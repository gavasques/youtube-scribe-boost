
import { useState, useCallback } from 'react'

export interface SyncState {
  isReady: boolean
  isInitializing: boolean
  error: string | null
  lastSync: Date | null
  hasYouTubeConnection: boolean
}

export interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  pageStats?: {
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
  totalVideosEstimated?: number
}

export const useSyncState = () => {
  const [state, setState] = useState<SyncState>({
    isReady: false,
    isInitializing: true,
    error: null,
    lastSync: null,
    hasYouTubeConnection: false
  })

  const [progress, setProgress] = useState<SyncProgress>({
    step: '',
    current: 0,
    total: 0,
    message: ''
  })

  const markReady = useCallback((hasConnection: boolean = false) => {
    console.log('[SYNC-STATE] Marking system as ready', { hasConnection })
    setState(prev => ({
      ...prev,
      isReady: true,
      isInitializing: false,
      error: null,
      hasYouTubeConnection: hasConnection
    }))
  }, [])

  const markError = useCallback((error: string) => {
    console.error('[SYNC-STATE] System error:', error)
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
    setProgress({
      step: '',
      current: 0,
      total: 0,
      message: ''
    })
  }, [])

  return {
    state,
    progress,
    setProgress,
    markReady,
    markError,
    markSyncComplete,
    updateConnectionStatus,
    resetState
  }
}
