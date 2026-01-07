/**
 * AssessmentWizard Component
 * Enhanced wizard with category-based navigation for RAPID questionnaires
 * Integrates with CategoryNavigationSidebar and FixedQuestionContainer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  RAPIDCategory,
  RAPIDQuestion,
  CategoryCompletionStatus,
  CompletionStatus
} from '@/types/rapid-questionnaire';
import CategoryNavigationSidebar from './CategoryNavigationSidebar';
import FixedQuestionContainer from './FixedQuestionContainer';
import QuestionStep from './QuestionStep';
import ResponseReviewModal from './ResponseReviewModal';

interface AssessmentWizardProps {
  assessment: Assessment;
  rapidQuestions: RAPIDQuestionnaireStructure;
  responses: AssessmentResponses;
  onResponseChange: (categoryId: string, responses: any) => void;
  onCategoryChange: (categoryId: string) => void;
  onComplete: () => void;
  className?: string;
}

interface QuestionValidation {
  [questionId: string]: {
    isValid: boolean;
    error?: string;
  };
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  assessment,
  rapidQuestions,
  responses,
  onResponseChange,
  onCategoryChange,
  onComplete,
  className = ''
}) => {
  // State management
  const [currentCategory, setCurrentCategory] = useState<string>(assessment.currentCategory || rapidQuestions.categories[0]?.id || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questionValidation, setQuestionValidation] = useState<QuestionValidation>({});
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Get current category data
  const getCurrentCategory = useCallback((): RAPIDCategory | undefined => {
    return rapidQuestions.categories.find(cat => cat.id === currentCategory);
  }, [rapidQuestions.categories, currentCategory]);

  // Get current question
  const getCurrentQuestion = useCallback((): RAPIDQuestion | undefined => {
    const category = getCurrentCategory();
    if (!category) return undefined;
    
    // Flatten all questions from all subcategories
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    return allQuestions[currentQuestionIndex];
  }, [getCurrentCategory, currentQuestionIndex]);

  // Calculate category completion status
  const calculateCategoryCompletion = useCallback((categoryId: string): CategoryCompletionStatus => {
    const category = rapidQuestions.categories.find(cat => cat.id === categoryId);
    if (!category) {
      return {
        categoryId,
        status: 'not_started',
        completionPercentage: 0,
        lastModified: new Date()
      };
    }

    const categoryResponses = responses[categoryId] || {};
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== null && response !== undefined && response !== '' && 
             (!Array.isArray(response) || response.length > 0);
    });

    const totalAnswered = allQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== null && response !== undefined && response !== '' && 
             (!Array.isArray(response) || response.length > 0);
    });

    const completionPercentage = allQuestions.length > 0 ? 
      Math.round((totalAnswered.length / allQuestions.length) * 100) : 0;

    let status: CompletionStatus = 'not_started';
    if (completionPercentage === 100) {
      status = 'completed';
    } else if (completionPercentage > 0) {
      status = 'partial';
    }

    return {
      categoryId,
      status,
      completionPercentage,
      lastModified: new Date()
    };
  }, [rapidQuestions.categories, responses]);

  // Get completion status for all categories
  const getAllCategoryStatuses = useCallback((): CategoryCompletionStatus[] => {
    return rapidQuestions.categories.map(cat => calculateCategoryCompletion(cat.id));
  }, [rapidQuestions.categories, calculateCategoryCompletion]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setAutoSaveStatus('saving');
    try {
      // Simulate API call - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Reset to idle after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [hasUnsavedChanges]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Handle response changes
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    const categoryResponses = responses[currentCategory] || {};
    const updatedResponses = {
      ...categoryResponses,
      [questionId]: value
    };

    onResponseChange(currentCategory, updatedResponses);
    setHasUnsavedChanges(true);
  }, [currentCategory, responses, onResponseChange]);

  // Handle question validation
  const handleQuestionValidation = useCallback((questionId: string, isValid: boolean, error?: string) => {
    setQuestionValidation(prev => ({
      ...prev,
      [questionId]: { isValid, error }
    }));
  }, []);

  // Validate current question
  const validateCurrentQuestion = useCallback((): boolean => {
    const question = getCurrentQuestion();
    if (!question) return false;

    const categoryResponses = responses[currentCategory] || {};
    const response = categoryResponses[question.id];
    const validation = questionValidation[question.id];

    // If question is not required and no response, it's valid
    if (!question.required && (response === null || response === undefined || response === '')) {
      return true;
    }

    // Check if required question is answered
    if (question.required) {
      if (response === null || response === undefined || response === '') {
        return false;
      }
      // For array responses (multiselect, checkbox)
      if (Array.isArray(response) && response.length === 0) {
        return false;
      }
    }

    // Check if validation failed
    if (validation && !validation.isValid) {
      return false;
    }

    return true;
  }, [getCurrentQuestion, currentCategory, responses, questionValidation]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    // Auto-save before switching categories
    if (hasUnsavedChanges) {
      autoSave();
    }

    setCurrentCategory(categoryId);
    setCurrentQuestionIndex(0);
    onCategoryChange(categoryId);
  }, [hasUnsavedChanges, autoSave, onCategoryChange]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (!validateCurrentQuestion()) return;

    const category = getCurrentCategory();
    if (!category) return;

    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    
    if (currentQuestionIndex < allQuestions.length - 1) {
      // Move to next question in same category
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to next category
      const currentCategoryIndex = rapidQuestions.categories.findIndex(cat => cat.id === currentCategory);
      if (currentCategoryIndex < rapidQuestions.categories.length - 1) {
        const nextCategory = rapidQuestions.categories[currentCategoryIndex + 1];
        handleCategorySelect(nextCategory.id);
      }
    }

    // Auto-save after navigation
    if (hasUnsavedChanges) {
      await autoSave();
    }
  }, [validateCurrentQuestion, getCurrentCategory, currentQuestionIndex, rapidQuestions.categories, currentCategory, handleCategorySelect, hasUnsavedChanges, autoSave]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      // Go to previous question in same category
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Go to previous category, last question
      const currentCategoryIndex = rapidQuestions.categories.findIndex(cat => cat.id === currentCategory);
      if (currentCategoryIndex > 0) {
        const prevCategory = rapidQuestions.categories[currentCategoryIndex - 1];
        const prevCategoryData = rapidQuestions.categories.find(cat => cat.id === prevCategory.id);
        if (prevCategoryData) {
          const allQuestions = prevCategoryData.subcategories.flatMap(sub => sub.questions);
          setCurrentCategory(prevCategory.id);
          setCurrentQuestionIndex(allQuestions.length - 1);
          onCategoryChange(prevCategory.id);
        }
      }
    }
  }, [currentQuestionIndex, rapidQuestions.categories, currentCategory, onCategoryChange]);

  // Check if assessment is complete
  const isAssessmentComplete = useCallback((): boolean => {
    const statuses = getAllCategoryStatuses();
    return statuses.every(status => status.status === 'completed');
  }, [getAllCategoryStatuses]);

  // Handle complete assessment
  const handleComplete = useCallback(async () => {
    if (!validateCurrentQuestion() || !isAssessmentComplete()) return;

    setIsLoading(true);
    try {
      // Final save before completion
      await autoSave();
      onComplete();
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [validateCurrentQuestion, isAssessmentComplete, autoSave, onComplete]);

  // Handle review modal
  const handleShowReview = useCallback(() => {
    setShowReviewModal(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setShowReviewModal(false);
  }, []);

  const handleEditFromReview = useCallback((categoryId: string, questionId: string) => {
    const category = rapidQuestions.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    const questionIndex = allQuestions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;

    setCurrentCategory(categoryId);
    setCurrentQuestionIndex(questionIndex);
    setShowReviewModal(false);
    onCategoryChange(categoryId);
  }, [rapidQuestions.categories, onCategoryChange]);

  // Get current state
  const currentQuestion = getCurrentQuestion();
  const category = getCurrentCategory();
  const categoryStatuses = getAllCategoryStatuses();
  const isFirstQuestion = rapidQuestions.categories[0]?.id === currentCategory && currentQuestionIndex === 0;
  const isLastQuestion = (() => {
    const lastCategory = rapidQuestions.categories[rapidQuestions.categories.length - 1];
    if (currentCategory !== lastCategory?.id) return false;
    
    const allQuestions = lastCategory.subcategories.flatMap(sub => sub.questions);
    return currentQuestionIndex === allQuestions.length - 1;
  })();

  if (!category || !currentQuestion) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Invalid Category or Question</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested category or question could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-none ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Navigation Sidebar (3 columns) */}
        <div className="lg:col-span-3">
          <CategoryNavigationSidebar
            categories={rapidQuestions.categories}
            currentCategory={currentCategory}
            onCategorySelect={handleCategorySelect}
            completionStatus={categoryStatuses}
            className="sticky top-4"
          />
        </div>

        {/* Main Content (9 columns) */}
        <div className="lg:col-span-9">
          <FixedQuestionContainer>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category.title}
                  </h2>
                  {category.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {category.description}
                    </p>
                  )}
                </div>
                
                {/* Save Status */}
                <div className="flex items-center space-x-4">
                  {autoSaveStatus === 'saving' && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                      Saving...
                    </div>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Saved
                    </div>
                  )}
                  {autoSaveStatus === 'error' && (
                    <div className="flex items-center text-sm text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Save failed
                    </div>
                  )}
                  {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                    <div className="flex items-center text-sm text-amber-600">
                      <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                  
                  {lastSaved && (
                    <div className="text-xs text-gray-400">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Progress */}
              <div className="text-sm text-gray-500 mb-4">
                Question {currentQuestionIndex + 1} of {category.subcategories.flatMap(sub => sub.questions).length} in this category
              </div>
            </div>

            {/* Current Question */}
            <div className="mb-8">
              <QuestionStep
                question={currentQuestion}
                value={responses[currentCategory]?.[currentQuestion.id]}
                onChange={(value) => handleResponseChange(currentQuestion.id, value)}
                onValidation={(isValid, error) => handleQuestionValidation(currentQuestion.id, isValid, error)}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
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

              <div className="flex items-center space-x-4">
                {/* Manual Save Button */}
                <button
                  type="button"
                  onClick={autoSave}
                  disabled={autoSaveStatus === 'saving' || !hasUnsavedChanges}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                    hasUnsavedChanges && autoSaveStatus !== 'saving'
                      ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                  {autoSaveStatus === 'saving' ? 'Saving...' : 'Save Progress'}
                </button>

                {/* Next/Complete Button */}
                {isLastQuestion ? (
                  <div className="flex items-center space-x-3">
                    {/* Review All Responses Button */}
                    <button
                      type="button"
                      onClick={handleShowReview}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                      Review All Responses
                    </button>
                    
                    {/* Complete Assessment Button */}
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={!validateCurrentQuestion() || !isAssessmentComplete() || isLoading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                        validateCurrentQuestion() && isAssessmentComplete() && !isLoading
                          ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                      title={
                        !validateCurrentQuestion() 
                          ? 'Please answer the current question to continue'
                          : !isAssessmentComplete()
                          ? 'Please complete all required questions before submitting'
                          : 'Complete your assessment'
                      }
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                          Complete Assessment
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateCurrentQuestion()}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                      validateCurrentQuestion()
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                    title={!validateCurrentQuestion() ? 'Please answer the required question to continue' : 'Continue to next question'}
                  >
                    Next
                    <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </FixedQuestionContainer>
        </div>
      </div>

      {/* Response Review Modal */}
      <ResponseReviewModal
        isOpen={showReviewModal}
        assessment={assessment}
        responses={responses}
        rapidQuestions={rapidQuestions}
        onClose={handleCloseReview}
        onEditResponse={handleEditFromReview}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default AssessmentWizard;