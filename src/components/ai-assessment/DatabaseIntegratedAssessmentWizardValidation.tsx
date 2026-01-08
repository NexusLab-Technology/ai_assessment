/**
 * Database Integrated Assessment Wizard - Validation Logic
 * Extracted from DatabaseIntegratedAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Question validation
 * - Category completion status
 * - Assessment completion validation
 */

import React, { useCallback, useState } from 'react';
import { 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  CategoryCompletionStatus,
  CompletionStatus
} from '../../types/rapid-questionnaire';

export interface QuestionValidation {
  [questionId: string]: {
    isValid: boolean;
    error?: string;
  };
}

export interface UseAssessmentWizardValidationReturn {
  validationErrors: QuestionValidation;
  setValidationErrors: React.Dispatch<React.SetStateAction<QuestionValidation>>;
  validateCurrentCategory: () => boolean;
  getCategoryCompletionStatus: (categoryId: string) => CompletionStatus;
  getCompletionStatuses: () => CategoryCompletionStatus[];
  validateAllCategories: () => boolean;
}

export function useAssessmentWizardValidation(
  questionnaire: RAPIDQuestionnaireStructure | null,
  currentCategory: string,
  responses: AssessmentResponses,
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>
): UseAssessmentWizardValidationReturn {
  const [validationErrors, setValidationErrors] = useState<QuestionValidation>({});

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

  // Validate all categories
  const validateAllCategories = useCallback((): boolean => {
    if (!questionnaire) return false;

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
    return allValid;
  }, [questionnaire, currentCategory, validateCurrentCategory, setCurrentCategory]);

  return {
    validationErrors,
    setValidationErrors,
    validateCurrentCategory,
    getCategoryCompletionStatus,
    getCompletionStatuses,
    validateAllCategories
  };
}
