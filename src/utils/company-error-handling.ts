// Enhanced error handling utilities for Company Settings

export interface CompanyError {
  code: string
  message: string
  details?: string
  timestamp: Date
  recoverable: boolean
  retryable: boolean
}

export enum CompanyErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR'
}

export const createCompanyError = (
  code: CompanyErrorCode,
  message: string,
  details?: string,
  recoverable: boolean = true,
  retryable: boolean = false
): CompanyError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  recoverable,
  retryable
})

export const handleApiError = (error: unknown): CompanyError => {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      return createCompanyError(
        CompanyErrorCode.DUPLICATE_NAME,
        'A company with this name already exists',
        error.message,
        true,
        false
      )
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createCompanyError(
        CompanyErrorCode.NETWORK_ERROR,
        'Network connection failed. Please check your internet connection.',
        error.message,
        true,
        true
      )
    }
    
    if (error.message.includes('timeout')) {
      return createCompanyError(
        CompanyErrorCode.TIMEOUT_ERROR,
        'Request timed out. Please try again.',
        error.message,
        true,
        true
      )
    }
    
    if (error.message.includes('not found')) {
      return createCompanyError(
        CompanyErrorCode.NOT_FOUND,
        'The requested company was not found',
        error.message,
        true,
        false
      )
    }
    
    if (error.message.includes('unauthorized')) {
      return createCompanyError(
        CompanyErrorCode.UNAUTHORIZED,
        'You are not authorized to perform this action',
        error.message,
        false,
        false
      )
    }
    
    if (error.message.includes('storage') || error.message.includes('quota')) {
      return createCompanyError(
        CompanyErrorCode.STORAGE_ERROR,
        'Storage operation failed. Your device may be out of space.',
        error.message,
        true,
        false
      )
    }
    
    // Generic API error
    return createCompanyError(
      CompanyErrorCode.API_ERROR,
      error.message || 'An unexpected error occurred',
      error.stack,
      true,
      true
    )
  }
  
  // Unknown error type
  return createCompanyError(
    CompanyErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    String(error),
    true,
    true
  )
}

export const getErrorMessage = (error: CompanyError): string => {
  return error.message
}

export const getErrorDetails = (error: CompanyError): string | undefined => {
  return error.details
}

export const isRetryableError = (error: CompanyError): boolean => {
  return error.retryable
}

export const isRecoverableError = (error: CompanyError): boolean => {
  return error.recoverable
}

export const getRecoveryActions = (error: CompanyError): Array<{
  label: string
  action: string
  primary?: boolean
}> => {
  const actions = []
  
  if (error.retryable) {
    actions.push({
      label: 'Try Again',
      action: 'retry',
      primary: true
    })
  }
  
  switch (error.code) {
    case CompanyErrorCode.NETWORK_ERROR:
    case CompanyErrorCode.CONNECTION_ERROR:
      actions.push({
        label: 'Check Connection',
        action: 'check_connection'
      })
      break
      
    case CompanyErrorCode.DUPLICATE_NAME:
      actions.push({
        label: 'Choose Different Name',
        action: 'edit_name',
        primary: true
      })
      break
      
    case CompanyErrorCode.STORAGE_ERROR:
    case CompanyErrorCode.QUOTA_EXCEEDED:
      actions.push({
        label: 'Free Up Space',
        action: 'free_space'
      })
      break
      
    case CompanyErrorCode.UNAUTHORIZED:
      actions.push({
        label: 'Sign In Again',
        action: 'reauth',
        primary: true
      })
      break
  }
  
  // Always provide a way to reload
  actions.push({
    label: 'Reload Page',
    action: 'reload'
  })
  
  return actions
}

// Retry mechanism with exponential backoff
export class RetryManager {
  private attempts: Map<string, number> = new Map()
  private maxAttempts: number = 3
  private baseDelay: number = 1000 // 1 second
  
  constructor(maxAttempts: number = 3, baseDelay: number = 1000) {
    this.maxAttempts = maxAttempts
    this.baseDelay = baseDelay
  }
  
  async executeWithRetry<T>(
    key: string,
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: CompanyError) => void
  ): Promise<T> {
    const currentAttempts = this.attempts.get(key) || 0
    
    try {
      const result = await operation()
      // Reset attempts on success
      this.attempts.delete(key)
      return result
    } catch (error) {
      const companyError = handleApiError(error)
      
      if (!companyError.retryable || currentAttempts >= this.maxAttempts) {
        this.attempts.delete(key)
        throw companyError
      }
      
      const nextAttempt = currentAttempts + 1
      this.attempts.set(key, nextAttempt)
      
      // Call retry callback
      onRetry?.(nextAttempt, companyError)
      
      // Calculate delay with exponential backoff
      const delay = this.baseDelay * Math.pow(2, currentAttempts)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry the operation
      return this.executeWithRetry(key, operation, onRetry)
    }
  }
  
  getAttemptCount(key: string): number {
    return this.attempts.get(key) || 0
  }
  
  resetAttempts(key: string): void {
    this.attempts.delete(key)
  }
  
  clearAll(): void {
    this.attempts.clear()
  }
}

// Global retry manager instance
export const companyRetryManager = new RetryManager()

// Error logging utility
export const logCompanyError = (error: CompanyError, context?: string): void => {
  const logData = {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Company Settings Error:', logData)
  }
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
}