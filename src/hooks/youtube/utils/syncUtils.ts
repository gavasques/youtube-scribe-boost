
import { logger } from '@/core/Logger'

export const shouldContinueSync = (
  deepScan: boolean = false, 
  hasNextPageToken: boolean = true,
  isRunning: boolean = true,
  emptyPages: number = 0,
  maxEmptyPages: number = 5
): boolean => {
  logger.info('[SYNC-UTILS] Checking should continue sync:', {
    deepScan,
    hasNextPageToken,
    isRunning,
    emptyPages,
    maxEmptyPages
  })

  // Se não está rodando, parar
  if (!isRunning) {
    logger.info('[SYNC-UTILS] Stopping - sync not running')
    return false
  }

  // Se não há próxima página, parar
  if (!hasNextPageToken) {
    logger.info('[SYNC-UTILS] Stopping - no more pages available')
    return false
  }

  // No deep scan, continuar sempre que há páginas disponíveis
  if (deepScan) {
    logger.info('[SYNC-UTILS] Deep scan mode - continuing while pages available')
    return true
  }

  // No modo normal, parar após maxEmptyPages páginas vazias consecutivas
  const shouldStop = emptyPages >= maxEmptyPages
  if (shouldStop) {
    logger.info(`[SYNC-UTILS] Stopping - reached max empty pages (${emptyPages}/${maxEmptyPages})`)
  }
  
  return !shouldStop
}

export const createInitialBatchState = () => ({
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
