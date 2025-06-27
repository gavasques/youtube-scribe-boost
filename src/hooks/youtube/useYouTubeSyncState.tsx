
import { useState, useCallback } from 'react'
import { logger } from '@/core/Logger'

export interface SyncState {
  isReady: boolean
  isInitializing: boolean
  error: string | null
  lastSync: Date | null
}

export const useYouTubeSyncState = () => {
  const [state, setState] = useState<SyncState>({
    isReady: false,
    isInitializing: true,
    error: null,
    lastSync: null
  })

  const markReady = useCallback(() => {
    logger.info('[SYNC-STATE] Marking sync system as ready')
    setState(prev => ({
      ...prev,
      isReady: true,
      isInitializing: false,
      error: null
    }))
  }, [])

  const markError = useCallback((error: string) => {
    logger.error('[SYNC-STATE] Sync system error:', error)
    setState(prev => ({
      ...prev,
      isReady: false,
      isInitializing: false,
      error
    }))
  }, [])

  const markSyncComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSync: new Date()
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      isReady: false,
      isInitializing: true,
      error: null,
      lastSync: null
    })
  }, [])

  return {
    state,
    markReady,
    markError,
    markSyncComplete,
    resetState
  }
}
