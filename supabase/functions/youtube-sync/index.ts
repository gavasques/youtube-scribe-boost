import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
  pageToken?: string
  syncAll?: boolean
  deepScan?: boolean
  maxEmptyPages?: number
}

interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
  totalEstimated?: number
}

interface SyncResult {
  stats: SyncStats
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
  pageStats: {
    videosInPage: number
    newInPage: number
    updatedInPage: number
    isEmptyPage: boolean
    totalChannelVideos?: number
    videosReturnedByAPI: number
  }
  processingSpeed?: {
    videosPerMinute: number
    elapsedTimeMs: number
    eta?: string
  }
}

function log(message: string, data?: any) {
  console.log(`[SYNC] ${new Date().toISOString()} - ${message}`)
  if (data) {
    console.log('[SYNC] Data:', JSON.stringify(data, null, 2))
  }
}

function logError(message: string, error?: any) {
  console.error(`[SYNC-ERROR] ${new Date().toISOString()} - ${message}`)
  if (error) {
    console.error('[SYNC-ERROR] Details:', error)
  }
}

async function checkQuotaUsage(supabaseService: any, userId: string, requestsNeeded: number = 100): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const dailyLimit = 10000
  
  try {
    const { data: currentUsage } = await supabaseService
      .from('youtube_quota_usage')
      .select('requests_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    const used = currentUsage?.requests_used || 0
    const wouldExceed = (used + requestsNeeded) > dailyLimit

    log('Quota check', { currentUsage: used, dailyLimit, requestsNeeded, wouldExceed })
    return !wouldExceed
  } catch (error) {
    logError('Quota check error', error)
    return false
  }
}

async function updateQuotaUsage(supabaseService: any, userId: string, requestsUsed: number) {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { data: existing } = await supabaseService
      .from('youtube_quota_usage')
      .select('requests_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      await supabaseService
        .from('youtube_quota_usage')
        .update({
          requests_used: existing.requests_used + requestsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', today)
    } else {
      await supabaseService
        .from('youtube_quota_usage')
        .insert({
          user_id: userId,
          date: today,
          requests_used: requestsUsed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    log('Quota usage updated', { userId, requestsUsed, date: today })
  } catch (error) {
    logError('Quota update error', error)
  }
}

async function validateYouTubeConnection(supabaseService: any, userId: string): Promise<{ valid: boolean, tokens?: any, error?: string }> {
  try {
    log('Validating YouTube connection for user:', userId)
    
    const { data: tokenData, error: tokenError } = await supabaseService
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (tokenError) {
      logError('Error fetching YouTube tokens', tokenError)
      return { valid: false, error: 'Erro ao buscar tokens do YouTube' }
    }

    if (!tokenData) {
      log('No YouTube tokens found for user')
      return { valid: false, error: 'YouTube não conectado. Conecte sua conta primeiro.' }
    }

    log('YouTube tokens found', { 
      channelId: tokenData.channel_id,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresAt: tokenData.expires_at
    })

    return { valid: true, tokens: tokenData }

  } catch (error) {
    logError('Critical error validating YouTube connection', error)
    return { valid: false, error: 'Erro crítico na validação da conexão YouTube' }
  }
}

async function refreshYouTubeToken(refreshToken: string): Promise<string | null> {
  try {
    log('Refreshing YouTube token')
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (response.ok) {
      const data = await response.json()
      log('Token refreshed successfully')
      return data.access_token
    } else {
      const error = await response.json()
      logError('Token refresh failed', error)
      return null
    }
  } catch (error) {
    logError('Token refresh error', error)
    return null
  }
}

function parseDuration(duration: string): { seconds: number; formatted: string } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return { seconds: 0, formatted: '0:00' }
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  
  let formatted = ''
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  return { seconds: totalSeconds, formatted }
}

function getBestThumbnail(thumbnails: any): string | null {
  if (thumbnails.maxres) return thumbnails.maxres.url
  if (thumbnails.standard) return thumbnails.standard.url
  if (thumbnails.high) return thumbnails.high.url
  if (thumbnails.medium) return thumbnails.medium.url
  if (thumbnails.default) return thumbnails.default.url
  return null
}

async function getChannelVideoCount(accessToken: string, channelId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    
    if (response.ok) {
      const data = await response.json()
      return parseInt(data.items?.[0]?.statistics?.videoCount || '0')
    }
  } catch (error) {
    log('Error fetching channel video count', error)
  }
  return 0
}

serve(async (req) => {
  const startTime = Date.now()
  
  log('=== YouTube Sync Function Started ===', {
    method: req.method,
    url: req.url,
    startTime: new Date(startTime).toISOString()
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    let requestBody: any = {}
    
    try {
      const bodyText = await req.text()
      log('Request body received', { 
        length: bodyText.length, 
        content: bodyText.substring(0, 500) 
      })
      
      if (bodyText.trim()) {
        requestBody = JSON.parse(bodyText)
        log('Request body parsed successfully', {
          hasOptions: !!requestBody.options,
          optionsType: requestBody.options?.type,
          optionsMaxVideos: requestBody.options?.maxVideos,
          optionsPageToken: requestBody.options?.pageToken ? 'presente' : 'ausente'
        })
      } else {
        log('Request body is empty, using defaults')
      }
    } catch (parseError) {
      logError('Failed to parse request body', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle test request
    if (requestBody.test === true) {
      log('Test request detected')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Edge function working correctly',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CORREÇÃO: Extract options com propagação correta do pageToken
    const options: SyncOptions = {
      type: requestBody.options?.type || 'incremental',
      includeRegular: requestBody.options?.includeRegular !== false,
      includeShorts: requestBody.options?.includeShorts !== false,
      syncMetadata: requestBody.options?.syncMetadata !== false,
      maxVideos: requestBody.options?.maxVideos || 50,
      pageToken: requestBody.options?.pageToken || undefined,
      syncAll: requestBody.options?.syncAll || false,
      deepScan: requestBody.options?.deepScan || false,
      maxEmptyPages: requestBody.options?.maxEmptyPages || 25
    }
    
    log('Sync options processed', {
      ...options,
      pageToken: options.pageToken ? `presente (${options.pageToken.substring(0, 20)}...)` : 'ausente'
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      logError('Authentication failed', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('User authenticated', { userId: user.id })

    // Validate YouTube connection
    const connectionValidation = await validateYouTubeConnection(supabaseService, user.id)
    if (!connectionValidation.valid) {
      log('YouTube connection validation failed', connectionValidation.error)
      return new Response(
        JSON.stringify({ 
          error: connectionValidation.error || 'YouTube não conectado',
          requiresConnection: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = connectionValidation.tokens!

    // Check quota before proceeding
    const canProceed = await checkQuotaUsage(supababaseService, user.id, 100)
    if (!canProceed) {
      log('YouTube API quota exceeded')
      await updateQuotaUsage(supabaseService, user.id, 1)
      return new Response(
        JSON.stringify({ 
          error: 'Quota da API do YouTube excedida para hoje. Tente novamente amanhã.',
          quotaExceeded: true
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('YouTube tokens validated', { channelId: tokenData.channel_id })

    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    // CORREÇÃO: Verificar e renovar token OAuth se necessário
    if (expiresAt <= now) {
      log('Token expired, refreshing for pagination compatibility...')
      const newToken = await refreshYouTubeToken(tokenData.refresh_token)
      
      if (!newToken) {
        return new Response(
          JSON.stringify({ 
            error: 'Token refresh failed. Reconecte sua conta do YouTube.',
            requiresConnection: true
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      accessToken = newToken
      const newExpiresAt = new Date(Date.now() + (3600 * 1000))
      
      await supabaseService
        .from('youtube_tokens')
        .update({
          access_token: newToken,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      log('Token refreshed successfully for pagination')
    }

    // Get total channel video count for better progress tracking
    let totalChannelVideos = 0
    if (options.syncAll || options.deepScan) {
      totalChannelVideos = await getChannelVideoCount(accessToken, tokenData.channel_id)
      log('Channel video count retrieved', { totalChannelVideos })
    }

    // CORREÇÃO: Build search URL com pageToken corretamente propagado
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${options.maxVideos}`
    
    if (options.pageToken) {
      searchUrl += `&pageToken=${options.pageToken}`
      log('Using pageToken for pagination', { 
        pageToken: options.pageToken.substring(0, 20) + '...',
        fullUrl: searchUrl.substring(0, 120) + '...'
      })
    } else {
      log('First page request (no pageToken)')
    }
    
    log('Fetching videos from YouTube API', { 
      maxVideos: options.maxVideos, 
      hasPageToken: !!options.pageToken,
      syncAll: options.syncAll,
      deepScan: options.deepScan,
      totalChannelVideos,
      searchUrl: searchUrl.substring(0, 150) + '...'
    })
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    await updateQuotaUsage(supabaseService, user.id, 1)

    if (!searchResponse.ok) {
      const error = await searchResponse.json()
      logError('YouTube search failed', error)
      
      if (error.error?.code === 403 && error.error?.message?.includes('quota')) {
        await updateQuotaUsage(supabaseService, user.id, 5)
        return new Response(
          JSON.stringify({ 
            error: 'Quota da API do YouTube excedida. Tente novamente mais tarde.',
            quotaExceeded: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'YouTube API error', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchData = await searchResponse.json()
    const videoIds = searchData.items?.map((item: any) => item.id.videoId) || []
    const nextPageToken = searchData.nextPageToken
    const totalResults = searchData.pageInfo?.totalResults || totalChannelVideos || 0
    const resultsPerPage = searchData.pageInfo?.resultsPerPage || 50
    
    // CORREÇÃO: Campo adicional para distinguir vídeos retornados pela API
    const videosReturnedByAPI = videoIds.length
    
    // CORREÇÃO: Logs detalhados de paginação para debugging
    log('Pagination details from YouTube API', { 
      videosReturnedByAPI, // CORREÇÃO: Novo campo
      nextPageToken: nextPageToken ? `presente (${nextPageToken.substring(0, 20)}...)` : 'ausente',
      totalResults,
      resultsPerPage,
      totalChannelVideos,
      hasMorePages: !!nextPageToken,
      currentPageToken: options.pageToken ? `${options.pageToken.substring(0, 20)}...` : 'primeira página',
      pageInfo: searchData.pageInfo,
      estimatedTotalPages: Math.ceil(totalResults / resultsPerPage)
    })

    if (videoIds.length === 0) {
      const elapsedTime = Date.now() - startTime
      log('No videos returned by YouTube API', { // CORREÇÃO: Log mais específico
        searchUrl: searchUrl.substring(0, 100) + '...',
        pageToken: options.pageToken,
        totalResults,
        nextPageToken,
        isActuallyEmpty: true // CORREÇÃO: Flag para indicar página verdadeiramente vazia
      })
      
      return new Response(
        JSON.stringify({ 
          success: true,
          stats: { processed: 0, new: 0, updated: 0, errors: 0, totalEstimated: totalResults },
          hasMorePages: !!nextPageToken,
          currentPage: Math.floor(totalResults / resultsPerPage) || 1,
          nextPageToken,
          pageStats: {
            videosInPage: 0,
            newInPage: 0,
            updatedInPage: 0,
            isEmptyPage: true,
            totalChannelVideos,
            videosReturnedByAPI: 0 // CORREÇÃO: Campo específico para vídeos retornados pela API
          },
          processingSpeed: {
            videosPerMinute: 0,
            elapsedTimeMs: elapsedTime
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get video details
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds.join(',')}`
    
    log('Fetching video details', { 
      videoCount: videoIds.length,
      detailsUrl: detailsUrl.substring(0, 150) + '...'
    })
    
    const detailsResponse = await fetch(detailsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    await updateQuotaUsage(supabaseService, user.id, 1)

    if (!detailsResponse.ok) {
      const error = await detailsResponse.json()
      logError('YouTube details failed', error)
      return new Response(
        JSON.stringify({ error: 'Failed to get video details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const detailsData = await detailsResponse.json()
    const videos = detailsData.items || []
    
    log('Video details fetched', { count: videos.length })

    const stats = { processed: 0, new: 0, updated: 0, errors: 0, totalEstimated: totalResults }
    const errors: string[] = []
    const newVideoTitles: string[] = []
    const updatedVideoTitles: string[] = []

    let pageNewCount = 0
    let pageUpdatedCount = 0

    for (const video of videos) {
      try {
        const durationData = parseDuration(video.contentDetails.duration)
        const isShort = durationData.seconds <= 60
        const videoType = isShort ? 'SHORT' : 'REGULAR'
        
        if (videoType === 'REGULAR' && !options.includeRegular) continue
        if (videoType === 'SHORT' && !options.includeShorts) continue

        const videoTitle = video.snippet.title

        const { data: existingVideo } = await supabaseService
          .from('videos')
          .select('id')
          .eq('youtube_id', video.id)
          .eq('user_id', user.id)
          .maybeSingle()

        const videoData = {
          user_id: user.id,
          youtube_id: video.id,
          youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
          title: videoTitle,
          video_type: videoType,
          published_at: video.snippet.publishedAt,
          updated_at: new Date().toISOString()
        }

        if (existingVideo) {
          if (options.syncMetadata) {
            const { error: updateError } = await supabaseService
              .from('videos')
              .update(videoData)
              .eq('id', existingVideo.id)
            
            if (updateError) throw updateError

            await supabaseService
              .from('video_metadata')
              .upsert({
                video_id: existingVideo.id,
                views_count: parseInt(video.statistics.viewCount || '0'),
                likes_count: parseInt(video.statistics.likeCount || '0'),
                comments_count: parseInt(video.statistics.commentCount || '0'),
                thumbnail_url: getBestThumbnail(video.snippet.thumbnails),
                duration_seconds: durationData.seconds,
                duration_formatted: durationData.formatted,
                privacy_status: video.status.privacyStatus,
                updated_at: new Date().toISOString()
              })

            stats.updated++
            pageUpdatedCount++
            updatedVideoTitles.push(videoTitle)
            log(`Updated existing video: ${videoTitle}`)
          }
        } else {
          const { data: newVideo, error: insertError } = await supabaseService
            .from('videos')
            .insert(videoData)
            .select('id')
            .single()
          
          if (insertError) throw insertError

          await supabaseService
            .from('video_metadata')
            .insert({
              video_id: newVideo.id,
              views_count: parseInt(video.statistics.viewCount || '0'),
              likes_count: parseInt(video.statistics.likeCount || '0'),
              comments_count: parseInt(video.statistics.commentCount || '0'),
              thumbnail_url: getBestThumbnail(video.snippet.thumbnails),
              duration_seconds: durationData.seconds,
              duration_formatted: durationData.formatted,
              privacy_status: video.status.privacyStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          stats.new++
          pageNewCount++
          newVideoTitles.push(videoTitle)
          log(`Added new video: ${videoTitle}`)
        }

        stats.processed++

      } catch (error) {
        logError(`Error processing video ${video.snippet.title}`, error)
        errors.push(`${video.snippet.title}: ${error.message}`)
        stats.errors++
      }
    }

    // Calculate processing speed and ETA
    const elapsedTime = Date.now() - startTime
    const videosPerMinute = stats.processed > 0 ? (stats.processed / (elapsedTime / 60000)) : 0
    let eta = undefined
    
    if (totalResults > 0 && videosPerMinute > 0) {
      const remainingVideos = totalResults - stats.processed
      const remainingMinutes = remainingVideos / videosPerMinute
      eta = new Date(Date.now() + (remainingMinutes * 60000)).toISOString()
    }

    // Calculate pagination info
    const hasMorePages = !!nextPageToken
    const estimatedTotalPages = Math.ceil(totalResults / resultsPerPage)
    const currentPage = options.pageToken ? 
      Math.floor((stats.processed || 0) / resultsPerPage) + 1 : 1

    // CORREÇÃO: Lógica corrigida para "página vazia" - apenas quando API não retorna vídeos
    const isEmptyPage = videosReturnedByAPI === 0

    const result: SyncResult = {
      stats,
      errors: errors.length > 0 ? errors : undefined,
      nextPageToken,
      hasMorePages,
      currentPage,
      totalPages: estimatedTotalPages,
      pageStats: {
        videosInPage: videos.length,
        newInPage: pageNewCount,
        updatedInPage: pageUpdatedCount,
        isEmptyPage,
        totalChannelVideos,
        videosReturnedByAPI // CORREÇÃO: Novo campo crucial para a lógica correta
      },
      processingSpeed: {
        videosPerMinute: Math.round(videosPerMinute * 100) / 100,
        elapsedTimeMs: elapsedTime,
        eta
      }
    }

    log('Sync completed successfully', { 
      stats, 
      errorCount: errors.length,
      hasMorePages,
      nextPageToken: nextPageToken ? `presente (${nextPageToken.substring(0, 20)}...)` : 'ausente',
      currentPage,
      totalPages: estimatedTotalPages,
      pageStats: result.pageStats,
      processingSpeed: result.processingSpeed,
      newVideos: newVideoTitles.length > 0 ? newVideoTitles.slice(0, 3) : 'none',
      updatedVideos: updatedVideoTitles.length > 0 ? updatedVideoTitles.slice(0, 3) : 'none',
      quotaUsed: 2,
      // CORREÇÃO: Log final com distinção clara
      paginationSummary: {
        receivedPageToken: options.pageToken ? 'sim' : 'não',
        returningPageToken: nextPageToken ? 'sim' : 'não',
        isLastPage: !nextPageToken,
        totalVideosInChannel: totalChannelVideos,
        videosReturnedByAPI,
        videosProcessed: stats.processed,
        isActuallyEmpty: isEmptyPage
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    logError('Critical sync error', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
