/**
 * Comprehensive Error Handling Tests
 * Tests error boundaries, loading states, and retry mechanisms
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ai-assessment/ErrorBoundary'
import { LoadingSpinner, FullPageLoading, CategoryLoading } from '@/components/ai-assessment/LoadingSpinner'
import { ErrorMessage, NetworkError, ValidationError, CategoryError } from '@/components/ai-assessment/ErrorMessage'
import { useErrorHandler, useCategoryErrorHandler, useFormErrorHandler } from '@/hooks/useErrorHandler'

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean; message?: string }> = ({ 
  shouldThrow, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>No error</div>
}

// Test component for error handler hook
const TestErrorHandler: React.FC<{ 
  operation: () => Promise<string>
  operationName?: string 
}> = ({ operation, operationName }) => {
  const { error, isLoading, retryCount, canRetry, executeWithErrorHandling, retry, clearError } = useErrorHandler()
  const [result, setResult] = React.useState<string | null>(null)

  const handleExecute = async () => {
    const result = await executeWithErrorHandling(operation, operationName)
    setResult(result)
  }

  return (
    <div>
      <button onClick={handleExecute} data-testid="execute-button">
        Execute Operation
      </button>
      {canRetry && (
        <button onClick={retry} data-testid="retry-button">
          Retry ({retryCount})
        </button>
      )}
      <button onClick={clearError} data-testid="clear-button">
        Clear Error
      </button>
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {result && <div data-testid="result">{result}</div>}
    </div>
  )
}

describe('Error Boundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  test('catches and displays error when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Test error message" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  test('provides retry functionality', async () => {
    let shouldThrow = true
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    )

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Click retry button
    const retryButton = screen.getByText(/Try Again/)
    fireEvent.click(retryButton)

    // Change the component to not throw
    shouldThrow = false
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  test('limits retry attempts', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Click retry button multiple times
    const retryButton = screen.getByText(/Try Again/)
    
    fireEvent.click(retryButton) // Retry 1
    fireEvent.click(retryButton) // Retry 2
    fireEvent.click(retryButton) // Retry 3

    // Should show max retries reached message
    expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument()
  })

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} message="Callback test" />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })
})

describe('Loading Components', () => {
  test('LoadingSpinner renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" text="Loading small" />)
    expect(screen.getByText('Loading small')).toBeInTheDocument()

    rerender(<LoadingSpinner size="lg" text="Loading large" />)
    expect(screen.getByText('Loading large')).toBeInTheDocument()
  })

  test('FullPageLoading displays title and message', () => {
    render(
      <FullPageLoading 
        title="Custom Title" 
        message="Custom loading message" 
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom loading message')).toBeInTheDocument()
  })

  test('CategoryLoading shows category-specific loading', () => {
    render(
      <CategoryLoading 
        categoryName="Test Category" 
        operation="Saving" 
      />
    )

    expect(screen.getByText('Saving "Test Category"...')).toBeInTheDocument()
  })
})

describe('Error Message Components', () => {
  test('ErrorMessage displays different types correctly', () => {
    const { rerender } = render(
      <ErrorMessage 
        message="Error message" 
        type="error" 
        title="Error Title" 
      />
    )

    expect(screen.getByText('Error Title')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()

    rerender(
      <ErrorMessage 
        message="Warning message" 
        type="warning" 
        title="Warning Title" 
      />
    )

    expect(screen.getByText('Warning Title')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  test('ErrorMessage handles retry and dismiss actions', () => {
    const onRetry = jest.fn()
    const onDismiss = jest.fn()

    render(
      <ErrorMessage 
        message="Test message" 
        onRetry={onRetry}
        onDismiss={onDismiss}
        retryText="Custom Retry"
      />
    )

    fireEvent.click(screen.getByText('Custom Retry'))
    expect(onRetry).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Dismiss'))
    expect(onDismiss).toHaveBeenCalled()
  })

  test('NetworkError shows retry count', () => {
    const onRetry = jest.fn()

    render(
      <NetworkError 
        onRetry={onRetry}
        retryCount={2}
        maxRetries={3}
      />
    )

    expect(screen.getByText('Retry (1 left)')).toBeInTheDocument()
  })

  test('ValidationError displays multiple errors', () => {
    const errors = ['Field 1 is required', 'Field 2 is invalid']

    render(<ValidationError errors={errors} />)

    expect(screen.getByText('Please fix the following 2 issues:')).toBeInTheDocument()
    expect(screen.getByText('Field 1 is required')).toBeInTheDocument()
    expect(screen.getByText('Field 2 is invalid')).toBeInTheDocument()
  })

  test('CategoryError provides skip option', () => {
    const onRetry = jest.fn()
    const onSkip = jest.fn()

    render(
      <CategoryError
        categoryName="Test Category"
        operation="load"
        error="Failed to load category"
        onRetry={onRetry}
        onSkip={onSkip}
      />
    )

    expect(screen.getByText('Failed to load "Test Category"')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onRetry).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Skip for Now'))
    expect(onSkip).toHaveBeenCalled()
  })
})

describe('Error Handler Hooks', () => {
  test('useErrorHandler executes operations and handles success', async () => {
    const successOperation = jest.fn().mockResolvedValue('Success result')

    render(
      <TestErrorHandler 
        operation={successOperation}
        operationName="Test Operation"
      />
    )

    fireEvent.click(screen.getByTestId('execute-button'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Success result')
    })

    expect(successOperation).toHaveBeenCalled()
  })

  test('useErrorHandler handles operation failures', async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'))

    render(
      <TestErrorHandler 
        operation={failingOperation}
        operationName="Failing Operation"
      />
    )

    fireEvent.click(screen.getByTestId('execute-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failing Operation failed: Operation failed')
    })
  })

  test('useErrorHandler provides retry functionality', async () => {
    let callCount = 0
    const retryOperation = jest.fn().mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.reject(new Error('Retry test'))
      }
      return Promise.resolve('Success after retry')
    })

    render(
      <TestErrorHandler 
        operation={retryOperation}
        operationName="Retry Operation"
      />
    )

    // First attempt - should fail
    fireEvent.click(screen.getByTestId('execute-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    // Retry - should still fail
    fireEvent.click(screen.getByTestId('retry-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    // Second retry - should succeed
    fireEvent.click(screen.getByTestId('retry-button'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Success after retry')
    })

    expect(retryOperation).toHaveBeenCalledTimes(3)
  })

  test('useErrorHandler clears errors', async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error('Clear test'))

    render(
      <TestErrorHandler 
        operation={failingOperation}
        operationName="Clear Test"
      />
    )

    // Execute and fail
    fireEvent.click(screen.getByTestId('execute-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    // Clear error
    fireEvent.click(screen.getByTestId('clear-button'))

    expect(screen.queryByTestId('error')).not.toBeInTheDocument()
  })
})

describe('Form Error Handler', () => {
  const TestFormErrorHandler: React.FC = () => {
    const {
      validationErrors,
      validationErrorList,
      hasValidationErrors,
      addValidationError,
      removeValidationError,
      clearValidationErrors
    } = useFormErrorHandler()

    return (
      <div>
        <button 
          onClick={() => addValidationError('field1', 'Field 1 error')}
          data-testid="add-error-1"
        >
          Add Error 1
        </button>
        <button 
          onClick={() => addValidationError('field2', 'Field 2 error')}
          data-testid="add-error-2"
        >
          Add Error 2
        </button>
        <button 
          onClick={() => removeValidationError('field1')}
          data-testid="remove-error-1"
        >
          Remove Error 1
        </button>
        <button 
          onClick={clearValidationErrors}
          data-testid="clear-errors"
        >
          Clear All
        </button>
        
        {hasValidationErrors && (
          <div data-testid="has-errors">Has Errors</div>
        )}
        
        <div data-testid="error-count">{validationErrorList.length}</div>
        
        {Object.entries(validationErrors).map(([field, error]) => (
          <div key={field} data-testid={`error-${field}`}>{error}</div>
        ))}
      </div>
    )
  }

  test('manages validation errors correctly', () => {
    render(<TestFormErrorHandler />)

    // Initially no errors
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    expect(screen.queryByTestId('has-errors')).not.toBeInTheDocument()

    // Add first error
    fireEvent.click(screen.getByTestId('add-error-1'))
    expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    expect(screen.getByTestId('has-errors')).toBeInTheDocument()
    expect(screen.getByTestId('error-field1')).toHaveTextContent('Field 1 error')

    // Add second error
    fireEvent.click(screen.getByTestId('add-error-2'))
    expect(screen.getByTestId('error-count')).toHaveTextContent('2')
    expect(screen.getByTestId('error-field2')).toHaveTextContent('Field 2 error')

    // Remove first error
    fireEvent.click(screen.getByTestId('remove-error-1'))
    expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    expect(screen.queryByTestId('error-field1')).not.toBeInTheDocument()
    expect(screen.getByTestId('error-field2')).toBeInTheDocument()

    // Clear all errors
    fireEvent.click(screen.getByTestId('clear-errors'))
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    expect(screen.queryByTestId('has-errors')).not.toBeInTheDocument()
  })
})

describe('Category Error Handler', () => {
  test('useCategoryErrorHandler provides category-specific error handling', () => {
    const TestCategoryErrorHandler: React.FC = () => {
      const errorHandler = useCategoryErrorHandler('test-category')
      
      return (
        <div>
          <button 
            onClick={() => errorHandler.executeWithErrorHandling(
              () => Promise.reject(new Error('Category error')),
              'Category Operation'
            )}
            data-testid="execute-category-operation"
          >
            Execute Category Operation
          </button>
          
          {errorHandler.error && (
            <div data-testid="category-error">{errorHandler.error}</div>
          )}
        </div>
      )
    }

    render(<TestCategoryErrorHandler />)

    fireEvent.click(screen.getByTestId('execute-category-operation'))

    waitFor(() => {
      expect(screen.getByTestId('category-error')).toHaveTextContent('Category Operation failed: Category error')
    })
  })
})