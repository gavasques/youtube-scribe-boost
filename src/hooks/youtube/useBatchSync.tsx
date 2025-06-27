
import { useState } from 'react'
import { logger } from '@/core/Logger'
import type { SyncOptions, BatchSyncState, SyncStats, PageStats, ProcessingSpeed } from './types'

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
    maxEmptyPages: 5,
    startTime: undefined,
    lastPageStats: undefined,
    overallSpeed: undefined
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
      maxEmptyPages: 5,
      startTime: undefined,
      lastPageStats: undefined,
      overallSpeed: undefined
    })
  }

  const updateBatchStats = (newStats: SyncStats, errors: string[] = [], pageStats?: PageStats) => {
    setBatchSync(prev => {
      const isEmptyPage = pageStats?.isEmptyPage || newStats.new === 0
      const newEmptyPages = isEmptyPage ? prev.emptyPages + 1 : 0
      
      // Calculate overall processing speed
      const totalElapsed = prev.startTime ? Date.now() - prev.startTime : 0
      const totalProcessed = prev.totalStats.processed + newStats.processed
      const overallSpeed: ProcessingSpeed = {
        videosPerMinute: totalElapsed > 0 ? (totalProcessed / (totalElapsed / 60000)) : 0,
        elapsedTimeMs: totalElapsed
      }

      // Calculate ETA if we have total estimated
      if (newStats.totalEstimated && overallSpeed.videosPerMinute > 0) {
        const remainingVideos = newStats.totalEstimated - totalProcessed
        const remainingMinutes = remainingVideos / overallSpeed.videosPerMinute
        overallSpeed.eta = new Date(Date.now() + (remainingMinutes * 60000)).toISOString()
      }
      
      logger.info('[BATCH-SYNC] Enhanced stats update:', {
        newVideos: newStats.new,
        isEmptyPage,
        emptyPagesCount: newEmptyPages,
        maxEmptyPages: prev.maxEmptyPages,
        pageStats,
        overallSpeed,
        totalProcessed
      })

      return {
        ...prev,
        totalStats: {
          processed: prev.totalStats.processed + newStats.processed,
          new: prev.totalStats.new + newStats.new,
          updated: prev.totalStats.updated + newStats.updated,
          errors: prev.totalStats.errors + newStats.errors,
          totalEstimated: newStats.totalEstimated || prev.totalStats.totalEstimated
        },
        allErrors: [...prev.allErrors, ...errors],
        pagesProcessed: prev.pagesProcessed + 1,
        emptyPages: newEmptyPages,
        lastPageStats: pageStats,
        overallSpeed
      }
    })
  }

  const shouldContinueSync = (deepScan: boolean = false) => {
    if (deepScan) {
      // In deep scan mode, continue until no more pages
      return batchSync.isRunning
    }
    // Normal mode: stop after maxEmptyPages consecutive empty pages
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
      maxEmptyPages: options.maxEmptyPages || 5,
      startTime: Date.now(),
      lastPageStats: undefined,
      overallSpeed: undefined
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
