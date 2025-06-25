
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff'
}

interface ProcessingRequest {
  videoId: string
  transcription: string
  prompts: {
    summary?: string
    chapters?: string
    description?: string
    tags?: string
    category?: string
  }
  settings: {
    model: string
    temperature: number
    maxTokens: number
  }
  timestamp: number
  userId: string
}

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now >= userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (userLimit.count >= maxRequests) {
    return true
  }
  
  userLimit.count++
  return false
}

function validateInput(data: any): ProcessingRequest {
  // Validate required fields
  if (!data.videoId || typeof data.videoId !== 'string') {
    throw new Error('Invalid videoId')
  }
  
  if (!data.transcription || typeof data.transcription !== 'string') {
    throw new Error('Invalid transcription')
  }
  
  if (!data.userId || typeof data.userId !== 'string') {
    throw new Error('Invalid userId')
  }
  
  // Validate transcription length (max 100KB)
  if (data.transcription.length > 100000) {
    throw new Error('Transcription too large')
  }
  
  // Validate timestamp (must be recent)
  const now = Date.now()
  if (!data.timestamp || Math.abs(now - data.timestamp) > 300000) { // 5 minutes
    throw new Error('Invalid or expired timestamp')
  }
  
  // Sanitize strings
  const sanitizedData = {
    videoId: data.videoId.trim(),
    transcription: data.transcription.trim(),
    prompts: data.prompts || {},
    settings: {
      model: (data.settings?.model || 'gpt-4o-mini').trim(),
      temperature: Math.max(0, Math.min(2, data.settings?.temperature || 0.7)),
      maxTokens: Math.max(1, Math.min(4000, data.settings?.maxTokens || 1000))
    },
    timestamp: data.timestamp,
    userId: data.userId.trim()
  }
  
  return sanitizedData
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = req.headers.get('X-Request-ID') || crypto.randomUUID()
  console.log(`[${requestId}] AI Processing request started`)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const rawData = await req.json()
    
    // Validate and sanitize input
    const validatedData = validateInput(rawData)
    
    // Verify user owns the video
    const { data: videoData, error: videoError } = await supabaseClient
      .from('videos')
      .select('id, user_id')
      .eq('id', validatedData.videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !videoData) {
      throw new Error('Video not found or access denied')
    }

    // Check rate limit
    if (checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log(`[${requestId}] Starting AI processing for video: ${validatedData.videoId}`)

    const results: any = {}
    const errors: string[] = []

    // Função para chamar OpenAI com retry e timeout
    const callOpenAI = async (prompt: string, type: string, retries = 2) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`[${requestId}] Processing ${type} with OpenAI (attempt ${attempt + 1})`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: validatedData.settings.model,
              messages: [
                {
                  role: 'system',
                  content: prompt
                },
                {
                  role: 'user',
                  content: `Transcrição do vídeo:\n\n${validatedData.transcription}`
                }
              ],
              temperature: validatedData.settings.temperature,
              max_tokens: validatedData.settings.maxTokens,
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
          }

          const data = await response.json()
          return data.choices[0].message.content

        } catch (error) {
          console.error(`[${requestId}] Error processing ${type} (attempt ${attempt + 1}):`, error)
          
          if (attempt === retries) {
            errors.push(`Erro ao processar ${type}: ${error.message}`)
            return null
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
        }
      }
    }

    // Processar cada tipo solicitado
    if (validatedData.prompts.summary) {
      results.summary = await callOpenAI(validatedData.prompts.summary, 'summary')
    }

    if (validatedData.prompts.chapters) {
      const chaptersResult = await callOpenAI(validatedData.prompts.chapters, 'chapters')
      if (chaptersResult) {
        try {
          results.chapters = JSON.parse(chaptersResult)
        } catch {
          results.chapters = chaptersResult
        }
      }
    }

    if (validatedData.prompts.description) {
      results.description = await callOpenAI(validatedData.prompts.description, 'description')
    }

    if (validatedData.prompts.tags) {
      const tagsResult = await callOpenAI(validatedData.prompts.tags, 'tags')
      if (tagsResult) {
        try {
          const tags = tagsResult.split(',').map((tag: string) => tag.trim()).filter(Boolean)
          results.tags = tags.slice(0, 10) // Limit to 10 tags
        } catch {
          results.tags = [tagsResult]
        }
      }
    }

    if (validatedData.prompts.category) {
      results.categoryAnalysis = await callOpenAI(validatedData.prompts.category, 'category')
    }

    // Atualizar vídeo no banco com os resultados
    const updateData: any = {
      ai_processed: true,
      updated_at: new Date().toISOString()
    }

    if (results.summary) updateData.ai_summary = results.summary.substring(0, 2000) // Limit length
    if (results.description) updateData.ai_description = results.description.substring(0, 5000)
    if (results.tags) updateData.ai_generated_tags = results.tags
    if (results.chapters) updateData.ai_chapters = results.chapters

    const { error: updateError } = await supabaseClient
      .from('videos')
      .update(updateData)
      .eq('id', validatedData.videoId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error(`[${requestId}] Error updating video:`, updateError)
      errors.push('Erro ao salvar resultados no banco de dados')
    }

    // Log successful processing
    console.log(`[${requestId}] AI processing completed for video: ${validatedData.videoId}`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors: errors.length > 0 ? errors : undefined,
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`[${requestId}] Error in ai-processing:`, error)
    
    // Sanitize error message
    const sanitizedError = error.message
      .replace(/Bearer [a-zA-Z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]')
      .replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-[REDACTED]')
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: sanitizedError,
        requestId 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
