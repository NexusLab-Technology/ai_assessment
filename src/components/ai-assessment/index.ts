// AI Assessment module component exports

// Assessment Management Components
export { default as AssessmentContainer } from './assessment/AssessmentContainer'
export { default as AssessmentDashboard } from './assessment/AssessmentDashboard'
export { default as AssessmentViewer } from './assessment/AssessmentViewer'
export { default as CompanySelector } from './assessment/CompanySelector'

// Wizard Components
export { DatabaseIntegratedAssessmentWizard } from './wizards/DatabaseIntegratedAssessmentWizard'
export { default as RAPIDAssessmentWizard } from './wizards/RAPIDAssessmentWizard'
export { default as QuestionnaireFlow } from './wizards/QuestionnaireFlow'

// Progress Tracker Components
export { default as ProgressTracker } from './progress/ProgressTracker'
export { default as EnhancedProgressTracker } from './progress/EnhancedProgressTracker'
export { default as DatabaseIntegratedProgressTracker } from './progress/DatabaseIntegratedProgressTracker'

// Report Components
export { default as ReportViewer } from './reports/ReportViewer'
export { default as AsyncReportGenerator } from './reports/AsyncReportGenerator'
export { default as ReportStatusTracker } from './reports/ReportStatusTracker'
export { default as ReportGenerator } from './reports/ReportGenerator'

// Navigation Components
export { default as CategoryNavigationSidebar } from './navigation/CategoryNavigationSidebar'
export { default as EnhancedCategoryNavigationWithSubcategories } from './navigation/EnhancedCategoryNavigationWithSubcategories'
export { default as SubSidebar } from './navigation/SubSidebar'

// Question Components
export { default as QuestionStep } from './questions/QuestionStep'
export { default as FixedQuestionContainer } from './questions/FixedQuestionContainer'
export { default as RAPIDQuestionnaireLoader } from './questions/RAPIDQuestionnaireLoader'

// Modal Components
export { default as ResponseReviewModal } from './modals/ResponseReviewModal'

// Common/Utility Components
export { ErrorBoundary } from './common/ErrorBoundary'
export { ErrorMessage } from './common/ErrorMessage'
export { LoadingSpinner } from './common/LoadingSpinner'
export * from './common/ResponseReviewModalUtils'

// Hooks - Database Integrated Assessment Wizard
export { useQuestionnaireLoader } from './hooks/database-integrated/DatabaseIntegratedAssessmentWizardLoader'
export { useAssessmentWizardState } from './hooks/database-integrated/DatabaseIntegratedAssessmentWizardState'
export { useAssessmentWizardValidation } from './hooks/database-integrated/DatabaseIntegratedAssessmentWizardValidation'

// Hooks - Progress Tracker
export { useProgressCalculation } from './hooks/progress-tracker/DatabaseIntegratedProgressTrackerLogic'
export { useProgressTrackerUI } from './hooks/progress-tracker/DatabaseIntegratedProgressTrackerUI'

// Hooks - Questionnaire Flow
export { useQuestionnaireAutoSave } from './hooks/questionnaire-flow/QuestionnaireFlowAutoSave'
export { useQuestionnaireNavigation } from './hooks/questionnaire-flow/QuestionnaireFlowNavigation'
export { useQuestionnaireResponses } from './hooks/questionnaire-flow/QuestionnaireFlowResponses'

// Hooks - RAPID Assessment Wizard
export { useRAPIDCategoryManagement } from './hooks/rapid-wizard/RAPIDAssessmentWizardCategories'
export { useRAPIDQuestionHandling } from './hooks/rapid-wizard/RAPIDAssessmentWizardQuestions'
export { useRAPIDProgressTracking } from './hooks/rapid-wizard/RAPIDAssessmentWizardProgress'

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