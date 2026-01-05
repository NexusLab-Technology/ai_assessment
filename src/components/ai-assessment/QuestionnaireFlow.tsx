'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { Assessment, QuestionSection, AssessmentResponses } from '../../types/assessment'
import { assessmentApi } from '../../lib/api-client'
import { useAutoSave } from '../../hooks/useAutoSave'
import QuestionStep from './QuestionStep'
import ProgressTracker from './ProgressTracker'

interface QuestionnaireFlowProps {
  assessment: Assessment
  sections: QuestionSection[]
  onComplete: (responses: AssessmentResponses) => void
  onSave?: (responses: AssessmentResponses, currentStep: number) => void
  className?: string
}

interface StepValidation {
  [questionId: string]: {
    isValid: boolean
    error?: string
  }
}

const QuestionnaireFlow: React.FC<QuestionnaireFlowProps> = ({
  assessment,
  sections,
  onComplete,
  onSave,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(assessment.currentStep || 1)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0) // Track current question in section
  const [responses, setResponses] = useState<AssessmentResponses>({})
  const [stepValidation, setStepValidation] = useState<StepValidation>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingResponses, setIsLoadingResponses] = useState(true)

  // Auto-save hook with API integration
  const { saveStatus, lastSaved, saveNow, hasUnsavedChanges } = useAutoSave(
    responses,
    currentStep,
    {
      assessmentId: assessment.id,
      autoSaveInterval: 30000, // 30 seconds
      onSaveSuccess: () => {
        // Call the optional onSave callback for compatibility
        onSave?.(responses, currentStep)
      },
      onSaveError: (error) => {
        console.error('Auto-save error:', error)
      }
    }
  )

  // Load responses from server on mount
  useEffect(() => {
    const loadResponses = async () => {
      try {
        setIsLoadingResponses(true)
        const data = await assessmentApi.getResponses(assessment.id)
        
        setResponses(data.responses || {})
        setCurrentStep(data.currentStep || 1)
        
        // Determine completed steps based on responses
        const completed: number[] = []
        Object.keys(data.responses || {}).forEach(stepId => {
          const stepNumber = parseInt(stepId.replace('step-', ''))
          if (!isNaN(stepNumber)) {
            completed.push(stepNumber)
          }
        })
        setCompletedSteps(completed)
        
      } catch (error) {
        console.error('Failed to load assessment responses:', error)
        // Fallback to localStorage for offline support
        try {
          const storageKey = `assessment_${assessment.id}_responses`
          const savedData = localStorage.getItem(storageKey)
          if (savedData) {
            const { responses: savedResponses, completedSteps: savedCompleted } = JSON.parse(savedData)
            setResponses(savedResponses || {})
            setCompletedSteps(savedCompleted || [])
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError)
        }
      } finally {
        setIsLoadingResponses(false)
      }
    }

    loadResponses()
  }, [assessment.id])

  // Backup to localStorage for offline support
  useEffect(() => {
    if (isLoadingResponses) return
    
    try {
      const storageKey = `assessment_${assessment.id}_responses`
      const dataToSave = {
        responses,
        completedSteps,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to backup to localStorage:', error)
    }
  }, [responses, completedSteps, assessment.id, isLoadingResponses])

  const getCurrentSection = () => {
    return sections.find(section => section.stepNumber === currentStep)
  }

  const handleResponseChange = (questionId: string, value: any) => {
    const currentSection = getCurrentSection()
    if (!currentSection) return

    setResponses(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [questionId]: value
      }
    }))
  }

  const handleQuestionValidation = (questionId: string, isValid: boolean, error?: string) => {
    setStepValidation(prev => ({
      ...prev,
      [questionId]: { isValid, error }
    }))
  }

  const validateCurrentQuestion = (): boolean => {
    const currentSection = getCurrentSection()
    if (!currentSection || !currentSection.questions[currentQuestionIndex]) {
      console.log('No current section or question')
      return false
    }

    const currentQuestion = currentSection.questions[currentQuestionIndex]
    const sectionResponses = responses[currentSection.id] || {}
    const response = sectionResponses[currentQuestion.id]
    const validation = stepValidation[currentQuestion.id]

    console.log('Validating question:', {
      questionId: currentQuestion.id,
      required: currentQuestion.required,
      response,
      validation,
      hasValidation: !!validation
    })

    // If question is not required and no response, it's valid
    if (!currentQuestion.required && (response === null || response === undefined || response === '')) {
      console.log('Optional question with no response - valid')
      return true
    }

    // Check if required question is answered
    if (currentQuestion.required) {
      if (response === null || response === undefined || response === '') {
        console.log('Required question not answered')
        return false
      }
      // For array responses (multiselect, checkbox)
      if (Array.isArray(response) && response.length === 0) {
        console.log('Required array question empty')
        return false
      }
    }

    // Check if validation failed (only if validation exists)
    if (validation && !validation.isValid) {
      console.log('Validation failed:', validation.error)
      return false
    }

    console.log('Question validation passed')
    return true
  }

  const validateCurrentStep = (): boolean => {
    const currentSection = getCurrentSection()
    if (!currentSection) return false

    const sectionResponses = responses[currentSection.id] || {}
    
    // Check all required questions are answered and valid
    for (const question of currentSection.questions) {
      const response = sectionResponses[question.id]
      const validation = stepValidation[question.id]

      // Check if required question is answered
      if (question.required) {
        if (response === null || response === undefined || response === '') {
          return false
        }
        // For array responses (multiselect, checkbox)
        if (Array.isArray(response) && response.length === 0) {
          return false
        }
      }

      // Check if validation failed
      if (validation && !validation.isValid) {
        return false
      }
    }

    return true
  }

  const handleNext = async () => {
    const currentSection = getCurrentSection()
    if (!currentSection) return

    if (!validateCurrentQuestion()) {
      console.log('Cannot proceed - validation failed')
      return
    }

    // Auto save current response before moving to next question
    try {
      console.log('Auto-saving before next...')
      await saveNow()
    } catch (error) {
      console.error('Failed to auto-save:', error)
      // Continue navigation even if save fails
    }

    // Check if this is the last question in current section
    const isLastQuestionInSection = currentQuestionIndex === currentSection.questions.length - 1

    if (isLastQuestionInSection) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }

      // Move to next section
      if (currentStep < sections.length) {
        setCurrentStep(currentStep + 1)
        setCurrentQuestionIndex(0) // Reset to first question of next section
      }
    } else {
      // Move to next question in same section
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Go to previous question in same section
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentStep > 1) {
      // Go to previous section, last question
      const prevStep = currentStep - 1
      const prevSection = sections.find(s => s.stepNumber === prevStep)
      if (prevSection) {
        setCurrentStep(prevStep)
        setCurrentQuestionIndex(prevSection.questions.length - 1)
      }
    }
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

  const currentSection = getCurrentSection()
  const isFirstQuestion = currentStep === 1 && currentQuestionIndex === 0
  const isLastQuestion = currentStep === sections.length && currentSection && currentQuestionIndex === currentSection.questions.length - 1
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
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!canProceed || isLoading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                      canProceed && !isLoading
                        ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
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
              
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-2">
                  Debug: canProceed={canProceed.toString()}, 
                  currentQuestion={currentSection?.questions[currentQuestionIndex]?.id},
                  required={currentSection?.questions[currentQuestionIndex]?.required?.toString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireFlow