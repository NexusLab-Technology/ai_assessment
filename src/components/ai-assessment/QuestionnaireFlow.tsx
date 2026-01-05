'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Assessment, QuestionSection, AssessmentResponses } from '../../types/assessment'
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
  const [responses, setResponses] = useState<AssessmentResponses>({})
  const [stepValidation, setStepValidation] = useState<StepValidation>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Storage key for localStorage persistence
  const storageKey = `assessment_${assessment.id}_responses`

  // Load responses from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        const { responses: savedResponses, completedSteps: savedCompleted } = JSON.parse(savedData)
        setResponses(savedResponses || {})
        setCompletedSteps(savedCompleted || [])
      }
    } catch (error) {
      console.error('Failed to load saved responses:', error)
    }
  }, [storageKey])

  // Auto-save to localStorage whenever responses change
  useEffect(() => {
    try {
      const dataToSave = {
        responses,
        completedSteps,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save responses to localStorage:', error)
    }
  }, [responses, completedSteps, storageKey])

  // Auto-save to server every 30 seconds
  useEffect(() => {
    if (!onSave) return

    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        handleSave()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [responses, onSave])

  const handleSave = useCallback(async () => {
    if (!onSave) return

    setSaveStatus('saving')
    try {
      await onSave(responses, currentStep)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save responses:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [onSave, responses, currentStep])

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
    if (!validateCurrentStep()) {
      return
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    // Save on navigation
    if (onSave) {
      await handleSave()
    }

    if (currentStep < sections.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!validateCurrentStep()) {
      return
    }

    // Mark final step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    setIsLoading(true)
    try {
      // Final save before completion
      if (onSave) {
        await handleSave()
      }
      
      // Clear localStorage after successful completion
      localStorage.removeItem(storageKey)
      
      onComplete(responses)
    } catch (error) {
      console.error('Failed to complete assessment:', error)
      setIsLoading(false)
    }
  }

  const currentSection = getCurrentSection()
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === sections.length
  const canProceed = validateCurrentStep()

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
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progress Tracker - Left Sidebar */}
        <div className="lg:col-span-1">
          <ProgressTracker
            sections={sections}
            currentStep={currentStep}
            completedSteps={completedSteps}
            className="sticky top-4"
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
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
                {onSave && (
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
                  </div>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="px-6 py-6 space-y-8">
              {currentSection.questions.map((question) => (
                <QuestionStep
                  key={question.id}
                  question={question}
                  value={responses[currentSection.id]?.[question.id]}
                  onChange={(value) => handleResponseChange(question.id, value)}
                  onValidation={(isValid, error) => handleQuestionValidation(question.id, isValid, error)}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  isFirstStep
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                {/* Manual Save Button */}
                {onSave && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Save Progress
                  </button>
                )}

                {/* Next/Complete Button */}
                {isLastStep ? (
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
    </div>
  )
}

export default QuestionnaireFlow