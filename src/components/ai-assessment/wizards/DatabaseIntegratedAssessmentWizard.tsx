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
  Cog6ToothIcon
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

  const {
    responses,
    currentCategory,
    currentSubcategory,
    showReviewModal,
    autoSaveStatus,
    setResponses,
    setCurrentCategory,
    setCurrentSubcategory,
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
      }
      
      onCategoryChange?.(initialCategory);
    }
  }, [questionnaire, currentCategory, assessment?.currentCategory, onCategoryChange, setCurrentCategory, setCurrentSubcategory]);

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
                  
                  if (subcategory) {
                    return (
                      <div className="p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {subcategory.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {subcategory.questionCount} questions in this section
                          </p>
                        </div>
                        
                        <div className="space-y-6">
                          {subcategory.questions.map((question, index) => (
                            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {index + 1}
                                  </span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {question.number}
                                    </h4>
                                    {question.required && (
                                      <span className="text-red-500 text-sm">*</span>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-gray-700 mb-3">
                                    {question.text}
                                  </p>
                                  
                                  {question.description && (
                                    <p className="text-xs text-gray-500 mb-3">
                                      {question.description}
                                    </p>
                                  )}
                                  
                                  {/* Question Input */}
                                  <div className="space-y-2">
                                    {question.type === 'text' && (
                                      <input
                                        type="text"
                                        value={responses[currentCategory]?.[question.id] || ''}
                                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your answer..."
                                      />
                                    )}
                                    
                                    {question.type === 'textarea' && (
                                      <textarea
                                        value={responses[currentCategory]?.[question.id] || ''}
                                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your detailed answer..."
                                      />
                                    )}
                                    
                                    {question.type === 'select' && question.options && (
                                      <select
                                        value={responses[currentCategory]?.[question.id] || ''}
                                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        <option value="">Select an option...</option>
                                        {question.options.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    
                                    {question.type === 'radio' && question.options && (
                                      <div className="space-y-2">
                                        {question.options.map((option) => (
                                          <label key={option} className="flex items-center">
                                            <input
                                              type="radio"
                                              name={question.id}
                                              value={option}
                                              checked={responses[currentCategory]?.[question.id] === option}
                                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Validation Error */}
                                  {validationErrors[question.id] && !validationErrors[question.id].isValid && (
                                    <p className="mt-2 text-sm text-red-600">
                                      {validationErrors[question.id].error}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
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
                userId: '',
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
              onEditResponse={(categoryId: string) => {
                setCurrentCategory(categoryId);
                setShowReviewModal(false);
              }}
              onComplete={() => {
                setShowReviewModal(false);
                onComplete?.(responses);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
