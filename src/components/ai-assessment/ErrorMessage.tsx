/**
 * Error Message Components for AI Assessment
 * Provides user-friendly error messages and recovery actions
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

'use client'

import React from 'react'
import { AlertTriangle, XCircle, RefreshCw, ChevronRight, Info } from 'lucide-react'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  onRetry?: () => void
  onDismiss?: () => void
  retryText?: string
  className?: string
  showIcon?: boolean
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  onRetry,
  onDismiss,
  retryText = 'Try Again',
  className = '',
  showIcon = true
}) => {
  const typeStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = typeStyles[type]
  
  const IconComponent = type === 'error' ? XCircle : type === 'warning' ? AlertTriangle : Info

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`w-5 h-5 ${styles.icon}`} />
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h3>
          )}
          
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50`}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {retryText}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  retryCount?: number
  maxRetries?: number
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  retryCount = 0,
  maxRetries = 3
}) => {
  const canRetry = retryCount < maxRetries

  return (
    <ErrorMessage
      title="Connection Error"
      message={
        canRetry
          ? "Unable to connect to the server. Please check your internet connection and try again."
          : "Multiple connection attempts failed. Please refresh the page or try again later."
      }
      type="error"
      onRetry={canRetry ? onRetry : undefined}
      retryText={`Retry (${maxRetries - retryCount} left)`}
    />
  )
}

interface ValidationErrorProps {
  errors: string[]
  onDismiss?: () => void
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  errors,
  onDismiss
}) => {
  return (
    <ErrorMessage
      title="Validation Error"
      message={
        errors.length === 1
          ? errors[0]
          : `Please fix the following ${errors.length} issues:`
      }
      type="warning"
      onDismiss={onDismiss}
      className="mb-4"
    >
      {errors.length > 1 && (
        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </ErrorMessage>
  )
}

interface CategoryErrorProps {
  categoryName: string
  operation: string
  error: string
  onRetry?: () => void
  onSkip?: () => void
}

export const CategoryError: React.FC<CategoryErrorProps> = ({
  categoryName,
  operation,
  error,
  onRetry,
  onSkip
}) => {
  return (
    <div className="bg-white rounded-lg border border-red-200 p-6">
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to {operation} "{categoryName}"
        </h3>
        
        <p className="text-gray-600 mb-4">
          {error}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Skip for Now
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface FormFieldErrorProps {
  error: string
  fieldName?: string
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
  error,
  fieldName
}) => {
  return (
    <div className="mt-1 flex items-center text-red-600">
      <XCircle className="w-4 h-4 mr-1 flex-shrink-0" />
      <span className="text-sm">
        {fieldName && `${fieldName}: `}{error}
      </span>
    </div>
  )
}

interface ApiErrorProps {
  error: {
    message: string
    code?: string | number
    details?: string
  }
  onRetry?: () => void
  onReport?: () => void
}

export const ApiError: React.FC<ApiErrorProps> = ({
  error,
  onRetry,
  onReport
}) => {
  const getErrorMessage = () => {
    if (error.code === 404) {
      return "The requested resource was not found. It may have been moved or deleted."
    }
    if (error.code === 403) {
      return "You don't have permission to access this resource."
    }
    if (error.code === 500) {
      return "A server error occurred. Our team has been notified."
    }
    if (typeof error.code === 'number' && error.code >= 400) {
      return `Server error (${error.code}): ${error.message}`
    }
    return error.message
  }

  return (
    <ErrorMessage
      title="API Error"
      message={getErrorMessage()}
      type="error"
      onRetry={onRetry}
    >
      {error.details && (
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
            Technical Details
          </summary>
          <pre className="mt-1 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
            {error.details}
          </pre>
        </details>
      )}
      
      {onReport && (
        <button
          onClick={onReport}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Report this issue
        </button>
      )}
    </ErrorMessage>
  )
}