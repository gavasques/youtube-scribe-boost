
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { videoId, transcription, prompts, settings }: ProcessingRequest = await req.json()

    if (!transcription) {
      return new Response(
        JSON.stringify({ error: 'Transcription is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting AI processing for video:', videoId)

    const results: any = {}
    const errors: string[] = []

    // Função para chamar OpenAI
    const callOpenAI = async (prompt: string, type: string) => {
      try {
        console.log(`Processing ${type} with OpenAI`)
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: settings.model || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: prompt
              },
              {
                role: 'user',
                content: `Transcrição do vídeo:\n\n${transcription}`
              }
            ],
            temperature: settings.temperature || 0.7,
            max_tokens: settings.maxTokens || 1000,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        return data.choices[0].message.content

      } catch (error) {
        console.error(`Error processing ${type}:`, error)
        errors.push(`Erro ao processar ${type}: ${error.message}`)
        return null
      }
    }

    // Processar cada tipo solicitado
    if (prompts.summary) {
      results.summary = await callOpenAI(prompts.summary, 'summary')
    }

    if (prompts.chapters) {
      const chaptersResult = await callOpenAI(prompts.chapters, 'chapters')
      if (chaptersResult) {
        try {
          // Tentar parsear como JSON se for estruturado
          results.chapters = JSON.parse(chaptersResult)
        } catch {
          // Se não for JSON válido, manter como string
          results.chapters = chaptersResult
        }
      }
    }

    if (prompts.description) {
      results.description = await callOpenAI(prompts.description, 'description')
    }

    if (prompts.tags) {
      const tagsResult = await callOpenAI(prompts.tags, 'tags')
      if (tagsResult) {
        try {
          // Tentar extrair tags como array
          const tags = tagsResult.split(',').map((tag: string) => tag.trim()).filter(Boolean)
          results.tags = tags
        } catch {
          results.tags = [tagsResult]
        }
      }
    }

    if (prompts.category) {
      results.categoryAnalysis = await callOpenAI(prompts.category, 'category')
    }

    // Atualizar vídeo no banco com os resultados
    const updateData: any = {
      ai_processed: true,
      updated_at: new Date().toISOString()
    }

    if (results.summary) updateData.ai_summary = results.summary
    if (results.description) updateData.ai_description = results.description
    if (results.tags) updateData.ai_generated_tags = results.tags
    if (results.chapters) updateData.ai_chapters = results.chapters

    const { error: updateError } = await supabaseClient
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating video:', updateError)
      errors.push('Erro ao salvar resultados no banco de dados')
    }

    console.log('AI processing completed for video:', videoId)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-processing:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
