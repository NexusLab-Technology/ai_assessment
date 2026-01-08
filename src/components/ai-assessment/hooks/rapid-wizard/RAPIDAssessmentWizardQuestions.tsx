/**
 * RAPID Assessment Wizard - Question Rendering Logic
 * Extracted from RAPIDAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Question retrieval
 * - Question validation
 * - Response handling
 */

import { useCallback } from 'react';
import { 
  RAPIDQuestionnaireStructure,
  RAPIDQuestion,
  RAPIDCategory,
  AssessmentResponses
} from '../../../../types/rapid-questionnaire';

export interface QuestionValidation {
  [questionId: string]: {
    isValid: boolean;
    error?: string;
  };
}

export interface UseRAPIDQuestionHandlingReturn {
  getCurrentQuestion: () => RAPIDQuestion | undefined;
  handleResponseChange: (questionId: string, value: any) => void;
  handleQuestionValidation: (questionId: string, isValid: boolean, error?: string) => void;
  validateCurrentQuestion: () => boolean;
}

export function useRAPIDQuestionHandling(
  rapidQuestions: RAPIDQuestionnaireStructure,
  currentCategory: string,
  currentQuestionIndex: number,
  responses: AssessmentResponses,
  questionValidation: QuestionValidation,
  getCurrentCategory: () => RAPIDCategory | undefined,
  onResponseChange: (categoryId: string, responses: any) => void,
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setQuestionValidation: React.Dispatch<React.SetStateAction<QuestionValidation>>
): UseRAPIDQuestionHandlingReturn {
  // Get current question
  const getCurrentQuestion = useCallback((): RAPIDQuestion | undefined => {
    const category = getCurrentCategory();
    if (!category) return undefined;
    
    // Flatten all questions from all subcategories
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    return allQuestions[currentQuestionIndex];
  }, [getCurrentCategory, currentQuestionIndex]);

  // Handle response changes
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    const categoryResponses = responses[currentCategory] || {};
    const updatedResponses = {
      ...categoryResponses,
      [questionId]: value
    };

    onResponseChange(currentCategory, updatedResponses);
    setHasUnsavedChanges(true);
  }, [currentCategory, responses, onResponseChange, setHasUnsavedChanges]);

  // Handle question validation
  const handleQuestionValidation = useCallback((questionId: string, isValid: boolean, error?: string) => {
    setQuestionValidation(prev => ({
      ...prev,
      [questionId]: { isValid, error }
    }));
  }, [setQuestionValidation]);

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

  return {
    getCurrentQuestion,
    handleResponseChange,
    handleQuestionValidation,
    validateCurrentQuestion
  };
}
