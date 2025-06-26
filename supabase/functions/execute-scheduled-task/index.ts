
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskData {
  blockId?: string
  syncOptions?: {
    type: 'full' | 'incremental'
    includeRegular: boolean
    includeShorts: boolean
    syncMetadata: boolean
    maxVideos: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Execute Scheduled Task Function Called ===')

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { taskId } = await req.json()

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Executing task:', taskId)

    // Buscar a tarefa
    const { data: task, error: taskError } = await supabaseService
      .from('scheduled_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'running')
      .single()

    if (taskError || !task) {
      console.error('Task not found or not in running status:', taskError)
      return new Response(
        JSON.stringify({ error: 'Task not found or not in running status' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Task found:', task.name, 'Type:', task.task_type)

    let result: { success: boolean; message: string; error?: string }

    try {
      // Executar a tarefa baseada no tipo
      switch (task.task_type) {
        case 'activate_block':
          result = await executeActivateBlock(supabaseService, task.task_data as TaskData)
          break
        case 'deactivate_block':
          result = await executeDeactivateBlock(supabaseService, task.task_data as TaskData)
          break
        case 'sync_videos':
          result = await executeSyncVideos(supabaseService, task.user_id, task.task_data as TaskData)
          break
        default:
          throw new Error(`Unknown task type: ${task.task_type}`)
      }

      console.log('Task execution result:', result)

      // Atualizar status da tarefa
      if (result.success) {
        await supabaseService
          .from('scheduled_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId)
      } else {
        await supabaseService
          .from('scheduled_tasks')
          .update({
            status: 'error',
            error_message: result.error || result.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId)
      }

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Error executing task:', error)

      // Marcar tarefa como erro
      await supabaseService
        .from('scheduled_tasks')
        .update({
          status: 'error',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Task execution failed',
          error: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('=== Critical error in execute-scheduled-task ===')
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function executeActivateBlock(supabase: any, taskData: TaskData): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { blockId } = taskData

    if (!blockId) {
      return { success: false, message: 'Block ID is required', error: 'Missing blockId in task_data' }
    }

    const { error } = await supabase
      .from('blocks')
      .update({ is_active: true })
      .eq('id', blockId)

    if (error) throw error

    return { success: true, message: `Block ${blockId} activated successfully` }
  } catch (error) {
    return { success: false, message: 'Failed to activate block', error: error.message }
  }
}

async function executeDeactivateBlock(supabase: any, taskData: TaskData): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { blockId } = taskData

    if (!blockId) {
      return { success: false, message: 'Block ID is required', error: 'Missing blockId in task_data' }
    }

    const { error } = await supabase
      .from('blocks')
      .update({ is_active: false })
      .eq('id', blockId)

    if (error) throw error

    return { success: true, message: `Block ${blockId} deactivated successfully` }
  } catch (error) {
    return { success: false, message: 'Failed to deactivate block', error: error.message }
  }
}

async function executeSyncVideos(supabase: any, userId: string, taskData: TaskData): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const defaultSyncOptions = {
      type: 'incremental' as const,
      includeRegular: true,
      includeShorts: true,
      syncMetadata: true,
      maxVideos: 50
    }

    const syncOptions = { ...defaultSyncOptions, ...(taskData.syncOptions || {}) }

    // Buscar tokens do YouTube do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, message: 'YouTube not connected', error: 'No YouTube tokens found' }
    }

    // Chamar a função de sincronização do YouTube
    const response = await supabase.functions.invoke('youtube-sync', {
      body: { options: syncOptions }
    })

    if (response.error) {
      return { success: false, message: 'YouTube sync failed', error: response.error.message }
    }

    const stats = response.data?.stats || { processed: 0, new: 0, updated: 0, errors: 0 }
    return {
      success: true,
      message: `YouTube sync completed: ${stats.processed} videos processed, ${stats.new} new, ${stats.updated} updated`
    }
  } catch (error) {
    return { success: false, message: 'Failed to sync videos', error: error.message }
  }
}
