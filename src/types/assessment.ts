// Core types for AI Assessment module

export interface Company {
  id: string
  name: string
  description?: string
  createdAt: Date
  assessmentCount: number
}

export interface Assessment {
  id: string
  name: string
  companyId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  currentStep: number
  totalSteps: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface QuestionOption {
  value: string
  label: string
}

export interface ValidationRules {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
}

export interface Question {
  id: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'number'
  label: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  validation?: ValidationRules
}

export interface QuestionSection {
  id: string
  title: string
  description: string
  questions: Question[]
  stepNumber: number
}

export interface AssessmentResponses {
  [stepId: string]: {
    [questionId: string]: any
  }
}

export interface AssessmentReport {
  id: string
  assessmentId: string
  companyId: string
  htmlContent: string
  generatedAt: Date
  metadata: ReportMetadata
}

export interface ReportMetadata {
  assessmentType: string
  companyName: string
  generationDuration: number
  bedrockModel: string
}

export interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

// Component Props Interfaces

export interface SubSidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export interface SubSidebarItem {
  id: string
  label: string
  icon: React.ComponentType
  path: string
  isActive: boolean
}

export interface CompanySelectorProps {
  companies: Company[]
  selectedCompany: Company | null
  onCompanySelect: (company: Company) => void
  onCreateNew: () => void
  compact?: boolean
  disabled?: boolean
}

export interface AssessmentDashboardProps {
  company: Company | null
  assessments: Assessment[]
  onCreateAssessment: () => void
  onSelectAssessment: (assessment: Assessment) => void
  onViewAssessment?: (assessmentId: string) => void
  onDeleteAssessment: (assessmentId: string) => void
  isLoading?: boolean
  isDeletingAssessment?: string | null
}

export interface AssessmentWizardProps {
  assessment: Assessment
  questions: QuestionSection[]
  responses: AssessmentResponses
  onResponseChange: (stepId: string, responses: any) => void
  onStepChange: (step: number) => void
  onComplete: () => void
}

export interface AssessmentCreationWizardProps {
  onAssessmentCreate: (name: string, type: 'EXPLORATORY' | 'MIGRATION') => void
  onCancel: () => void
  isLoading?: boolean
}

export interface ReportGeneratorProps {
  assessment: Assessment
  responses: AssessmentResponses
  awsCredentials: AWSCredentials
  onReportGenerated: (report: AssessmentReport) => void
}

// API Interfaces

export interface GetCompaniesResponse {
  companies: Company[]
  total: number
}

export interface CreateCompanyRequest {
  name: string
  description?: string
}

export interface UpdateCompanyRequest {
  name: string
  description?: string
}

export interface GetAssessmentsResponse {
  assessments: Assessment[]
  total: number
}

export interface CreateAssessmentRequest {
  name: string
  companyId: string
  type: 'EXPLORATORY' | 'MIGRATION'
}

export interface SaveResponsesRequest {
  stepId: string
  responses: { [questionId: string]: any }
  currentStep: number
}

export interface GenerateReportRequest {
  assessmentId: string
  awsCredentials: AWSCredentials
}

export interface GetReportResponse {
  report: AssessmentReport
}

// MongoDB Document Interfaces

export interface CompanyDocument {
  _id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface AssessmentDocument {
  _id: string
  name: string
  companyId: string
  userId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  currentStep: number
  totalSteps: number
  responses: AssessmentResponses
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface ReportDocument {
  _id: string
  assessmentId: string
  companyId: string
  userId: string
  htmlContent: string
  generatedAt: Date
  metadata: ReportMetadata
}