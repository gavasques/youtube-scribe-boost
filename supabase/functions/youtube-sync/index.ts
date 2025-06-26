
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
    // Leitura mais robusta do request body
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
      } else {
        log('Non-JSON content type, using empty body')
      }
      
      log('Parsed request body', requestBody)
    } catch (parseError) {
      logError('Failed to parse request body', parseError)
      // Usar body vazio em caso de erro
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

    // Extrair opções com valores padrão
    const options: SyncOptions = {
      type: requestBody.options?.type || 'incremental',
      includeRegular: requestBody.options?.includeRegular !== false,
      includeShorts: requestBody.options?.includeShorts !== false,
      syncMetadata: requestBody.options?.syncMetadata !== false,
      maxVideos: requestBody.options?.maxVideos || 50
    }
    
    log('Sync options (with defaults)', options)

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

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      logError('Authentication failed', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('User authenticated', { userId: user.id })

    // Get YouTube tokens
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

    // Check and refresh token if needed
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

    // Fetch videos from YouTube
    log('Fetching videos from YouTube', { maxVideos: options.maxVideos })
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${Math.min(options.maxVideos, 50)}`
    
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
    
    log('Video IDs fetched', { count: videoIds.length })

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          stats: { processed: 0, new: 0, updated: 0, errors: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get video details
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

        log(`Processing video: ${video.snippet.title}`)

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
          }
        } else {
          const { error: insertError } = await supabaseService
            .from('videos')
            .insert(videoData)
          
          if (insertError) throw insertError
          stats.new++
        }

        stats.processed++

      } catch (error) {
        logError(`Error processing video ${video.snippet.title}`, error)
        errors.push(`${video.snippet.title}: ${error.message}`)
        stats.errors++
      }
    }

    log('Sync completed', { stats, errorCount: errors.length })

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        errors: errors.length > 0 ? errors : undefined
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
