/**
 * Enhanced AssessmentWizard Component with Auto-Save
 * Integrates auto-save functionality with category-based navigation
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  RAPIDCategory,
  RAPIDQuestion
} from '@/types/rapid-questionnaire'
import { useAutoSave } from '@/hooks/useAutoSave'
import CategoryNavigationSidebar from './CategoryNavigationSidebar'
import FixedQuestionContainer from './FixedQuestionContainer'
import QuestionStep from './QuestionStep'
import ResponseReviewModal from './ResponseReviewModal'
import { AutoSaveIndicator, AutoSaveStatusPanel } from './AutoSaveIndicator'

interface EnhancedAssessmentWizardProps {
  assessment: Assessment
  rapidQuestions: RAPIDQuestionnaireStructure
  onComplete: (responses: AssessmentResponses) => void
  onSave?: (responses: AssessmentResponses) => void
  className?: string
}

export const EnhancedAssessmentWizard: React.FC<EnhancedAssessmentWizardProps> = ({
  assessment,
  rapidQuestions,
  onComplete,
  onSave,
  className = ''
}) => {
  // State management
  const [currentCategory, setCurrentCategory] = useState<string>(assessment.currentCategory)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [responses, setResponses] = useState<AssessmentResponses>(assessment.responses || {})
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Auto-save integration
  const autoSave = useAutoSave({
    assessmentId: assessment.id,
    intervalMs: 30000, // 30 seconds
    maxRetries: 3,
    enabled: true
  })

  // Get current category data
  const getCurrentCategory = useCallback((): RAPIDCategory | undefined => {
    return rapidQuestions?.categories?.find(cat => cat.id === currentCategory)
  }, [rapidQuestions?.categories, currentCategory])

  // Get current question
  const getCurrentQuestion = useCallback((): RAPIDQuestion | undefined => {
    const category = getCurrentCategory()
    if (!category) return undefined
    
    const allQuestions = category.subcategories.flatMap(sub => sub.questions)
    return allQuestions[currentQuestionIndex]
  }, [getCurrentCategory, currentQuestionIndex])

  // Get category completion statuses
  const getCategoryStatuses = useCallback(() => {
    return rapidQuestions?.categories?.map(category => {
      const totalQuestions = category.subcategories.flatMap(sub => sub.questions).length
      return autoSave.getCategoryCompletionStatus(category.id, totalQuestions)
    }) || []
  }, [rapidQuestions?.categories, autoSave])

  // Handle response change
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    const newResponses = {
      ...responses,
      [currentCategory]: {
        ...responses[currentCategory],
        [questionId]: value
      }
    }
    
    setResponses(newResponses)
    
    // Update auto-save with new responses
    autoSave.updateCategoryResponses(currentCategory, newResponses[currentCategory] || {})
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(newResponses)
    }
  }, [responses, currentCategory, autoSave, onSave])

  // Handle category change
  const handleCategoryChange = useCallback(async (categoryId: string) => {
    if (categoryId === currentCategory) return

    setIsLoading(true)
    
    try {
      // Save current category responses before navigation
      const currentResponses = responses[currentCategory] || {}
      const saveResult = await autoSave.saveOnNavigation(currentCategory, currentResponses)
      
      if (!saveResult.success) {
        console.warn('Failed to save before navigation:', saveResult.error)
        // Continue with navigation anyway - auto-save will retry
      }

      // Update current category
      setCurrentCategory(categoryId)
      setCurrentQuestionIndex(0)
      
    } catch (error) {
      console.error('Error during category navigation:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentCategory, responses, autoSave])

  // Handle question navigation
  const handleQuestionNavigation = useCallback((direction: 'next' | 'previous') => {
    const category = getCurrentCategory()
    if (!category) return

    const totalQuestions = category.subcategories.flatMap(sub => sub.questions).length
    
    if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (direction === 'previous' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }, [getCurrentCategory, currentQuestionIndex])

  // Handle assessment completion
  const handleComplete = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Save all pending changes
      const saveResult = await autoSave.saveNow()
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save before completion')
      }

      // Complete the assessment
      onComplete(responses)
      
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Failed to complete assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [autoSave, responses, onComplete])

  // Initialize current category
  useEffect(() => {
    if (rapidQuestions?.categories?.length > 0 && !currentCategory) {
      setCurrentCategory(rapidQuestions.categories[0].id)
    }
  }, [rapidQuestions?.categories, currentCategory])

  // Current question and category data
  const currentCategoryData = getCurrentCategory()
  const currentQuestion = getCurrentQuestion()
  const categoryStatuses = getCategoryStatuses()

  if (!rapidQuestions?.categories?.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header with Auto-Save Status */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentCategoryData?.title || 'Loading...'}
            </h2>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {currentCategoryData?.subcategories.flatMap(sub => sub.questions).length || 0}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <AutoSaveIndicator status={autoSave.status} />
            
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Review Responses
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Navigation Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200">
          <CategoryNavigationSidebar
            categories={rapidQuestions.categories}
            currentCategory={currentCategory}
            onCategorySelect={handleCategoryChange}
            completionStatus={categoryStatuses}
          />
        </div>

        {/* Question Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <FixedQuestionContainer>
            {currentQuestion ? (
              <QuestionStep
                question={currentQuestion}
                value={responses[currentCategory]?.[currentQuestion.id]}
                onChange={(value) => handleResponseChange(currentQuestion.id, value)}
                onNext={() => handleQuestionNavigation('next')}
                onPrevious={() => handleQuestionNavigation('previous')}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === (currentCategoryData?.subcategories.flatMap(sub => sub.questions).length || 1) - 1}
                isLoading={isLoading}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No questions available for this category.</p>
              </div>
            )}
          </FixedQuestionContainer>

          {/* Auto-Save Status Panel */}
          <div className="border-t border-gray-200 p-4">
            <AutoSaveStatusPanel
              status={autoSave.status}
              onSaveNow={autoSave.saveNow}
            />
          </div>
        </div>
      </div>

      {/* Complete Assessment Button */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Progress: {categoryStatuses.filter(s => s.status === 'completed').length} of {rapidQuestions.categories.length} categories completed
          </div>
          
          <button
            onClick={handleComplete}
            disabled={isLoading || autoSave.status.status === 'saving'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing...
              </>
            ) : (
              'Complete Assessment'
            )}
          </button>
        </div>
      </div>

      {/* Response Review Modal */}
      {showReviewModal && (
        <ResponseReviewModal
          assessment={assessment}
          rapidQuestions={rapidQuestions}
          responses={responses}
          onClose={() => setShowReviewModal(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}

export default EnhancedAssessmentWizard