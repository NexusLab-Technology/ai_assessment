/**
 * ResponseReviewModal Component
 * Enhanced for RAPID questionnaire structure with category organization
 * Displays comprehensive summary organized by categories
 * Highlights unanswered required questions and allows direct navigation
 */

'use client'

import React, { useMemo } from 'react'
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline'
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  RAPIDQuestion,
  RAPIDCategory 
} from '@/types/rapid-questionnaire'

interface ResponseReviewModalProps {
  isOpen: boolean;
  assessment: Assessment;
  responses: AssessmentResponses;
  rapidQuestions: RAPIDQuestionnaireStructure;
  onClose: () => void;
  onEditResponse: (categoryId: string, questionId: string) => void;
  onComplete: () => void;
}

interface CategoryReviewSummary {
  categoryId: string;
  categoryTitle: string;
  categoryDescription?: string;
  subcategories: SubcategoryReviewSummary[];
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface SubcategoryReviewSummary {
  subcategoryId: string;
  subcategoryTitle: string;
  questions: ReviewQuestion[];
}

interface ReviewQuestion {
  id: string;
  number: string;
  text: string;
  description?: string;
  answer: any;
  required: boolean;
  isEmpty: boolean;
  type: string;
}

const ResponseReviewModal: React.FC<ResponseReviewModalProps> = ({
  isOpen,
  assessment,
  responses,
  rapidQuestions,
  onClose,
  onEditResponse,
  onComplete
}) => {
  // Generate category-based review summary from responses and RAPID questions
  const categoryReviewSummary = useMemo((): CategoryReviewSummary[] => {
    return rapidQuestions.categories.map(category => {
      const categoryResponses = responses[category.id] || {}
      
      // Process subcategories
      const subcategoryReviews: SubcategoryReviewSummary[] = category.subcategories.map(subcategory => {
        const reviewQuestions: ReviewQuestion[] = subcategory.questions.map(question => {
          const answer = categoryResponses[question.id]
          const isEmpty = answer === undefined || answer === null || answer === '' || 
                         (Array.isArray(answer) && answer.length === 0)
          
          return {
            id: question.id,
            number: question.number,
            text: question.text,
            description: question.description,
            answer: answer,
            required: question.required,
            isEmpty: isEmpty,
            type: question.type
          }
        })
        
        return {
          subcategoryId: subcategory.id,
          subcategoryTitle: subcategory.title,
          questions: reviewQuestions
        }
      })
      
      // Calculate category statistics
      const allQuestions = subcategoryReviews.flatMap(sub => sub.questions)
      const requiredQuestions = allQuestions.filter(q => q.required)
      const answeredQuestions = allQuestions.filter(q => !q.isEmpty)
      const answeredRequiredQuestions = requiredQuestions.filter(q => !q.isEmpty)
      
      const completionPercentage = requiredQuestions.length > 0 
        ? Math.round((answeredRequiredQuestions.length / requiredQuestions.length) * 100)
        : allQuestions.length > 0 
        ? Math.round((answeredQuestions.length / allQuestions.length) * 100)
        : 100
      
      const isComplete = requiredQuestions.length > 0 
        ? answeredRequiredQuestions.length === requiredQuestions.length
        : allQuestions.length === answeredQuestions.length
      
      return {
        categoryId: category.id,
        categoryTitle: category.title,
        categoryDescription: category.description,
        subcategories: subcategoryReviews,
        totalQuestions: allQuestions.length,
        answeredQuestions: answeredQuestions.length,
        requiredQuestions: requiredQuestions.length,
        answeredRequiredQuestions: answeredRequiredQuestions.length,
        completionPercentage,
        isComplete
      }
    })
  }, [rapidQuestions.categories, responses])

  // Calculate overall completion status
  const overallCompletion = useMemo(() => {
    const totalRequired = categoryReviewSummary.reduce((sum, category) => 
      sum + category.requiredQuestions, 0)
    const totalAnswered = categoryReviewSummary.reduce((sum, category) => 
      sum + category.answeredRequiredQuestions, 0)
    const totalQuestions = categoryReviewSummary.reduce((sum, category) => 
      sum + category.totalQuestions, 0)
    const totalAnsweredAll = categoryReviewSummary.reduce((sum, category) => 
      sum + category.answeredQuestions, 0)
    
    return {
      totalRequired,
      totalAnswered,
      totalQuestions,
      totalAnsweredAll,
      isComplete: totalRequired > 0 ? totalAnswered === totalRequired : totalAnsweredAll === totalQuestions,
      percentage: totalRequired > 0 ? Math.round((totalAnswered / totalRequired) * 100) : 
                 totalQuestions > 0 ? Math.round((totalAnsweredAll / totalQuestions) * 100) : 100,
      completedCategories: categoryReviewSummary.filter(cat => cat.isComplete).length,
      totalCategories: categoryReviewSummary.length
    }
  }, [categoryReviewSummary])

  const formatAnswer = (answer: any, questionType: string): string => {
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
    
    // Format based on question type
    if (questionType === 'number' && typeof answer === 'number') {
      return answer.toLocaleString()
    }
    
    return String(answer)
  }

  const handleEditQuestion = (categoryId: string, questionId: string) => {
    onEditResponse(categoryId, questionId)
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
        <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Your Assessment Responses
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {assessment.name} • {assessment.type === 'EXPLORATORY' ? 'New AI Development' : 'Migrate Existing AI'} • RAPID Questionnaire v{rapidQuestions.version}
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
              <h3 className="text-lg font-medium text-gray-900">Assessment Progress</h3>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">
                  {overallCompletion.completedCategories} of {overallCompletion.totalCategories} categories completed
                </div>
                <div className="text-xs text-gray-500">
                  {overallCompletion.totalAnswered} of {overallCompletion.totalRequired} required questions answered
                </div>
              </div>
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
                  {overallCompletion.totalRequired - overallCompletion.totalAnswered} required questions remaining.
                </span>
              </div>
            )}
            
            {overallCompletion.isComplete && (
              <div className="flex items-center text-green-700 bg-green-100 p-3 rounded-md">
                <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  🎉 All required questions have been answered across all categories. You can now complete your assessment.
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
            <div className="space-y-6">
              {categoryReviewSummary.map((category, categoryIndex) => (
                <div key={category.categoryId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div className={`px-6 py-4 border-b border-gray-200 ${
                    category.isComplete ? 'bg-green-50' : 
                    category.completionPercentage > 0 ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {categoryIndex + 1}. {category.categoryTitle}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.isComplete ? 'bg-green-100 text-green-800' :
                          category.completionPercentage > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {category.isComplete ? 'Complete' : 
                           category.completionPercentage > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {category.completionPercentage}% complete
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              category.isComplete ? 'bg-green-600' : 
                              category.completionPercentage > 50 ? 'bg-blue-600' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${category.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {category.categoryDescription && (
                      <p className="text-sm text-gray-600 mb-2">{category.categoryDescription}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {category.answeredQuestions} of {category.totalQuestions} questions answered
                      {category.requiredQuestions > 0 && (
                        <span className="ml-2">
                          • {category.answeredRequiredQuestions} of {category.requiredQuestions} required questions
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div className="divide-y divide-gray-100">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.subcategoryId} className="p-4">
                        <h5 className="text-md font-medium text-gray-800 mb-3 border-l-4 border-blue-400 pl-3">
                          {subcategory.subcategoryTitle}
                        </h5>
                        
                        {/* Questions */}
                        <div className="space-y-3 ml-4">
                          {subcategory.questions.map((question) => (
                            <div 
                              key={question.id} 
                              className={`p-3 rounded-lg border transition-colors ${
                                question.required && question.isEmpty 
                                  ? 'bg-red-50 border-red-200' 
                                  : question.isEmpty
                                  ? 'bg-gray-50 border-gray-200'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start space-x-2 mb-2">
                                    <h6 className="text-sm font-medium text-gray-900 leading-tight">
                                      {question.number}: {question.text}
                                    </h6>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      {question.required && (
                                        <span className="text-xs text-red-600 font-medium bg-red-100 px-1 py-0.5 rounded">
                                          Required
                                        </span>
                                      )}
                                      {question.required && question.isEmpty && (
                                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {question.description && (
                                    <p className="text-xs text-gray-500 mb-2 italic">{question.description}</p>
                                  )}
                                  
                                  <div className={`text-sm ${
                                    question.isEmpty 
                                      ? 'text-gray-400 italic' 
                                      : 'text-gray-700 font-medium'
                                  }`}>
                                    {formatAnswer(question.answer, question.type)}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleEditQuestion(category.categoryId, question.id)}
                                  className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                                  aria-label={`Edit question: ${question.text}`}
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