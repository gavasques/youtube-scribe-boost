
import { useState, useCallback } from 'react'
import { logger } from '@/core/Logger'

export interface SyncState {
  isReady: boolean
  isInitializing: boolean
  error: string | null
  lastSync: Date | null
  hasYouTubeConnection: boolean
}

export const useYouTubeSyncState = () => {
  const [state, setState] = useState<SyncState>({
    isReady: false,
    isInitializing: true,
    error: null,
    lastSync: null,
    hasYouTubeConnection: false
  })

  const markReady = useCallback((hasConnection: boolean = false) => {
    logger.info('[SYNC-STATE] Marking sync system as ready', { hasConnection })
    setState(prev => ({
      ...prev,
      isReady: true,
      isInitializing: false,
      error: null,
      hasYouTubeConnection: hasConnection
    }))
  }, [])

  const markError = useCallback((error: string) => {
    logger.error('[SYNC-STATE] Sync system error:', error)
    setState(prev => ({
      ...prev,
      isReady: false,
      isInitializing: false,
      error,
      hasYouTubeConnection: false
    }))
  }, [])

  const markSyncComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSync: new Date()
    }))
  }, [])

  const updateConnectionStatus = useCallback((hasConnection: boolean) => {
    setState(prev => ({
      ...prev,
      hasYouTubeConnection: hasConnection,
      isReady: hasConnection
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      isReady: false,
      isInitializing: true,
      error: null,
      lastSync: null,
      hasYouTubeConnection: false
    })
  }, [])

  return {
    state,
    markReady,
    markError,
    markSyncComplete,
    updateConnectionStatus,
    resetState
  }
}
