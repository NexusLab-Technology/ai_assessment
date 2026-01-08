/**
 * Questionnaire Flow Component
 * Refactored to use extracted hooks for better code organization (Rule 3 compliance)
 */

'use client'

import React, { useState } from 'react'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Assessment, QuestionSection, AssessmentResponses } from '../../types/assessment'
import { assessmentApi } from '../../lib/api-client'
import QuestionStep from './QuestionStep'
import ProgressTracker from './ProgressTracker'
import ResponseReviewModal from './ResponseReviewModal'
import { useQuestionnaireAutoSave } from './QuestionnaireFlowAutoSave'
import { useQuestionnaireNavigation } from './QuestionnaireFlowNavigation'
import { useQuestionnaireResponses } from './QuestionnaireFlowResponses'

interface QuestionnaireFlowProps {
  assessment: Assessment
  sections: QuestionSection[]
  onComplete: (responses: AssessmentResponses) => void
  onSave?: (responses: AssessmentResponses, currentStep: number) => void
  className?: string
}

const QuestionnaireFlow: React.FC<QuestionnaireFlowProps> = ({
  assessment,
  sections,
  onComplete,
  onSave,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(assessment.currentStep || 1)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use extracted hooks
  const {
    responses,
    setResponses,
    stepValidation,
    completedSteps,
    setCompletedSteps,
    isLoadingResponses,
    handleResponseChange,
    handleQuestionValidation,
    validateCurrentQuestion,
    validateAllRequiredQuestions
  } = useQuestionnaireResponses(assessment, sections, currentStep, currentQuestionIndex)

  const {
    saveStatus,
    lastSaved,
    saveNow,
    hasUnsavedChanges
  } = useQuestionnaireAutoSave(
    assessment,
    responses,
    currentStep,
    completedSteps,
    isLoadingResponses,
    onSave
  )

  const {
    handleNext,
    handlePrevious,
    isFirstQuestion,
    isLastQuestion
  } = useQuestionnaireNavigation(
    sections,
    currentStep,
    currentQuestionIndex,
    setCurrentStep,
    setCurrentQuestionIndex,
    setCompletedSteps,
    completedSteps,
    validateCurrentQuestion,
    saveNow
  )

  const handleShowReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleEditFromReview = (stepNumberOrCategoryId: string | number, questionId: string) => {
    // Handle both number (legacy) and string (RAPID) formats
    const stepNumber = typeof stepNumberOrCategoryId === 'number' 
      ? stepNumberOrCategoryId 
      : parseInt(String(stepNumberOrCategoryId), 10);
    const targetSection = sections.find(s => s.stepNumber === stepNumber)
    if (!targetSection) return
    
    const questionIndex = targetSection.questions.findIndex(q => q.id === questionId)
    if (questionIndex === -1) return
    
    setCurrentStep(stepNumber)
    setCurrentQuestionIndex(questionIndex)
    setShowReviewModal(false)
  }

  const handleCompleteFromReview = async () => {
    setShowReviewModal(false)
    await handleComplete()
  }

  const handleComplete = async () => {
    if (!validateCurrentQuestion()) {
      return
    }

    // Mark final step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    setIsLoading(true)
    try {
      // Final save before completion
      await saveNow()
      
      // Update assessment status to completed
      await assessmentApi.update(assessment.id, {
        status: 'COMPLETED',
        currentStep: sections.length
      })
      
      // Clear localStorage after successful completion
      const storageKey = `assessment_${assessment.id}_responses`
      localStorage.removeItem(storageKey)
      
      onComplete(responses)
    } catch (error) {
      console.error('Failed to complete assessment:', error)
      setIsLoading(false)
    }
  }

  const getCurrentSection = () => {
    return sections.find(section => section.stepNumber === currentStep)
  }

  const currentSection = getCurrentSection()
  const canProceed = validateCurrentQuestion()

  // Show loading state while fetching responses
  if (isLoadingResponses) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Loading Assessment</h3>
          <p className="mt-2 text-sm text-gray-500">
            Retrieving your saved responses...
          </p>
        </div>
      </div>
    )
  }

  if (!currentSection) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Invalid Step</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested step could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-none ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Tracker - Left Sidebar (3 columns) */}
        <div className="lg:col-span-3">
          <ProgressTracker
            sections={sections}
            currentStep={currentStep}
            completedSteps={completedSteps}
            className="sticky top-4"
          />
        </div>

        {/* Main Content (9 columns) */}
        <div className="lg:col-span-9">
          <div className="bg-white shadow-sm rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentSection.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {currentSection.description}
                  </p>
                </div>
                
                {/* Save Status */}
                <div className="flex items-center space-x-4">
                  {/* Auto-save status */}
                  <div className="flex items-center space-x-2">
                    {saveStatus === 'saving' && (
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                        Saving...
                      </div>
                    )}
                    {saveStatus === 'saved' && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Saved
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center text-sm text-red-600">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Save failed
                      </div>
                    )}
                    {saveStatus === 'idle' && hasUnsavedChanges && (
                      <div className="flex items-center text-sm text-amber-600">
                        <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                        Unsaved changes
                      </div>
                    )}
                  </div>

                  {/* Last saved timestamp */}
                  {lastSaved && (
                    <div className="text-xs text-gray-400">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions - Show only current question */}
            <div className="px-6 py-6">
              {currentSection.questions.length > 0 && (
                <div className="space-y-6">
                  {/* Question counter */}
                  <div className="text-sm text-gray-500 mb-4">
                    Question {currentQuestionIndex + 1} of {currentSection.questions.length} in this section
                  </div>
                  
                  {/* Current question */}
                  <QuestionStep
                    key={currentSection.questions[currentQuestionIndex].id}
                    question={currentSection.questions[currentQuestionIndex]}
                    value={responses[currentSection.id]?.[currentSection.questions[currentQuestionIndex].id]}
                    onChange={(value) => handleResponseChange(currentSection.questions[currentQuestionIndex].id, value)}
                    onValidation={(isValid, error) => handleQuestionValidation(currentSection.questions[currentQuestionIndex].id, isValid, error)}
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  isFirstQuestion
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                {/* Manual Save Button */}
                <button
                  type="button"
                  onClick={saveNow}
                  disabled={saveStatus === 'saving' || !hasUnsavedChanges}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                    hasUnsavedChanges && saveStatus !== 'saving'
                      ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Progress'}
                </button>

                {/* Next/Complete Button */}
                {isLastQuestion ? (
                  <div className="flex items-center space-x-3">
                    {/* Review All Responses Button */}
                    <button
                      type="button"
                      onClick={handleShowReview}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                      Review All Responses
                    </button>
                    
                    {/* Complete Assessment Button */}
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={!canProceed || isLoading || !validateAllRequiredQuestions()}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                        canProceed && !isLoading && validateAllRequiredQuestions()
                          ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                      title={
                        !canProceed 
                          ? 'Please answer the current question to continue'
                          : !validateAllRequiredQuestions()
                          ? 'Please complete all required questions before submitting'
                          : 'Complete your assessment'
                      }
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                          Complete Assessment
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                      canProceed
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                    title={!canProceed ? 'Please answer the required question to continue' : 'Continue to next question'}
                  >
                    Next
                    <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Review Modal */}
      <ResponseReviewModal
        isOpen={showReviewModal}
        assessment={assessment}
        responses={responses}
        questions={sections}
        onClose={handleCloseReview}
        onEditResponse={handleEditFromReview}
        onComplete={handleCompleteFromReview}
      />
    </div>
  )
}

export default QuestionnaireFlow
