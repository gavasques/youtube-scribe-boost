
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
    console.log('=== YouTube OAuth Start Function Called ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user ID:', user.id)

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    if (!clientId) {
      console.error('Google Client ID not configured')
      return new Response(
        JSON.stringify({ error: 'Google Client ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Google Client ID found:', clientId.substring(0, 10) + '...')

    // Gerar state para segurança
    const state = crypto.randomUUID()
    const secureState = `${user.id}-${state}`
    console.log('Generated state:', secureState)

    // Obter a origin da requisição
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
    console.log('Request origin:', origin)
    console.log('Request referer:', req.headers.get('referer'))
    
    if (!origin) {
      console.error('No origin found in request headers')
      console.log('Available headers:', Object.fromEntries(req.headers.entries()))
      return new Response(
        JSON.stringify({ error: 'Invalid request origin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redirectUri = `${origin}/auth/youtube/callback`
    console.log('Generated redirect URI:', redirectUri)
    
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.upload'
    ].join(' ')

    console.log('OAuth scopes:', scopes)

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', secureState)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    console.log('=== Generated OAuth URL ===')
    console.log('Full URL:', authUrl.toString())
    console.log('URL parameters:')
    authUrl.searchParams.forEach((value, key) => {
      console.log(`  ${key}: ${key === 'client_id' ? value.substring(0, 10) + '...' : value}`)
    })

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(), 
        state: secureState,
        redirectUri: redirectUri,
        clientId: clientId.substring(0, 10) + '...'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Error in youtube-oauth-start ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
