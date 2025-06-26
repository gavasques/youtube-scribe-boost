
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

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
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
  // Prioridade: maxres > standard > high > medium > default
  if (thumbnails.maxres) return thumbnails.maxres.url
  if (thumbnails.standard) return thumbnails.standard.url
  if (thumbnails.high) return thumbnails.high.url
  if (thumbnails.medium) return thumbnails.medium.url
  if (thumbnails.default) return thumbnails.default.url
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== YouTube Sync Function Called ===')
    console.log('Request method:', req.method)
    console.log('Content-Type header:', req.headers.get('content-type'))
    console.log('Authorization header present:', !!req.headers.get('authorization'))

    // Verificar se é método POST
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ler o body uma única vez e armazenar
    let bodyText: string
    try {
      bodyText = await req.text()
      console.log('Raw body length:', bodyText.length)
      console.log('Raw body preview:', bodyText.substring(0, 200))
    } catch (bodyError) {
      console.error('Error reading request body:', bodyError)
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
      console.error('Empty request body received')
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body',
          details: 'Request body is required with sync options'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user ID:', user.id)

    // Fazer parse do JSON
    let requestBody: any
    let options: SyncOptions
    
    try {
      requestBody = JSON.parse(bodyText)
      console.log('Parsed request body successfully:', Object.keys(requestBody))

      // Extrair options do body
      if (!requestBody.options) {
        throw new Error('Missing options in request body')
      }

      options = requestBody.options as SyncOptions
      console.log('Sync options extracted:', {
        type: options.type,
        maxVideos: options.maxVideos,
        includeRegular: options.includeRegular,
        includeShorts: options.includeShorts
      })

    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: jsonError.message,
          bodyReceived: bodyText.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar options obrigatórios
    if (!options.hasOwnProperty('type') || !options.hasOwnProperty('maxVideos')) {
      console.error('Invalid options structure:', options)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid options structure',
          details: 'Missing required fields: type, maxVideos',
          received: Object.keys(options)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Função para enviar progresso
    const sendProgress = (progress: SyncProgress) => {
      console.log('Progress:', progress.step, '-', progress.message)
    }

    sendProgress({
      step: 'validation',
      current: 1,
      total: 5,
      message: 'Validando conexão com YouTube...'
    })

    // Buscar tokens do YouTube usando o service role
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: tokenData, error: tokenError } = await supabaseService
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      console.error('YouTube tokens not found:', tokenError)
      return new Response(
        JSON.stringify({ 
          error: 'YouTube not connected', 
          details: 'No YouTube tokens found for user. Please connect your YouTube account first.',
          suggestion: 'Go to Settings > API Settings > YouTube to connect your account'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found YouTube tokens for user:', user.id)
    console.log('Channel ID:', tokenData.channel_id)

    // Verificar se token é válido e renovar se necessário
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    console.log('Token expires at:', expiresAt.toISOString())
    console.log('Current time:', now.toISOString())
    console.log('Token valid for:', Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60), 'minutes')

    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('Token expiring soon, refreshing...')
      
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
        console.log('Token refreshed successfully')
        accessToken = refreshData.access_token
        
        await supabaseService
          .from('youtube_tokens')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
          })
          .eq('user_id', user.id)
      } else {
        console.error('Failed to refresh token:', refreshData)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to refresh YouTube token',
            details: 'Please reconnect your YouTube account',
            suggestion: 'Go to Settings > API Settings > YouTube to reconnect'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    sendProgress({
      step: 'fetching',
      current: 2,
      total: 5,
      message: 'Buscando lista de vídeos do canal...'
    })

    // Buscar vídeos do canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${Math.min(options.maxVideos, 50)}`
    console.log('Fetching videos from YouTube API...')

    const channelResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const channelData = await channelResponse.json()
    
    if (!channelResponse.ok) {
      console.error('YouTube API error:', channelData)
      return new Response(
        JSON.stringify({ 
          error: 'YouTube API error',
          details: channelData.error?.message || 'Failed to fetch videos from YouTube',
          code: channelData.error?.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found videos from API:', channelData.items?.length || 0)
    const videoIds = channelData.items?.map((item: any) => item.id.videoId) || []

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum vídeo encontrado no canal',
          stats: { processed: 0, new: 0, updated: 0, errors: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    sendProgress({
      step: 'details',
      current: 3,
      total: 5,
      message: `Buscando detalhes completos de ${videoIds.length} vídeos...`
    })

    // Buscar detalhes completos dos vídeos em lotes
    const batchSize = 50
    const allVideos: YouTubeVideo[] = []
    const errors: string[] = []

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize)
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batch.join(',')}`
      
      console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}, videos: ${batch.length}`)
      
      try {
        const detailsResponse = await fetch(detailsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        const detailsData = await detailsResponse.json()
        if (detailsResponse.ok) {
          allVideos.push(...detailsData.items)
          console.log(`Batch completed, total videos so far: ${allVideos.length}`)
        } else {
          console.error('Error fetching video details batch:', detailsData)
          errors.push(`Erro ao buscar lote ${Math.floor(i/batchSize) + 1}: ${detailsData.error?.message}`)
        }
      } catch (batchError) {
        console.error('Network error fetching batch:', batchError)
        errors.push(`Erro de rede no lote ${Math.floor(i/batchSize) + 1}`)
      }
    }

    console.log('Total videos fetched with complete data:', allVideos.length)

    sendProgress({
      step: 'processing',
      current: 4,
      total: 5,
      message: 'Processando e salvando dados dos vídeos...'
    })

    const stats = {
      processed: 0,
      new: 0,
      updated: 0,
      errors: 0
    }

    // Função para detectar se é Short
    const isShort = (duration: string) => {
      const { seconds } = parseDuration(duration)
      return seconds <= 60
    }

    for (const video of allVideos) {
      try {
        console.log(`Processing video: ${video.snippet.title}`)
        
        const videoType = isShort(video.contentDetails.duration) ? 'SHORT' : 'REGULAR'
        const durationData = parseDuration(video.contentDetails.duration)
        const thumbnailUrl = getBestThumbnail(video.snippet.thumbnails)
        
        // Filtrar por tipo se necessário
        if (videoType === 'REGULAR' && !options.includeRegular) {
          console.log('Skipping regular video due to filter')
          continue
        }
        if (videoType === 'SHORT' && !options.includeShorts) {
          console.log('Skipping short video due to filter')
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
              console.error('Error updating video:', updateError)
              throw updateError
            }
            
            stats.updated++
            console.log('Video updated successfully')
          }
        } else {
          const { error: insertError } = await supabaseService
            .from('videos')
            .insert(videoData)
          
          if (insertError) {
            console.error('Error inserting video:', insertError)
            throw insertError
          }
          
          stats.new++
          console.log('New video created successfully')
        }

        stats.processed++

      } catch (error) {
        console.error('Error processing video:', video.id, error)
        errors.push(`Erro ao processar vídeo ${video.snippet.title}: ${error.message}`)
        stats.errors++
      }
    }

    sendProgress({
      step: 'complete',
      current: 5,
      total: 5,
      message: 'Sincronização concluída!'
    })

    console.log('=== Sync completed successfully ===')
    console.log('Final stats:', stats)
    if (errors.length > 0) {
      console.log('Errors encountered:', errors)
    }

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
    console.error('=== Critical error in youtube-sync ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
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
