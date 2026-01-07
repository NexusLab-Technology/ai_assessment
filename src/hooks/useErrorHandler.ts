/**
 * Error Handler Hook for AI Assessment
 * Provides centralized error handling with retry mechanisms
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

'use client'

import { useState, useCallback, useRef } from 'react'

export interface ErrorState {
  error: string | null
  isLoading: boolean
  retryCount: number
  lastAttempt: Date | null
}

export interface ErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onRetry?: (retryCount: number) => void
  onMaxRetriesReached?: () => void
}

export interface UseErrorHandlerReturn {
  error: string | null
  isLoading: boolean
  retryCount: number
  canRetry: boolean
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    operationName?: string
  ) => Promise<T | null>
  retry: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useErrorHandler = (
  options: ErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options

  const [state, setState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    lastAttempt: null
  })

  const lastOperationRef = useRef<{
    operation: () => Promise<any>
    operationName?: string
  } | null>(null)

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      retryCount: 0,
      lastAttempt: null
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }))
  }, [])

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName = 'Operation'
  ): Promise<T | null> => {
    // Store the operation for retry
    lastOperationRef.current = { operation, operationName }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastAttempt: new Date()
    }))

    try {
      const result = await operation()
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `${operationName} failed: ${errorMessage}`,
        retryCount: prev.retryCount + 1
      }))

      // Call error handler
      if (onError && error instanceof Error) {
        onError(error)
      }

      // Log error for debugging
      console.error(`${operationName} failed:`, error)

      return null
    }
  }, [onError])

  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperationRef.current || state.retryCount >= maxRetries) {
      if (onMaxRetriesReached) {
        onMaxRetriesReached()
      }
      return
    }

    // Call retry handler
    if (onRetry) {
      onRetry(state.retryCount)
    }

    // Add exponential backoff delay
    const delayMs = retryDelay * Math.pow(2, state.retryCount - 1)
    await delay(delayMs)

    const { operation, operationName } = lastOperationRef.current
    await executeWithErrorHandling(operation, operationName)
  }, [state.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached, executeWithErrorHandling])

  const canRetry = state.retryCount > 0 && state.retryCount < maxRetries && !state.isLoading

  return {
    error: state.error,
    isLoading: state.isLoading,
    retryCount: state.retryCount,
    canRetry,
    executeWithErrorHandling,
    retry,
    clearError,
    setLoading
  }
}

/**
 * Specialized error handler for category operations
 */
export const useCategoryErrorHandler = (categoryName: string) => {
  return useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error(`Category "${categoryName}" operation failed:`, error)
    },
    onRetry: (retryCount) => {
      console.log(`Retrying category "${categoryName}" operation (attempt ${retryCount + 1})`)
    },
    onMaxRetriesReached: () => {
      console.error(`Max retries reached for category "${categoryName}"`)
    }
  })
}

/**
 * Error handler for API operations with specific error handling
 */
export const useApiErrorHandler = () => {
  return useErrorHandler({
    maxRetries: 2,
    retryDelay: 2000,
    onError: (error) => {
      // Log API errors for monitoring
      console.error('API operation failed:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }
  })
}

/**
 * Error handler for form validation
 */
export const useFormErrorHandler = () => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const addValidationError = useCallback((field: string, error: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])

  const removeValidationError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  const hasValidationErrors = Object.keys(validationErrors).length > 0
  const validationErrorList = Object.values(validationErrors)

  return {
    validationErrors,
    validationErrorList,
    hasValidationErrors,
    addValidationError,
    removeValidationError,
    clearValidationErrors
  }
}

/**
 * Network-specific error handler
 */
export const useNetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const errorHandler = useErrorHandler({
    maxRetries: 5,
    retryDelay: 1000,
    onError: (error) => {
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('network')) {
        setIsOnline(false)
      }
    }
  })

  // Listen for online/offline events
  useState(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  return {
    ...errorHandler,
    isOnline
  }
}