/**
 * RAPID Questionnaire Utility Functions
 * Helper functions for managing RAPID questionnaire data and calculations
 */

import { 
  RAPIDQuestionnaireStructure, 
  RAPIDCategory, 
  AssessmentResponses, 
  CategoryCompletionStatus,
  CompletionStatus,
  AssessmentType,
  RAPID_CATEGORIES 
} from '@/types/rapid-questionnaire';

/**
 * Calculate completion percentage for a category based on responses
 */
export function calculateCategoryCompletion(
  category: RAPIDCategory,
  responses: AssessmentResponses
): number {
  const categoryResponses = responses[category.id] || {};
  const totalQuestions = category.totalQuestions;
  
  if (totalQuestions === 0) return 0;
  
  // Count questions with non-empty responses
  const answeredQuestions = Object.values(categoryResponses).filter(response => {
    if (response === null || response === undefined) return false;
    if (typeof response === 'string') return response.trim().length > 0;
    if (Array.isArray(response)) return response.length > 0;
    return true;
  }).length;
  
  return Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Determine completion status based on percentage
 */
export function getCompletionStatus(percentage: number): CompletionStatus {
  if (percentage === 0) return 'not_started';
  if (percentage === 100) return 'completed';
  return 'partial';
}

/**
 * Calculate overall assessment completion
 */
export function calculateOverallCompletion(
  questionnaire: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses
): {
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  categoryStatuses: CategoryCompletionStatus[];
} {
  let totalQuestions = 0;
  let totalAnswered = 0;
  const categoryStatuses: CategoryCompletionStatus[] = [];
  
  questionnaire.categories.forEach(category => {
    const categoryCompletion = calculateCategoryCompletion(category, responses);
    const categoryAnswered = Math.round((categoryCompletion / 100) * category.totalQuestions);
    
    totalQuestions += category.totalQuestions;
    totalAnswered += categoryAnswered;
    
    categoryStatuses.push({
      categoryId: category.id,
      status: getCompletionStatus(categoryCompletion),
      completionPercentage: categoryCompletion,
      lastModified: new Date()
    });
  });
  
  const completionPercentage = totalQuestions > 0 
    ? Math.round((totalAnswered / totalQuestions) * 100) 
    : 0;
  
  return {
    totalQuestions,
    answeredQuestions: totalAnswered,
    completionPercentage,
    categoryStatuses
  };
}

/**
 * Check if assessment is ready for completion
 */
export function isAssessmentComplete(
  questionnaire: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses
): boolean {
  // Check if all required questions are answered
  for (const category of questionnaire.categories) {
    for (const subcategory of category.subcategories) {
      for (const question of subcategory.questions) {
        if (question.required) {
          const response = responses[category.id]?.[question.id];
          if (!response || (typeof response === 'string' && response.trim().length === 0)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

/**
 * Get next incomplete category
 */
export function getNextIncompleteCategory(
  questionnaire: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses
): string | null {
  for (const category of questionnaire.categories) {
    const completion = calculateCategoryCompletion(category, responses);
    if (completion < 100) {
      return category.id;
    }
  }
  return null;
}

/**
 * Validate response for a specific question
 */
export function validateQuestionResponse(
  questionId: string,
  response: any,
  questionnaire: RAPIDQuestionnaireStructure
): { isValid: boolean; error?: string } {
  // Find the question
  let question = null;
  for (const category of questionnaire.categories) {
    for (const subcategory of category.subcategories) {
      const foundQuestion = subcategory.questions.find(q => q.id === questionId);
      if (foundQuestion) {
        question = foundQuestion;
        break;
      }
    }
    if (question) break;
  }
  
  if (!question) {
    return { isValid: false, error: 'Question not found' };
  }
  
  // Check if required question is empty
  if (question.required && (!response || (typeof response === 'string' && response.trim().length === 0))) {
    return { isValid: false, error: 'This question is required' };
  }
  
  // Type-specific validation
  switch (question.type) {
    case 'select':
    case 'radio':
      if (response && question.options && !question.options.includes(response)) {
        return { isValid: false, error: 'Invalid option selected' };
      }
      break;
      
    case 'checkbox':
      if (response && Array.isArray(response)) {
        const invalidOptions = response.filter(option => 
          question.options && !question.options.includes(option)
        );
        if (invalidOptions.length > 0) {
          return { isValid: false, error: 'Invalid options selected' };
        }
      }
      break;
      
    case 'number':
      if (response && isNaN(Number(response))) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * Get category display order for different assessment types
 */
export function getCategoryDisplayOrder(assessmentType: AssessmentType): string[] {
  const baseOrder = [
    RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    RAPID_CATEGORIES.DATA_READINESS,
    RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    RAPID_CATEGORIES.MODEL_EVALUATION,
    RAPID_CATEGORIES.BUSINESS_VALUE_ROI
  ];
  
  if (assessmentType === 'MIGRATION') {
    // Insert Current System Assessment after Use Case Discovery
    return [
      RAPID_CATEGORIES.USE_CASE_DISCOVERY,
      RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
      ...baseOrder.slice(1)
    ];
  }
  
  return baseOrder;
}

/**
 * Format category title for display
 */
export function formatCategoryTitle(categoryId: string): string {
  const titles: Record<string, string> = {
    [RAPID_CATEGORIES.USE_CASE_DISCOVERY]: 'Use Case Discovery',
    [RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT]: 'Current System Assessment',
    [RAPID_CATEGORIES.DATA_READINESS]: 'Data Readiness',
    [RAPID_CATEGORIES.COMPLIANCE_INTEGRATION]: 'Compliance & Integration',
    [RAPID_CATEGORIES.MODEL_EVALUATION]: 'Model Evaluation',
    [RAPID_CATEGORIES.BUSINESS_VALUE_ROI]: 'Business Value & ROI'
  };
  
  return titles[categoryId] || categoryId;
}

/**
 * Generate assessment summary for reporting
 */
export function generateAssessmentSummary(
  questionnaire: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses
) {
  const completion = calculateOverallCompletion(questionnaire, responses);
  
  return {
    assessmentType: questionnaire.assessmentType,
    version: questionnaire.version,
    totalCategories: questionnaire.categories.length,
    totalQuestions: completion.totalQuestions,
    answeredQuestions: completion.answeredQuestions,
    completionPercentage: completion.completionPercentage,
    isComplete: isAssessmentComplete(questionnaire, responses),
    categoryBreakdown: completion.categoryStatuses.map(status => ({
      categoryId: status.categoryId,
      categoryTitle: formatCategoryTitle(status.categoryId),
      status: status.status,
      completionPercentage: status.completionPercentage
    })),
    lastUpdated: new Date()
  };
}