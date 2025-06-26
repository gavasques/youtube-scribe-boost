
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
}

interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    publishedAt: string
    tags?: string[]
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
      standard?: { url: string }
      maxres?: { url: string }
    }
    categoryId: string
  }
  contentDetails: {
    duration: string
  }
  statistics: {
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }
  status: {
    privacyStatus: string
  }
}

function debugLog(message: string, data?: any) {
  console.log(`[SYNC-DEBUG] ${new Date().toISOString()} - ${message}`)
  if (data !== undefined) {
    console.log(`[SYNC-DEBUG] Data:`, JSON.stringify(data, null, 2))
  }
}

function errorLog(message: string, error?: any) {
  console.error(`[SYNC-ERROR] ${new Date().toISOString()} - ${message}`)
  if (error !== undefined) {
    console.error(`[SYNC-ERROR] Details:`, error)
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

async function refreshYouTubeToken(refreshToken: string): Promise<string | null> {
  try {
    debugLog('Attempting to refresh YouTube token')
    
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    const refreshData = await refreshResponse.json()
    
    if (refreshResponse.ok) {
      debugLog('Token refreshed successfully')
      return refreshData.access_token
    } else {
      errorLog('Failed to refresh token', refreshData)
      return null
    }
  } catch (error) {
    errorLog('Error during token refresh', error)
    return null
  }
}

serve(async (req) => {
  debugLog('=== YouTube Sync Function Started ===', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    debugLog('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    errorLog('Invalid HTTP method', { method: req.method })
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let requestBody: any = null
  let options: SyncOptions

  try {
    // Read and log the raw request body
    const bodyText = await req.text()
    debugLog('Raw request body received', {
      bodyLength: bodyText.length,
      hasContent: bodyText.length > 0,
      rawBody: bodyText
    })

    // Validate body is not empty
    if (!bodyText || bodyText.trim() === '') {
      errorLog('Empty request body received')
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body',
          details: 'Request body is required for sync operation'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON
    try {
      requestBody = JSON.parse(bodyText)
      debugLog('Request body parsed successfully', {
        bodyKeys: Object.keys(requestBody),
        bodyStructure: typeof requestBody,
        fullBody: requestBody
      })
    } catch (parseError) {
      errorLog('JSON parsing failed', {
        error: parseError.message,
        bodyPreview: bodyText.substring(0, 500)
      })
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format',
          details: `JSON parsing error: ${parseError.message}`,
          received: bodyText.substring(0, 200)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle test connectivity request
    if (requestBody.test === true) {
      debugLog('Test connectivity request detected')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Edge function is accessible and working',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate sync options
    if (!requestBody.options) {
      errorLog('Missing options in request body', {
        receivedKeys: Object.keys(requestBody),
        bodyStructure: requestBody
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing sync options',
          details: 'Request must include sync options object',
          received: Object.keys(requestBody),
          expected: 'Body should contain "options" property'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    options = requestBody.options as SyncOptions
    debugLog('Sync options extracted and validated', {
      type: options.type,
      includeRegular: options.includeRegular,
      includeShorts: options.includeShorts,
      syncMetadata: options.syncMetadata,
      maxVideos: options.maxVideos
    })

    // Validate required option fields
    const requiredFields = ['type', 'includeRegular', 'includeShorts', 'syncMetadata', 'maxVideos']
    const missingFields = requiredFields.filter(field => options[field] === undefined)
    
    if (missingFields.length > 0) {
      errorLog('Missing required option fields', {
        missingFields,
        receivedOptions: options
      })
      return new Response(
        JSON.stringify({ 
          error: 'Invalid sync options',
          details: `Missing required fields: ${missingFields.join(', ')}`,
          received: options
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    debugLog('Supabase clients created successfully')

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      errorLog('Authentication failed', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          details: 'Please log in to sync videos',
          authError: authError?.message
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    debugLog('User authenticated successfully', { userId: user.id })

    // Get YouTube tokens
    const { data: tokenData, error: tokenError } = await supabaseService
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      errorLog('YouTube tokens not found', {
        tokenError: tokenError?.message,
        userId: user.id
      })
      return new Response(
        JSON.stringify({ 
          error: 'YouTube not connected',
          details: 'Please connect your YouTube account in Settings > APIs'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    debugLog('YouTube tokens retrieved successfully', {
      channelId: tokenData.channel_id,
      expiresAt: tokenData.expires_at,
      hasRefreshToken: !!tokenData.refresh_token
    })

    // Check and refresh token if needed
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const minutesUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60)

    debugLog('Token expiry check', {
      expiresAt: expiresAt.toISOString(),
      minutesUntilExpiry,
      needsRefresh: timeUntilExpiry < 10 * 60 * 1000
    })

    if (timeUntilExpiry < 10 * 60 * 1000) {
      debugLog('Token needs refresh, attempting renewal')
      const newToken = await refreshYouTubeToken(tokenData.refresh_token)
      
      if (newToken) {
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
        
        debugLog('Token refreshed and updated successfully', { 
          newExpiresAt: newExpiresAt.toISOString() 
        })
      } else {
        errorLog('Token refresh failed')
        return new Response(
          JSON.stringify({ 
            error: 'Token refresh failed',
            details: 'Please reconnect your YouTube account in Settings'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Start video synchronization
    debugLog('Starting video sync process', {
      channelId: tokenData.channel_id,
      maxVideos: options.maxVideos,
      includeRegular: options.includeRegular,
      includeShorts: options.includeShorts,
      syncType: options.type
    })

    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${Math.min(options.maxVideos, 50)}`
    
    debugLog('Fetching video list from YouTube API', { searchUrl })
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!searchResponse.ok) {
      const searchError = await searchResponse.json()
      errorLog('YouTube search API error', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: searchError
      })
      return new Response(
        JSON.stringify({ 
          error: 'YouTube API error',
          details: searchError.error?.message || 'Failed to fetch videos from YouTube'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchData = await searchResponse.json()
    const videoIds = searchData.items?.map((item: any) => item.id.videoId) || []
    
    debugLog('Video IDs retrieved from search', { 
      totalFound: videoIds.length, 
      videoIds: videoIds.slice(0, 5) // Log first 5 for debugging
    })

    if (videoIds.length === 0) {
      debugLog('No videos found in channel')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No videos found in channel',
          stats: { processed: 0, new: 0, updated: 0, errors: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get video details
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds.join(',')}`
    
    debugLog('Fetching video details from YouTube API', { 
      videoCount: videoIds.length,
      detailsUrl: detailsUrl.substring(0, 200) + '...'
    })
    
    const detailsResponse = await fetch(detailsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!detailsResponse.ok) {
      const detailsError = await detailsResponse.json()
      errorLog('YouTube details API error', {
        status: detailsResponse.status,
        error: detailsError
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get video details',
          details: detailsError.error?.message || 'YouTube API error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const detailsData = await detailsResponse.json()
    const videos: YouTubeVideo[] = detailsData.items || []
    
    debugLog('Video details retrieved successfully', { 
      videoCount: videos.length,
      sampleTitles: videos.slice(0, 3).map(v => v.snippet.title)
    })

    // Process videos
    const stats = { processed: 0, new: 0, updated: 0, errors: 0 }
    const errors: string[] = []

    for (const video of videos) {
      try {
        const durationData = parseDuration(video.contentDetails.duration)
        const isShort = durationData.seconds <= 60
        const videoType = isShort ? 'SHORT' : 'REGULAR'
        
        // Apply filters
        if (videoType === 'REGULAR' && !options.includeRegular) continue
        if (videoType === 'SHORT' && !options.includeShorts) continue

        debugLog(`Processing video: ${video.snippet.title}`, {
          id: video.id,
          type: videoType,
          duration: durationData.formatted,
          published: video.snippet.publishedAt
        })

        // Check if video exists
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
          title: video.snippet.title,
          video_type: videoType,
          published_at: video.snippet.publishedAt,
          original_description: video.snippet.description || '',
          current_description: video.snippet.description || '',
          original_tags: video.snippet.tags || [],
          current_tags: video.snippet.tags || [],
          views_count: parseInt(video.statistics.viewCount || '0'),
          likes_count: parseInt(video.statistics.likeCount || '0'),
          comments_count: parseInt(video.statistics.commentCount || '0'),
          thumbnail_url: getBestThumbnail(video.snippet.thumbnails),
          duration_seconds: durationData.seconds,
          duration_formatted: durationData.formatted,
          privacy_status: video.status.privacyStatus,
          category_id: video.snippet.categoryId,
          updated_at: new Date().toISOString()
        }

        if (existingVideo) {
          if (options.syncMetadata) {
            const { error: updateError } = await supabaseService
              .from('videos')
              .update(videoData)
              .eq('id', existingVideo.id)
            
            if (updateError) throw updateError
            stats.updated++
            debugLog(`Video updated: ${video.snippet.title}`)
          }
        } else {
          const { error: insertError } = await supabaseService
            .from('videos')
            .insert(videoData)
          
          if (insertError) throw insertError
          stats.new++
          debugLog(`New video created: ${video.snippet.title}`)
        }

        stats.processed++

      } catch (error) {
        errorLog(`Error processing video ${video.snippet.title}`, {
          videoId: video.id,
          errorMessage: error.message,
          errorName: error.name
        })
        errors.push(`${video.snippet.title}: ${error.message}`)
        stats.errors++
      }
    }

    debugLog('=== Sync completed successfully ===', { 
      stats, 
      errorCount: errors.length,
      totalProcessed: stats.processed
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída com sucesso',
        stats,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    errorLog('=== Critical error in youtube-sync ===', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
