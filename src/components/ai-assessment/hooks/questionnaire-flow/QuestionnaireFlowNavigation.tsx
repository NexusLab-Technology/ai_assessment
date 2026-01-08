/**
 * Questionnaire Flow - Navigation Logic
 * Extracted from QuestionnaireFlow.tsx for better code organization
 * 
 * Handles:
 * - Step navigation (next/previous)
 * - Question navigation within sections
 * - Completion handling
 */

import { QuestionSection } from '../../../../types/assessment';

export interface UseQuestionnaireNavigationReturn {
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export function useQuestionnaireNavigation(
  sections: QuestionSection[],
  currentStep: number,
  currentQuestionIndex: number,
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>,
  setCompletedSteps: React.Dispatch<React.SetStateAction<number[]>>,
  completedSteps: number[],
  validateCurrentQuestion: () => boolean,
  saveNow: () => Promise<void>
): UseQuestionnaireNavigationReturn {
  const getCurrentSection = () => {
    return sections.find(section => section.stepNumber === currentStep);
  };

  const handleNext = async () => {
    const currentSection = getCurrentSection();
    if (!currentSection) return;

    if (!validateCurrentQuestion()) {
      return;
    }

    // Auto save current response before moving to next question
    try {
      await saveNow();
    } catch (error) {
      console.error('Failed to auto-save:', error);
      // Continue navigation even if save fails
    }

    // Check if this is the last question in current section
    const isLastQuestionInSection = currentQuestionIndex === currentSection.questions.length - 1;

    if (isLastQuestionInSection) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }

      // Move to next section
      if (currentStep < sections.length) {
        setCurrentStep(currentStep + 1);
        setCurrentQuestionIndex(0); // Reset to first question of next section
      }
    } else {
      // Move to next question in same section
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Go to previous question in same section
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentStep > 1) {
      // Go to previous section, last question
      const prevStep = currentStep - 1;
      const prevSection = sections.find(s => s.stepNumber === prevStep);
      if (prevSection) {
        setCurrentStep(prevStep);
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  };

  const currentSection = getCurrentSection();
  const isFirstQuestion = currentStep === 1 && currentQuestionIndex === 0;
  const isLastQuestion = currentStep === sections.length && currentSection !== null && currentSection !== undefined && currentQuestionIndex === currentSection.questions.length - 1;

  return {
    handleNext,
    handlePrevious,
    isFirstQuestion,
    isLastQuestion
  };
}
