
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { code, state, error: oauthError } = await req.json()

    console.log('Callback received:', { code: !!code, state: !!state, error: oauthError })

    if (oauthError) {
      console.error('OAuth error:', oauthError)
      return new Response(
        JSON.stringify({ error: `OAuth error: ${oauthError}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state: !!state })
      return new Response(
        JSON.stringify({ error: 'Missing authorization code or state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair user_id do state
    const userId = state.split('-')[0]
    if (!userId) {
      console.error('Invalid state parameter:', state)
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('OAuth credentials not configured')
      return new Response(
        JSON.stringify({ error: 'OAuth credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determinar a redirect_uri baseada no origin
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
    const redirectUri = origin ? `${origin}/auth/youtube/callback` : `https://kmhwfdupsyobqoacjdbz.supabase.co/auth/youtube/callback`

    console.log('Using redirect_uri for token exchange:', redirectUri)

    // Trocar code por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    const tokenData = await tokenResponse.json()

    console.log('Token response status:', tokenResponse.status)
    console.log('Token data keys:', Object.keys(tokenData))

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for tokens', details: tokenData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar informações do canal
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    )

    const channelData = await channelResponse.json()
    console.log('Channel response status:', channelResponse.status)
    
    const channel = channelData.items?.[0]

    if (!channel) {
      console.error('No channel found for user')
      return new Response(
        JSON.stringify({ error: 'No YouTube channel found for this account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    // Salvar tokens no banco
    const { error: dbError } = await supabaseClient
      .from('youtube_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        channel_id: channel?.id,
        channel_name: channel?.snippet?.title,
        channel_thumbnail: channel?.snippet?.thumbnails?.default?.url,
        subscriber_count: parseInt(channel?.statistics?.subscriberCount || '0')
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save tokens', details: dbError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully saved tokens for user:', userId)

    return new Response(
      JSON.stringify({ 
        success: true,
        channel: {
          id: channel?.id,
          name: channel?.snippet?.title,
          thumbnail: channel?.snippet?.thumbnails?.default?.url,
          subscriberCount: channel?.statistics?.subscriberCount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in youtube-oauth-callback:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
