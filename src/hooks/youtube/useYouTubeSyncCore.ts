
import { useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { SyncProgress } from './useSyncState'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos?: number
  pageToken?: string
  syncAll?: boolean
  deepScan?: boolean
  maxEmptyPages?: number
}

interface SyncResult {
  stats: {
    processed: number
    new: number
    updated: number
    errors: number
    totalEstimated?: number
  }
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
  pageStats: {
    videosInPage: number
    newInPage: number
    updatedInPage: number
    isEmptyPage: boolean
    totalChannelVideos?: number
  }
  processingSpeed?: {
    videosPerMinute: number
    elapsedTimeMs: number
    eta?: string
  }
}

export const useYouTubeSyncCore = () => {
  const { toast } = useToast()
  const cancelRef = useRef(false)

  const performSync = useCallback(async (
    options: SyncOptions,
    onProgress: (progress: SyncProgress) => void
  ): Promise<SyncResult> => {
    console.log('[SYNC-CORE] Iniciando sincronização:', options)
    
    // Reset cancel flag
    cancelRef.current = false
    
    onProgress({
      step: 'auth_check',
      current: 1,
      total: 6,
      message: 'Verificando autenticação...'
    })

    // Verificar autenticação
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError || !authData.session) {
      throw new Error('Usuário não autenticado')
    }

    if (cancelRef.current) {
      throw new Error('Sincronização cancelada')
    }

    console.log('[SYNC-CORE] Usuário autenticado:', authData.session.user.id)

    onProgress({
      step: 'youtube_check',
      current: 2,
      total: 6,
      message: 'Verificando conexão YouTube...'
    })

    // Verificar tokens YouTube
    const { data: tokenData, error: tokenError } = await supabase
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', authData.session.user.id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      throw new Error('YouTube não conectado. Conecte sua conta primeiro.')
    }

    if (cancelRef.current) {
      throw new Error('Sincronização cancelada')
    }

    console.log('[SYNC-CORE] YouTube conectado:', tokenData.channel_name)

    onProgress({
      step: 'calling_api',
      current: 3,
      total: 6,
      message: 'Chamando YouTube API...'
    })

    // Chamar Edge Function
    console.log('[SYNC-CORE] Chamando Edge Function com opções:', options)
    
    const response = await supabase.functions.invoke('youtube-sync', {
      body: { options },
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (cancelRef.current) {
      throw new Error('Sincronização cancelada')
    }

    console.log('[SYNC-CORE] Resposta da Edge Function:', {
      error: response.error?.message,
      success: !!response.data,
      stats: response.data?.stats
    })

    if (response.error) {
      console.error('[SYNC-CORE] Erro na Edge Function:', response.error)
      throw new Error(`Erro na sincronização: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('Resposta vazia da Edge Function')
    }

    const result = response.data as SyncResult

    if (!result.stats) {
      throw new Error('Dados inválidos retornados da sincronização')
    }

    onProgress({
      step: 'complete',
      current: 6,
      total: 6,
      message: `Sincronização concluída! ${result.stats.processed} vídeos processados.`,
      pageStats: result.pageStats,
      processingSpeed: result.processingSpeed,
      totalVideosEstimated: result.stats.totalEstimated
    })

    console.log('[SYNC-CORE] Sincronização concluída com sucesso:', result.stats)
    return result

  }, [toast])

  const cancelSync = useCallback(() => {
    console.log('[SYNC-CORE] Cancelando sincronização...')
    cancelRef.current = true
  }, [])

  return {
    performSync,
    cancelSync
  }
}
