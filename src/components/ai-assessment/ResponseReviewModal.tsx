'use client'

import React, { useMemo } from 'react'
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline'
import { ResponseReviewModalProps, ReviewSummary, ReviewQuestion } from '../../types/assessment'

const ResponseReviewModal: React.FC<ResponseReviewModalProps> = ({
  isOpen,
  assessment,
  responses,
  questions,
  onClose,
  onEditResponse,
  onComplete
}) => {
  // Generate review summary from responses and questions
  const reviewSummary = useMemo((): ReviewSummary[] => {
    return questions.map(section => {
      const sectionResponses = responses[section.id] || {}
      
      const reviewQuestions: ReviewQuestion[] = section.questions.map(question => {
        const answer = sectionResponses[question.id]
        const isEmpty = answer === undefined || answer === null || answer === '' || 
                       (Array.isArray(answer) && answer.length === 0)
        
        return {
          id: question.id,
          label: question.label,
          answer: answer,
          required: question.required,
          isEmpty: isEmpty
        }
      })
      
      const requiredQuestions = reviewQuestions.filter(q => q.required)
      const answeredRequired = requiredQuestions.filter(q => !q.isEmpty)
      const completionPercentage = requiredQuestions.length > 0 
        ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
        : 100
      
      return {
        stepNumber: section.stepNumber,
        stepTitle: section.title,
        questions: reviewQuestions,
        completionPercentage
      }
    })
  }, [questions, responses])

  // Calculate overall completion status
  const overallCompletion = useMemo(() => {
    const totalRequired = reviewSummary.reduce((sum, section) => 
      sum + section.questions.filter(q => q.required).length, 0)
    const totalAnswered = reviewSummary.reduce((sum, section) => 
      sum + section.questions.filter(q => q.required && !q.isEmpty).length, 0)
    
    return {
      totalRequired,
      totalAnswered,
      isComplete: totalRequired > 0 ? totalAnswered === totalRequired : true,
      percentage: totalRequired > 0 ? Math.round((totalAnswered / totalRequired) * 100) : 100
    }
  }, [reviewSummary])

  const formatAnswer = (answer: any): string => {
    if (answer === undefined || answer === null || answer === '') {
      return 'Not answered'
    }
    
    if (Array.isArray(answer)) {
      if (answer.length === 0) return 'Not answered'
      return answer.join(', ')
    }
    
    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No'
    }
    
    return String(answer)
  }

  const handleEditQuestion = (stepNumber: number, questionId: string) => {
    onEditResponse(stepNumber, questionId)
    onClose()
  }

  const handleComplete = () => {
    if (overallCompletion.isComplete) {
      onComplete()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Your Responses
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {assessment.name} • {assessment.type === 'EXPLORATORY' ? 'New AI Development' : 'Migrate Existing AI'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close review"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Overall Progress */}
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Overall Progress</h3>
              <span className="text-sm font-medium text-gray-600">
                {overallCompletion.totalAnswered} of {overallCompletion.totalRequired} required questions answered
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  overallCompletion.isComplete 
                    ? 'bg-green-600' 
                    : overallCompletion.percentage > 50 
                    ? 'bg-blue-600' 
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${overallCompletion.percentage}%` }}
              />
            </div>
            
            {!overallCompletion.isComplete && (
              <div className="flex items-center text-amber-700 bg-amber-100 p-3 rounded-md">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  Please complete all required questions before submitting your assessment.
                </span>
              </div>
            )}
            
            {overallCompletion.isComplete && (
              <div className="flex items-center text-green-700 bg-green-100 p-3 rounded-md">
                <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  All required questions have been answered. You can now complete your assessment.
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
            <div className="space-y-8">
              {reviewSummary.map((section) => (
                <div key={section.stepNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">
                        Step {section.stepNumber}: {section.stepTitle}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {section.completionPercentage}% complete
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              section.completionPercentage === 100 
                                ? 'bg-green-600' 
                                : section.completionPercentage > 50 
                                ? 'bg-blue-600' 
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${section.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-gray-200">
                    {section.questions.map((question) => (
                      <div 
                        key={question.id} 
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          question.required && question.isEmpty ? 'bg-red-50 border-l-4 border-red-400' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="text-sm font-medium text-gray-900">
                                {question.label}
                              </h5>
                              {question.required && (
                                <span className="text-xs text-red-600 font-medium">Required</span>
                              )}
                              {question.required && question.isEmpty && (
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            
                            <div className={`text-sm ${
                              question.isEmpty 
                                ? 'text-gray-400 italic' 
                                : 'text-gray-700'
                            }`}>
                              {formatAnswer(question.answer)}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleEditQuestion(section.stepNumber, question.id)}
                            className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                            aria-label={`Edit ${question.label}`}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continue Editing
            </button>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {overallCompletion.isComplete 
                  ? 'Ready to complete assessment' 
                  : `${overallCompletion.totalRequired - overallCompletion.totalAnswered} required questions remaining`
                }
              </span>
              <button
                onClick={handleComplete}
                disabled={!overallCompletion.isComplete}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  overallCompletion.isComplete
                    ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                Complete Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponseReviewModal