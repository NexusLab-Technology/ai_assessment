/**
 * Database Integrated Progress Tracker - Progress Calculation Logic
 * Extracted from DatabaseIntegratedProgressTracker.tsx for better code organization
 * 
 * Handles:
 * - Category progress calculation
 * - Overall progress calculation
 * - Progress data loading
 */

import { useCallback } from 'react';
import { 
  RAPIDCategory, 
  CategoryCompletionStatus,
  Assessment,
  AssessmentResponses
} from '../../types/rapid-questionnaire';

export interface ProgressSummary {
  totalCategories: number;
  completedCategories: number;
  inProgressCategories: number;
  notStartedCategories: number;
  overallPercentage: number;
  categoryStatuses: CategoryCompletionStatus[];
}

export interface CategoryProgress {
  categoryId: string;
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  completionPercentage: number;
  status: 'not_started' | 'partial' | 'completed';
}

export interface UseProgressCalculationReturn {
  calculateCategoryProgress: (categoryId: string, responses: AssessmentResponses) => CategoryProgress;
  loadProgressData: () => Promise<ProgressSummary>;
}

export function useProgressCalculation(
  assessment: Assessment,
  categories: RAPIDCategory[]
): UseProgressCalculationReturn {
  // Calculate category progress from responses
  const calculateCategoryProgress = useCallback((
    categoryId: string, 
    responses: AssessmentResponses
  ): CategoryProgress => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return {
        categoryId,
        totalQuestions: 0,
        answeredQuestions: 0,
        requiredQuestions: 0,
        answeredRequiredQuestions: 0,
        completionPercentage: 0,
        status: 'not_started'
      };
    }

    const categoryResponses = responses[categoryId] || {};
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    
    const answeredQuestions = allQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== undefined && response !== null && response !== '';
    });

    const answeredRequiredQuestions = requiredQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== undefined && response !== null && response !== '';
    });

    const completionPercentage = allQuestions.length > 0 ? 
      Math.round((answeredQuestions.length / allQuestions.length) * 100) : 0;

    let status: 'not_started' | 'partial' | 'completed' = 'not_started';
    
    if (answeredRequiredQuestions.length === requiredQuestions.length && requiredQuestions.length > 0) {
      status = 'completed';
    } else if (answeredQuestions.length > 0) {
      status = 'partial';
    }

    return {
      categoryId,
      totalQuestions: allQuestions.length,
      answeredQuestions: answeredQuestions.length,
      requiredQuestions: requiredQuestions.length,
      answeredRequiredQuestions: answeredRequiredQuestions.length,
      completionPercentage,
      status
    };
  }, [categories]);

  // Load progress data from assessment
  const loadProgressData = useCallback(async (): Promise<ProgressSummary> => {
    // Calculate progress for each category
    const categoryProgresses = categories.map(category => 
      calculateCategoryProgress(category.id, assessment.responses)
    );

    // Convert to CategoryCompletionStatus format
    const categoryStatuses: CategoryCompletionStatus[] = categoryProgresses.map(progress => ({
      categoryId: progress.categoryId,
      status: progress.status,
      completionPercentage: progress.completionPercentage,
      lastModified: new Date()
    }));

    // Calculate overall progress
    const totalCategories = categories.length;
    const completedCategories = categoryProgresses.filter(p => p.status === 'completed').length;
    const inProgressCategories = categoryProgresses.filter(p => p.status === 'partial').length;
    const notStartedCategories = totalCategories - completedCategories - inProgressCategories;
    
    const overallPercentage = totalCategories > 0 ? 
      Math.round(((completedCategories + (inProgressCategories * 0.5)) / totalCategories) * 100) : 0;

    const progressSummary: ProgressSummary = {
      totalCategories,
      completedCategories,
      inProgressCategories,
      notStartedCategories,
      overallPercentage,
      categoryStatuses
    };

    return progressSummary;
  }, [assessment.responses, categories, calculateCategoryProgress]);

  return {
    calculateCategoryProgress,
    loadProgressData
  };
}
