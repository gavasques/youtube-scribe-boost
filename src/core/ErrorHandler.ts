
import { logger } from './Logger'
import { toast } from '@/hooks/use-toast'
import { isSupabaseError, isYouTubeApiError, isOpenAIApiError } from './typeGuards'

export interface ErrorHandlerConfig {
  showToast?: boolean
  logError?: boolean
  retryable?: boolean
  context?: string
}

export class AppError extends Error {
  public readonly code: string
  public readonly retryable: boolean
  public readonly context?: string

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    retryable: boolean = false,
    context?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.retryable = retryable
    this.context = context
  }
}

class ErrorHandler {
  private readonly defaultConfig: ErrorHandlerConfig = {
    showToast: true,
    logError: true,
    retryable: false
  }

  handle(error: unknown, config: ErrorHandlerConfig = {}): AppError {
    const finalConfig = { ...this.defaultConfig, ...config }
    const appError = this.parseError(error, finalConfig.context)

    if (finalConfig.logError) {
      logger.error(
        `Error in ${finalConfig.context || 'Unknown'}`,
        {
          message: appError.message,
          code: appError.code,
          retryable: appError.retryable,
          stack: appError.stack
        },
        finalConfig.context
      )
    }

    if (finalConfig.showToast) {
      this.showErrorToast(appError)
    }

    return appError
  }

  private parseError(error: unknown, context?: string): AppError {
    // Supabase errors
    if (isSupabaseError(error)) {
      return new AppError(
        this.getReadableMessage(error.message),
        error.code,
        this.isRetryableSupabaseError(error.code),
        context
      )
    }

    // YouTube API errors
    if (isYouTubeApiError(error)) {
      return new AppError(
        error.error.message,
        `YOUTUBE_${error.error.code}`,
        error.error.code >= 500,
        context
      )
    }

    // OpenAI API errors
    if (isOpenAIApiError(error)) {
      return new AppError(
        error.error.message,
        `OPENAI_${error.error.type}`,
        error.error.type === 'server_error',
        context
      )
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AppError(
        'Erro de conexão. Verifique sua internet.',
        'NETWORK_ERROR',
        true,
        context
      )
    }

    // App errors
    if (error instanceof AppError) {
      return error
    }

    // Generic errors
    if (error instanceof Error) {
      return new AppError(
        error.message,
        'GENERIC_ERROR',
        false,
        context
      )
    }

    // Unknown errors
    return new AppError(
      'Erro inesperado. Tente novamente.',
      'UNKNOWN_ERROR',
      false,
      context
    )
  }

  private getReadableMessage(message: string): string {
    const messageMap: Record<string, string> = {
      'JWT expired': 'Sessão expirada. Faça login novamente.',
      'Invalid JWT': 'Sessão inválida. Faça login novamente.',
      'Row Level Security': 'Acesso negado.',
      'duplicate key value': 'Este item já existe.',
      'foreign key constraint': 'Não é possível excluir este item.',
      'not found': 'Item não encontrado.',
      'permission denied': 'Permissão negada.',
      'rate limit exceeded': 'Muitas tentativas. Tente novamente em alguns minutos.'
    }

    for (const [key, readable] of Object.entries(messageMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return readable
      }
    }

    return message
  }

  private isRetryableSupabaseError(code: string): boolean {
    const retryableCodes = [
      'PGRST301', // Rate limit
      'PGRST504', // Gateway timeout
      '42P01',    // Connection error
      '08000',    // Connection exception
      '08003',    // Connection does not exist
      '08006',    // Connection failure
      '08001',    // Unable to connect
      '08004'     // Connection rejected
    ]
    return retryableCodes.includes(code)
  }

  private showErrorToast(error: AppError) {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive"
    })
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: AppError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.handle(error, {
          showToast: false,
          logError: attempt === maxRetries,
          context: `${context} (attempt ${attempt}/${maxRetries})`
        })

        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
      }
    }

    throw lastError!
  }
}

export const errorHandler = new ErrorHandler()

// Hook para usar o error handler em componentes
export function useErrorHandler() {
  return {
    handleError: errorHandler.handle.bind(errorHandler),
    withRetry: errorHandler.withRetry.bind(errorHandler)
  }
}
