/**
 * RAPID Questionnaire Type Definitions
 * Based on RAPID Assessment Questionnaires v3.0
 */

export type AssessmentType = 'EXPLORATORY' | 'MIGRATION';

export type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';

export type CompletionStatus = 'not_started' | 'partial' | 'completed';

export interface RAPIDQuestion {
  id: string;
  number: string;
  text: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  category: string;
  subcategory: string;
}

export interface RAPIDSubcategory {
  id: string;
  title: string;
  questions: RAPIDQuestion[];
  questionCount: number;
}

export interface RAPIDCategory {
  id: string;
  title: string;
  description?: string;
  subcategories: RAPIDSubcategory[];
  totalQuestions: number;
  completionPercentage: number;
  status: CompletionStatus;
}

export interface RAPIDQuestionnaireStructure {
  version: string;
  assessmentType: AssessmentType;
  totalQuestions: number;
  categories: RAPIDCategory[];
  lastUpdated: Date;
}

export interface AssessmentResponses {
  [categoryId: string]: {
    [questionId: string]: any;
  };
}

export interface CategoryCompletionStatus {
  categoryId: string;
  status: CompletionStatus;
  completionPercentage: number;
  lastModified: Date;
}

export interface Assessment {
  id: string;
  name: string;
  companyId: string;
  type: AssessmentType;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  currentCategory: string;
  currentSubcategory?: string;
  totalCategories: number;
  responses: AssessmentResponses;
  categoryStatuses: {
    [categoryId: string]: CategoryCompletionStatus;
  };
  rapidQuestionnaireVersion: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  assessmentCount: number;
}

// RAPID Category IDs for consistent referencing
export const RAPID_CATEGORIES = {
  USE_CASE_DISCOVERY: 'use-case-discovery',
  CURRENT_SYSTEM_ASSESSMENT: 'current-system-assessment', // Migration only
  DATA_READINESS: 'data-readiness',
  COMPLIANCE_INTEGRATION: 'compliance-integration',
  MODEL_EVALUATION: 'model-evaluation',
  BUSINESS_VALUE_ROI: 'business-value-roi'
} as const;

export type RAPIDCategoryId = typeof RAPID_CATEGORIES[keyof typeof RAPID_CATEGORIES];