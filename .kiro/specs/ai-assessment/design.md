# Design Document

## Overview

AI Assessment module เป็นระบบประเมินความพร้อม GenAI ที่ออกแบบให้รองรับการทำงานแบบ multi-company และ multi-assessment โดยเน้นการพัฒนาแบบ phase-based development (UI ก่อน แล้วค่อย data persistence) เพื่อให้สามารถทดสอบ application flow ได้เร็วขึ้น

ระบบรองรับ 2 เส้นทางหลัก: Exploratory Path (7 ขั้นตอน) สำหรับการพัฒนา AI ใหม่ และ Migration Path (8 ขั้นตอน) สำหรับการ migrate AI ที่มีอยู่ โดยใช้ MongoDB เป็นฐานข้อมูลหลักและ External API Gateway + Lambda + SQS architecture สำหรับการสร้างรายงานแบบ asynchronous

**ฟีเจอร์ใหม่ที่เพิ่มเข้ามา:**
- **Response Review System**: ให้ผู้ใช้สามารถดูคำตอบที่กรอกไปแล้วและทบทวนทั้งหมดก่อนส่ง assessment
- **Enhanced Progress Visualization**: แสดงสถานะความคืบหน้าแบบ visual และให้คลิกไปยัง step ต่างๆ ได้
- **Asynchronous Report Generation**: ใช้ External API + Lambda + SQS แทนการเรียก AWS Bedrock โดยตรง

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Components]
        State[State Management]
        Router[Next.js Router]
        ReviewSystem[Response Review System]
        ProgressTracker[Enhanced Progress Tracker]
    end
    
    subgraph "API Layer"
        CompanyAPI[Company API Routes]
        AssessmentAPI[Assessment API Routes]
        ReportAPI[Report Status API]
        ExternalAPI[External Report API]
    end
    
    subgraph "External Services"
        MongoDB[(MongoDB Database)]
        APIGateway[API Gateway]
        Lambda[Lambda Functions]
        SQS[SQS Queue]
        Bedrock[AWS Bedrock]
    end
    
    UI --> State
    State --> Router
    Router --> CompanyAPI
    Router --> AssessmentAPI
    Router --> ReportAPI
    
    ReviewSystem --> AssessmentAPI
    ProgressTracker --> AssessmentAPI
    
    CompanyAPI --> MongoDB
    AssessmentAPI --> MongoDB
    ReportAPI --> ExternalAPI
    
    ExternalAPI --> APIGateway
    APIGateway --> Lambda
    Lambda --> MongoDB
    Lambda --> SQS
    SQS --> Lambda
    Lambda --> Bedrock
```

### Component Architecture

```mermaid
graph TB
    subgraph "Layout Components"
        AppLayout[App Layout]
        SubSidebar[Sub Sidebar]
        AssessmentLayout[Assessment Layout]
    end
    
    subgraph "Company Management"
        CompanySelector[Company Selector]
        CompanyDashboard[Company Dashboard]
        CompanyForm[Company Form]
    end
    
    subgraph "Assessment Components"
        AssessmentDashboard[Assessment Dashboard]
        AssessmentWizard[Assessment Wizard]
        QuestionStep[Question Step]
        EnhancedProgressTracker[Enhanced Progress Tracker]
        ResponseReviewModal[Response Review Modal]
        StepNavigator[Step Navigator]
    end
    
    subgraph "Report Components"
        AsyncReportGenerator[Async Report Generator]
        ReportStatusTracker[Report Status Tracker]
        ReportViewer[Report Viewer]
        ReportList[Report List]
    end
    
    AppLayout --> SubSidebar
    AppLayout --> CompanySelector
    CompanySelector --> CompanyDashboard
    CompanyDashboard --> AssessmentDashboard
    AssessmentDashboard --> AssessmentWizard
    AssessmentWizard --> QuestionStep
    AssessmentWizard --> EnhancedProgressTracker
    AssessmentWizard --> ResponseReviewModal
    AssessmentWizard --> StepNavigator
    AssessmentWizard --> AsyncReportGenerator
    AsyncReportGenerator --> ReportStatusTracker
    ReportStatusTracker --> ReportViewer
```

## Components and Interfaces

### Core Components

#### 1. SubSidebar Component
```typescript
interface SubSidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

interface SubSidebarItem {
  id: string
  label: string
  icon: React.ComponentType
  path: string
  isActive: boolean
}
```

**Responsibilities:**
- Display navigation menu with "AI Assessment" and "Company Settings"
- Handle active state highlighting
- Responsive collapse on mobile devices

#### 2. CompanySelector Component
```typescript
interface CompanySelectorProps {
  companies: Company[]
  selectedCompany: Company | null
  onCompanySelect: (company: Company) => void
  onCreateNew: () => void
}

interface Company {
  id: string
  name: string
  description?: string
  createdAt: Date
  assessmentCount: number
}
```

**Responsibilities:**
- Display available companies in dropdown or grid format
- Handle company selection
- Redirect to Company Settings if no companies exist

#### 3. AssessmentDashboard Component
```typescript
interface AssessmentDashboardProps {
  company: Company
  assessments: Assessment[]
  onCreateAssessment: () => void
  onSelectAssessment: (assessment: Assessment) => void
  onDeleteAssessment: (assessmentId: string) => void
}

interface Assessment {
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
```

**Responsibilities:**
- Display assessments for selected company
- Show assessment status and progress
- Provide CRUD operations for assessments

#### 4. AssessmentWizard Component
```typescript
interface AssessmentWizardProps {
  assessment: Assessment
  questions: QuestionSection[]
  responses: AssessmentResponses
  onResponseChange: (stepId: string, responses: any) => void
  onStepChange: (step: number) => void
  onComplete: () => void
  onShowReview: () => void
}

interface QuestionSection {
  id: string
  title: string
  description: string
  questions: Question[]
  stepNumber: number
  completionStatus: 'not_started' | 'partial' | 'completed'
}

interface Question {
  id: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'number'
  label: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  validation?: ValidationRules
}
```

**Responsibilities:**
- Manage multi-step questionnaire flow
- Handle form validation and error display
- Auto-save responses every 30 seconds
- Display enhanced progress indicator with clickable steps
- Provide response review functionality

#### 5. EnhancedProgressTracker Component
```typescript
interface EnhancedProgressTrackerProps {
  currentStep: number
  totalSteps: number
  stepStatuses: StepStatus[]
  onStepClick: (stepNumber: number) => void
  allowNavigation: boolean
}

interface StepStatus {
  stepNumber: number
  status: 'not_started' | 'partial' | 'completed' | 'current'
  hasResponses: boolean
  requiredFieldsCount: number
  filledFieldsCount: number
}
```

**Responsibilities:**
- Display visual progress with different states for each step
- Allow direct navigation to any step by clicking
- Show completion indicators for steps with responses
- Highlight current step and partial completion status

#### 6. ResponseReviewModal Component
```typescript
interface ResponseReviewModalProps {
  isOpen: boolean
  assessment: Assessment
  responses: AssessmentResponses
  questions: QuestionSection[]
  onClose: () => void
  onEditResponse: (stepNumber: number, questionId: string) => void
  onComplete: () => void
}

interface ReviewSummary {
  stepNumber: number
  stepTitle: string
  questions: ReviewQuestion[]
  completionPercentage: number
}

interface ReviewQuestion {
  id: string
  label: string
  answer: any
  required: boolean
  isEmpty: boolean
}
```

**Responsibilities:**
- Display comprehensive review of all questions and answers
- Organize responses by step with clear visual hierarchy
- Highlight unanswered required questions
- Allow direct navigation to specific questions for editing
- Provide final completion validation

#### 7. AsyncReportGenerator Component
```typescript
interface AsyncReportGeneratorProps {
  assessment: Assessment
  responses: AssessmentResponses
  onReportRequested: (requestId: string) => void
  onReportCompleted: (report: AssessmentReport) => void
}

interface ReportGenerationRequest {
  id: string
  assessmentId: string
  companyId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  requestedAt: Date
  completedAt?: Date
  errorMessage?: string
}
```

**Responsibilities:**
- Initiate report generation through external API
- Display request status and progress
- Handle asynchronous report completion
- Provide retry functionality for failed requests

#### 8. ReportStatusTracker Component
```typescript
interface ReportStatusTrackerProps {
  requests: ReportGenerationRequest[]
  onRefreshStatus: () => void
  onViewReport: (reportId: string) => void
  onRetryGeneration: (requestId: string) => void
}
```

**Responsibilities:**
- Track multiple report generation requests
- Poll for status updates periodically
- Display request history and current status
- Handle error states and retry mechanisms

### Data Models

#### MongoDB Collections

##### Companies Collection
```typescript
interface CompanyDocument {
  _id: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  userId: string // Owner of the company
}
```

##### Assessments Collection
```typescript
interface AssessmentDocument {
  _id: ObjectId
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
```

##### Report Generation Requests Collection
```typescript
interface ReportRequestDocument {
  _id: ObjectId
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
```

##### Reports Collection
```typescript
interface ReportDocument {
  _id: ObjectId
  assessmentId: ObjectId
  companyId: ObjectId
  userId: string
  htmlContent: string
  generatedAt: Date
  metadata: {
    assessmentType: string
    companyName: string
    generationDuration: number
    bedrockModel: string
  }
}
```

### API Interfaces

#### Company Management APIs
```typescript
// GET /api/companies
interface GetCompaniesResponse {
  companies: Company[]
  total: number
}

// POST /api/companies
interface CreateCompanyRequest {
  name: string
  description?: string
}

// PUT /api/companies/[id]
interface UpdateCompanyRequest {
  name: string
  description?: string
}
```

#### Assessment Management APIs
```typescript
// GET /api/assessments?companyId=xxx
interface GetAssessmentsResponse {
  assessments: Assessment[]
  total: number
}

// POST /api/assessments
interface CreateAssessmentRequest {
  name: string
  companyId: string
  type: 'EXPLORATORY' | 'MIGRATION'
}

// PUT /api/assessments/[id]/responses
interface SaveResponsesRequest {
  stepId: string
  responses: { [questionId: string]: any }
  currentStep: number
  stepStatus: {
    status: 'not_started' | 'partial' | 'completed'
    requiredFieldsCount: number
    filledFieldsCount: number
  }
}

// GET /api/assessments/[id]/review
interface GetAssessmentReviewResponse {
  assessment: Assessment
  reviewSummary: ReviewSummary[]
  completionStatus: {
    totalRequired: number
    totalFilled: number
    isComplete: boolean
  }
}
```

#### Report Generation APIs
```typescript
// POST /api/reports/generate
interface GenerateReportRequest {
  assessmentId: string
}

interface GenerateReportResponse {
  requestId: string
  status: 'PENDING'
  estimatedCompletionTime: Date
}

// GET /api/reports/status/[requestId]
interface GetReportStatusResponse {
  request: ReportGenerationRequest
  report?: AssessmentReport
}

// GET /api/reports/requests?assessmentId=xxx
interface GetReportRequestsResponse {
  requests: ReportGenerationRequest[]
  total: number
}
```

#### External API Integration
```typescript
// External API Gateway Endpoints
interface ExternalReportAPI {
  // POST /external/reports/generate
  generateReport(data: {
    assessmentId: string
    companyId: string
    responses: AssessmentResponses
    assessmentType: string
  }): Promise<{ requestId: string }>
  
  // GET /external/reports/status/{requestId}
  getStatus(requestId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    result?: string
    error?: string
  }>
}
```

## Phase-Based Development Strategy

### Phase 1: UI/UX Foundation (Week 1-2)
**Goal:** Create complete UI flow with mock data for rapid testing

**Components to Build:**
- SubSidebar with navigation
- CompanySelector with mock companies
- AssessmentDashboard with mock assessments
- AssessmentWizard with all question types
- ProgressTracker and navigation
- ReportViewer with sample HTML content

**Mock Data Strategy:**
- Use static JSON files for companies and assessments
- Implement localStorage for temporary data persistence
- Create sample questionnaire structure
- Generate sample HTML reports

**Benefits:**
- Rapid prototyping and user testing
- Early feedback on UX flow
- Component isolation and testing
- Visual validation of responsive design

### Phase 2: Data Integration (Week 3-4)
**Goal:** Replace mock data with MongoDB integration

**Implementation Steps:**
- Set up MongoDB connection and schemas
- Implement API routes for CRUD operations
- Replace localStorage with API calls
- Add proper error handling and loading states
- Implement auto-save functionality

### Phase 3: AWS Bedrock Integration (Week 5)
**Goal:** Add AI-powered report generation

**Implementation Steps:**
- Integrate AWS SDK for Bedrock
- Implement report generation logic
- Add AWS credentials management
- Create HTML report templates
- Test with different Bedrock models

### Phase 4: Polish and Optimization (Week 6)
**Goal:** Performance optimization and final touches

**Implementation Steps:**
- Add caching strategies
- Optimize database queries
- Implement proper error boundaries
- Add comprehensive validation
- Performance testing and optimization

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sub-sidebar active state consistency
*For any* assessment-related page navigation, the sub-sidebar should highlight the "AI Assessment" menu item when the user is on any assessment page
**Validates: Requirements 1.3**

### Property 2: Company-based assessment filtering
*For any* company selection, all displayed assessments should belong only to the selected company and no assessments from other companies should appear
**Validates: Requirements 2.2**

### Property 3: Assessment creation with company association
*For any* valid assessment creation request with company selection, the created assessment should be properly associated with the selected company and contain all required fields (name, company ID, path type)
**Validates: Requirements 2.4, 2.5, 3.5**

### Property 4: Company name display consistency
*For any* assessment interface, the displayed company name in the header should match the company associated with the current assessment
**Validates: Requirements 2.6**

### Property 5: Step progression and validation
*For any* assessment step with required fields, progression to the next step should only be enabled when all required fields are valid and complete
**Validates: Requirements 4.2, 4.4**

### Property 6: Progress indicator accuracy
*For any* assessment step navigation, the progress indicator should accurately reflect the current step number and total steps for the assessment type
**Validates: Requirements 4.1**

### Property 7: Response preservation during navigation
*For any* step navigation within an assessment, previously entered responses should be preserved and restored when returning to that step
**Validates: Requirements 4.3**

### Property 8: Assessment state persistence
*For any* assessment that is saved and later restored, all responses and the current step position should be identical to when it was last saved
**Validates: Requirements 5.3**

### Property 9: Navigation-triggered save
*For any* step navigation event, the current responses should be immediately saved to the database before navigation occurs
**Validates: Requirements 5.2**

### Property 10: Assessment-company relationship integrity
*For any* created assessment, it should be associated with exactly one company ID and this relationship should be maintained throughout the assessment lifecycle
**Validates: Requirements 5.5**

### Property 11: AWS credentials validation and error handling
*For any* invalid or missing AWS credentials, the system should display appropriate error messages and disable report generation functionality
**Validates: Requirements 6.4**

### Property 12: Report generation availability
*For any* completed assessment, report generation functionality should be enabled and available to the user
**Validates: Requirements 7.1**

### Property 13: HTML report structure and storage
*For any* generated report, it should be formatted as valid HTML with proper structure and stored in MongoDB with unique ID, timestamp, and proper associations
**Validates: Requirements 7.3, 7.4, 7.5, 7.7**

### Property 15: Step navigation with response preservation
*For any* assessment step navigation (via step indicators, review modal, or direct navigation), the current step's responses should be preserved before navigation and the target step should display its previously saved responses correctly
**Validates: Requirements 11.2, 11.5, 12.4, 12.5**

### Property 16: Visual progress indicators consistency
*For any* assessment step, the progress tracker should display the correct visual state (not started, partial, completed, current) based on the step's response data and completion status
**Validates: Requirements 11.1, 12.1, 12.2, 12.3**

### Property 17: Response review completeness
*For any* assessment with responses, the review summary should display all questions and answers organized by step, with unanswered required questions highlighted
**Validates: Requirements 11.4, 11.6**

### Property 18: Assessment completion validation
*For any* assessment, the complete button should only be enabled when all required fields across all steps are filled, as verified through the review process
**Validates: Requirements 11.7**

### Property 19: Asynchronous report generation workflow
*For any* valid assessment, initiating report generation should call the external API, receive a request ID, display progress status, and handle the complete workflow including polling and completion
**Validates: Requirements 6.1, 6.2, 6.6, 7.1, 7.2, 7.3**

### Property 20: Report generation error handling
*For any* failed report generation request, the system should display appropriate error messages, provide retry options, and maintain error details in the request history
**Validates: Requirements 6.7, 7.5**

### Property 21: Report data persistence and associations
*For any* generated report, it should be stored in MongoDB with proper associations to both assessment ID and company ID, and be accessible through the status history
**Validates: Requirements 7.4, 7.6, 7.7**

## Error Handling

### Input Validation Strategy
- **Client-side validation**: Immediate feedback for user input errors
- **Server-side validation**: Comprehensive validation before data persistence
- **Schema validation**: MongoDB schema enforcement for data integrity
- **AWS credential validation**: Real-time validation of Bedrock connectivity

### Error Recovery Mechanisms
- **Auto-save recovery**: Restore unsaved responses from localStorage on page reload
- **Network error handling**: Retry mechanisms for failed API calls
- **Graceful degradation**: Disable features when dependencies are unavailable
- **User-friendly messages**: Clear error messages with suggested actions

### Error Boundary Implementation
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
  errorCode?: string
}

class AssessmentErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  // Handle component errors gracefully
  // Provide fallback UI for critical failures
  // Log errors for debugging
}
```

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal properties across all inputs. Both approaches are complementary and necessary for comprehensive coverage.

**Unit Tests Focus:**
- Specific UI component behavior
- API endpoint functionality
- Error condition handling
- Integration between components
- Edge cases like empty data states

**Property-Based Tests Focus:**
- Universal properties that hold across all valid inputs
- Data consistency and integrity
- State management correctness
- Navigation and flow validation

### Property-Based Testing Configuration
- **Testing Library**: fast-check for TypeScript/JavaScript property-based testing
- **Test Iterations**: Minimum 100 iterations per property test
- **Test Tagging**: Each property test tagged with format: **Feature: ai-assessment, Property {number}: {property_text}**
- **Coverage**: Each correctness property implemented as a single property-based test

### Testing Implementation Guidelines
- Property tests validate universal behaviors across randomized inputs
- Unit tests verify specific examples and integration points
- Mock external dependencies (External API Gateway, Lambda functions) for consistent testing
- Use test databases for data persistence testing
- Implement visual regression testing for UI components
- Test asynchronous workflows with proper timing and state management

### Test Data Generation Strategy
- **Companies**: Generate random company names, descriptions, and IDs
- **Assessments**: Create assessments with various states, steps, and response patterns
- **Responses**: Generate valid and invalid response data for all question types
- **Step Statuses**: Create various completion states (not_started, partial, completed)
- **Report Requests**: Generate report generation requests with different statuses
- **Reports**: Create sample HTML reports with different structures and content
- **Review Summaries**: Generate comprehensive review data with various completion patterns

### New Testing Areas for Enhanced Features

#### Response Review System Testing
- Test review modal with various response patterns
- Validate navigation from review to specific questions
- Test completion validation across all steps
- Verify highlighting of unanswered required questions

#### Enhanced Progress Tracking Testing
- Test visual indicators for all step states
- Validate clickable navigation to any step
- Test response preservation during navigation
- Verify progress calculation accuracy

#### Asynchronous Report Generation Testing
- Mock external API Gateway responses
- Test polling mechanisms and status updates
- Validate error handling and retry functionality
- Test report request history and status tracking

This comprehensive testing approach ensures both the correctness of individual components and the overall system behavior across all possible inputs and states, including the new enhanced features for response review, progress visualization, and asynchronous report generation.