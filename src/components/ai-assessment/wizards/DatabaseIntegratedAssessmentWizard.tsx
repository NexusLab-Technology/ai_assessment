/**
 * Database Integrated Assessment Wizard Component
 * Task 17.1: Complete RAPIDQuestionnaireLoader database integration
 * 
 * Features:
 * - Integrates RAPIDQuestionnaireLoader with database
 * - Handles questionnaire loading states and errors
 * - Provides fallback to static data
 * - Auto-initializes database if needed
 * 
 * Refactored to use extracted hooks for better code organization (Rule 3 compliance)
 */

import React, { useEffect } from 'react';
import { 
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  Assessment, 
  AssessmentResponses, 
  AssessmentType
} from '../../../types/rapid-questionnaire';
import RAPIDQuestionnaireLoader from '../questions/RAPIDQuestionnaireLoader';
import EnhancedCategoryNavigationWithSubcategories from '../navigation/EnhancedCategoryNavigationWithSubcategories';
import FixedQuestionContainer from '../questions/FixedQuestionContainer';
import ResponseReviewModal from '../modals/ResponseReviewModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useQuestionnaireLoader } from '../hooks/database-integrated/DatabaseIntegratedAssessmentWizardLoader';
import { useAssessmentWizardState } from '../hooks/database-integrated/DatabaseIntegratedAssessmentWizardState';
import { useAssessmentWizardValidation } from '../hooks/database-integrated/DatabaseIntegratedAssessmentWizardValidation';

interface DatabaseIntegratedAssessmentWizardProps {
  assessment?: Assessment;
  assessmentType: AssessmentType;
  version?: string;
  responses?: AssessmentResponses;
  onResponseChange?: (categoryId: string, responses: any) => void;
  onCategoryChange?: (categoryId: string) => void;
  onComplete?: (responses: AssessmentResponses) => void;
  onError?: (error: string) => void;
  className?: string;
  enableAutoInit?: boolean;
}

export const DatabaseIntegratedAssessmentWizard: React.FC<DatabaseIntegratedAssessmentWizardProps> = ({
  assessment,
  assessmentType,
  version,
  responses: initialResponses = {},
  onResponseChange,
  onCategoryChange,
  onComplete,
  onError,
  className = '',
  enableAutoInit = true
}) => {
  const validAssessmentType = assessmentType || assessment?.type || 'EXPLORATORY';

  // Use extracted hooks
  const {
    questionnaire,
    questionnaireLoading,
    questionnaireError,
    isInitializing,
    handleQuestionsLoaded,
    handleQuestionnaireError,
    handleAutoInitialization
  } = useQuestionnaireLoader(
    validAssessmentType,
    enableAutoInit,
    onCategoryChange,
    assessment?.currentCategory,
    onError
  );

  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = React.useState(false);

  const {
    responses,
    currentCategory,
    currentSubcategory,
    currentQuestionIndex,
    showReviewModal,
    autoSaveStatus,
    setResponses,
    setCurrentCategory,
    setCurrentSubcategory,
    setCurrentQuestionIndex,
    setShowReviewModal,
    handleCategorySelect,
    handleSubcategorySelect,
    handleResponseChange
  } = useAssessmentWizardState(
    initialResponses,
    questionnaire,
    onResponseChange,
    onCategoryChange
  );

  const {
    validationErrors,
    getCategoryCompletionStatus,
    getCompletionStatuses,
    validateAllCategories
  } = useAssessmentWizardValidation(
    questionnaire,
    currentCategory,
    responses,
    setCurrentCategory
  );

  // Handle assessment completion
  const handleComplete = () => {
    if (!questionnaire) return;

    if (!validateAllCategories()) {
      alert('Please complete all required fields before submitting.');
      return;
    }

    onComplete?.(responses);
  };

  // Initialize current category when questionnaire loads
  useEffect(() => {
    if (questionnaire && !currentCategory && questionnaire.categories.length > 0) {
      const initialCategory = assessment?.currentCategory || questionnaire.categories[0].id;
      setCurrentCategory(initialCategory);
      
      const category = questionnaire.categories.find(cat => cat.id === initialCategory);
      if (category && category.subcategories.length > 0) {
        setCurrentSubcategory(category.subcategories[0].id);
        setCurrentQuestionIndex(0); // Reset to first question
      }
      
      onCategoryChange?.(initialCategory);
    }
  }, [questionnaire, currentCategory, assessment?.currentCategory, onCategoryChange, setCurrentCategory, setCurrentSubcategory, setCurrentQuestionIndex]);

  // Update responses when initial responses change
  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses, setResponses]);

  return (
    <div className={`h-full ${className}`}>
      {/* Always render the questionnaire loader first */}
      <div className="hidden">
        <RAPIDQuestionnaireLoader
          assessmentType={validAssessmentType}
          onQuestionsLoaded={handleQuestionsLoaded}
          onError={handleQuestionnaireError}
        />
      </div>

      {/* Show loading state while questionnaire is loading */}
      {(questionnaireLoading || isInitializing) && (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isInitializing ? 'Initializing RAPID questionnaires...' : 'Loading questionnaire...'}
          </p>
          <p className="text-sm text-gray-500">
            {validAssessmentType === 'EXPLORATORY' ? 'Exploratory' : 'Migration'} Assessment
            {version && ` (version ${version})`}
          </p>
          {isInitializing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Cog6ToothIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Setting up database for first-time use...
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show error state if questionnaire failed to load */}
      {questionnaireError && !questionnaire && !questionnaireLoading && (
        <div className="p-8">
          <ErrorMessage 
            message={questionnaireError}
            title="Failed to Load Assessment"
            onRetry={() => {
              // Retry logic handled by loader hook
            }}
            className="mb-4"
          />
          
          {enableAutoInit && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Troubleshooting</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Database connection may be unavailable</p>
                <p>• RAPID questionnaires may not be initialized</p>
                <p>• Auto-initialization is enabled and will retry</p>
              </div>
              <button
                onClick={handleAutoInitialization}
                disabled={isInitializing}
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-1" />
                {isInitializing ? 'Initializing...' : 'Initialize Database'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show questionnaire not found */}
      {!questionnaire && !questionnaireLoading && !questionnaireError && (
        <div className="p-8">
          <ErrorMessage 
            message="Questionnaire data is not available"
            title="No Questionnaire Found"
          />
        </div>
      )}

      {/* Show main content when questionnaire is loaded */}
      {questionnaire && !questionnaireLoading && (
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50">
            <EnhancedCategoryNavigationWithSubcategories
              categories={questionnaire.categories}
              currentCategory={currentCategory}
              currentSubcategory={currentSubcategory}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
              completionStatus={getCompletionStatuses()}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {(() => {
                      const category = questionnaire.categories.find(cat => cat.id === currentCategory);
                      const subcategory = category?.subcategories.find(sub => sub.id === currentSubcategory);
                      return subcategory?.title || category?.title || 'Loading...';
                    })()}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const category = questionnaire.categories.find(cat => cat.id === currentCategory);
                      const subcategory = category?.subcategories.find(sub => sub.id === currentSubcategory);
                      return (
                        <>
                          {category?.title}
                          {subcategory && category?.title !== subcategory.title && ` • ${subcategory.title}`}
                          {' • '}
                          {validAssessmentType === 'EXPLORATORY' ? 'Exploratory' : 'Migration'} Assessment
                          {assessment?.name && ` • ${assessment.name}`}
                        </>
                      );
                    })()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Auto-save indicator */}
                  {autoSaveStatus !== 'idle' && (
                    <div className="flex items-center space-x-1 text-sm">
                      {autoSaveStatus === 'saving' && (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                          <span className="text-gray-600">Saving...</span>
                        </>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <>
                          <CheckIcon className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Saved</span>
                        </>
                      )}
                      {autoSaveStatus === 'error' && (
                        <>
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">Error</span>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Review Responses
                  </button>

                  <button
                    onClick={handleComplete}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Complete Assessment
                  </button>
                </div>
              </div>
            </div>

            {/* Question Container */}
            <div className="flex-1 overflow-auto">
              <FixedQuestionContainer>
                {(() => {
                  const category = questionnaire.categories.find(cat => cat.id === currentCategory);
                  const subcategory = category?.subcategories.find(sub => sub.id === currentSubcategory);
                  
                  if (subcategory && subcategory.questions.length > 0 && category) {
                    const currentQuestion = subcategory.questions[currentQuestionIndex];
                    
                    // Get current indices
                    const currentSubcategoryIndex = category.subcategories.findIndex(sub => sub.id === currentSubcategory);
                    const currentCategoryIndex = questionnaire.categories.findIndex(cat => cat.id === currentCategory);
                    
                    // Check positions
                    const isFirstQuestionInSubcategory = currentQuestionIndex === 0;
                    const isFirstSubcategoryInCategory = currentSubcategoryIndex === 0;
                    const isFirstCategory = currentCategoryIndex === 0;
                    const isFirstQuestion = isFirstQuestionInSubcategory && isFirstSubcategoryInCategory && isFirstCategory;
                    const isLastQuestionInSubcategory = currentQuestionIndex === subcategory.questions.length - 1;
                    const isLastSubcategoryInCategory = currentSubcategoryIndex === category.subcategories.length - 1;
                    const isLastCategory = currentCategoryIndex === questionnaire.categories.length - 1;
                    
                    // Check if this is the absolute last question
                    const isAbsoluteLastQuestion = isLastQuestionInSubcategory && isLastSubcategoryInCategory && isLastCategory;
                    
                    // Navigation handlers
                    const handlePrevious = () => {
                      if (currentQuestionIndex > 0) {
                        // Go to previous question in same subcategory
                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                      } else {
                        // Go to previous subcategory's last question
                        if (currentSubcategoryIndex > 0) {
                          const prevSubcategory = category.subcategories[currentSubcategoryIndex - 1];
                          handleSubcategorySelect(currentCategory, prevSubcategory.id);
                          setCurrentQuestionIndex(prevSubcategory.questions.length - 1);
                        } else {
                          // Go to previous category's last subcategory's last question
                          if (currentCategoryIndex > 0) {
                            const prevCategory = questionnaire.categories[currentCategoryIndex - 1];
                            const prevCategoryLastSubcategory = prevCategory.subcategories[prevCategory.subcategories.length - 1];
                            handleCategorySelect(prevCategory.id);
                            setCurrentSubcategory(prevCategoryLastSubcategory.id);
                            setCurrentQuestionIndex(prevCategoryLastSubcategory.questions.length - 1);
                          }
                        }
                      }
                    };
                    
                    const handleNext = () => {
                      if (!isLastQuestionInSubcategory) {
                        // Move to next question in same subcategory
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      } else {
                        // Check if there's a next subcategory in current category
                        if (!isLastSubcategoryInCategory) {
                          // Move to next subcategory's first question
                          const nextSubcategory = category.subcategories[currentSubcategoryIndex + 1];
                          handleSubcategorySelect(currentCategory, nextSubcategory.id);
                          setCurrentQuestionIndex(0);
                        } else {
                          // Check if there's a next category
                          if (!isLastCategory) {
                            // Move to next category's first subcategory's first question
                            const nextCategory = questionnaire.categories[currentCategoryIndex + 1];
                            handleCategorySelect(nextCategory.id);
                            if (nextCategory.subcategories.length > 0) {
                              setCurrentSubcategory(nextCategory.subcategories[0].id);
                              setCurrentQuestionIndex(0);
                            }
                          } else {
                            // This is the absolute last question - show confirmation
                            setShowCompleteConfirmModal(true);
                          }
                        }
                      }
                    };
                    
                    return (
                      <div className="p-6 flex flex-col h-full">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {subcategory.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Question {currentQuestionIndex + 1} of {subcategory.questions.length} in this section
                          </p>
                        </div>
                        
                        {/* Current Question */}
                        <div className="flex-1">
                          <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {currentQuestionIndex + 1}
                                </span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {currentQuestion.number}
                                  </h4>
                                  {currentQuestion.required && (
                                    <span className="text-red-500 text-sm">*</span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-700 mb-3">
                                  {currentQuestion.text}
                                </p>
                                
                                {currentQuestion.description && (
                                  <p className="text-xs text-gray-500 mb-3">
                                    {currentQuestion.description}
                                  </p>
                                )}
                                
                                {/* Question Input */}
                                <div className="space-y-2">
                                  {currentQuestion.type === 'text' && (
                                    <input
                                      type="text"
                                      value={responses[currentCategory]?.[currentQuestion.id] || ''}
                                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Enter your answer..."
                                    />
                                  )}
                                  
                                  {currentQuestion.type === 'textarea' && (
                                    <textarea
                                      value={responses[currentCategory]?.[currentQuestion.id] || ''}
                                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                      rows={6}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Enter your detailed answer..."
                                    />
                                  )}
                                  
                                  {currentQuestion.type === 'select' && currentQuestion.options && (
                                    <select
                                      value={responses[currentCategory]?.[currentQuestion.id] || ''}
                                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Select an option...</option>
                                      {currentQuestion.options.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  {currentQuestion.type === 'radio' && currentQuestion.options && (
                                    <div className="space-y-2">
                                      {currentQuestion.options.map((option) => (
                                        <label key={option} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={currentQuestion.id}
                                            value={option}
                                            checked={responses[currentCategory]?.[currentQuestion.id] === option}
                                            onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                          />
                                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Validation Error */}
                                {validationErrors[currentQuestion.id] && !validationErrors[currentQuestion.id].isValid && (
                                  <p className="mt-2 text-sm text-red-600">
                                    {validationErrors[currentQuestion.id].error}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Navigation Buttons */}
                        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
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
                          
                          <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {isAbsoluteLastQuestion ? 'Complete Assessment' : 'Next'}
                            <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="p-6">
                      <p className="text-gray-500">Please select a subcategory to view questions.</p>
                    </div>
                  );
                })()}
              </FixedQuestionContainer>
            </div>
          </div>

          {/* Response Review Modal */}
          {showReviewModal && (
            <ResponseReviewModal
              isOpen={showReviewModal}
              assessment={assessment || {
                id: 'temp',
                name: 'Assessment',
                companyId: '',
                type: validAssessmentType,
                status: 'IN_PROGRESS',
                currentCategory: currentCategory,
                totalCategories: questionnaire.categories.length,
                responses: responses,
                categoryStatuses: {},
                rapidQuestionnaireVersion: questionnaire.version || '1.0',
                createdAt: new Date(),
                updatedAt: new Date()
              }}
              responses={responses}
              rapidQuestions={questionnaire}
              onClose={() => setShowReviewModal(false)}
              onEditResponse={(categoryIdOrStep: string | number, questionId?: string) => {
                if (typeof categoryIdOrStep === 'string') {
                  setCurrentCategory(categoryIdOrStep);
                }
                setShowReviewModal(false);
              }}
              onComplete={() => {
                setShowReviewModal(false);
                onComplete?.(responses);
              }}
            />
          )}

          {/* Complete Assessment Confirmation Modal */}
          {showCompleteConfirmModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCompleteConfirmModal(false)} />
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Complete Assessment
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            You have reached the last question. Are you sure you want to complete this assessment? 
                            You can review your responses before submitting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompleteConfirmModal(false);
                        handleComplete();
                      }}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Complete Assessment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Review Responses
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCompleteConfirmModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
