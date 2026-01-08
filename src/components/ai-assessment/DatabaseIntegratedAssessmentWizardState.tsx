/**
 * Database Integrated Assessment Wizard - State Management Logic
 * Extracted from DatabaseIntegratedAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Response state management
 * - Category/subcategory navigation
 * - Auto-save status
 */

import { useState, useCallback } from 'react';
import { AssessmentResponses, RAPIDQuestionnaireStructure } from '../../types/rapid-questionnaire';

export interface UseAssessmentWizardStateReturn {
  responses: AssessmentResponses;
  currentCategory: string;
  currentSubcategory: string;
  showReviewModal: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setResponses: React.Dispatch<React.SetStateAction<AssessmentResponses>>;
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>;
  setCurrentSubcategory: React.Dispatch<React.SetStateAction<string>>;
  setShowReviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<'idle' | 'saving' | 'saved' | 'error'>>;
  handleCategorySelect: (categoryId: string) => void;
  handleSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
  handleResponseChange: (questionId: string, value: any) => void;
}

export function useAssessmentWizardState(
  initialResponses: AssessmentResponses,
  questionnaire: RAPIDQuestionnaireStructure | null,
  onResponseChange?: (categoryId: string, responses: any) => void,
  onCategoryChange?: (categoryId: string) => void
): UseAssessmentWizardStateReturn {
  const [responses, setResponses] = useState<AssessmentResponses>(initialResponses);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [currentSubcategory, setCurrentSubcategory] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setCurrentCategory(categoryId);
    // Auto-select first subcategory when category changes
    const category = questionnaire?.categories.find(cat => cat.id === categoryId);
    if (category && category.subcategories.length > 0) {
      setCurrentSubcategory(category.subcategories[0].id);
    }
    onCategoryChange?.(categoryId);
    // Clear validation errors when switching categories (handled by validation hook)
  }, [questionnaire, onCategoryChange]);

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((categoryId: string, subcategoryId: string) => {
    setCurrentCategory(categoryId);
    setCurrentSubcategory(subcategoryId);
    onCategoryChange?.(categoryId);
  }, [onCategoryChange]);

  // Handle response changes
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    setResponses(prevResponses => {
      const updatedResponses = {
        ...prevResponses,
        [currentCategory]: {
          ...prevResponses[currentCategory],
          [questionId]: value
        }
      };

      onResponseChange?.(currentCategory, updatedResponses[currentCategory]);

      // Auto-save (debounced)
      setAutoSaveStatus('saving');
      // In a real implementation, you would debounce this
      setTimeout(() => setAutoSaveStatus('saved'), 1000);

      return updatedResponses;
    });
  }, [currentCategory, onResponseChange]);

  return {
    responses,
    currentCategory,
    currentSubcategory,
    showReviewModal,
    autoSaveStatus,
    setResponses,
    setCurrentCategory,
    setCurrentSubcategory,
    setShowReviewModal,
    setAutoSaveStatus,
    handleCategorySelect,
    handleSubcategorySelect,
    handleResponseChange
  };
}
