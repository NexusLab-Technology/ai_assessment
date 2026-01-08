/**
 * Database Integrated Assessment Wizard - Loader Logic
 * Extracted from DatabaseIntegratedAssessmentWizard.tsx for better code organization
 * 
 * Handles:
 * - Questionnaire loading
 * - Auto-initialization
 * - Loading state management
 */

import { useState, useCallback } from 'react';
import { RAPIDQuestionnaireStructure, AssessmentType } from '../../../../types/rapid-questionnaire';

export interface UseQuestionnaireLoaderReturn {
  questionnaire: RAPIDQuestionnaireStructure | null;
  questionnaireLoading: boolean;
  questionnaireError: string | null;
  isInitializing: boolean;
  handleQuestionsLoaded: (loadedQuestionnaire: RAPIDQuestionnaireStructure) => void;
  handleQuestionnaireError: (error: string) => Promise<void>;
  handleAutoInitialization: () => Promise<boolean>;
}

export function useQuestionnaireLoader(
  assessmentType: AssessmentType,
  enableAutoInit: boolean,
  onCategoryChange?: (categoryId: string) => void,
  assessmentCurrentCategory?: string,
  onError?: (error: string) => void
): UseQuestionnaireLoaderReturn {
  const [questionnaire, setQuestionnaire] = useState<RAPIDQuestionnaireStructure | null>(null);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(true);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-initialize database if questionnaire loading fails
  const handleAutoInitialization = useCallback(async (): Promise<boolean> => {
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

    // Category initialization will be handled by the state hook
  }, [assessmentCurrentCategory, onCategoryChange]);

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
        // The RAPIDQuestionnaireLoader will automatically retry
      }
    }
  }, [onError, enableAutoInit, isInitializing, handleAutoInitialization]);

  return {
    questionnaire,
    questionnaireLoading,
    questionnaireError,
    isInitializing,
    handleQuestionsLoaded,
    handleQuestionnaireError,
    handleAutoInitialization
  };
}
