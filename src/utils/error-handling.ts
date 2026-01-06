/**
 * Error handling utilities for AI Assessment module
 */

export interface NetworkError extends Error {
  status?: number
  code?: string
  isNetworkError?: boolean
}

export interface ErrorHandlingOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
  onError?: (error: NetworkError) => void
}

/**
 * Creates a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if ('status' in error) {
      const networkError = error as NetworkError
      switch (networkError.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.'
        case 401:
          return 'Authentication required. Please log in and try again.'
        case 403:
          return 'You do not have permission to perform this action.'
        case 404:
          return 'The requested resource was not found.'
        case 409:
          return 'A conflict occurred. The resource may have been modified by another user.'
        case 422:
          return 'Invalid data provided. Please check your input.'
        case 429:
          return 'Too many requests. Please wait a moment and try again.'
        case 500:
          return 'Server error occurred. Please try again later.'
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.'
        default:
          if (networkError.status && networkError.status >= 500) {
            return 'Server error occurred. Please try again later.'
          }
          return networkError.message || 'An unexpected error occurred.'
      }
    }

    // Connection errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }

    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred.'
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const networkError = error as NetworkError
    
    // Retry on network errors
    if (networkError.isNetworkError) {
      return true
    }

    // Retry on specific HTTP status codes
    if (networkError.status) {
      return [408, 429, 500, 502, 503, 504].includes(networkError.status)
    }

    // Retry on connection/timeout errors
    const message = error.message.toLowerCase()
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('fetch')
  }

  return false
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onError
  } = options

  let lastError: NetworkError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as NetworkError
      
      // Don't retry on the last attempt or non-retryable errors
      if (attempt === maxRetries || !isRetryableError(error)) {
        onError?.(lastError)
        throw lastError
      }

      // Call retry callback
      onRetry?.(attempt + 1)

      // Wait with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Creates a network error with additional metadata
 */
export function createNetworkError(
  message: string,
  status?: number,
  code?: string
): NetworkError {
  const error = new Error(message) as NetworkError
  error.status = status
  error.code = code
  error.isNetworkError = true
  return error
}

/**
 * Error categories for different types of errors
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Categorizes an error for better handling
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const networkError = error as NetworkError
    
    if (networkError.status) {
      if (networkError.status === 401) return ErrorCategory.AUTHENTICATION
      if (networkError.status === 403) return ErrorCategory.AUTHORIZATION
      if (networkError.status === 404) return ErrorCategory.NOT_FOUND
      if (networkError.status >= 400 && networkError.status < 500) return ErrorCategory.VALIDATION
      if (networkError.status >= 500) return ErrorCategory.SERVER
    }

    if (networkError.isNetworkError || 
        error.message.includes('network') || 
        error.message.includes('fetch')) {
      return ErrorCategory.NETWORK
    }
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Logs errors with appropriate level and context
 */
export function logError(error: unknown, context?: string) {
  const category = categorizeError(error)
  
  const logData = {
    error: error instanceof Error ? error.message : String(error),
    category,
    context,
    timestamp: new Date().toISOString(),
    ...(error instanceof Error && 'stack' in error && { stack: error.stack })
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', logData)
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
}