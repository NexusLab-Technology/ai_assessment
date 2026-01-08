# AI Assessment Module - Structure

## Code File Organization

```
src/
├── components/
│   └── ai-assessment/
│       ├── AssessmentContainer.tsx          # Main container
│       ├── AssessmentDashboard.tsx         # Assessment list (with status indicators)
│       ├── AssessmentWizard.tsx             # Assessment wizard
│       ├── AssessmentViewer.tsx             # Read-only viewer (from Assessment Status UI)
│       ├── CategoryNavigationSidebar.tsx    # Category navigation
│       ├── FixedQuestionContainer.tsx       # Fixed-size container
│       ├── RAPIDQuestionnaireLoader.tsx    # Questionnaire loader
│       ├── ResponseReviewModal.tsx          # Response review
│       ├── AsyncReportGenerator.tsx         # Report generation (from Report Generation)
│       ├── ReportStatusTracker.tsx          # Status tracking (from Report Generation)
│       └── CompanySelector.tsx               # Company selection
├── hooks/
│   ├── useAssessmentViewer.ts               # Viewer hook (from Assessment Status UI)
│   └── useAutoSave.ts                      # Auto-save hook
├── utils/
│   ├── assessment-helpers.ts                # Assessment utilities
│   ├── rapid-questionnaire-utils.ts        # RAPID utilities
│   └── session-data-utils.ts                # Session data utilities (from Assessment Status UI)
├── types/
│   └── assessment.ts                       # Type definitions
└── app/
    └── api/
        ├── assessments/                     # Assessment APIs
        ├── questionnaires/                  # Questionnaire APIs
        └── reports/                         # Report APIs (from Report Generation)
```

## Component Hierarchy

```
AssessmentContainer
├── CompanySelector
├── AssessmentDashboard
│   ├── AssessmentCard (per assessment)
│   │   ├── Status Icon (edit/view based on completion) [Assessment Status UI]
│   │   └── Action Button (contextual) [Assessment Status UI]
│   └── AssessmentViewer [Assessment Status UI]
│       ├── Session-based Data Display
│       ├── Read-only Question Responses
│       └── Navigation Controls
├── AssessmentWizard
│   ├── CategoryNavigationSidebar
│   ├── FixedQuestionContainer
│   │   └── QuestionStep
│   ├── ResponseReviewModal
│   └── ProgressTracker
└── AsyncReportGenerator [Report Generation]
    └── ReportStatusTracker [Report Generation]
```

## Core Components

### 1. AssessmentContainer
**Purpose**: Main container managing assessment state and view modes

**Key Features**:
- Company selection
- Assessment list management
- View mode switching (dashboard/wizard/viewer)
- Integration with all sub-components

### 2. AssessmentDashboard
**Purpose**: Display and manage assessment list

**Key Features**:
- Assessment list display
- Status-based icons (edit/view) [Assessment Status UI]
- Assessment creation
- Assessment deletion
- Navigation to edit/view modes

### 3. AssessmentViewer [Assessment Status UI]
**Purpose**: Read-only viewer for completed assessments

**Key Features**:
- Session-based data organization
- Read-only question display
- Chronological session ordering
- Session metadata display

### 4. AssessmentWizard
**Purpose**: Assessment questionnaire flow

**Key Features**:
- Category-based navigation
- Question display in fixed container
- Auto-save functionality
- Response review

### 5. AsyncReportGenerator [Report Generation]
**Purpose**: Asynchronous report generation

**Key Features**:
- External API Gateway integration
- Request tracking
- Status polling

### 6. ReportStatusTracker [Report Generation]
**Purpose**: Track report generation status

**Key Features**:
- MongoDB status queries
- Status updates display
- Retry functionality

## Data Models

### Assessment

```typescript
interface Assessment {
  id: string
  name: string
  companyId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  isActive: boolean  // Soft delete: true = active, false = deleted
  currentCategory: string
  totalCategories: number
  responses: {
    [categoryId: string]: {
      [questionId: string]: any
    }
  }
  categoryStatuses: {
    [categoryId: string]: {
      status: 'not_started' | 'partial' | 'completed'
      completionPercentage: number
      lastModified: Date
    }
  }
  sessions?: AssessmentSession[] // For Assessment Status UI
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

**Soft Delete Pattern:**
- When an assessment is deleted, `isActive` is set to `false` instead of removing the record
- All queries automatically filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed
- Deleted assessments are not displayed in normal queries

### Report Generation Request [Report Generation]

```typescript
interface ReportGenerationRequest {
  id: string
  assessmentId: string
  companyId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  isActive: boolean  // Soft delete: true = active, false = deleted
  requestedAt: Date
  completedAt?: Date
  errorMessage?: string
  externalRequestId: string
  retryCount: number
}
```

**Soft Delete Pattern:**
- When a report request is deleted, `isActive` is set to `false` instead of removing the record
- All queries automatically filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed

### Session Data [Assessment Status UI]

```typescript
interface SessionData {
  sessionId: string
  timestamp: Date
  stepId: string
  stepTitle: string
  responses: { [questionId: string]: any }
  questions: Question[]
  metadata?: {
    duration?: number
    progress?: number
  }
}
```

## API Endpoints

### Assessment APIs
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/[id]` - Get assessment
- `PUT /api/assessments/[id]` - Update assessment
- `PUT /api/assessments/[id]/responses` - Save responses
- `GET /api/assessments/[id]/review` - Get review summary

### Questionnaire APIs
- `GET /api/questionnaires/rapid` - Get RAPID questionnaire
- `GET /api/questionnaires` - Get questionnaire sections (for Assessment Status UI)

### Report APIs [Report Generation]
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/status/[requestId]` - Get report status
- `GET /api/reports/requests?assessmentId=xxx` - Get report requests

## Dependencies

### Internal Dependencies
- Company Settings Module - Company selection
- Authentication Module - User authentication

### External Dependencies
- MongoDB - Data persistence
- External API Gateway - Report generation
- AWS Bedrock (via External API) - AI report generation
