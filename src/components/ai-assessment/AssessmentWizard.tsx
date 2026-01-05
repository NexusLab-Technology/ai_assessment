'use client'

import React, { useState } from 'react'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { AssessmentCreationWizardProps } from '../../types/assessment'

interface WizardStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
}

const AssessmentWizard: React.FC<AssessmentCreationWizardProps> = ({
  onAssessmentCreate,
  onCancel,
  isLoading = false
}) => {
  const [currentWizardStep, setCurrentWizardStep] = useState(0)
  const [assessmentName, setAssessmentName] = useState('')
  const [assessmentType, setAssessmentType] = useState<'EXPLORATORY' | 'MIGRATION' | null>(null)
  const [nameError, setNameError] = useState('')

  const wizardSteps: WizardStep[] = [
    {
      id: 'name',
      title: 'Assessment Name',
      description: 'Give your assessment a descriptive name',
      isCompleted: assessmentName.trim().length > 0,
      isActive: currentWizardStep === 0
    },
    {
      id: 'type',
      title: 'Assessment Type',
      description: 'Choose the type of assessment you want to conduct',
      isCompleted: assessmentType !== null,
      isActive: currentWizardStep === 1
    },
    {
      id: 'confirm',
      title: 'Confirmation',
      description: 'Review your settings and create the assessment',
      isCompleted: false,
      isActive: currentWizardStep === 2
    }
  ]

  const validateName = (name: string): boolean => {
    if (name.trim().length === 0) {
      setNameError('Assessment name is required')
      return false
    }
    if (name.trim().length < 3) {
      setNameError('Assessment name must be at least 3 characters')
      return false
    }
    if (name.trim().length > 100) {
      setNameError('Assessment name must be less than 100 characters')
      return false
    }
    setNameError('')
    return true
  }

  const handleNext = () => {
    if (currentWizardStep === 0) {
      if (!validateName(assessmentName)) {
        return
      }
    }
    
    if (currentWizardStep < wizardSteps.length - 1) {
      setCurrentWizardStep(currentWizardStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentWizardStep > 0) {
      setCurrentWizardStep(currentWizardStep - 1)
    }
  }

  const handleCreateAssessment = () => {
    if (!validateName(assessmentName) || !assessmentType) {
      return
    }

    // Call the parent callback with assessment data
    onAssessmentCreate(assessmentName.trim(), assessmentType)
  }

  const canProceed = () => {
    switch (currentWizardStep) {
      case 0:
        return assessmentName.trim().length >= 3 && assessmentName.trim().length <= 100
      case 1:
        return assessmentType !== null
      case 2:
        return assessmentName.trim().length >= 3 && assessmentName.trim().length <= 100 && assessmentType !== null
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentWizardStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Assessment Name</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a descriptive name for your assessment that will help you identify it later.
              </p>
            </div>

            <div>
              <label htmlFor="assessment-name" className="block text-sm font-medium text-gray-700">
                Assessment Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="assessment-name"
                  value={assessmentName}
                  onChange={(e) => {
                    setAssessmentName(e.target.value)
                    if (nameError) {
                      validateName(e.target.value)
                    }
                  }}
                  onBlur={() => validateName(assessmentName)}
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    nameError 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., Q1 2024 Cloud Migration Assessment"
                  maxLength={100}
                />
              </div>
              {nameError && (
                <p className="mt-2 text-sm text-red-600">{nameError}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {assessmentName.length}/100 characters
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CogIcon className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Assessment Type</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select the type of assessment that best fits your needs.
              </p>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setAssessmentType('EXPLORATORY')}
                className={`relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 ${
                  assessmentType === 'EXPLORATORY'
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="EXPLORATORY"
                      checked={assessmentType === 'EXPLORATORY'}
                      onChange={() => setAssessmentType('EXPLORATORY')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-900">
                      Exploratory Assessment
                    </label>
                    <p className="text-gray-500">
                      Comprehensive evaluation to understand current state and identify opportunities. 
                      Includes 7 detailed sections covering infrastructure, applications, and processes.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Duration: 2-3 hours • 7 sections
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setAssessmentType('MIGRATION')}
                className={`relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 ${
                  assessmentType === 'MIGRATION'
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="MIGRATION"
                      checked={assessmentType === 'MIGRATION'}
                      onChange={() => setAssessmentType('MIGRATION')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-900">
                      Migration Assessment
                    </label>
                    <p className="text-gray-500">
                      Focused evaluation for cloud migration planning. Includes all exploratory sections 
                      plus specialized migration readiness and strategy planning.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Duration: 3-4 hours • 8 sections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckIcon className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Ready to Create</h3>
              <p className="mt-1 text-sm text-gray-500">
                Review your assessment configuration and create your assessment.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Assessment Name:</span>
                <span className="text-sm text-gray-900">{assessmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className="text-sm text-gray-900">
                  {assessmentType === 'EXPLORATORY' ? 'Exploratory Assessment' : 'Migration Assessment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Sections:</span>
                <span className="text-sm text-gray-900">
                  {assessmentType === 'EXPLORATORY' ? '7 sections' : '8 sections'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Estimated Duration:</span>
                <span className="text-sm text-gray-900">
                  {assessmentType === 'EXPLORATORY' ? '2-3 hours' : '3-4 hours'}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Your assessment will be created as a draft. You can complete it at your own pace, 
                      save progress between sections, and generate a comprehensive report when finished.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {wizardSteps.map((step, stepIdx) => (
                <li key={step.id} className={`${stepIdx !== wizardSteps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        step.isCompleted
                          ? 'bg-blue-600'
                          : step.isActive
                          ? 'border-2 border-blue-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                      }`}
                    >
                      {step.isCompleted ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            step.isActive ? 'bg-blue-600' : 'bg-transparent'
                          }`}
                        />
                      )}
                    </div>
                    <span className="ml-4 text-sm font-medium text-gray-900">
                      {step.title}
                    </span>
                  </div>
                  {stepIdx !== wizardSteps.length - 1 && (
                    <div
                      className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 ${
                        wizardSteps[stepIdx + 1].isCompleted || wizardSteps[stepIdx + 1].isActive
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="px-6 py-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={currentWizardStep === 0 ? onCancel : handlePrevious}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
              isLoading
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            {currentWizardStep === 0 ? 'Cancel' : 'Previous'}
          </button>

          {currentWizardStep < wizardSteps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                canProceed() && !isLoading
                  ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateAssessment}
              disabled={!canProceed() || isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                canProceed() && !isLoading
                  ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                  Create Assessment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssessmentWizard