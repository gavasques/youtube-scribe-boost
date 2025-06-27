
import { useState } from 'react'
import { logger } from '@/core/Logger'
import type { SyncOptions, BatchSyncState, SyncStats } from './types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useBatchSync = () => {
  const [batchSync, setBatchSync] = useState<BatchSyncState>({
    isRunning: false,
    canPause: false,
    isPaused: false,
    totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
    allErrors: []
  })

  const pauseBatchSync = () => {
    setBatchSync(prev => ({ ...prev, isPaused: true }))
  }

  const resumeBatchSync = () => {
    setBatchSync(prev => ({ ...prev, isPaused: false }))
  }

  const stopBatchSync = () => {
    setBatchSync({
      isRunning: false,
      canPause: false,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: []
    })
  }

  const updateBatchStats = (newStats: SyncStats, errors: string[] = []) => {
    setBatchSync(prev => ({
      ...prev,
      totalStats: {
        processed: prev.totalStats.processed + newStats.processed,
        new: prev.totalStats.new + newStats.new,
        updated: prev.totalStats.updated + newStats.updated,
        errors: prev.totalStats.errors + newStats.errors,
        totalEstimated: newStats.totalEstimated
      },
      allErrors: [...prev.allErrors, ...errors]
    }))
  }

  const startBatchSync = (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: []
    })
  }

  return {
    batchSync,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    updateBatchStats,
    startBatchSync
  }
}
