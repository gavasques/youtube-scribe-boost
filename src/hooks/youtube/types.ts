
export interface SyncOptions {
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

export interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
  totalEstimated?: number
}

export interface QuotaInfo {
  resetTime?: string
  requestsUsed?: number
  dailyLimit?: number
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
}

export interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
  currentPage?: number
  totalPages?: number
  videosProcessed?: number
  totalVideosEstimated?: number
  quotaInfo?: QuotaInfo
  processingSpeed?: ProcessingSpeed
  pageStats?: PageStats
}

export interface SyncResult {
  stats: SyncStats
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
  quotaInfo?: QuotaInfo
  pageStats: PageStats
  processingSpeed: ProcessingSpeed
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
