/**
 * Enhanced Assessment Wizard with Comprehensive Error Handling
 * Integrates error boundaries, loading states, and retry mechanisms
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { LoadingSpinner, FullPageLoading, CategoryLoading } from './LoadingSpinner'
import { ErrorMessage, NetworkError, CategoryError, ValidationError } from './ErrorMessage'
import { useErrorHandler, useCategoryErrorHandler, useFormErrorHandler } from '@/hooks/useErrorHandler'
import { CategoryNavigationSidebar } from './CategoryNavigationSidebar'
import { FixedQuestionContainer } from './FixedQuestionContainer'
import { EnhancedProgressTracker } from './EnhancedProgressTracker'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { 
  RAPIDQuestionnaire, 
  Assessment, 
  AssessmentResponses,
  CategoryCompletionStatus 
} from '@/types/rapid-questionnaire'

interface EnhancedAssessmentWizardWithErrorHandlingProps {
  questionnaire: RAPIDQuestionnaire
  assessment: Assessment
  onUpdateResponses: (categoryId: string, responses: { [questionId: string]: any }) => Promise<void>
  onUpdateCategoryStatus: (categoryId: string, status: CategoryCompletionStatus) => Promise<void>
  onComplete: () => Promise<void>
  className?: string
}

export const EnhancedAssessmentWizardWithErrorHandling: React.FC<EnhancedAssessmentWizardWithErrorHandlingProps> = ({
  questionnaire,
  assessment,
  onUpdateResponses,
  onUpdateCategoryStatus,
  onComplete,
  className = ''
}) => {
  const [currentCategoryId, setCurrentCategoryId] = useState(assessment.currentCategory)
  const [currentSubcategoryId, setCurrentSubcategoryId] = useState<string>('')
  const [responses, setResponses] = useState<AssessmentResponses>(assessment.responses)
  const [isInitializing, setIsInitializing] = useState(true)

  // Error handlers
  const mainErrorHandler = useErrorHandler({
    maxRetries: 3,
    onError: (error) => console.error('Assessment wizard error:', error)
  })

  const categoryErrorHandler = useCategoryErrorHandler(currentCategoryId)
  const formErrorHandler = useFormErrorHandler()

  // Auto-save functionality
  const {
    saveStatus,
    lastSaved,
    error: autoSaveError,
    retry: retryAutoSave
  } = useAutoSave({
    assessmentId: assessment.id,
    responses,
    interval: 30000,
    onSave: async (data) => {
      await onUpdateResponses(currentCategoryId, data[currentCategoryId] || {})
    }
  })

  // Initialize component
  useEffect(() => {
    const initializeWizard = async () => {
      await mainErrorHandler.executeWithErrorHandling(async () => {
        // Validate questionnaire data
        if (!questionnaire.categories || questionnaire.categories.length === 0) {
          throw new Error('Invalid questionnaire data: No categories found')
        }

        // Validate current category
        const currentCategory = questionnaire.categories.find(cat => cat.id === currentCategoryId)
        if (!currentCategory) {
          throw new Error(`Invalid current category: ${currentCategoryId}`)
        }

        // Set initial subcategory
        if (currentCategory.subcategories && currentCategory.subcategories.length > 0) {
          setCurrentSubcategoryId(currentCategory.subcategories[0].id)
        }

        setIsInitializing(false)
      }, 'Initialize Assessment Wizard')
    }

    initializeWizard()
  }, [questionnaire, currentCategoryId, mainErrorHandler])

  // Handle category navigation
  const handleCategoryChange = useCallback(async (categoryId: string, subcategoryId?: string) => {
    await categoryErrorHandler.executeWithErrorHandling(async () => {
      // Validate category exists
      const category = questionnaire.categories.find(cat => cat.id === categoryId)
      if (!category) {
        throw new Error(`Category not found: ${categoryId}`)
      }

      // Save current responses before navigation
      if (responses[currentCategoryId]) {
        await onUpdateResponses(currentCategoryId, responses[currentCategoryId])
      }

      // Update current category
      setCurrentCategoryId(categoryId)
      
      if (subcategoryId) {
        setCurrentSubcategoryId(subcategoryId)
      } else if (category.subcategories && category.subcategories.length > 0) {
        setCurrentSubcategoryId(category.subcategories[0].id)
      }

      // Clear form validation errors
      formErrorHandler.clearValidationErrors()
    }, `Navigate to category "${categoryId}"`)
  }, [questionnaire, currentCategoryId, responses, onUpdateResponses, categoryErrorHandler, formErrorHandler])

  // Handle response updates
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentCategoryId]: {
        ...prev[currentCategoryId],
        [questionId]: value
      }
    }))

    // Clear validation error for this field
    formErrorHandler.removeValidationError(questionId)
  }, [currentCategoryId, formErrorHandler])

  // Handle form validation
  const validateCurrentCategory = useCallback(() => {
    const category = questionnaire.categories.find(cat => cat.id === currentCategoryId)
    if (!category) return false

    const categoryResponses = responses[currentCategoryId] || {}
    let isValid = true

    // Clear previous validation errors
    formErrorHandler.clearValidationErrors()

    // Validate required questions
    category.subcategories.forEach(subcategory => {
      subcategory.questions.forEach(question => {
        if (question.required) {
          const response = categoryResponses[question.id]
          if (response === undefined || response === null || response === '') {
            formErrorHandler.addValidationError(
              question.id,
              `${question.text} is required`
            )
            isValid = false
          }
        }
      })
    })

    return isValid
  }, [questionnaire, currentCategoryId, responses, formErrorHandler])

  // Handle category completion
  const handleCategoryComplete = useCallback(async () => {
    if (!validateCurrentCategory()) {
      return
    }

    await categoryErrorHandler.executeWithErrorHandling(async () => {
      // Save responses
      await onUpdateResponses(currentCategoryId, responses[currentCategoryId] || {})

      // Update category status
      const categoryResponses = responses[currentCategoryId] || {}
      const category = questionnaire.categories.find(cat => cat.id === currentCategoryId)
      
      if (category) {
        const totalQuestions = category.subcategories.reduce(
          (sum, sub) => sum + sub.questions.length, 0
        )
        const answeredQuestions = Object.keys(categoryResponses).length
        const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)

        const status: CategoryCompletionStatus = {
          status: completionPercentage === 100 ? 'completed' : 'partial',
          completionPercentage,
          lastModified: new Date()
        }

        await onUpdateCategoryStatus(currentCategoryId, status)
      }

      // Navigate to next category or complete assessment
      const currentIndex = questionnaire.categories.findIndex(cat => cat.id === currentCategoryId)
      if (currentIndex < questionnaire.categories.length - 1) {
        const nextCategory = questionnaire.categories[currentIndex + 1]
        await handleCategoryChange(nextCategory.id)
      } else {
        // All categories completed
        await onComplete()
      }
    }, `Complete category "${currentCategoryId}"`)
  }, [
    validateCurrentCategory,
    categoryErrorHandler,
    currentCategoryId,
    responses,
    questionnaire,
    onUpdateResponses,
    onUpdateCategoryStatus,
    onComplete,
    handleCategoryChange
  ])

  // Get current category and subcategory
  const currentCategory = questionnaire.categories.find(cat => cat.id === currentCategoryId)
  const currentSubcategory = currentCategory?.subcategories.find(sub => sub.id === currentSubcategoryId)

  // Show full page loading during initialization
  if (isInitializing) {
    if (mainErrorHandler.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <ErrorMessage
            title="Failed to Load Assessment"
            message={mainErrorHandler.error}
            type="error"
            onRetry={mainErrorHandler.canRetry ? mainErrorHandler.retry : undefined}
          />
        </div>
      )
    }

    return (
      <FullPageLoading
        title="Loading Assessment"
        message="Please wait while we prepare your assessment..."
      />
    )
  }

  // Show category error if category operations fail
  if (categoryErrorHandler.error && !categoryErrorHandler.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <CategoryError
          categoryName={currentCategoryId}
          operation="load"
          error={categoryErrorHandler.error}
          onRetry={categoryErrorHandler.canRetry ? categoryErrorHandler.retry : undefined}
          onSkip={() => {
            categoryErrorHandler.clearError()
            // Try to navigate to next category
            const currentIndex = questionnaire.categories.findIndex(cat => cat.id === currentCategoryId)
            if (currentIndex < questionnaire.categories.length - 1) {
              const nextCategory = questionnaire.categories[currentIndex + 1]
              handleCategoryChange(nextCategory.id)
            }
          }}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="flex h-screen">
          {/* Left Sidebar - Category Navigation */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <ErrorBoundary
              fallback={
                <div className="p-4">
                  <ErrorMessage
                    message="Failed to load category navigation"
                    type="error"
                  />
                </div>
              }
            >
              <CategoryNavigationSidebar
                questionnaire={questionnaire}
                currentCategory={currentCategoryId}
                currentSubcategory={currentSubcategoryId}
                completionStatus={assessment.categoryStatuses}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={(subcategoryId) => setCurrentSubcategoryId(subcategoryId)}
              />
            </ErrorBoundary>

            {/* Progress Tracker */}
            <div className="border-t border-gray-200 p-4">
              <ErrorBoundary
                fallback={
                  <ErrorMessage
                    message="Failed to load progress tracker"
                    type="warning"
                    showIcon={false}
                  />
                }
              >
                <EnhancedProgressTracker
                  questionnaire={questionnaire}
                  responses={responses}
                  categoryStatuses={assessment.categoryStatuses}
                  currentCategory={currentCategoryId}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header with Auto-save Status */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {assessment.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {currentCategory?.title}
                    {currentSubcategory && ` - ${currentSubcategory.title}`}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <AutoSaveIndicator
                    status={saveStatus}
                    lastSaved={lastSaved}
                    error={autoSaveError}
                    onRetry={retryAutoSave}
                  />
                </div>
              </div>

              {/* Validation Errors */}
              {formErrorHandler.hasValidationErrors && (
                <div className="mt-4">
                  <ValidationError
                    errors={formErrorHandler.validationErrorList}
                    onDismiss={formErrorHandler.clearValidationErrors}
                  />
                </div>
              )}

              {/* Network Error */}
              {mainErrorHandler.error && (
                <div className="mt-4">
                  <NetworkError
                    onRetry={mainErrorHandler.canRetry ? mainErrorHandler.retry : undefined}
                    retryCount={mainErrorHandler.retryCount}
                  />
                </div>
              )}
            </div>

            {/* Question Container */}
            <div className="flex-1 p-6">
              {categoryErrorHandler.isLoading ? (
                <CategoryLoading
                  categoryName={currentCategory?.title}
                  operation="Loading"
                />
              ) : currentSubcategory ? (
                <ErrorBoundary
                  fallback={
                    <ErrorMessage
                      title="Question Display Error"
                      message="Failed to display questions for this category"
                      type="error"
                      onRetry={() => window.location.reload()}
                    />
                  }
                >
                  <FixedQuestionContainer
                    subcategory={currentSubcategory}
                    responses={responses[currentCategoryId] || {}}
                    onResponseChange={handleResponseChange}
                    validationErrors={formErrorHandler.validationErrors}
                  />
                </ErrorBoundary>
              ) : (
                <ErrorMessage
                  message="No questions available for this category"
                  type="info"
                />
              )}
            </div>

            {/* Footer with Navigation */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Category {questionnaire.categories.findIndex(cat => cat.id === currentCategoryId) + 1} of {questionnaire.categories.length}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCategoryComplete}
                    disabled={categoryErrorHandler.isLoading || formErrorHandler.hasValidationErrors}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {categoryErrorHandler.isLoading && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    {questionnaire.categories.findIndex(cat => cat.id === currentCategoryId) === questionnaire.categories.length - 1
                      ? 'Complete Assessment'
                      : 'Next Category'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}