/**
 * RAPID Assessment Wizard - Category Management Logic
 * Extracted from RAPIDAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Category selection
 * - Category completion status calculation
 * - Category navigation
 */

import { useCallback } from 'react';
import { 
  RAPIDQuestionnaireStructure,
  RAPIDCategory,
  CategoryCompletionStatus,
  CompletionStatus,
  AssessmentResponses
} from '../../../../types/rapid-questionnaire';

export interface UseRAPIDCategoryManagementReturn {
  getCurrentCategory: () => RAPIDCategory | undefined;
  calculateCategoryCompletion: (categoryId: string) => CategoryCompletionStatus;
  getAllCategoryStatuses: () => CategoryCompletionStatus[];
  handleCategorySelect: (categoryId: string) => void;
}

export function useRAPIDCategoryManagement(
  rapidQuestions: RAPIDQuestionnaireStructure,
  currentCategory: string,
  responses: AssessmentResponses,
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>,
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>,
  onCategoryChange: (categoryId: string) => void,
  hasUnsavedChanges: boolean,
  autoSave: () => Promise<void>
): UseRAPIDCategoryManagementReturn {
  // Get current category data
  const getCurrentCategory = useCallback((): RAPIDCategory | undefined => {
    return rapidQuestions.categories.find(cat => cat.id === currentCategory);
  }, [rapidQuestions.categories, currentCategory]);

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

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    // Auto-save before switching categories
    if (hasUnsavedChanges) {
      autoSave();
    }

    setCurrentCategory(categoryId);
    setCurrentQuestionIndex(0);
    onCategoryChange(categoryId);
  }, [hasUnsavedChanges, autoSave, setCurrentCategory, setCurrentQuestionIndex, onCategoryChange]);

  return {
    getCurrentCategory,
    calculateCategoryCompletion,
    getAllCategoryStatuses,
    handleCategorySelect
  };
}
