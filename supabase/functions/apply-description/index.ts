
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplyDescriptionRequest {
  videoId: string
  description: string
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

    const { videoId, description }: ApplyDescriptionRequest = await req.json()

    if (!videoId || !description) {
      return new Response(
        JSON.stringify({ error: 'videoId and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Applying description to video:', videoId)

    // Buscar tokens do YouTube do usuário
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('youtube_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single()

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: 'YouTube tokens not found. Please reconnect your YouTube account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar tamanho da descrição (YouTube limit: 5000 characters)
    if (description.length > 5000) {
      return new Response(
        JSON.stringify({ error: `Description too long (${description.length} characters). YouTube limit is 5000 characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar vídeo no YouTube
    const youtubeResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: videoId,
        snippet: {
          description: description
        }
      })
    })

    if (!youtubeResponse.ok) {
      const errorData = await youtubeResponse.json()
      console.error('YouTube API error:', errorData)
      
      // Se o token expirou, tentar renovar
      if (youtubeResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'YouTube authentication expired. Please reconnect your account.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw new Error(`YouTube API error: ${errorData.error?.message || youtubeResponse.statusText}`)
    }

    const updatedVideo = await youtubeResponse.json()
    
    // Log da operação
    const { error: logError } = await supabaseClient
      .from('videos')
      .update({
        current_description: description,
        compiled_description: description,
        configuration_status: 'CONFIGURED',
        updated_at: new Date().toISOString()
      })
      .eq('youtube_id', videoId)
      .eq('user_id', user.id)

    if (logError) {
      console.error('Error updating video record:', logError)
    }

    console.log('Description applied successfully to video:', videoId)

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        charactersUsed: description.length,
        updatedAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in apply-description:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
