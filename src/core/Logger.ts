
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: Date
  source?: string
}

class Logger {
  private level: LogLevel = LogLevel.DEBUG
  private isDevelopment = import.meta.env.DEV

  setLevel(level: LogLevel) {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const dataStr = data ? ` | ${JSON.stringify(data, null, 2)}` : ''
    return `[YT-SYNC][${timestamp}] ${levelName}: ${message}${dataStr}`
  }

  debug(message: string, data?: any, source?: string) {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    console.debug(this.formatMessage(LogLevel.DEBUG, message, data))
  }

  info(message: string, data?: any, source?: string) {
    if (!this.shouldLog(LogLevel.INFO)) return
    console.info(this.formatMessage(LogLevel.INFO, message, data))
  }

  warn(message: string, data?: any, source?: string) {
    if (!this.shouldLog(LogLevel.WARN)) return
    console.warn(this.formatMessage(LogLevel.WARN, message, data))
  }

  error(message: string, error?: any, source?: string) {
    if (!this.shouldLog(LogLevel.ERROR)) return
    console.error(this.formatMessage(LogLevel.ERROR, message, error))
    
    // Send structured error data to console for debugging
    if (error && typeof error === 'object') {
      console.error('[YT-SYNC] Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      })
    }
    
    if (!this.isDevelopment) {
      this.sendToMonitoring({
        level: LogLevel.ERROR,
        message,
        data: error,
        timestamp: new Date(),
        source
      })
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Future: implement monitoring service integration
  }
}

export const logger = new Logger()

if (import.meta.env.DEV) {
  logger.setLevel(LogLevel.DEBUG)
} else {
  logger.setLevel(LogLevel.INFO)
}
