
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { options }: { options: SyncOptions } = await req.json()

    // Buscar tokens do YouTube
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'YouTube not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Verificar se token é válido e renovar se necessário
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      // Token expira em menos de 5 minutos, renovar
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
        accessToken = refreshData.access_token
        
        // Atualizar token no banco
        await supabaseClient
          .from('youtube_tokens')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
          })
          .eq('user_id', user.id)
      }
    }

    sendProgress({
      step: 'fetching',
      current: 2,
      total: 5,
      message: 'Buscando lista de vídeos do canal...'
    })

    // Buscar vídeos do canal
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${tokenData.channel_id}&type=video&order=date&maxResults=${options.maxVideos}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    const channelData = await channelResponse.json()
    
    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelData.error?.message || 'Unknown error'}`)
    }

    const videoIds = channelData.items.map((item: any) => item.id.videoId)

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
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batch.join(',')}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const detailsData = await detailsResponse.json()
      if (detailsResponse.ok) {
        allVideos.push(...detailsData.items)
      }
    }

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
        const videoType = isShort(video.contentDetails.duration) ? 'SHORT' : 'REGULAR'
        
        // Filtrar por tipo se necessário
        if (videoType === 'REGULAR' && !options.includeRegular) continue
        if (videoType === 'SHORT' && !options.includeShorts) continue

        // Verificar se vídeo já existe
        const { data: existingVideo } = await supabaseClient
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
          original_description: video.snippet.description,
          current_description: video.snippet.description,
          original_tags: video.snippet.tags || [],
          current_tags: video.snippet.tags || [],
          updated_at: new Date().toISOString()
        }

        if (existingVideo) {
          // Fazer backup da descrição atual se for diferente
          if (options.syncMetadata && existingVideo.current_description !== video.snippet.description) {
            await supabaseClient
              .from('description_backups')
              .insert({
                video_id: existingVideo.id,
                user_id: user.id,
                description: existingVideo.current_description,
                backup_reason: 'sync_update',
                created_at: new Date().toISOString()
              })
          }

          // Atualizar vídeo existente
          if (options.syncMetadata) {
            await supabaseClient
              .from('videos')
              .update(videoData)
              .eq('id', existingVideo.id)
            
            stats.updated++
          }
        } else {
          // Criar novo vídeo
          await supabaseClient
            .from('videos')
            .insert(videoData)
          
          stats.new++
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
    console.error('Error in youtube-sync:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
