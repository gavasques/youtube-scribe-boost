
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
  quotaInfo?: {
    exceeded: boolean
    resetTime?: string
    requestsUsed?: number
    dailyLimit?: number
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

// Store quota usage in Supabase
async function updateQuotaUsage(supabaseService: any, userId: string, requestsUsed: number) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    await supabaseService
      .from('youtube_quota_usage')
      .upsert({
        user_id: userId,
        date: today,
        requests_used: requestsUsed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' })
    
    log('Quota usage updated', { userId, requestsUsed, date: today })
  } catch (error) {
    logError('Failed to update quota usage', error)
  }
}

async function getQuotaUsage(supabaseService: any, userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabaseService
      .from('youtube_quota_usage')
      .select('requests_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      logError('Failed to get quota usage', error)
      return 0
    }
    
    return data?.requests_used ?? 0
  } catch (error) {
    logError('Failed to get quota usage', error)
    return 0
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

serve(async (req) => {
  log('=== YouTube Sync Function Started ===', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
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
      const contentType = req.headers.get('content-type') || ''
      log('Content-Type header', contentType)
      
      const bodyText = await req.text()
      log('Request body text', { length: bodyText.length, content: bodyText.substring(0, 1000) })
      
      if (bodyText.trim()) {
        requestBody = JSON.parse(bodyText)
        log('Successfully parsed request body', requestBody)
      } else {
        log('Request body is empty')
        requestBody = {}
      }
      
    } catch (parseError) {
      logError('Failed to parse request body', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: 'Failed to parse JSON from request body'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle test request
    if (requestBody.test === true) {
      log('Test request detected - communication working')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Edge function working correctly',
          timestamp: new Date().toISOString(),
          receivedBody: requestBody
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process options
    if (!requestBody.options) {
      logError('Missing options in request body', { 
        requestBody, 
        hasOptions: !!requestBody.options,
        bodyKeys: Object.keys(requestBody || {}),
        bodyType: typeof requestBody,
        bodyString: JSON.stringify(requestBody)
      })
      
      requestBody = {
        options: {
          type: 'incremental',
          includeRegular: true,
          includeShorts: true,
          syncMetadata: true,
          maxVideos: 50,
          pageToken: null,
          syncAll: false
        }
      }
      
      log('Using default options', requestBody.options)
    }

    const options: SyncOptions = {
      type: requestBody.options?.type || 'incremental',
      includeRegular: requestBody.options?.includeRegular !== false,
      includeShorts: requestBody.options?.includeShorts !== false,
      syncMetadata: requestBody.options?.syncMetadata !== false,
      maxVideos: requestBody.options?.maxVideos || 50,
      pageToken: requestBody.options?.pageToken,
      syncAll: requestBody.options?.syncAll || false
    }
    
    log('Processed sync options', options)

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

    // Check current quota usage
    const currentQuotaUsage = await getQuotaUsage(supabaseService, user.id)
    const dailyLimit = 10000 // YouTube API default daily quota
    const estimatedRequestsNeeded = Math.min(options.maxVideos, 50) * 2 // Search + Details
    
    log('Quota check', { 
      currentUsage: currentQuotaUsage, 
      dailyLimit, 
      requestsNeeded: estimatedRequestsNeeded,
      wouldExceed: currentQuotaUsage + estimatedRequestsNeeded > dailyLimit
    })

    // If we're close to quota limit, reduce the batch size
    const remainingQuota = dailyLimit - currentQuotaUsage
    if (remainingQuota < estimatedRequestsNeeded) {
      const maxPossibleVideos = Math.max(1, Math.floor(remainingQuota / 2))
      options.maxVideos = Math.min(options.maxVideos, maxPossibleVideos)
      log('Reduced batch size due to quota limits', { 
        remainingQuota, 
        newMaxVideos: options.maxVideos 
      })
    }

    const { data: tokenData, error: tokenError } = await supabaseService
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      logError('YouTube tokens not found', tokenError)
      return new Response(
        JSON.stringify({ error: 'YouTube not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('YouTube tokens found', { channelId: tokenData.channel_id })

    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (expiresAt <= now) {
      log('Token expired, refreshing...')
      const newToken = await refreshYouTubeToken(tokenData.refresh_token)
      
      if (!newToken) {
        return new Response(
          JSON.stringify({ error: 'Token refresh failed' }),
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
      
      log('Token refreshed successfully')
    }

    const pageSize = options.syncAll ? 50 : Math.min(options.maxVideos, 50)
    
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${pageSize}`
    
    if (options.pageToken) {
      searchUrl += `&pageToken=${options.pageToken}`
      log('Using page token for pagination', { pageToken: options.pageToken })
    }
    
    log('Fetching videos from YouTube', { 
      pageSize, 
      pageToken: options.pageToken,
      syncAll: options.syncAll 
    })
    
    let requestsUsed = 0
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    requestsUsed += 1

    if (!searchResponse.ok) {
      const error = await searchResponse.json()
      logError('YouTube search failed', error)
      
      // Enhanced quota error handling
      if (error.error?.code === 403 && error.error?.errors?.some((e: any) => e.reason === 'quotaExceeded')) {
        log('YouTube API quota exceeded')
        
        // Update quota usage
        await updateQuotaUsage(supabaseService, user.id, currentQuotaUsage + requestsUsed)
        
        return new Response(
          JSON.stringify({ 
            error: 'YouTube API quota exceeded',
            details: 'A quota diária do YouTube API foi excedida. A quota é resetada à meia-noite (horário do Pacífico). Tente novamente em algumas horas.',
            quotaInfo: {
              exceeded: true,
              resetTime: 'Meia-noite (Horário do Pacífico)',
              requestsUsed: currentQuotaUsage + requestsUsed,
              dailyLimit: dailyLimit
            }
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
    const totalResults = searchData.pageInfo?.totalResults || 0
    const resultsPerPage = searchData.pageInfo?.resultsPerPage || 50
    
    log('Video IDs fetched', { 
      count: videoIds.length,
      nextPageToken,
      totalResults,
      resultsPerPage,
      hasMorePages: !!nextPageToken
    })

    if (videoIds.length === 0) {
      await updateQuotaUsage(supabaseService, user.id, currentQuotaUsage + requestsUsed)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          stats: { processed: 0, new: 0, updated: 0, errors: 0, totalEstimated: totalResults },
          hasMorePages: false,
          currentPage: 1,
          nextPageToken: null,
          quotaInfo: {
            exceeded: false,
            requestsUsed: currentQuotaUsage + requestsUsed,
            dailyLimit: dailyLimit
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds.join(',')}`
    
    const detailsResponse = await fetch(detailsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    requestsUsed += 1

    if (!detailsResponse.ok) {
      const error = await detailsResponse.json()
      logError('YouTube details failed', error)
      
      if (error.error?.code === 403 && error.error?.errors?.some((e: any) => e.reason === 'quotaExceeded')) {
        await updateQuotaUsage(supabaseService, user.id, currentQuotaUsage + requestsUsed)
        
        return new Response(
          JSON.stringify({ 
            error: 'YouTube API quota exceeded',
            details: 'A quota diária do YouTube API foi excedida durante o processamento.',
            quotaInfo: {
              exceeded: true,
              resetTime: 'Meia-noite (Horário do Pacífico)',
              requestsUsed: currentQuotaUsage + requestsUsed,
              dailyLimit: dailyLimit
            }
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
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

    for (const video of videos) {
      try {
        const durationData = parseDuration(video.contentDetails.duration)
        const isShort = durationData.seconds <= 60
        const videoType = isShort ? 'SHORT' : 'REGULAR'
        
        if (videoType === 'REGULAR' && !options.includeRegular) continue
        if (videoType === 'SHORT' && !options.includeShorts) continue

        log(`Processing video: ${video.snippet.title}`)

        const { data: existingVideo } = await supabaseService
          .from('videos')
          .select('id')
          .eq('youtube_id', video.id)
          .eq('user_id', user.id)
          .maybeSingle()

        const coreVideoData = {
          user_id: user.id,
          youtube_id: video.id,
          youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
          title: video.snippet.title,
          video_type: videoType,
          published_at: video.snippet.publishedAt,
          category_id: video.snippet.categoryId,
          updated_at: new Date().toISOString()
        }

        let videoId: string
        
        if (existingVideo) {
          const { error: updateError } = await supabaseService
            .from('videos')
            .update(coreVideoData)
            .eq('id', existingVideo.id)
          
          if (updateError) throw updateError
          
          videoId = existingVideo.id
          stats.updated++
          log(`Updated existing video: ${video.snippet.title}`)
        } else {
          const { data: newVideo, error: insertError } = await supabaseService
            .from('videos')
            .insert(coreVideoData)
            .select('id')
            .single()
          
          if (insertError) throw insertError
          
          videoId = newVideo.id
          stats.new++
          log(`Created new video: ${video.snippet.title}`)
        }

        // Insert/update metadata
        const metadataData = {
          video_id: videoId,
          views_count: parseInt(video.statistics.viewCount || '0'),
          likes_count: parseInt(video.statistics.likeCount || '0'),
          comments_count: parseInt(video.statistics.commentCount || '0'),
          duration_seconds: durationData.seconds,
          duration_formatted: durationData.formatted,
          thumbnail_url: getBestThumbnail(video.snippet.thumbnails),
          privacy_status: video.status.privacyStatus,
          published_at: video.snippet.publishedAt,
          updated_at: new Date().toISOString()
        }

        const { error: metadataError } = await supabaseService
          .from('video_metadata')
          .upsert(metadataData, { onConflict: 'video_id' })
        
        if (metadataError) {
          logError('Failed to upsert metadata', metadataError)
        }

        // Insert/update descriptions
        const descriptionData = {
          video_id: videoId,
          original_description: video.snippet.description || '',
          current_description: video.snippet.description || '',
          updated_at: new Date().toISOString()
        }

        const { error: descriptionError } = await supabaseService
          .from('video_descriptions')
          .upsert(descriptionData, { onConflict: 'video_id' })
        
        if (descriptionError) {
          logError('Failed to upsert description', descriptionError)
        }

        // Insert/update configuration
        const configData = {
          video_id: videoId,
          configuration_status: 'NOT_CONFIGURED',
          update_status: 'ACTIVE_FOR_UPDATE',
          updated_at: new Date().toISOString()
        }

        const { error: configError } = await supabaseService
          .from('video_configuration')
          .upsert(configData, { onConflict: 'video_id' })
        
        if (configError) {
          logError('Failed to upsert configuration', configError)
        }

        // Handle tags
        if (video.snippet.tags && video.snippet.tags.length > 0) {
          await supabaseService
            .from('video_tags')
            .delete()
            .eq('video_id', videoId)
            .eq('tag_type', 'original')

          const tagData = video.snippet.tags.map((tag: string) => ({
            video_id: videoId,
            tag_text: tag,
            tag_type: 'original'
          }))

          const { error: tagsError } = await supabaseService
            .from('video_tags')
            .insert(tagData)
          
          if (tagsError) {
            logError('Failed to insert tags', tagsError)
          }
        }

        stats.processed++

      } catch (error) {
        logError(`Error processing video ${video.snippet.title}`, error)
        errors.push(`${video.snippet.title}: ${error.message}`)
        stats.errors++
      }
    }

    // Update quota usage
    await updateQuotaUsage(supabaseService, user.id, currentQuotaUsage + requestsUsed)

    const hasMorePages = !!nextPageToken
    const estimatedTotalPages = Math.ceil(totalResults / resultsPerPage)
    const currentPage = options.pageToken ? 
      Math.floor((totalResults - searchData.pageInfo?.totalResults + stats.processed) / resultsPerPage) + 1 : 1

    const result: SyncResult = {
      stats,
      errors: errors.length > 0 ? errors : undefined,
      nextPageToken,
      hasMorePages,
      currentPage,
      totalPages: estimatedTotalPages,
      quotaInfo: {
        exceeded: false,
        requestsUsed: currentQuotaUsage + requestsUsed,
        dailyLimit: dailyLimit
      }
    }

    log('Sync completed successfully', { 
      stats, 
      errorCount: errors.length,
      hasMorePages,
      nextPageToken: nextPageToken ? 'present' : 'none',
      currentPage,
      totalPages: estimatedTotalPages,
      quotaUsed: requestsUsed
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
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
