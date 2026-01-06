import { ObjectId } from 'mongodb'

// Assessment Document Schema
export interface AssessmentDocument {
  _id?: ObjectId
  name: string
  companyId: ObjectId
  userId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  currentStep: number
  totalSteps: number
  responses: {
    [stepId: string]: {
      [questionId: string]: any
    }
  }
  stepStatuses: {
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
  COMPANIES: 'companies'
} as const

// Indexes for performance
export const ASSESSMENT_INDEXES = [
  { key: { companyId: 1, userId: 1 } as const, name: 'companyId_userId' },
  { key: { userId: 1, status: 1 } as const, name: 'userId_status' },
  { key: { createdAt: -1 } as const, name: 'createdAt_desc' },
  { key: { updatedAt: -1 } as const, name: 'updatedAt_desc' }
]

export const REPORT_REQUEST_INDEXES = [
  { key: { assessmentId: 1 } as const, name: 'assessmentId' },
  { key: { userId: 1, status: 1 } as const, name: 'userId_status' },
  { key: { requestedAt: -1 } as const, name: 'requestedAt_desc' },
  { key: { externalRequestId: 1 } as const, name: 'externalRequestId', sparse: true }
]

export const REPORT_INDEXES = [
  { key: { assessmentId: 1 } as const, name: 'assessmentId', unique: true },
  { key: { companyId: 1, userId: 1 } as const, name: 'companyId_userId' },
  { key: { generatedAt: -1 } as const, name: 'generatedAt_desc' }
]

export const COMPANY_INDEXES = [
  { key: { userId: 1 } as const, name: 'userId' },
  { key: { name: 1, userId: 1 } as const, name: 'name_userId', unique: true },
  { key: { createdAt: -1 } as const, name: 'createdAt_desc' }
]