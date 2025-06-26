
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

// Função para debug completo
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
  if (data !== undefined) {
    console.log(`[DEBUG] Data:`, JSON.stringify(data, null, 2))
  }
}

function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`)
  if (error !== undefined) {
    console.error(`[ERROR] Details:`, error)
    if (error?.stack) {
      console.error(`[ERROR] Stack:`, error.stack)
    }
  }
}

// Função para converter duração ISO 8601 (PT1M30S) para segundos
function parseDuration(duration: string): { seconds: number; formatted: string } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return { seconds: 0, formatted: '0:00' }
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  
  // Formatar como HH:MM:SS ou MM:SS
  let formatted = ''
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  return { seconds: totalSeconds, formatted }
}

// Função para obter a melhor thumbnail disponível
function getBestThumbnail(thumbnails: any): string | null {
  if (thumbnails.maxres) return thumbnails.maxres.url
  if (thumbnails.standard) return thumbnails.standard.url
  if (thumbnails.high) return thumbnails.high.url
  if (thumbnails.medium) return thumbnails.medium.url
  if (thumbnails.default) return thumbnails.default.url
  return null
}

serve(async (req) => {
  debugLog('=== YouTube Sync Function Called ===')
  debugLog('Request details', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  })

  if (req.method === 'OPTIONS') {
    debugLog('CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  let bodyText = ''
  let requestBody: any = null
  let options: SyncOptions

  try {
    // Verificar se é método POST
    if (req.method !== 'POST') {
      errorLog('Invalid method', { method: req.method })
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ler o body da requisição uma única vez
    try {
      bodyText = await req.text()
      debugLog('Request body received', {
        bodyLength: bodyText.length,
        bodyPreview: bodyText.substring(0, 200),
        isEmpty: bodyText.trim() === ''
      })
    } catch (bodyError) {
      errorLog('Error reading request body', bodyError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to read request body', 
          details: bodyError.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se body está vazio
    if (!bodyText || bodyText.trim() === '') {
      errorLog('Empty request body received')
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body',
          details: 'Request body is required with sync options',
          suggestion: 'Check if frontend is sending data correctly'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse do JSON
    try {
      requestBody = JSON.parse(bodyText)
      debugLog('JSON parsed successfully', {
        bodyKeys: Object.keys(requestBody),
        hasOptions: !!requestBody.options,
        timestamp: requestBody.timestamp,
        userId: requestBody.userId
      })
    } catch (jsonError) {
      errorLog('JSON parsing error', {
        error: jsonError,
        bodyText: bodyText.substring(0, 500)
      })
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: jsonError.message,
          bodyReceived: bodyText.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar estrutura da requisição
    if (!requestBody.options) {
      errorLog('Missing options in request body', { requestBody })
      return new Response(
        JSON.stringify({ 
          error: 'Missing options in request body',
          details: 'The request must include an options object',
          received: Object.keys(requestBody)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    options = requestBody.options as SyncOptions
    debugLog('Sync options extracted', options)

    // Validar options obrigatórios
    const requiredFields = ['type', 'maxVideos', 'includeRegular', 'includeShorts']
    const missingFields = requiredFields.filter(field => !options.hasOwnProperty(field))
    
    if (missingFields.length > 0) {
      errorLog('Missing required fields in options', { missingFields, receivedOptions: options })
      return new Response(
        JSON.stringify({ 
          error: 'Invalid options structure',
          details: `Missing required fields: ${missingFields.join(', ')}`,
          received: Object.keys(options)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    debugLog('Supabase client created')

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      errorLog('Authentication error', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: authError?.message || 'User not authenticated'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    debugLog('User authenticated', { userId: user.id, email: user.email })

    // Criar cliente com service role para operações privilegiadas
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    debugLog('Service role client created')

    // Buscar tokens do YouTube
    const { data: tokenData, error: tokenError } = await supabaseService
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      errorLog('YouTube tokens not found', { tokenError, userId: user.id })
      return new Response(
        JSON.stringify({ 
          error: 'YouTube not connected', 
          details: 'No YouTube tokens found for user. Please connect your YouTube account first.',
          suggestion: 'Go to Settings > API Settings > YouTube to connect your account'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    debugLog('YouTube tokens found', {
      channelId: tokenData.channel_id,
      channelName: tokenData.channel_name,
      expiresAt: tokenData.expires_at
    })

    // Verificar e renovar token se necessário
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    debugLog('Token validation', {
      expiresAt: expiresAt.toISOString(),
      currentTime: now.toISOString(),
      minutesUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60),
      needsRefresh: timeUntilExpiry < 5 * 60 * 1000
    })

    if (timeUntilExpiry < 5 * 60 * 1000) {
      debugLog('Token expiring soon, attempting refresh...')
      
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token'
          })
        })

        const refreshData = await refreshResponse.json()
        
        if (refreshResponse.ok) {
          debugLog('Token refreshed successfully')
          accessToken = refreshData.access_token
          
          await supabaseService
            .from('youtube_tokens')
            .update({
              access_token: accessToken,
              expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
            })
            .eq('user_id', user.id)
        } else {
          errorLog('Failed to refresh token', refreshData)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to refresh YouTube token',
              details: 'Please reconnect your YouTube account',
              suggestion: 'Go to Settings > API Settings > YouTube to reconnect'
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (refreshError) {
        errorLog('Error during token refresh', refreshError)
        return new Response(
          JSON.stringify({ 
            error: 'Token refresh failed',
            details: 'Unable to refresh YouTube access token'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    debugLog('Starting video search', { channelId: tokenData.channel_id, maxResults: options.maxVideos })

    // Buscar vídeos do canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${Math.min(options.maxVideos, 50)}`
    
    try {
      const channelResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const channelData = await channelResponse.json()
      
      debugLog('YouTube API search response', {
        status: channelResponse.status,
        ok: channelResponse.ok,
        itemCount: channelData.items?.length || 0,
        hasError: !!channelData.error
      })
      
      if (!channelResponse.ok) {
        errorLog('YouTube API search error', channelData)
        return new Response(
          JSON.stringify({ 
            error: 'YouTube API error',
            details: channelData.error?.message || 'Failed to fetch videos from YouTube',
            code: channelData.error?.code
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const videoIds = channelData.items?.map((item: any) => item.id.videoId) || []
      debugLog('Video IDs extracted', { count: videoIds.length, ids: videoIds.slice(0, 5) })

      if (videoIds.length === 0) {
        debugLog('No videos found in channel')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Nenhum vídeo encontrado no canal',
            stats: { processed: 0, new: 0, updated: 0, errors: 0 }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar detalhes completos dos vídeos
      debugLog('Fetching video details for videos', { count: videoIds.length })
      
      const batchSize = 50
      const allVideos: YouTubeVideo[] = []
      const errors: string[] = []

      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize)
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batch.join(',')}`
        
        debugLog(`Fetching batch ${Math.floor(i/batchSize) + 1}`, { batchSize: batch.length, startIndex: i })
        
        try {
          const detailsResponse = await fetch(detailsUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })

          const detailsData = await detailsResponse.json()
          
          if (detailsResponse.ok) {
            allVideos.push(...detailsData.items)
            debugLog(`Batch ${Math.floor(i/batchSize) + 1} completed`, { 
              batchVideos: detailsData.items?.length || 0,
              totalSoFar: allVideos.length 
            })
          } else {
            const errorMsg = `Erro ao buscar lote ${Math.floor(i/batchSize) + 1}: ${detailsData.error?.message}`
            errorLog('Video details batch error', detailsData)
            errors.push(errorMsg)
          }
        } catch (batchError) {
          const errorMsg = `Erro de rede no lote ${Math.floor(i/batchSize) + 1}`
          errorLog('Network error in batch', batchError)
          errors.push(errorMsg)
        }
      }

      debugLog('All video details fetched', { totalVideos: allVideos.length, errors: errors.length })

      // Processar e salvar vídeos
      const stats = { processed: 0, new: 0, updated: 0, errors: 0 }

      // Função para detectar se é Short
      const isShort = (duration: string) => {
        const { seconds } = parseDuration(duration)
        return seconds <= 60
      }

      debugLog('Starting video processing', { totalToProcess: allVideos.length })

      for (const video of allVideos) {
        try {
          const videoType = isShort(video.contentDetails.duration) ? 'SHORT' : 'REGULAR'
          const durationData = parseDuration(video.contentDetails.duration)
          const thumbnailUrl = getBestThumbnail(video.snippet.thumbnails)
          
          debugLog(`Processing video: ${video.snippet.title}`, {
            id: video.id,
            type: videoType,
            duration: durationData.formatted
          })
          
          // Filtrar por tipo se necessário
          if (videoType === 'REGULAR' && !options.includeRegular) {
            debugLog('Skipping regular video due to filter')
            continue
          }
          if (videoType === 'SHORT' && !options.includeShorts) {
            debugLog('Skipping short video due to filter')
            continue
          }

          // Verificar se vídeo já existe
          const { data: existingVideo } = await supabaseService
            .from('videos')
            .select('*')
            .eq('youtube_id', video.id)
            .eq('user_id', user.id)
            .maybeSingle()

          // Preparar dados do vídeo
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
            thumbnail_url: thumbnailUrl,
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
              
              if (updateError) {
                errorLog('Error updating video', { videoId: video.id, error: updateError })
                throw updateError
              }
              
              stats.updated++
              debugLog('Video updated successfully', { id: video.id, title: video.snippet.title })
            }
          } else {
            const { error: insertError } = await supabaseService
              .from('videos')
              .insert(videoData)
            
            if (insertError) {
              errorLog('Error inserting video', { videoId: video.id, error: insertError })
              throw insertError
            }
            
            stats.new++
            debugLog('New video created successfully', { id: video.id, title: video.snippet.title })
          }

          stats.processed++

        } catch (error) {
          errorLog('Error processing individual video', { videoId: video.id, error })
          errors.push(`Erro ao processar vídeo ${video.snippet.title}: ${error.message}`)
          stats.errors++
        }
      }

      debugLog('=== Sync completed successfully ===', { stats, errorCount: errors.length })

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
      errorLog('Error during video fetching/processing', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch or process videos',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    errorLog('=== Critical error in youtube-sync ===', {
      error,
      stack: error.stack,
      name: error.name,
      message: error.message
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        type: error.constructor.name 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
