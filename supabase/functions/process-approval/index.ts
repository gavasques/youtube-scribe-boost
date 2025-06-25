
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

    const { approvalId } = await req.json()

    if (!approvalId) {
      throw new Error('ID da aprovação é obrigatório')
    }

    // Buscar a aprovação
    const { data: approval, error: approvalError } = await supabaseClient
      .from('approvals')
      .select('*')
      .eq('id', approvalId)
      .single()

    if (approvalError || !approval) {
      throw new Error('Aprovação não encontrada')
    }

    if (approval.status !== 'APPROVED') {
      throw new Error('Apenas aprovações aprovadas podem ser processadas')
    }

    console.log(`Processando aprovação: ${approval.title}`)

    // Processar baseado no tipo de aprovação
    switch (approval.type) {
      case 'BLOCK_CHANGE':
        await processBlockChange(supabaseClient, approval)
        break
      
      case 'MASS_UPDATE':
        await processMassUpdate(supabaseClient, approval)
        break
      
      case 'SYNC_OPERATION':
        await processSyncOperation(supabaseClient, approval)
        break
      
      case 'CATEGORY_CHANGE':
        await processCategoryChange(supabaseClient, approval)
        break
      
      case 'TAG_UPDATE':
        await processTagUpdate(supabaseClient, approval)
        break
      
      case 'SEASONAL_TEMPLATE':
        await processSeasonalTemplate(supabaseClient, approval)
        break
      
      default:
        throw new Error(`Tipo de aprovação não suportado: ${approval.type}`)
    }

    console.log(`Aprovação processada com sucesso: ${approval.title}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Aprovação processada com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar aprovação:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function processBlockChange(supabaseClient: any, approval: any) {
  const { block_after, affected_videos } = approval.data

  // Atualizar o bloco
  const { error: blockError } = await supabaseClient
    .from('blocks')
    .update({
      content: block_after.content,
      title: block_after.title,
      description: block_after.description,
      updated_at: new Date().toISOString()
    })
    .eq('id', block_after.id)

  if (blockError) {
    throw new Error(`Erro ao atualizar bloco: ${blockError.message}`)
  }

  console.log(`Bloco atualizado: ${block_after.title}`)
  console.log(`${affected_videos?.length || 0} vídeos serão atualizados`)
}

async function processMassUpdate(supabaseClient: any, approval: any) {
  const { operation_type, changes, affected_videos } = approval.data

  console.log(`Processando atualização em massa: ${operation_type}`)
  
  if (affected_videos && affected_videos.length > 0) {
    // Aplicar as mudanças em lotes
    const batchSize = 10
    for (let i = 0; i < affected_videos.length; i += batchSize) {
      const batch = affected_videos.slice(i, i + batchSize)
      
      const { error } = await supabaseClient
        .from('videos')
        .update({
          ...changes,
          updated_at: new Date().toISOString()
        })
        .in('id', batch.map((v: any) => v.id))

      if (error) {
        throw new Error(`Erro ao atualizar lote de vídeos: ${error.message}`)
      }
    }
  }

  console.log(`${affected_videos?.length || 0} vídeos atualizados`)
}

async function processSyncOperation(supabaseClient: any, approval: any) {
  console.log('Processando operação de sincronização')
  
  // Aqui você pode implementar a lógica de sincronização com YouTube
  // Por exemplo, chamar outras Edge Functions de sincronização
  
  const { affected_videos } = approval.data
  console.log(`Sincronizando ${affected_videos?.length || 0} vídeos`)
}

async function processCategoryChange(supabaseClient: any, approval: any) {
  const { category_after, affected_videos } = approval.data

  if (affected_videos && affected_videos.length > 0) {
    const { error } = await supabaseClient
      .from('videos')
      .update({
        category_id: category_after.id,
        updated_at: new Date().toISOString()
      })
      .in('id', affected_videos.map((v: any) => v.id))

    if (error) {
      throw new Error(`Erro ao atualizar categoria dos vídeos: ${error.message}`)
    }
  }

  console.log(`${affected_videos?.length || 0} vídeos movidos para categoria: ${category_after.name}`)
}

async function processTagUpdate(supabaseClient: any, approval: any) {
  const { tags_after, affected_videos } = approval.data

  if (affected_videos && affected_videos.length > 0) {
    const { error } = await supabaseClient
      .from('videos')
      .update({
        current_tags: tags_after,
        updated_at: new Date().toISOString()
      })
      .in('id', affected_videos.map((v: any) => v.id))

    if (error) {
      throw new Error(`Erro ao atualizar tags dos vídeos: ${error.message}`)
    }
  }

  console.log(`Tags atualizadas em ${affected_videos?.length || 0} vídeos`)
}

async function processSeasonalTemplate(supabaseClient: any, approval: any) {
  console.log('Processando template sazonal')
  
  const { template, affected_videos } = approval.data
  
  // Implementar lógica específica para templates sazonais
  console.log(`Aplicando template ${template.name} em ${affected_videos?.length || 0} vídeos`)
}
