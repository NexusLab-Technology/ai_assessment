/**
 * Mock RAPID Questionnaire Data
 * Based on RAPID Assessment Questionnaires v3.0
 */

import { 
  RAPIDQuestionnaireStructure, 
  RAPIDCategory, 
  RAPIDSubcategory, 
  RAPIDQuestion,
  AssessmentType,
  RAPID_CATEGORIES 
} from '@/types/rapid-questionnaire';

// Use Case Discovery Questions (48 questions, 5 subcategories)
const useCaseDiscoveryQuestions: RAPIDQuestion[] = [
  // Business Context and Use Case Definition (12 questions)
  {
    id: 'q1-1-1',
    number: 'Q1.1',
    text: 'What business problem(s) does your GenAI application aim to solve? Can you describe the user and use case in terms of your business or operational needs?',
    description: 'Establishes the fundamental business purpose and identifies key user personas for the application.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-2',
    number: 'Q1.2',
    text: 'What is the current state of this use case (in progress, ideated, etc.)?',
    description: 'Determines where in the planning/development lifecycle the use case currently stands.',
    type: 'select',
    required: true,
    options: ['Ideated', 'In Progress', 'Proof of Concept', 'Pilot', 'Production'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-3',
    number: 'Q1.3',
    text: 'What is the urgency for this use case? Is there an impending event or target date to launch?',
    description: 'Identifies timeline constraints and helps prioritize implementation activities.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-4',
    number: 'Q1.4',
    text: 'Who is the business owner for this use case (name, title, and/or group)?',
    description: 'Establishes primary stakeholder and decision-maker for the project.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-5',
    number: 'Q1.5',
    text: 'What is the primary goal or success criteria of the use case?',
    description: 'Clarifies measurable outcomes that will define success for the implementation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-6',
    number: 'Q1.6',
    text: 'How does this use case align with your organization\'s strategic goals?',
    description: 'Connects the GenAI initiative to broader organizational priorities and value creation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-7',
    number: 'Q1.7',
    text: 'What specific pain points does this GenAI application aim to address?',
    description: 'Identifies current problems the application will solve, establishing baseline for ROI calculations.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-8',
    number: 'Q1.8',
    text: 'Are there existing workflows or processes that will be replaced or enhanced?',
    description: 'Maps the implementation to current operational activities for smoother transition planning.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-9',
    number: 'Q1.9',
    text: 'What is the expected business impact in the first 3/6/12 months?',
    description: 'Establishes timeline for expected value realization and helps set realistic expectations.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-10',
    number: 'Q1.10',
    text: 'Are there any immediate cost savings or revenue generation opportunities?',
    description: 'Identifies quick financial wins that could help justify the investment and build momentum.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-11',
    number: 'Q1.11',
    text: 'How will you measure ROI for this implementation?',
    description: 'Establishes key metrics for business value assessment.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-12',
    number: 'Q1.12',
    text: 'What is the scope of impact in terms of users or departments affected?',
    description: 'Helps quantify the reach and potential scale of the solution\'s impact across the organization',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },

  // Evaluation and Success Metrics (10 questions)
  {
    id: 'q1-2-1',
    number: 'Q1.1',
    text: 'How will you measure the success of this GenAI implementation?',
    description: 'Establishes key performance indicators for value assessment.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-2',
    number: 'Q1.2',
    text: 'What quantitative metrics are important (time saved, error reduction, etc.)?',
    description: 'Identifies specific measurable outcomes for ROI calculation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-3',
    number: 'Q1.3',
    text: 'What qualitative feedback will you gather from users?',
    description: 'Establishes user satisfaction measurement approach.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-4',
    number: 'Q1.4',
    text: 'How will you determine if the AI outputs meet quality expectations?',
    description: 'Identifies quality control mechanisms and standards.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-5',
    number: 'Q1.5',
    text: 'What are your primary concerns about implementing this GenAI application?',
    description: 'Identifies perceived risks and concerns for proactive addressing.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-6',
    number: 'Q1.6',
    text: 'What baseline metrics exist for current processes being replaced?',
    description: 'Provides comparison data for improvement measurement.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-7',
    number: 'Q1.7',
    text: 'Who will be responsible for ongoing evaluation of the application?',
    description: 'Identifies ownership of performance monitoring and optimization.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-8',
    number: 'Q1.8',
    text: 'What constitutes a minimum viable product for initial deployment?',
    description: 'Establishes scope requirements for initial release.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-9',
    number: 'Q1.9',
    text: 'How important is factuality and citation in model outputs?',
    description: 'Establishes accuracy requirements and hallucination tolerance.',
    type: 'select',
    required: true,
    options: ['Critical', 'Important', 'Moderate', 'Low Priority'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-10',
    number: 'Q1.10',
    text: 'Define clear success criteria (accuracy, latency, cost)',
    description: 'Set accuracy/performance targets, define latency requirements, establish cost parameters, document additional requirements',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  }
];

// Create subcategories for Use Case Discovery
const useCaseDiscoverySubcategories: RAPIDSubcategory[] = [
  {
    id: 'business-context',
    title: 'Business Context and Use Case Definition',
    questions: useCaseDiscoveryQuestions.filter(q => q.subcategory === 'business-context'),
    questionCount: 12
  },
  {
    id: 'evaluation-metrics',
    title: 'Evaluation and Success Metrics',
    questions: useCaseDiscoveryQuestions.filter(q => q.subcategory === 'evaluation-metrics'),
    questionCount: 10
  },
  {
    id: 'implementation-considerations',
    title: 'Implementation Considerations',
    questions: [], // Simplified for mock - would contain 11 questions
    questionCount: 11
  },
  {
    id: 'technical-requirements',
    title: 'Technical Requirements and Constraints',
    questions: [], // Simplified for mock - would contain 13 questions
    questionCount: 13
  },
  {
    id: 'use-case-prioritization',
    title: 'Use-case Prioritization',
    questions: [], // Simplified for mock - would contain 2 questions
    questionCount: 2
  }
];

// Create categories for Exploratory Path
const exploratoryCategories: RAPIDCategory[] = [
  {
    id: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    title: 'Use Case Discovery',
    description: 'Define business context, success metrics, and implementation requirements',
    subcategories: useCaseDiscoverySubcategories,
    totalQuestions: 48,
    completionPercentage: 0,
    status: 'not_started'
  },
  {
    id: RAPID_CATEGORIES.DATA_READINESS,
    title: 'Data Readiness Assessment',
    description: 'Evaluate data quality, format, and preparation requirements',
    subcategories: [], // Simplified for mock
    totalQuestions: 25,
    completionPercentage: 0,
    status: 'not_started'
  },
  {
    id: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    title: 'Compliance & Integration',
    description: 'Assess regulatory, security, and enterprise integration requirements',
    subcategories: [], // Simplified for mock
    totalQuestions: 27,
    completionPercentage: 0,
    status: 'not_started'
  },
  {
    id: RAPID_CATEGORIES.MODEL_EVALUATION,
    title: 'Model Evaluation',
    description: 'Guided process for model selection and evaluation',
    subcategories: [], // Simplified for mock
    totalQuestions: 0, // Guided process
    completionPercentage: 0,
    status: 'not_started'
  },
  {
    id: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    title: 'Business Value & ROI',
    description: 'Quantify business impact and return on investment',
    subcategories: [], // Simplified for mock
    totalQuestions: 10,
    completionPercentage: 0,
    status: 'not_started'
  }
];

// Create categories for Migration Path (includes Current System Assessment)
const migrationCategories: RAPIDCategory[] = [
  ...exploratoryCategories,
  {
    id: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    title: 'Current System Assessment',
    description: 'Evaluate existing GenAI implementation for migration planning',
    subcategories: [], // Simplified for mock
    totalQuestions: 52,
    completionPercentage: 0,
    status: 'not_started'
  }
];

// Export mock questionnaire structures
export const mockExploratoryQuestionnaire: RAPIDQuestionnaireStructure = {
  version: '3.0',
  assessmentType: 'EXPLORATORY',
  totalQuestions: 110,
  categories: exploratoryCategories,
  lastUpdated: new Date('2025-01-06')
};

export const mockMigrationQuestionnaire: RAPIDQuestionnaireStructure = {
  version: '3.0',
  assessmentType: 'MIGRATION',
  totalQuestions: 162,
  categories: migrationCategories,
  lastUpdated: new Date('2025-01-06')
};

// Helper function to get questionnaire by type
export function getRAPIDQuestionnaire(type: AssessmentType): RAPIDQuestionnaireStructure {
  return type === 'EXPLORATORY' ? mockExploratoryQuestionnaire : mockMigrationQuestionnaire;
}

// Mock companies for development
export const mockCompanies = [
  {
    id: 'company-1',
    name: 'Tech Innovations Inc.',
    description: 'Leading technology company focused on AI solutions',
    createdAt: new Date('2024-01-15'),
    assessmentCount: 3
  },
  {
    id: 'company-2',
    name: 'Healthcare Solutions Ltd.',
    description: 'Healthcare technology provider',
    createdAt: new Date('2024-02-20'),
    assessmentCount: 1
  },
  {
    id: 'company-3',
    name: 'Financial Services Corp.',
    description: 'Digital banking and financial services',
    createdAt: new Date('2024-03-10'),
    assessmentCount: 2
  }
];

// Mock assessments for development
export const mockAssessments = [
  {
    id: 'assessment-1',
    name: 'Customer Service Chatbot',
    companyId: 'company-1',
    userId: 'user-1',
    type: 'EXPLORATORY' as AssessmentType,
    status: 'IN_PROGRESS' as const,
    currentCategory: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    totalCategories: 5,
    responses: {},
    categoryStatuses: {},
    rapidQuestionnaireVersion: '3.0',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: 'assessment-2',
    name: 'Document Analysis System',
    companyId: 'company-1',
    userId: 'user-1',
    type: 'MIGRATION' as AssessmentType,
    status: 'DRAFT' as const,
    currentCategory: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    totalCategories: 6,
    responses: {},
    categoryStatuses: {},
    rapidQuestionnaireVersion: '3.0',
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-10')
  }
];