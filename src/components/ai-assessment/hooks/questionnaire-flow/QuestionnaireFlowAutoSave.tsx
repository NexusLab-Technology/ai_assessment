/**
 * Questionnaire Flow - Auto-save Logic
 * Extracted from QuestionnaireFlow.tsx for better code organization
 * 
 * Handles:
 * - Auto-save functionality
 * - localStorage backup
 * - Save status management
 */

import { useEffect } from 'react';
import { Assessment, AssessmentResponses } from '../../../../types/assessment';
import { useAutoSave } from '../../../../hooks/useAutoSave';
import { formatLocalDateTime } from '../../../../utils/time-helpers';

export interface UseQuestionnaireAutoSaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export function useQuestionnaireAutoSave(
  assessment: Assessment,
  responses: AssessmentResponses,
  currentStep: number,
  completedSteps: number[],
  isLoadingResponses: boolean,
  onSave?: (responses: AssessmentResponses, currentStep: number) => void
): UseQuestionnaireAutoSaveReturn {
  // Auto-save hook with API integration
  const autoSaveResult = useAutoSave({
    assessmentId: assessment.id,
    intervalMs: 30000, // 30 seconds
    enabled: true
  });
  
  const { status, saveNow } = autoSaveResult;

  // Backup to localStorage for offline support
  useEffect(() => {
    if (isLoadingResponses) return;
    
    try {
      const storageKey = `assessment_${assessment.id}_responses`;
      const dataToSave = {
        responses,
        completedSteps,
        lastSaved: formatLocalDateTime(new Date())
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to backup to localStorage:', error);
    }
  }, [responses, completedSteps, assessment.id, isLoadingResponses]);

  return {
    saveStatus: status.status === 'retrying' ? 'saving' : status.status as 'idle' | 'saving' | 'saved' | 'error',
    lastSaved: status.lastSaved,
    saveNow: async () => {
      const result = await saveNow();
      if (result.success && onSave) {
        onSave(responses, currentStep);
      }
    },
    hasUnsavedChanges: status.hasUnsavedChanges
  };
}
