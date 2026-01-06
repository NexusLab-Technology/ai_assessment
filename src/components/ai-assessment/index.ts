// AI Assessment module component exports

export { default as SubSidebar } from './SubSidebar'
export { default as CompanySelector } from './CompanySelector'
export { default as AssessmentDashboard } from './AssessmentDashboard'
export { default as AssessmentWizard } from './AssessmentWizard'
export { default as QuestionStep } from './QuestionStep'
export { default as ProgressTracker } from './ProgressTracker'
export { default as EnhancedProgressTracker } from './EnhancedProgressTracker'
export { default as ResponseReviewModal } from './ResponseReviewModal'
export { default as ReportViewer } from './ReportViewer'
export { default as AsyncReportGenerator } from './AsyncReportGenerator'
export { default as ReportStatusTracker } from './ReportStatusTracker'
// export { default as ReportGenerator } from './ReportGenerator' // TODO: Implement in Phase 3

// New RAPID Integration Components
export { default as CategoryNavigationSidebar } from './CategoryNavigationSidebar'
export { default as FixedQuestionContainer } from './FixedQuestionContainer'
export { default as RAPIDQuestionnaireLoader } from './RAPIDQuestionnaireLoader'

// Re-export types for convenience
export type {
  Company,
  Assessment,
  Question,
  QuestionSection,
  AssessmentResponses,
  AssessmentReport,
  AWSCredentials,
  EnhancedProgressTrackerProps,
  StepStatus,
  ResponseReviewModalProps,
  ReviewSummary,
  ReviewQuestion,
  AsyncReportGeneratorProps,
  ReportGenerationRequest,
  ReportStatusTrackerProps
} from '../../types/assessment'

// Re-export RAPID types
export type {
  RAPIDQuestion,
  RAPIDCategory,
  RAPIDSubcategory,
  RAPIDQuestionnaireStructure,
  AssessmentResponses as RAPIDAssessmentResponses,
  CategoryCompletionStatus,
  AssessmentType,
  CompletionStatus
} from '../../types/rapid-questionnaire'