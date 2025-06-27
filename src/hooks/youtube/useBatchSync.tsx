
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
    allErrors: [],
    pagesProcessed: 0,
    emptyPages: 0,
    maxEmptyPages: 5 // Stop after 5 consecutive pages with no new videos
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
      allErrors: [],
      pagesProcessed: 0,
      emptyPages: 0,
      maxEmptyPages: 5
    })
  }

  const updateBatchStats = (newStats: SyncStats, errors: string[] = []) => {
    setBatchSync(prev => {
      const isEmptyPage = newStats.new === 0
      const newEmptyPages = isEmptyPage ? prev.emptyPages + 1 : 0
      
      logger.info('[BATCH-SYNC] Updating stats:', {
        newVideos: newStats.new,
        isEmptyPage,
        emptyPagesCount: newEmptyPages,
        maxEmptyPages: prev.maxEmptyPages
      })

      return {
        ...prev,
        totalStats: {
          processed: prev.totalStats.processed + newStats.processed,
          new: prev.totalStats.new + newStats.new,
          updated: prev.totalStats.updated + newStats.updated,
          errors: prev.totalStats.errors + newStats.errors,
          totalEstimated: newStats.totalEstimated
        },
        allErrors: [...prev.allErrors, ...errors],
        pagesProcessed: prev.pagesProcessed + 1,
        emptyPages: newEmptyPages
      }
    })
  }

  const shouldContinueSync = () => {
    return batchSync.emptyPages < batchSync.maxEmptyPages && batchSync.isRunning
  }

  const startBatchSync = (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: [],
      pagesProcessed: 0,
      emptyPages: 0,
      maxEmptyPages: 5
    })
  }

  return {
    batchSync,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    updateBatchStats,
    startBatchSync,
    shouldContinueSync
  }
}
