
export interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
  pageToken?: string
  syncAll?: boolean
  deepScan?: boolean
  maxEmptyPages?: number
}

export interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
  totalEstimated?: number
}

export interface ProcessingSpeed {
  videosPerMinute: number
  elapsedTimeMs: number
  eta?: string
}

export interface PageStats {
  videosInPage: number
  newInPage: number
  updatedInPage: number
  isEmptyPage: boolean
  totalChannelVideos?: number
  videosReturnedByAPI: number
}

export interface SyncResult {
  stats: SyncStats
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
  pageStats: PageStats
  processingSpeed?: ProcessingSpeed
}

export interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  pageStats?: PageStats
  processingSpeed?: ProcessingSpeed
  totalVideosEstimated?: number
}

export interface BatchSyncState {
  isRunning: boolean
  canPause: boolean
  isPaused: boolean
  totalStats: SyncStats
  allErrors: string[]
  pagesProcessed: number
  emptyPages: number
  maxEmptyPages: number
  startTime?: number
  lastPageStats?: PageStats
  overallSpeed?: ProcessingSpeed
}
