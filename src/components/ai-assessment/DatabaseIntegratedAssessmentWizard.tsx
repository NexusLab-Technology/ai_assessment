/**
 * Database Integrated Assessment Wizard Component
 * Task 17.1: Complete RAPIDQuestionnaireLoader database integration
 * 
 * Features:
 * - Integrates EnhancedRAPIDQuestionnaireLoader with database
 * - Handles questionnaire loading states and errors
 * - Provides fallback to static data
 * - Auto-initializes database if needed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  RAPIDCategory,
  RAPIDQuestion,
  CategoryCompletionStatus,
  CompletionStatus,
  AssessmentType
} from '../../types/rapid-questionnaire';
import EnhancedRAPIDQuestionnaireLoader from './EnhancedRAPIDQuestionnaireLoader';
import CategoryNavigationSidebar from './CategoryNavigationSidebar';
import FixedQuestionContainer from './FixedQuestionContainer';
import QuestionStep from './RAPIDQuestionStep';
import ResponseReviewModal from './ResponseReviewModal';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface DatabaseIntegratedAssessmentWizardProps {
  assessment?: Assessment; // Optional for new assessments
  assessmentType: AssessmentType;
  version?: string; // Optional specific version
  responses?: AssessmentResponses;
  onResponseChange?: (categoryId: string, responses: any) => void;
  onCategoryChange?: (categoryId: string) => void;
  onComplete?: (responses: AssessmentResponses) => void;
  onError?: (error: string) => void;
  className?: string;
  enableAutoInit?: boolean; // Auto-initialize database if needed
}

interface QuestionValidation {
  [questionId: string]: {
    isValid: boolean;
    error?: string;
  };
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
  // Ensure assessmentType is valid
  const validAssessmentType = assessmentType || assessment?.type || 'EXPLORATORY';
  
  // Questionnaire loading state
  const [questionnaire, setQuestionnaire] = useState<RAPIDQuestionnaireStructure | null>(null);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(true);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Assessment state
  const [responses, setResponses] = useState<AssessmentResponses>(initialResponses);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<QuestionValidation>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-initialize database if questionnaire loading fails
  const handleAutoInitialization = useCallback(async () => {
    if (!enableAutoInit) return false;

    try {
      setIsInitializing(true);
      console.log('🔄 Auto-initializing RAPID questionnaires...');

      const response = await fetch('/api/questionnaires/rapid/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-init' })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Auto-initialization successful');
        return true;
      } else {
        console.error('❌ Auto-initialization failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Auto-initialization error:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [enableAutoInit]);

  // Handle questionnaire loading success
  const handleQuestionsLoaded = useCallback((loadedQuestionnaire: RAPIDQuestionnaireStructure) => {
    console.log('📝 RAPID questionnaire loaded:', loadedQuestionnaire);
    setQuestionnaire(loadedQuestionnaire);
    setQuestionnaireLoading(false);
    setQuestionnaireError(null);

    // Set initial category if not set
    if (!currentCategory && loadedQuestionnaire.categories.length > 0) {
      const initialCategory = assessment?.currentCategory || loadedQuestionnaire.categories[0].id;
      setCurrentCategory(initialCategory);
      onCategoryChange?.(initialCategory);
    }
  }, [currentCategory, assessment?.currentCategory, onCategoryChange]);

  // Handle questionnaire loading error
  const handleQuestionnaireError = useCallback(async (error: string) => {
    console.error('❌ RAPID questionnaire loading error:', error);
    setQuestionnaireError(error);
    setQuestionnaireLoading(false);
    onError?.(error);

    // Try auto-initialization if enabled
    if (enableAutoInit && !isInitializing) {
      console.log('🔄 Attempting auto-initialization...');
      const initSuccess = await handleAutoInitialization();
      
      if (initSuccess) {
        // Retry loading after successful initialization
        setQuestionnaireLoading(true);
        setQuestionnaireError(null);
        // The EnhancedRAPIDQuestionnaireLoader will automatically retry
      }
    }
  }, [onError, enableAutoInit, isInitializing, handleAutoInitialization]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setCurrentCategory(categoryId);
    onCategoryChange?.(categoryId);
    setValidationErrors({}); // Clear validation errors when switching categories
  }, [onCategoryChange]);

  // Handle response changes
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    const updatedResponses = {
      ...responses,
      [currentCategory]: {
        ...responses[currentCategory],
        [questionId]: value
      }
    };

    setResponses(updatedResponses);
    onResponseChange?.(currentCategory, updatedResponses[currentCategory]);

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }

    // Auto-save (debounced)
    setAutoSaveStatus('saving');
    // In a real implementation, you would debounce this
    setTimeout(() => setAutoSaveStatus('saved'), 1000);
  }, [responses, currentCategory, onResponseChange, validationErrors]);

  // Validate current category responses
  const validateCurrentCategory = useCallback((): boolean => {
    if (!questionnaire || !currentCategory) return true;

    const category = questionnaire.categories.find(cat => cat.id === currentCategory);
    if (!category) return true;

    const categoryResponses = responses[currentCategory] || {};
    const errors: QuestionValidation = {};
    let hasErrors = false;

    // Get all questions in the category
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);

    allQuestions.forEach(question => {
      if (question.required) {
        const response = categoryResponses[question.id];
        if (!response || (typeof response === 'string' && response.trim() === '')) {
          errors[question.id] = {
            isValid: false,
            error: 'This field is required'
          };
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  }, [questionnaire, currentCategory, responses]);

  // Calculate category completion status
  const getCategoryCompletionStatus = useCallback((categoryId: string): CompletionStatus => {
    if (!questionnaire) return 'not_started';

    const category = questionnaire.categories.find(cat => cat.id === categoryId);
    if (!category) return 'not_started';

    const categoryResponses = responses[categoryId] || {};
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    
    if (requiredQuestions.length === 0) return 'completed';

    const answeredRequired = requiredQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response && (typeof response !== 'string' || response.trim() !== '');
    });

    if (answeredRequired.length === 0) return 'not_started';
    if (answeredRequired.length === requiredQuestions.length) return 'completed';
    return 'partial';
  }, [questionnaire, responses]);

  // Get completion statuses for all categories
  const getCompletionStatuses = useCallback((): CategoryCompletionStatus[] => {
    if (!questionnaire) return [];

    return questionnaire.categories.map(category => ({
      categoryId: category.id,
      status: getCategoryCompletionStatus(category.id),
      completionPercentage: 0, // Could be calculated based on answered questions
      lastModified: new Date()
    }));
  }, [questionnaire, getCategoryCompletionStatus]);

  // Handle assessment completion
  const handleComplete = useCallback(() => {
    if (!questionnaire) return;

    // Validate all categories
    let allValid = true;
    for (const category of questionnaire.categories) {
      const prevCategory = currentCategory;
      setCurrentCategory(category.id);
      if (!validateCurrentCategory()) {
        allValid = false;
        break;
      }
      setCurrentCategory(prevCategory);
    }

    if (!allValid) {
      alert('Please complete all required fields before submitting.');
      return;
    }

    onComplete?.(responses);
  }, [questionnaire, currentCategory, validateCurrentCategory, onComplete, responses]);

  // Initialize current category when questionnaire loads
  useEffect(() => {
    if (questionnaire && !currentCategory && questionnaire.categories.length > 0) {
      const initialCategory = assessment?.currentCategory || questionnaire.categories[0].id;
      setCurrentCategory(initialCategory);
      onCategoryChange?.(initialCategory);
    }
  }, [questionnaire, currentCategory, assessment?.currentCategory, onCategoryChange]);

  // Update responses when initial responses change
  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

  return (
    <div className={`h-full ${className}`}>
      {/* Always render the questionnaire loader first */}
      <div className="hidden">
        <EnhancedRAPIDQuestionnaireLoader
          assessmentType={validAssessmentType}
          version={version}
          onQuestionsLoaded={handleQuestionsLoaded}
          onError={handleQuestionnaireError}
          enableCaching={true}
          fallbackToStatic={true}
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
              setQuestionnaireLoading(true);
              setQuestionnaireError(null);
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
        <>
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50">
            <CategoryNavigationSidebar
              categories={questionnaire.categories}
              currentCategory={currentCategory}
              onCategorySelect={handleCategorySelect}
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
                    {questionnaire.categories.find(cat => cat.id === currentCategory)?.title || 'Loading...'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {validAssessmentType === 'EXPLORATORY' ? 'Exploratory' : 'Migration'} Assessment
                    {assessment?.name && ` • ${assessment.name}`}
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
                {questionnaire.categories.find(cat => cat.id === currentCategory) && (
                  <QuestionStep
                    category={questionnaire.categories.find(cat => cat.id === currentCategory)!}
                    responses={responses[currentCategory] || {}}
                    onResponseChange={handleResponseChange}
                    validationErrors={validationErrors}
                  />
                )}
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
                type: assessmentType,
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
        </>
      )}
    </div>
  );
};

export default DatabaseIntegratedAssessmentWizard;