/**
 * Response Review Modal - Utility Functions
 * Extracted from ResponseReviewModal.tsx for better code organization (Rule 3 compliance)
 */

import { 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  RAPIDQuestion,
  RAPIDCategory 
} from '../../../types/rapid-questionnaire';
import { QuestionSection } from '../../../types/assessment';

export interface CategoryReviewSummary {
  categoryId: string;
  categoryTitle: string;
  categoryDescription?: string;
  subcategories: SubcategoryReviewSummary[];
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  completionPercentage: number;
  isComplete: boolean;
}

export interface SubcategoryReviewSummary {
  subcategoryId: string;
  subcategoryTitle: string;
  questions: ReviewQuestion[];
}

export interface ReviewQuestion {
  id: string;
  number: string;
  text: string;
  description?: string;
  answer: any;
  required: boolean;
  isEmpty: boolean;
  type: string;
}

/**
 * Generate category review summary for RAPID structure
 */
export function generateRAPIDReviewSummary(
  rapidQuestions: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses
): CategoryReviewSummary[] {
  return rapidQuestions.categories.map(category => {
    const categoryResponses = responses[category.id] || {}
    
    // Process subcategories
    const subcategoryReviews: SubcategoryReviewSummary[] = category.subcategories.map(subcategory => {
      const reviewQuestions: ReviewQuestion[] = subcategory.questions.map(question => {
        const answer = categoryResponses[question.id]
        const isEmpty = answer === undefined || answer === null || answer === '' || 
                       (Array.isArray(answer) && answer.length === 0)
        
        return {
          id: question.id,
          number: question.number,
          text: question.text,
          description: question.description,
          answer: answer,
          required: question.required,
          isEmpty: isEmpty,
          type: question.type
        }
      })
      
      return {
        subcategoryId: subcategory.id,
        subcategoryTitle: subcategory.title,
        questions: reviewQuestions
      }
    })
    
    // Calculate category statistics
    const allQuestions = subcategoryReviews.flatMap(sub => sub.questions)
    const requiredQuestions = allQuestions.filter(q => q.required)
    const answeredQuestions = allQuestions.filter(q => !q.isEmpty)
    const answeredRequiredQuestions = requiredQuestions.filter(q => !q.isEmpty)
    
    const completionPercentage = requiredQuestions.length > 0 
      ? Math.round((answeredRequiredQuestions.length / requiredQuestions.length) * 100)
      : allQuestions.length > 0 
      ? Math.round((answeredQuestions.length / allQuestions.length) * 100)
      : 100
    
    const isComplete = requiredQuestions.length > 0 
      ? answeredRequiredQuestions.length === requiredQuestions.length
      : allQuestions.length === answeredQuestions.length
    
    return {
      categoryId: category.id,
      categoryTitle: category.title,
      categoryDescription: category.description,
      subcategories: subcategoryReviews,
      totalQuestions: allQuestions.length,
      answeredQuestions: answeredQuestions.length,
      requiredQuestions: requiredQuestions.length,
      answeredRequiredQuestions: answeredRequiredQuestions.length,
      completionPercentage,
      isComplete
    }
  })
}

/**
 * Generate category review summary for legacy QuestionSection[] structure
 */
export function generateLegacyReviewSummary(
  questions: QuestionSection[],
  responses: AssessmentResponses
): CategoryReviewSummary[] {
  return questions.map(section => {
    const sectionResponses = responses[section.id] || {};
    const sectionQuestions = section.questions.map(q => {
      const answer = sectionResponses[q.id];
      const isEmpty = answer === undefined || answer === null || answer === '' || 
                     (Array.isArray(answer) && answer.length === 0);
      return {
        id: q.id,
        number: q.number || q.id,
        text: q.text,
        description: q.description,
        answer: answer,
        required: q.required || false,
        isEmpty: isEmpty,
        type: q.type || 'text'
      };
    });
    
    const requiredQuestions = sectionQuestions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => !q.isEmpty);
    const completionPercentage = requiredQuestions.length > 0
      ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
      : sectionQuestions.length > 0
      ? Math.round((sectionQuestions.filter(q => !q.isEmpty).length / sectionQuestions.length) * 100)
      : 100;
    
    return {
      categoryId: section.id,
      categoryTitle: section.title,
      categoryDescription: section.description,
      subcategories: [{
        subcategoryId: section.id,
        subcategoryTitle: section.title,
        questions: sectionQuestions
      }],
      totalQuestions: sectionQuestions.length,
      answeredQuestions: sectionQuestions.filter(q => !q.isEmpty).length,
      requiredQuestions: requiredQuestions.length,
      answeredRequiredQuestions: answeredRequired.length,
      completionPercentage,
      isComplete: requiredQuestions.length > 0
        ? answeredRequired.length === requiredQuestions.length
        : sectionQuestions.length === sectionQuestions.filter(q => !q.isEmpty).length
    };
  });
}

/**
 * Calculate overall completion status
 */
export function calculateOverallCompletion(
  categoryReviewSummary: CategoryReviewSummary[]
) {
  const totalRequired = categoryReviewSummary.reduce((sum, category) => 
    sum + category.requiredQuestions, 0)
  const totalAnswered = categoryReviewSummary.reduce((sum, category) => 
    sum + category.answeredRequiredQuestions, 0)
  const totalQuestions = categoryReviewSummary.reduce((sum, category) => 
    sum + category.totalQuestions, 0)
  const totalAnsweredAll = categoryReviewSummary.reduce((sum, category) => 
    sum + category.answeredQuestions, 0)
  
  return {
    totalRequired,
    totalAnswered,
    totalQuestions,
    totalAnsweredAll,
    isComplete: totalRequired > 0 ? totalAnswered === totalRequired : totalAnsweredAll === totalQuestions,
    percentage: totalRequired > 0 ? Math.round((totalAnswered / totalRequired) * 100) : 
               totalQuestions > 0 ? Math.round((totalAnsweredAll / totalQuestions) * 100) : 100,
    completedCategories: categoryReviewSummary.filter(cat => cat.isComplete).length,
    totalCategories: categoryReviewSummary.length
  }
}

/**
 * Format answer for display
 */
export function formatAnswer(answer: any, questionType: string): string {
  if (answer === undefined || answer === null || answer === '') {
    return 'Not answered'
  }
  
  if (Array.isArray(answer)) {
    if (answer.length === 0) return 'Not answered'
    return answer.join(', ')
  }
  
  if (typeof answer === 'boolean') {
    return answer ? 'Yes' : 'No'
  }
  
  // Format based on question type
  if (questionType === 'number' && typeof answer === 'number') {
    return answer.toLocaleString()
  }
  
  return String(answer)
}
