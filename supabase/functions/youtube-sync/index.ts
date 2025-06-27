
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
      
      if (contentType.includes('application/json')) {
        const bodyText = await req.text()
        log('Request body text', { length: bodyText.length, content: bodyText.substring(0, 500) })
        
        if (bodyText.trim()) {
          requestBody = JSON.parse(bodyText)
        }
      }
      
      log('Parsed request body', requestBody)
    } catch (parseError) {
      logError('Failed to parse request body', parseError)
      requestBody = {}
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

    const options: SyncOptions = {
      type: requestBody.options?.type || 'incremental',
      includeRegular: requestBody.options?.includeRegular !== false,
      includeShorts: requestBody.options?.includeShorts !== false,
      syncMetadata: requestBody.options?.syncMetadata !== false,
      maxVideos: requestBody.options?.maxVideos || 50,
      pageToken: requestBody.options?.pageToken,
      syncAll: requestBody.options?.syncAll || false
    }
    
    log('Sync options (with defaults)', options)

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

    // Build search URL with pagination support
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${Math.min(options.maxVideos, 50)}`
    
    if (options.pageToken) {
      searchUrl += `&pageToken=${options.pageToken}`
      log('Using page token for pagination', { pageToken: options.pageToken })
    }
    
    log('Fetching videos from YouTube', { maxVideos: options.maxVideos, pageToken: options.pageToken })
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!searchResponse.ok) {
      const error = await searchResponse.json()
      logError('YouTube search failed', error)
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
      resultsPerPage
    })

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          stats: { processed: 0, new: 0, updated: 0, errors: 0 },
          hasMorePages: false,
          currentPage: 1,
          nextPageToken: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds.join(',')}`
    
    const detailsResponse = await fetch(detailsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

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

        // Core video data for the videos table
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
          // Update existing video
          const { error: updateError } = await supabaseService
            .from('videos')
            .update(coreVideoData)
            .eq('id', existingVideo.id)
          
          if (updateError) throw updateError
          
          videoId = existingVideo.id
          stats.updated++
        } else {
          // Insert new video
          const { data: newVideo, error: insertError } = await supabaseService
            .from('videos')
            .insert(coreVideoData)
            .select('id')
            .single()
          
          if (insertError) throw insertError
          
          videoId = newVideo.id
          stats.new++
        }

        // Insert/update metadata in video_metadata table
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
          .upsert(metadataData)
        
        if (metadataError) {
          logError('Failed to upsert metadata', metadataError)
        }

        // Insert/update descriptions in video_descriptions table
        const descriptionData = {
          video_id: videoId,
          original_description: video.snippet.description || '',
          current_description: video.snippet.description || '',
          updated_at: new Date().toISOString()
        }

        const { error: descriptionError } = await supabaseService
          .from('video_descriptions')
          .upsert(descriptionData)
        
        if (descriptionError) {
          logError('Failed to upsert description', descriptionError)
        }

        // Insert/update configuration in video_configuration table
        const configData = {
          video_id: videoId,
          configuration_status: 'NOT_CONFIGURED',
          update_status: 'ACTIVE_FOR_UPDATE',
          updated_at: new Date().toISOString()
        }

        const { error: configError } = await supabaseService
          .from('video_configuration')
          .upsert(configData)
        
        if (configError) {
          logError('Failed to upsert configuration', configError)
        }

        // Handle tags if they exist
        if (video.snippet.tags && video.snippet.tags.length > 0) {
          // Delete existing tags for this video
          await supabaseService
            .from('video_tags')
            .delete()
            .eq('video_id', videoId)
            .eq('tag_type', 'original')

          // Insert new tags
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

    // Calculate pagination info
    const hasMorePages = !!nextPageToken
    const estimatedTotalPages = Math.ceil(totalResults / resultsPerPage)
    const currentPage = options.pageToken ? 
      Math.floor((stats.processed || 0) / resultsPerPage) + 1 : 1

    const result: SyncResult = {
      stats,
      errors: errors.length > 0 ? errors : undefined,
      nextPageToken,
      hasMorePages,
      currentPage,
      totalPages: estimatedTotalPages
    }

    log('Sync completed', { 
      stats, 
      errorCount: errors.length,
      hasMorePages,
      nextPageToken: nextPageToken ? 'present' : 'none',
      currentPage,
      totalPages: estimatedTotalPages
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
