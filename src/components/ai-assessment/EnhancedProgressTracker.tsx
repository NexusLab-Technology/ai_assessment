'use client'

import React from 'react'
import { CheckIcon, ClockIcon } from '@heroicons/react/24/solid'
import { EnhancedProgressTrackerProps, StepStatus } from '../../types/assessment'

const EnhancedProgressTracker: React.FC<EnhancedProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  stepStatuses,
  onStepClick,
  allowNavigation
}) => {
  // Calculate overall progress
  const completedSteps = stepStatuses.filter(step => step.status === 'completed').length
  const progressPercentage = totalSteps > 0 
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0

  const getStepIcon = (stepStatus: StepStatus) => {
    switch (stepStatus.status) {
      case 'completed':
        return <CheckIcon className="w-4 h-4" />
      case 'partial':
        return <ClockIcon className="w-4 h-4" />
      case 'current':
        return stepStatus.stepNumber
      case 'not_started':
      default:
        return stepStatus.stepNumber
    }
  }

  const getStepStyles = (stepStatus: StepStatus) => {
    const baseStyles = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200"
    
    switch (stepStatus.status) {
      case 'completed':
        return `${baseStyles} bg-green-600 text-white shadow-sm`
      case 'partial':
        return `${baseStyles} bg-yellow-500 text-white shadow-sm`
      case 'current':
        return `${baseStyles} bg-blue-600 text-white shadow-md ring-2 ring-blue-200`
      case 'not_started':
      default:
        return `${baseStyles} bg-gray-200 text-gray-600 hover:bg-gray-300`
    }
  }

  const getStepContainerStyles = (stepStatus: StepStatus) => {
    const baseStyles = "flex items-center p-3 rounded-lg transition-all duration-200"
    const clickableStyles = allowNavigation ? "cursor-pointer hover:shadow-sm" : ""
    
    switch (stepStatus.status) {
      case 'completed':
        return `${baseStyles} ${clickableStyles} bg-green-50 border border-green-200 hover:bg-green-100`
      case 'partial':
        return `${baseStyles} ${clickableStyles} bg-yellow-50 border border-yellow-200 hover:bg-yellow-100`
      case 'current':
        return `${baseStyles} ${clickableStyles} bg-blue-50 border-2 border-blue-300 shadow-sm`
      case 'not_started':
      default:
        return `${baseStyles} ${clickableStyles} bg-gray-50 border border-gray-200 hover:bg-gray-100`
    }
  }

  const getProgressText = (stepStatus: StepStatus) => {
    if (stepStatus.status === 'partial' && stepStatus.requiredFieldsCount > 0) {
      return `${stepStatus.filledFieldsCount}/${stepStatus.requiredFieldsCount} fields completed`
    }
    return null
  }

  const handleStepClick = (stepNumber: number) => {
    if (allowNavigation) {
      onStepClick(stepNumber)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Assessment Progress</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {completedSteps} of {totalSteps} completed
          </div>
          <div className="text-xs text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step List - Desktop */}
      <div className="hidden md:block space-y-3">
        {stepStatuses.map((stepStatus) => (
          <div
            key={stepStatus.stepNumber}
            className={getStepContainerStyles(stepStatus)}
            onClick={() => handleStepClick(stepStatus.stepNumber)}
            role={allowNavigation ? "button" : undefined}
            tabIndex={allowNavigation ? 0 : undefined}
            onKeyDown={(e) => {
              if (allowNavigation && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleStepClick(stepStatus.stepNumber)
              }
            }}
          >
            {/* Step Number/Status Icon */}
            <div className={getStepStyles(stepStatus)}>
              {getStepIcon(stepStatus)}
            </div>

            {/* Step Info */}
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  stepStatus.status === 'current' 
                    ? 'text-blue-900' 
                    : stepStatus.status === 'completed'
                    ? 'text-green-900'
                    : stepStatus.status === 'partial'
                    ? 'text-yellow-900'
                    : 'text-gray-700'
                }`}>
                  Step {stepStatus.stepNumber}
                </p>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stepStatus.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : stepStatus.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : stepStatus.status === 'current'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {stepStatus.status === 'completed' && 'Completed'}
                  {stepStatus.status === 'partial' && 'In Progress'}
                  {stepStatus.status === 'current' && 'Current'}
                  {stepStatus.status === 'not_started' && 'Not Started'}
                </span>
              </div>
              
              {/* Progress Text */}
              {getProgressText(stepStatus) && (
                <p className="text-xs text-gray-500 mt-1">
                  {getProgressText(stepStatus)}
                </p>
              )}
            </div>

            {/* Navigation Indicator */}
            {allowNavigation && (
              <div className="flex-shrink-0 ml-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step List - Mobile (Simplified) */}
      <div className="md:hidden">
        {/* Current Step Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={getStepStyles(stepStatuses.find(s => s.stepNumber === currentStep) || stepStatuses[0])}>
              {getStepIcon(stepStatuses.find(s => s.stepNumber === currentStep) || stepStatuses[0])}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Step {currentStep}
              </p>
              <p className="text-xs text-gray-500">
                Current step
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Progress Dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {stepStatuses.map((stepStatus) => (
            <button
              key={stepStatus.stepNumber}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                allowNavigation ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              } ${
                stepStatus.status === 'completed'
                  ? 'bg-green-600'
                  : stepStatus.status === 'partial'
                  ? 'bg-yellow-500'
                  : stepStatus.status === 'current'
                  ? 'bg-blue-600 ring-2 ring-blue-200'
                  : 'bg-gray-300'
              }`}
              onClick={() => handleStepClick(stepStatus.stepNumber)}
              disabled={!allowNavigation}
              aria-label={`Go to step ${stepStatus.stepNumber}`}
            />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-green-600">{completedSteps}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-600">
              {stepStatuses.filter(s => s.status === 'partial').length}
            </p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-600">
              {stepStatuses.filter(s => s.status === 'not_started').length}
            </p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedProgressTracker