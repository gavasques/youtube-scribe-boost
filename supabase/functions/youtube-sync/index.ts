
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
      medium: { url: string }
    }
  }
  contentDetails: {
    duration: string
  }
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
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

    // Verificar autenticação usando o mesmo método do oauth-start
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

    // Buscar tokens do YouTube usando o service role para acessar todos os dados
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
        
        // Atualizar token no banco
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
      message: `Buscando detalhes de ${videoIds.length} vídeos...`
    })

    // Buscar detalhes dos vídeos em lotes
    const batchSize = 50
    const allVideos: YouTubeVideo[] = []

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize)
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

    console.log('Total videos fetched:', allVideos.length)

    sendProgress({
      step: 'processing',
      current: 4,
      total: 5,
      message: 'Processando vídeos...'
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
      // Parse ISO 8601 duration (PT1M30S = 1 minute 30 seconds)
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return false
      
      const minutes = parseInt(match[1] || '0')
      const seconds = parseInt(match[2] || '0')
      const totalSeconds = minutes * 60 + seconds
      
      return totalSeconds <= 60 // 60 segundos ou menos = Short
    }

    for (const video of allVideos) {
      try {
        console.log(`Processing video: ${video.snippet.title}`)
        
        const videoType = isShort(video.contentDetails.duration) ? 'SHORT' : 'REGULAR'
        console.log(`Video type: ${videoType}, Duration: ${video.contentDetails.duration}`)
        
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
          updated_at: new Date().toISOString()
        }

        console.log('Video data to save:', {
          youtube_id: videoData.youtube_id,
          title: videoData.title,
          video_type: videoData.video_type,
          user_id: videoData.user_id
        })

        if (existingVideo) {
          console.log('Video exists, updating...')
          
          // Atualizar vídeo existente apenas se syncMetadata estiver ativo
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
          console.log('Creating new video...')
          
          // Criar novo vídeo
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

    console.log('=== Sync completed ===')
    console.log('Final stats:', stats)

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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
