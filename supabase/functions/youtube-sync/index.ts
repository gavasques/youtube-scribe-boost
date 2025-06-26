
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
        JSON.stringify({ error: 'Unauthorized', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user ID:', user.id)

    const { options }: { options: SyncOptions } = await req.json()
    console.log('Sync options:', options)

    // Função para enviar progresso
    const sendProgress = (progress: SyncProgress) => {
      console.log('Progress:', progress)
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
        JSON.stringify({ error: 'YouTube not connected', details: tokenError }),
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
        throw new Error('Failed to refresh access token')
      }
    }

    sendProgress({
      step: 'fetching',
      current: 2,
      total: 5,
      message: 'Buscando lista de vídeos do canal...'
    })

    // Buscar vídeos do canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${options.maxVideos}`
    console.log('Fetching videos from:', searchUrl)

    const channelResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const channelData = await channelResponse.json()
    
    if (!channelResponse.ok) {
      console.error('YouTube API error:', channelData)
      throw new Error(`YouTube API error: ${channelData.error?.message || 'Unknown error'}`)
    }

    console.log('Found videos:', channelData.items?.length || 0)
    const videoIds = channelData.items?.map((item: any) => item.id.videoId) || []

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum vídeo encontrado',
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

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize)
      // Buscar todos os dados possíveis: snippet, contentDetails, statistics, status
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batch.join(',')}`
      
      console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}, videos: ${batch.length}`)
      
      const detailsResponse = await fetch(detailsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const detailsData = await detailsResponse.json()
      if (detailsResponse.ok) {
        allVideos.push(...detailsData.items)
        console.log(`Batch completed, total videos so far: ${allVideos.length}`)
      } else {
        console.error('Error fetching video details:', detailsData)
      }
    }

    console.log('Total videos fetched with complete data:', allVideos.length)

    sendProgress({
      step: 'processing',
      current: 4,
      total: 5,
      message: 'Processando e salvando todos os dados dos vídeos...'
    })

    const stats = {
      processed: 0,
      new: 0,
      updated: 0,
      errors: 0
    }

    const errors: string[] = []

    // Função para detectar se é Short
    const isShort = (duration: string) => {
      const { seconds } = parseDuration(duration)
      return seconds <= 60 // 60 segundos ou menos = Short
    }

    for (const video of allVideos) {
      try {
        console.log(`Processing video: ${video.snippet.title}`)
        
        const videoType = isShort(video.contentDetails.duration) ? 'SHORT' : 'REGULAR'
        const durationData = parseDuration(video.contentDetails.duration)
        const thumbnailUrl = getBestThumbnail(video.snippet.thumbnails)
        
        console.log(`Video type: ${videoType}, Duration: ${video.contentDetails.duration} (${durationData.formatted})`)
        
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

        // Preparar todos os dados do vídeo
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
          
          // Novos campos com todos os metadados
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

        console.log('Complete video data to save:', {
          youtube_id: videoData.youtube_id,
          title: videoData.title,
          video_type: videoData.video_type,
          views_count: videoData.views_count,
          likes_count: videoData.likes_count,
          duration_formatted: videoData.duration_formatted,
          privacy_status: videoData.privacy_status
        })

        if (existingVideo) {
          console.log('Video exists, updating with complete data...')
          
          // Atualizar vídeo existente sempre, ou apenas se syncMetadata estiver ativo
          if (options.syncMetadata || true) { // Sempre atualizar para garantir dados completos
            const { error: updateError } = await supabaseService
              .from('videos')
              .update(videoData)
              .eq('id', existingVideo.id)
            
            if (updateError) {
              console.error('Error updating video:', updateError)
              throw updateError
            }
            
            stats.updated++
            console.log('Video updated successfully with complete data')
          }
        } else {
          console.log('Creating new video with complete data...')
          
          // Criar novo vídeo
          const { error: insertError } = await supabaseService
            .from('videos')
            .insert(videoData)
          
          if (insertError) {
            console.error('Error inserting video:', insertError)
            throw insertError
          }
          
          stats.new++
          console.log('New video created successfully with complete data')
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
      message: 'Sincronização concluída com todos os dados!'
    })

    console.log('=== Sync completed with complete data ===')
    console.log('Final stats:', stats)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída com sucesso - todos os dados foram salvos',
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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
