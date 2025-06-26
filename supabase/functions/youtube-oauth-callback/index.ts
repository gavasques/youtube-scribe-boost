
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
    console.log('=== YouTube OAuth Callback Function Called ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('Request body received:', requestBody)

    const { code, state, error: oauthError } = requestBody

    console.log('OAuth parameters:')
    console.log('  Code:', code ? 'present' : 'missing')
    console.log('  State:', state ? state : 'missing')
    console.log('  OAuth Error:', oauthError || 'none')

    if (oauthError) {
      console.error('OAuth error received:', oauthError)
      return new Response(
        JSON.stringify({ error: `OAuth error: ${oauthError}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { 
        codePresent: !!code, 
        statePresent: !!state 
      })
      return new Response(
        JSON.stringify({ error: 'Missing authorization code or state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair user_id do state
    const userId = state.split('-')[0]
    if (!userId) {
      console.error('Invalid state parameter format:', state)
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Extracted user ID from state:', userId)

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('OAuth credentials missing:', {
        clientIdPresent: !!clientId,
        clientSecretPresent: !!clientSecret
      })
      return new Response(
        JSON.stringify({ error: 'OAuth credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('OAuth credentials found:')
    console.log('  Client ID:', clientId.substring(0, 10) + '...')
    console.log('  Client Secret:', clientSecret.substring(0, 6) + '...')

    // Determinar a redirect_uri baseada no origin ou usar a URL padrão
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
    const redirectUri = origin ? `${origin}/auth/youtube/callback` : `https://id-preview--c6b920b8-5253-4951-8cec-6933bd5f6001.lovable.app/auth/youtube/callback`

    console.log('Token exchange redirect URI:', redirectUri)

    // Preparar dados para troca de token
    const tokenRequestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })

    console.log('=== Initiating token exchange with Google ===')
    console.log('Token request parameters:')
    console.log('  client_id:', clientId.substring(0, 10) + '...')
    console.log('  code:', code.substring(0, 10) + '...')
    console.log('  grant_type: authorization_code')
    console.log('  redirect_uri:', redirectUri)

    // Trocar code por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenRequestBody
    })

    const tokenData = await tokenResponse.json()

    console.log('=== Google token response ===')
    console.log('Status:', tokenResponse.status)
    console.log('Status text:', tokenResponse.statusText)
    console.log('Response keys:', Object.keys(tokenData))
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:')
      console.error('  Status:', tokenResponse.status)
      console.error('  Response:', tokenData)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for tokens', details: tokenData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Token exchange successful, received:')
    console.log('  access_token:', tokenData.access_token ? 'present' : 'missing')
    console.log('  refresh_token:', tokenData.refresh_token ? 'present' : 'missing')
    console.log('  expires_in:', tokenData.expires_in)
    console.log('  token_type:', tokenData.token_type)

    // Buscar informações do canal
    console.log('=== Fetching YouTube channel info ===')
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    )

    const channelData = await channelResponse.json()
    console.log('YouTube API response:')
    console.log('  Status:', channelResponse.status)
    console.log('  Items count:', channelData.items?.length || 0)
    
    if (!channelResponse.ok) {
      console.error('YouTube API error:', channelData)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch YouTube channel info', details: channelData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const channel = channelData.items?.[0]

    if (!channel) {
      console.error('No YouTube channel found for user')
      return new Response(
        JSON.stringify({ error: 'No YouTube channel found for this account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Channel found:')
    console.log('  ID:', channel.id)
    console.log('  Name:', channel.snippet?.title)
    console.log('  Subscribers:', channel.statistics?.subscriberCount)

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))
    console.log('Token expires at:', expiresAt.toISOString())

    // Salvar tokens no banco
    console.log('=== Saving tokens to database ===')
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
      console.error('Database error when saving tokens:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save tokens', details: dbError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Success! Tokens saved successfully ===')
    console.log('User ID:', userId)
    console.log('Channel connected:', channel?.snippet?.title)

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
    console.error('=== Critical error in youtube-oauth-callback ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
