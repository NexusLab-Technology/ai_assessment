/**
 * Questionnaire Flow - Response Handling Logic
 * Extracted from QuestionnaireFlow.tsx for better code organization
 * 
 * Handles:
 * - Response state management
 * - Response validation
 * - Response loading from server/localStorage
 */

import { useState, useEffect } from 'react';
import { Assessment, QuestionSection, AssessmentResponses } from '../../types/assessment';
import { assessmentApi } from '../../lib/api-client';

export interface StepValidation {
  [questionId: string]: {
    isValid: boolean;
    error?: string;
  };
}

export interface UseQuestionnaireResponsesReturn {
  responses: AssessmentResponses;
  setResponses: React.Dispatch<React.SetStateAction<AssessmentResponses>>;
  stepValidation: StepValidation;
  setStepValidation: React.Dispatch<React.SetStateAction<StepValidation>>;
  completedSteps: number[];
  setCompletedSteps: React.Dispatch<React.SetStateAction<number[]>>;
  isLoadingResponses: boolean;
  handleResponseChange: (questionId: string, value: any) => void;
  handleQuestionValidation: (questionId: string, isValid: boolean, error?: string) => void;
  validateCurrentQuestion: () => boolean;
  validateAllRequiredQuestions: () => boolean;
}

export function useQuestionnaireResponses(
  assessment: Assessment,
  sections: QuestionSection[],
  currentStep: number,
  currentQuestionIndex: number
): UseQuestionnaireResponsesReturn {
  const [responses, setResponses] = useState<AssessmentResponses>({});
  const [stepValidation, setStepValidation] = useState<StepValidation>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);

  // Load responses from server on mount
  useEffect(() => {
    const loadResponses = async () => {
      try {
        setIsLoadingResponses(true);
        
        // Clear previous state first
        setResponses({});
        setCompletedSteps([]);
        setStepValidation({});
        
        const data = await assessmentApi.getResponses(assessment.id);
        
        setResponses(data.responses || {});
        
        // Determine completed steps based on responses
        const completed: number[] = [];
        Object.keys(data.responses || {}).forEach(stepId => {
          const stepNumber = parseInt(stepId.replace('step-', ''));
          if (!isNaN(stepNumber)) {
            completed.push(stepNumber);
          }
        });
        setCompletedSteps(completed);
        
      } catch (error) {
        console.error('Failed to load assessment responses:', error);
        // Clear state on error
        setResponses({});
        setCompletedSteps([]);
        setStepValidation({});
        
        // Only fallback to localStorage if this is not a newly created assessment
        const assessmentAge = Date.now() - new Date(assessment.createdAt).getTime();
        const isNewAssessment = assessmentAge < 5 * 60 * 1000; // 5 minutes
        
        if (!isNewAssessment) {
          try {
            const storageKey = `assessment_${assessment.id}_responses`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const { responses: savedResponses, completedSteps: savedCompleted } = JSON.parse(savedData);
              setResponses(savedResponses || {});
              setCompletedSteps(savedCompleted || []);
            }
          } catch (localError) {
            console.error('Failed to load from localStorage:', localError);
          }
        }
      } finally {
        setIsLoadingResponses(false);
      }
    };

    loadResponses();
  }, [assessment.id, assessment.createdAt]);

  // Cleanup function to clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      try {
        const storageKey = `assessment_${assessment.id}_responses`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear localStorage on cleanup:', error);
      }
    };
  }, [assessment.id]);

  const getCurrentSection = () => {
    return sections.find(section => section.stepNumber === currentStep);
  };

  const handleResponseChange = (questionId: string, value: any) => {
    const currentSection = getCurrentSection();
    if (!currentSection) return;

    setResponses(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [questionId]: value
      }
    }));
  };

  const handleQuestionValidation = (questionId: string, isValid: boolean, error?: string) => {
    setStepValidation(prev => ({
      ...prev,
      [questionId]: { isValid, error }
    }));
  };

  const validateCurrentQuestion = (): boolean => {
    const currentSection = getCurrentSection();
    if (!currentSection || !currentSection.questions[currentQuestionIndex]) {
      return false;
    }

    const currentQuestion = currentSection.questions[currentQuestionIndex];
    const sectionResponses = responses[currentSection.id] || {};
    const response = sectionResponses[currentQuestion.id];
    const validation = stepValidation[currentQuestion.id];

    // If question is not required and no response, it's valid
    if (!currentQuestion.required && (response === null || response === undefined || response === '')) {
      return true;
    }

    // Check if required question is answered
    if (currentQuestion.required) {
      if (response === null || response === undefined || response === '') {
        return false;
      }
      // For array responses (multiselect, checkbox)
      if (Array.isArray(response) && response.length === 0) {
        return false;
      }
    }

    // Check if validation failed (only if validation exists)
    if (validation && !validation.isValid) {
      return false;
    }

    return true;
  };

  const validateAllRequiredQuestions = (): boolean => {
    // Check all required questions across all sections are answered
    for (const section of sections) {
      const sectionResponses = responses[section.id] || {};
      
      for (const question of section.questions) {
        if (question.required) {
          const response = sectionResponses[question.id];
          
          if (response === null || response === undefined || response === '') {
            return false;
          }
          
          // For array responses (multiselect, checkbox)
          if (Array.isArray(response) && response.length === 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  return {
    responses,
    setResponses,
    stepValidation,
    setStepValidation,
    completedSteps,
    setCompletedSteps,
    isLoadingResponses,
    handleResponseChange,
    handleQuestionValidation,
    validateCurrentQuestion,
    validateAllRequiredQuestions
  };
}
