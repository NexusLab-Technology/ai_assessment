/**
 * CategoryResponseManager Component
 * Handles category navigation, validation, and localStorage persistence
 * Implements "Complete Assessment" button when all categories are done
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { 
  RAPIDCategory, 
  AssessmentResponses, 
  CategoryCompletionStatus,
  CompletionStatus 
} from '@/types/rapid-questionnaire';

interface CategoryResponseManagerProps {
  categories: RAPIDCategory[];
  currentCategory: string;
  responses: AssessmentResponses;
  onCategoryChange: (categoryId: string) => void;
  onResponsesUpdate: (responses: AssessmentResponses) => void;
  onAssessmentComplete: () => void;
  assessmentId: string;
  className?: string;
}

export const CategoryResponseManager: React.FC<CategoryResponseManagerProps> = ({
  categories,
  currentCategory,
  responses,
  onCategoryChange,
  onResponsesUpdate,
  onAssessmentComplete,
  assessmentId,
  className = ''
}) => {
  const [categoryStatuses, setCategoryStatuses] = useState<CategoryCompletionStatus[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // localStorage key for responses
  const getStorageKey = (id: string) => `assessment_responses_${id}`;
  const getStatusKey = (id: string) => `assessment_status_${id}`;

  // Load responses from localStorage on mount
  useEffect(() => {
    const savedResponses = localStorage.getItem(getStorageKey(assessmentId));
    const savedStatuses = localStorage.getItem(getStatusKey(assessmentId));
    
    if (savedResponses) {
      try {
        const parsedResponses = JSON.parse(savedResponses);
        onResponsesUpdate(parsedResponses);
      } catch (error) {
        console.error('Failed to parse saved responses:', error);
      }
    }

    if (savedStatuses) {
      try {
        const parsedStatuses = JSON.parse(savedStatuses);
        setCategoryStatuses(parsedStatuses.map((status: any) => ({
          ...status,
          lastModified: new Date(status.lastModified)
        })));
      } catch (error) {
        console.error('Failed to parse saved statuses:', error);
      }
    }
  }, [assessmentId, onResponsesUpdate]);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      localStorage.setItem(getStorageKey(assessmentId), JSON.stringify(responses));
    }
  }, [responses, assessmentId]);

  // Save category statuses to localStorage
  useEffect(() => {
    if (categoryStatuses.length > 0) {
      localStorage.setItem(getStatusKey(assessmentId), JSON.stringify(categoryStatuses));
    }
  }, [categoryStatuses, assessmentId]);

  // Calculate category completion status
  const calculateCategoryStatus = useCallback((category: RAPIDCategory): CategoryCompletionStatus => {
    const categoryResponses = responses[category.id] || {};
    const totalQuestions = category.totalQuestions;
    
    // Get all required questions for this category
    const requiredQuestions = category.subcategories.flatMap(sub => 
      sub.questions.filter(q => q.required)
    );
    
    const answeredQuestions = Object.keys(categoryResponses).filter(questionId => {
      const response = categoryResponses[questionId];
      return response !== undefined && response !== null && response !== '';
    });

    const answeredRequiredQuestions = requiredQuestions.filter(q => 
      categoryResponses[q.id] !== undefined && 
      categoryResponses[q.id] !== null && 
      categoryResponses[q.id] !== ''
    );

    const completionPercentage = totalQuestions > 0 ? 
      Math.round((answeredQuestions.length / totalQuestions) * 100) : 0;

    let status: CompletionStatus;
    if (answeredRequiredQuestions.length === requiredQuestions.length && completionPercentage === 100) {
      status = 'completed';
    } else if (answeredQuestions.length > 0) {
      status = 'partial';
    } else {
      status = 'not_started';
    }

    return {
      categoryId: category.id,
      status,
      completionPercentage,
      lastModified: new Date()
    };
  }, [responses]);

  // Update category statuses when responses change
  useEffect(() => {
    const newStatuses = categories.map(calculateCategoryStatus);
    setCategoryStatuses(newStatuses);
  }, [categories, calculateCategoryStatus]);

  // Validate category before navigation
  const validateCategory = (categoryId: string): string[] => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return [];

    const categoryResponses = responses[categoryId] || {};
    const errors: string[] = [];

    // Check required questions
    const requiredQuestions = category.subcategories.flatMap(sub => 
      sub.questions.filter(q => q.required)
    );

    const unansweredRequired = requiredQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response === undefined || response === null || response === '';
    });

    if (unansweredRequired.length > 0) {
      errors.push(`${unansweredRequired.length} required questions must be answered before leaving this category`);
    }

    return errors;
  };

  // Handle category navigation
  const handleCategoryNavigation = async (targetCategoryId: string) => {
    if (isNavigating || targetCategoryId === currentCategory) return;

    setIsNavigating(true);
    setValidationErrors([]);

    // Validate current category before leaving
    const errors = validateCategory(currentCategory);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsNavigating(false);
      return;
    }

    // Navigate to target category
    onCategoryChange(targetCategoryId);
    setIsNavigating(false);
  };

  // Get current category index
  const currentCategoryIndex = categories.findIndex(cat => cat.id === currentCategory);

  // Check if assessment is complete
  const isAssessmentComplete = categoryStatuses.every(status => status.status === 'completed');

  // Get category status
  const getCategoryStatus = (categoryId: string): CategoryCompletionStatus => {
    return categoryStatuses.find(status => status.categoryId === categoryId) || {
      categoryId,
      status: 'not_started',
      completionPercentage: 0,
      lastModified: new Date()
    };
  };

  // Handle complete assessment
  const handleCompleteAssessment = () => {
    if (isAssessmentComplete) {
      onAssessmentComplete();
    }
  };

  return (
    <div className={`category-response-manager ${className}`}>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please complete required fields
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {categories.map((category, index) => {
          const status = getCategoryStatus(category.id);
          const isActive = category.id === currentCategory;
          const isCompleted = status.status === 'completed';
          const isPartial = status.status === 'partial';
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryNavigation(category.id)}
              disabled={isNavigating}
              className={`
                relative px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                  : isCompleted
                    ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                    : isPartial
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }
                ${isNavigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center space-x-2">
                {/* Status Icon */}
                {isCompleted && (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                
                {/* Category Number and Title */}
                <span>
                  {index + 1}. {category.title}
                </span>
                
                {/* Progress Indicator */}
                {status.completionPercentage > 0 && (
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${isActive 
                      ? 'bg-blue-500 text-white' 
                      : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  `}>
                    {status.completionPercentage}%
                  </span>
                )}
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        {/* Previous Category Button */}
        <button
          onClick={() => {
            if (currentCategoryIndex > 0) {
              handleCategoryNavigation(categories[currentCategoryIndex - 1].id);
            }
          }}
          disabled={currentCategoryIndex <= 0 || isNavigating}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${currentCategoryIndex <= 0 || isNavigating
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous Category</span>
        </button>

        {/* Complete Assessment or Next Category Button */}
        <div className="flex items-center space-x-3">
          {isAssessmentComplete ? (
            <button
              onClick={handleCompleteAssessment}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Complete Assessment</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentCategoryIndex < categories.length - 1) {
                  handleCategoryNavigation(categories[currentCategoryIndex + 1].id);
                }
              }}
              disabled={currentCategoryIndex >= categories.length - 1 || isNavigating}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${currentCategoryIndex >= categories.length - 1 || isNavigating
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                }
              `}
            >
              <span>Next Category</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Assessment Progress</h4>
          <span className="text-sm text-gray-600">
            {categoryStatuses.filter(s => s.status === 'completed').length} of {categories.length} categories completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${categories.length > 0 ? 
                Math.round((categoryStatuses.filter(s => s.status === 'completed').length / categories.length) * 100) : 0
              }%` 
            }}
          />
        </div>
        
        {isAssessmentComplete && (
          <div className="mt-3 text-sm text-green-700 font-medium">
            🎉 All categories completed! You can now complete your assessment.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryResponseManager;