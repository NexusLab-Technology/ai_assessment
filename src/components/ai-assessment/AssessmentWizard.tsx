/**
 * AssessmentWizard Component
 * Multi-step wizard for creating new assessments
 * Handles assessment name input and type selection
 */

import React, { useState } from 'react'
import { 
  CheckIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { AssessmentCreationWizardProps } from '../../types/assessment'

type WizardStep = 'name' | 'type' | 'confirmation'

interface AssessmentFormData {
  name: string
  type: 'EXPLORATORY' | 'MIGRATION' | null
}

export default function AssessmentWizard({ 
  onAssessmentCreate, 
  onCancel, 
  isLoading = false 
}: AssessmentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('name')
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    type: null
  })
  const [nameError, setNameError] = useState<string>('')

  // Validation
  const validateName = (name: string): string => {
    if (name.length < 3) {
      return 'Assessment name must be at least 3 characters'
    }
    if (name.length > 100) {
      return 'Assessment name must be less than 100 characters'
    }
    return ''
  }

  const isNameValid = formData.name.length >= 3 && formData.name.length <= 100
  const isTypeSelected = formData.type !== null
  const canProceedFromName = isNameValid && !nameError
  const canProceedFromType = isTypeSelected

  // Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({ ...prev, name }))
    
    if (name.length > 0) {
      const error = validateName(name)
      setNameError(error)
    } else {
      setNameError('')
    }
  }

  const handleTypeSelect = (type: 'EXPLORATORY' | 'MIGRATION') => {
    setFormData(prev => ({ ...prev, type }))
  }

  const handleNext = () => {
    if (currentStep === 'name' && canProceedFromName) {
      setCurrentStep('type')
    } else if (currentStep === 'type' && canProceedFromType) {
      setCurrentStep('confirmation')
    }
  }

  const handleBack = () => {
    if (currentStep === 'type') {
      setCurrentStep('name')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('type')
    }
  }

  const handleCreate = () => {
    if (formData.name && formData.type) {
      onAssessmentCreate(formData.name, formData.type)
    }
  }

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'name': return 'Assessment Name'
      case 'type': return 'Assessment Type'
      case 'confirmation': return 'Ready to Create'
      default: return ''
    }
  }

  const getAssessmentTypeInfo = (type: 'EXPLORATORY' | 'MIGRATION') => {
    if (type === 'EXPLORATORY') {
      return {
        title: 'Exploratory Assessment',
        description: 'Discover AI opportunities and assess current readiness. Includes 7 detailed sections covering use cases, data readiness, compliance requirements, and business value analysis.',
        duration: '2-3 hours',
        sections: '7 sections',
        icon: CloudIcon
      }
    } else {
      return {
        title: 'Migration Assessment',
        description: 'Comprehensive evaluation for organizations planning AI migration. Includes specialized migration readiness, current system assessment, and detailed implementation planning.',
        duration: '3-4 hours',
        sections: '8 sections',
        icon: ArrowPathIcon
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {/* Step 1: Name */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'name' 
                ? 'bg-blue-600 text-white' 
                : canProceedFromName
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {canProceedFromName && currentStep !== 'name' ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                '1'
              )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Name</span>
          </div>

          {/* Connector */}
          <div className={`w-12 h-0.5 ${canProceedFromName ? 'bg-green-600' : 'bg-gray-200'}`} />

          {/* Step 2: Type */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'type' 
                ? 'bg-blue-600 text-white' 
                : canProceedFromType && canProceedFromName
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {canProceedFromType && canProceedFromName && currentStep !== 'type' ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                '2'
              )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Type</span>
          </div>

          {/* Connector */}
          <div className={`w-12 h-0.5 ${canProceedFromType && canProceedFromName ? 'bg-green-600' : 'bg-gray-200'}`} />

          {/* Step 3: Confirm */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'confirmation' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Confirm</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{getStepTitle()}</h2>

        {/* Step 1: Assessment Name */}
        {currentStep === 'name' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="assessment-name" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to name this assessment?
              </label>
              <input
                type="text"
                id="assessment-name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Q1 2024 Cloud Migration Assessment"
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  nameError ? 'border-red-300' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm">
                  {nameError && (
                    <span className="text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {nameError}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formData.name.length}/100 characters
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Choose a descriptive name
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      A good assessment name helps you identify and organize your evaluations. 
                      Consider including the time period, purpose, or target systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Assessment Type */}
        {currentStep === 'type' && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Choose the type of assessment that best fits your organization's current stage and goals.
            </p>

            <div className="space-y-4">
              {/* Exploratory Option */}
              <div 
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  formData.type === 'EXPLORATORY' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => !isLoading && handleTypeSelect('EXPLORATORY')}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="EXPLORATORY"
                      checked={formData.type === 'EXPLORATORY'}
                      onChange={() => handleTypeSelect('EXPLORATORY')}
                      disabled={isLoading}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <CloudIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Exploratory Assessment
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Discover AI opportunities and assess current readiness. Includes 7 detailed sections 
                      covering use cases, data readiness, compliance requirements, and business value analysis.
                    </p>
                    <div className="mt-3 text-sm text-gray-500">
                      Duration: 2-3 hours • 7 sections
                    </div>
                  </div>
                </div>
              </div>

              {/* Migration Option */}
              <div 
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  formData.type === 'MIGRATION' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => !isLoading && handleTypeSelect('MIGRATION')}
              >
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="MIGRATION"
                      checked={formData.type === 'MIGRATION'}
                      onChange={() => handleTypeSelect('MIGRATION')}
                      disabled={isLoading}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <ArrowPathIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Migration Assessment
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Comprehensive evaluation for organizations planning AI migration. Includes specialized 
                      migration readiness, current system assessment, and detailed implementation planning.
                    </p>
                    <div className="mt-3 text-sm text-gray-500">
                      Duration: 3-4 hours • 8 sections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirmation' && formData.type && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Review your assessment details before creating.
            </p>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Assessment Name
                  </h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {formData.name}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Assessment Type
                  </h3>
                  <div className="mt-2">
                    {(() => {
                      const typeInfo = getAssessmentTypeInfo(formData.type)
                      const IconComponent = typeInfo.icon
                      return (
                        <div className="flex items-start">
                          <IconComponent className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {typeInfo.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {typeInfo.description}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span>{typeInfo.duration}</span>
                              <span>•</span>
                              <span>{typeInfo.sections}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Ready to begin
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Your assessment will be created and you'll be taken to the questionnaire. 
                      You can save your progress and return at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div>
            {currentStep !== 'name' && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  isLoading 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                isLoading 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              Cancel
            </button>

            {currentStep === 'confirmation' ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                  isLoading
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Assessment'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  isLoading || 
                  (currentStep === 'name' && !canProceedFromName) ||
                  (currentStep === 'type' && !canProceedFromType)
                }
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                  isLoading || 
                  (currentStep === 'name' && !canProceedFromName) ||
                  (currentStep === 'type' && !canProceedFromType)
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}