import { ObjectId } from 'mongodb'

// RAPID Questionnaire Document Schema
export interface RAPIDQuestionnaireDocument {
  _id?: ObjectId
  version: string
  assessmentType: 'EXPLORATORY' | 'MIGRATION'
  totalQuestions: number
  categories: {
    id: string
    title: string
    description?: string
    subcategories: {
      id: string
      title: string
      questions: {
        id: string
        number: string
        text: string
        description?: string
        type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number'
        required: boolean
        options?: string[]
        category: string
        subcategory: string
      }[]
      questionCount: number
    }[]
    totalQuestions: number
  }[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Enhanced Assessment Document Schema for RAPID structure
export interface AssessmentDocument {
  _id?: ObjectId
  name: string
  companyId: ObjectId
  userId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  
  // RAPID-specific fields
  currentCategory: string
  currentSubcategory?: string
  totalCategories: number
  rapidQuestionnaireVersion: string
  
  // Category-based responses structure
  responses: {
    [categoryId: string]: {
      [questionId: string]: any
    }
  }
  
  // Category completion tracking
  categoryStatuses: {
    [categoryId: string]: {
      categoryId: string
      status: 'not_started' | 'partial' | 'completed'
      completionPercentage: number
      lastModified: Date
      requiredQuestionsCount: number
      answeredRequiredCount: number
      totalQuestionsCount: number
      answeredTotalCount: number
    }
  }
  
  // Legacy fields for backward compatibility
  currentStep?: number
  totalSteps?: number
  stepStatuses?: {
    [stepNumber: number]: {
      status: 'not_started' | 'partial' | 'completed'
      lastModified: Date
      requiredFieldsCount: number
      filledFieldsCount: number
    }
  }
  
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Report Generation Request Document Schema
export interface ReportRequestDocument {
  _id?: ObjectId
  assessmentId: ObjectId
  companyId: ObjectId
  userId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
  errorMessage?: string
  retryCount: number
  externalRequestId?: string
  
  // RAPID-specific metadata
  rapidQuestionnaireVersion?: string
  assessmentType?: 'EXPLORATORY' | 'MIGRATION'
  categoryCount?: number
  completedCategories?: number
}

// Report Document Schema
export interface ReportDocument {
  _id?: ObjectId
  assessmentId: ObjectId
  companyId: ObjectId
  userId: string
  htmlContent: string
  generatedAt: Date
  metadata: {
    assessmentType: 'EXPLORATORY' | 'MIGRATION'
    assessmentName: string
    companyName: string
    totalQuestions: number
    answeredQuestions: number
    generationDuration?: number
    
    // RAPID-specific metadata
    rapidQuestionnaireVersion?: string
    categoryBreakdown?: {
      [categoryId: string]: {
        categoryName: string
        totalQuestions: number
        answeredQuestions: number
        completionPercentage: number
      }
    }
  }
}

// Company Document Schema (for reference)
export interface CompanyDocument {
  _id?: ObjectId
  name: string
  description?: string
  industry?: string
  size?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Collection names
export const COLLECTIONS = {
  ASSESSMENTS: 'assessments',
  REPORT_REQUESTS: 'report_requests',
  REPORTS: 'reports',
  COMPANIES: 'companies',
  RAPID_QUESTIONNAIRES: 'rapid_questionnaires'
} as const

// Enhanced indexes for RAPID structure
export const ASSESSMENT_INDEXES = [
  { key: { companyId: 1, userId: 1 } as const, name: 'companyId_userId' },
  { key: { userId: 1, status: 1 } as const, name: 'userId_status' },
  { key: { createdAt: -1 } as const, name: 'createdAt_desc' },
  { key: { updatedAt: -1 } as const, name: 'updatedAt_desc' },
  
  // RAPID-specific indexes
  { key: { rapidQuestionnaireVersion: 1, type: 1 } as const, name: 'rapidVersion_type' },
  { key: { currentCategory: 1, status: 1 } as const, name: 'currentCategory_status' },
  { key: { userId: 1, type: 1, status: 1 } as const, name: 'userId_type_status' },
  { key: { 'categoryStatuses.status': 1 } as const, name: 'categoryStatuses_status' }
]

export const RAPID_QUESTIONNAIRE_INDEXES = [
  { key: { version: 1, assessmentType: 1 } as const, name: 'version_assessmentType', unique: true },
  { key: { isActive: 1, assessmentType: 1 } as const, name: 'isActive_assessmentType' },
  { key: { createdAt: -1 } as const, name: 'createdAt_desc' },
  { key: { 'categories.id': 1 } as const, name: 'categories_id' },
  { key: { 'categories.subcategories.questions.id': 1 } as const, name: 'questions_id' }
]

export const REPORT_REQUEST_INDEXES = [
  { key: { assessmentId: 1 } as const, name: 'assessmentId' },
  { key: { userId: 1, status: 1 } as const, name: 'userId_status' },
  { key: { requestedAt: -1 } as const, name: 'requestedAt_desc' },
  { key: { externalRequestId: 1 } as const, name: 'externalRequestId', sparse: true },
  
  // RAPID-specific indexes
  { key: { rapidQuestionnaireVersion: 1, assessmentType: 1 } as const, name: 'rapidVersion_assessmentType' }
]

export const REPORT_INDEXES = [
  { key: { assessmentId: 1 } as const, name: 'assessmentId', unique: true },
  { key: { companyId: 1, userId: 1 } as const, name: 'companyId_userId' },
  { key: { generatedAt: -1 } as const, name: 'generatedAt_desc' },
  
  // RAPID-specific indexes
  { key: { 'metadata.rapidQuestionnaireVersion': 1 } as const, name: 'metadata_rapidVersion' }
]

export const COMPANY_INDEXES = [
  { key: { userId: 1 } as const, name: 'userId' },
  { key: { name: 1, userId: 1 } as const, name: 'name_userId', unique: true },
  { key: { createdAt: -1 } as const, name: 'createdAt_desc' }
]