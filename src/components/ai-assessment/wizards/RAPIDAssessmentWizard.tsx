/**
 * AssessmentWizard Component
 * Enhanced wizard with category-based navigation for RAPID questionnaires
 * Refactored to use extracted hooks for better code organization (Rule 3 compliance)
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
  RAPIDQuestionnaireStructure
} from '../../../types/rapid-questionnaire';
import CategoryNavigationSidebar from '../navigation/CategoryNavigationSidebar';
import FixedQuestionContainer from '../questions/FixedQuestionContainer';
import QuestionStep from '../questions/QuestionStep';
import ResponseReviewModal from '../modals/ResponseReviewModal';
import { useRAPIDCategoryManagement } from '../hooks/rapid-wizard/RAPIDAssessmentWizardCategories';
import { useRAPIDQuestionHandling } from '../hooks/rapid-wizard/RAPIDAssessmentWizardQuestions';
import { useRAPIDProgressTracking } from '../hooks/rapid-wizard/RAPIDAssessmentWizardProgress';

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

  // Use extracted hooks
  const {
    getCurrentCategory,
    getAllCategoryStatuses,
    handleCategorySelect
  } = useRAPIDCategoryManagement(
    rapidQuestions,
    currentCategory,
    responses,
    setCurrentCategory,
    setCurrentQuestionIndex,
    onCategoryChange,
    hasUnsavedChanges,
    autoSave
  );

  const {
    getCurrentQuestion,
    handleResponseChange,
    handleQuestionValidation,
    validateCurrentQuestion
  } = useRAPIDQuestionHandling(
    rapidQuestions,
    currentCategory,
    currentQuestionIndex,
    responses,
    questionValidation,
    getCurrentCategory,
    onResponseChange,
    setHasUnsavedChanges,
    setQuestionValidation
  );

  const {
    isFirstQuestion,
    isLastQuestion,
    isAssessmentComplete,
    handleNext,
    handlePrevious
  } = useRAPIDProgressTracking(
    rapidQuestions,
    currentCategory,
    currentQuestionIndex,
    setCurrentCategory,
    setCurrentQuestionIndex,
    getCurrentCategory,
    validateCurrentQuestion,
    handleCategorySelect,
    hasUnsavedChanges,
    autoSave,
    getAllCategoryStatuses,
    onCategoryChange
  );

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
