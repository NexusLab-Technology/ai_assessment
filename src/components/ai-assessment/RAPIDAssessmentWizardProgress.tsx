/**
 * RAPID Assessment Wizard - Progress Tracking Logic
 * Extracted from RAPIDAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Progress calculation
 * - Completion status checking
 * - Navigation state management
 */

import { useCallback } from 'react';
import { RAPIDQuestionnaireStructure } from '../../types/rapid-questionnaire';

export interface UseRAPIDProgressTrackingReturn {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isAssessmentComplete: () => boolean;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
}

export function useRAPIDProgressTracking(
  rapidQuestions: RAPIDQuestionnaireStructure,
  currentCategory: string,
  currentQuestionIndex: number,
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>,
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>,
  getCurrentCategory: () => any,
  validateCurrentQuestion: () => boolean,
  handleCategorySelect: (categoryId: string) => void,
  hasUnsavedChanges: boolean,
  autoSave: () => Promise<void>,
  getAllCategoryStatuses: () => any[],
  onCategoryChange: (categoryId: string) => void
): UseRAPIDProgressTrackingReturn {
  // Check if assessment is complete
  const isAssessmentComplete = useCallback((): boolean => {
    const statuses = getAllCategoryStatuses();
    return statuses.every(status => status.status === 'completed');
  }, [getAllCategoryStatuses]);

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
  }, [validateCurrentQuestion, getCurrentCategory, currentQuestionIndex, rapidQuestions.categories, currentCategory, handleCategorySelect, hasUnsavedChanges, autoSave, setCurrentQuestionIndex]);

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
  }, [currentQuestionIndex, rapidQuestions.categories, currentCategory, onCategoryChange, setCurrentCategory, setCurrentQuestionIndex]);

  const isFirstQuestion = rapidQuestions.categories[0]?.id === currentCategory && currentQuestionIndex === 0;
  const isLastQuestion = (() => {
    const lastCategory = rapidQuestions.categories[rapidQuestions.categories.length - 1];
    if (currentCategory !== lastCategory?.id) return false;
    
    const allQuestions = lastCategory.subcategories.flatMap(sub => sub.questions);
    return currentQuestionIndex === allQuestions.length - 1;
  })();

  return {
    isFirstQuestion,
    isLastQuestion,
    isAssessmentComplete,
    handleNext,
    handlePrevious
  };
}
