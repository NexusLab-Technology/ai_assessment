'use client'

import React from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'
import { QuestionSection } from '../../types/assessment'

interface ProgressTrackerProps {
  sections: QuestionSection[]
  currentStep: number
  completedSteps: number[]
  className?: string
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  sections,
  currentStep,
  completedSteps,
  className = ''
}) => {
  const totalSteps = sections.length
  // Remove duplicates and filter valid steps
  const validCompletedSteps = [...new Set(completedSteps)]
    .filter(step => step >= 1 && step <= totalSteps)
  const progressPercentage = totalSteps > 0 
    ? Math.min(100, Math.round((validCompletedSteps.length / totalSteps) * 100))
    : 0

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Assessment Progress</h3>
        <span className="text-sm text-gray-500">
          {validCompletedSteps.length} of {totalSteps} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step List - Desktop */}
      <div className="hidden md:block space-y-2">
        {sections.map((section, index) => {
          const stepNumber = section.stepNumber
          const isCompleted = validCompletedSteps.includes(stepNumber)
          const isCurrent = currentStep === stepNumber
          const isAccessible = stepNumber <= currentStep || isCompleted

          return (
            <div
              key={section.id}
              className={`flex items-center p-2 rounded-md transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border border-blue-200'
                  : isCompleted
                  ? 'bg-green-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Step Number/Status */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : isAccessible
                    ? 'bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step Info */}
              <div className="ml-3 flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isCurrent
                      ? 'text-blue-900'
                      : isCompleted
                      ? 'text-green-900'
                      : isAccessible
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {section.title}
                </p>
                <p
                  className={`text-xs truncate ${
                    isCurrent
                      ? 'text-blue-700'
                      : isCompleted
                      ? 'text-green-700'
                      : isAccessible
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {section.description}
                </p>
              </div>

              {/* Status Indicator */}
              {isCurrent && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step List - Mobile (Simplified) */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                validCompletedSteps.includes(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {validCompletedSteps.includes(currentStep) ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                currentStep
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {sections.find(s => s.stepNumber === currentStep)?.title || 'Unknown Step'}
              </p>
              <p className="text-xs text-gray-500">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Progress Dots */}
        <div className="flex justify-center mt-3 space-x-1">
          {sections.map((section) => {
            const stepNumber = section.stepNumber
            const isCompleted = validCompletedSteps.includes(stepNumber)
            const isCurrent = currentStep === stepNumber

            return (
              <div
                key={section.id}
                className={`w-2 h-2 rounded-full ${
                  isCompleted
                    ? 'bg-green-600'
                    : isCurrent
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">{validCompletedSteps.length}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{Math.max(0, totalSteps - validCompletedSteps.length)}</p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressTracker