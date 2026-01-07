# AI Assessment Module Documentation

## Overview

The AI Assessment Module is the core feature of the RAPID AI Assessment Platform. It enables organizations to assess their GenAI readiness through structured questionnaires based on the RAPID (Rapid AI Development) framework. The module supports two assessment paths: **Exploratory** for new AI development and **Migration** for existing AI systems.

## Key Features

### 1. RAPID Questionnaire Integration
- **162 total questions** organized by categories
- **Exploratory Path**: 5 main categories (110 questions)
- **Migration Path**: 6 main categories (162 questions)
- Preserves original question numbering and structure

### 2. Category-Based Navigation
- **Enhanced Progress Sidebar**: Clickable category navigation with visual progress indicators
- **Fixed-Size Question Container**: Consistent UI with proper scrolling
- **Category Status Tracking**: Real-time completion status per category

### 3. Response Management
- **Auto-save**: Automatic saving every 30 seconds
- **Immediate Save**: Save on category navigation
- **Response Review**: Comprehensive review before completion
- **Session-based Organization**: Organize responses by session

### 4. Assessment Paths

#### Exploratory Path (5 Categories)
1. **Use Case Discovery** - 48 questions in 5 subcategories
2. **Data Readiness** - 25 questions in 4 subcategories
3. **Compliance & Integration** - 27 questions in 5 subcategories
4. **Model Evaluation** - Guided process
5. **Business Value & ROI** - 10 questions

#### Migration Path (6 Categories)
1. **Use Case Discovery** - Same as Exploratory
2. **Current System Assessment** - 52 questions in 8 subcategories
3. **Data Readiness** - 25 questions in 4 subcategories
4. **Compliance & Integration** - 27 questions in 5 subcategories
5. **Model Evaluation** - Guided process
6. **Business Value & ROI** - 10 questions

## Architecture

### Component Structure

```
AI Assessment Module
├── AssessmentContainer
│   ├── CompanySelector
│   ├── AssessmentDashboard
│   ├── AssessmentWizard (legacy, may not be used)
│   ├── DatabaseIntegratedAssessmentWizard (primary)
│   │   ├── EnhancedRAPIDQuestionnaireLoader
│   │   ├── EnhancedCategoryNavigationWithSubcategories
│   │   ├── FixedQuestionContainer
│   │   ├── RAPIDQuestionStep
│   │   ├── ResponseReviewModal
│   │   ├── AutoSaveIndicator
│   │   ├── LoadingSpinner
│   │   └── ErrorMessage
│   ├── AssessmentViewer (read-only)
│   │   └── uses useAssessmentViewer hook
│   └── ReportGenerator
│       ├── AsyncReportGenerator
│       ├── ReportStatusTracker
│       └── ReportViewer
└── Supporting Components
    ├── CategoryNavigationSidebar
    ├── ErrorBoundary
    ├── CompanySelector
    └── SubSidebar
```

### Data Flow

1. **Company Selection**: User selects a company or creates a new one
2. **Assessment Creation**: User creates a new assessment with name and type
3. **Questionnaire Loading**: System loads RAPID questionnaire structure
4. **Category Navigation**: User navigates between categories
5. **Response Entry**: User answers questions with auto-save
6. **Review**: User reviews all responses before completion
7. **Completion**: Assessment marked as completed
8. **Report Generation**: Asynchronous report generation via External API Gateway

## Components

### AssessmentContainer

Main container component that manages the overall assessment flow.

**Props:**
```typescript
interface AssessmentContainerProps {
  selectedCompany: Company | null
  onCompanySelectorDisabled?: (disabled: boolean) => void
}
```

**View Modes:**
- `dashboard` - Display list of assessments
- `wizard` - Assessment creation wizard
- `questionnaire` - Active assessment questionnaire (uses DatabaseIntegratedAssessmentWizard)
- `viewer` - Read-only assessment viewer
- `report` - Report generation view

**Responsibilities:**
- Manage assessment state and view modes
- Handle company selection
- Route between dashboard, wizard, questionnaire, viewer, and report modes
- Coordinate with API services
- Disable company selector during active assessment
- Handle assessment CRUD operations

---

### AssessmentDashboard

Displays all assessments for a selected company.

**Props:**
```typescript
interface AssessmentDashboardProps {
  company: Company | null
  assessments: Assessment[]
  onCreateAssessment: () => void
  onSelectAssessment: (assessment: Assessment) => void
  onViewAssessment?: (assessmentId: string) => void
  onDeleteAssessment: (assessmentId: string) => void
  isLoading?: boolean
  isDeletingAssessment?: string | null
}
```

**Features:**
- Status-based icon display (edit for incomplete, view for completed)
- Assessment list with status indicators
- Create, edit, delete operations
- Navigation to wizard or viewer

---

### DatabaseIntegratedAssessmentWizard

Main wizard component for completing assessments with RAPID questionnaire integration.

**Props:**
```typescript
interface DatabaseIntegratedAssessmentWizardProps {
  assessment?: Assessment
  assessmentType: AssessmentType
  version?: string
  responses?: AssessmentResponses
  onResponseChange?: (categoryId: string, responses: any) => void
  onCategoryChange?: (categoryId: string) => void
  onComplete?: (responses: AssessmentResponses) => void
  onError?: (error: string) => void
  className?: string
  enableAutoInit?: boolean
}
```

**Features:**
- Database-integrated RAPID questionnaire loading
- Category and subcategory-based navigation
- Auto-initialization of database if needed
- Form validation with real-time feedback
- Auto-save functionality (debounced)
- Progress tracking per category
- Response review integration
- Fallback to static data if database unavailable
- Error handling with retry mechanism

**Note:** This is the primary wizard component used by AssessmentContainer. The legacy AssessmentWizard component may still exist but is not actively used.

---

### CategoryNavigationSidebar

Left sidebar for category navigation with progress indicators.

**Props:**
```typescript
interface CategoryNavigationSidebarProps {
  categories: RAPIDCategory[]
  currentCategory: string
  onCategorySelect: (categoryId: string) => void
  completionStatus: CategoryCompletionStatus[]
  className?: string
  isMobile?: boolean
}
```

**Features:**
- Clickable category navigation
- Visual progress indicators (checkmarks, progress bars, percentages)
- Current category highlighting
- Responsive design (collapsible on mobile)
- Progress summary display
- Question count per category

### EnhancedCategoryNavigationWithSubcategories

Enhanced navigation sidebar that supports subcategory navigation.

**Props:**
```typescript
interface EnhancedCategoryNavigationProps {
  categories: RAPIDCategory[]
  currentCategory: string
  currentSubcategory?: string
  onCategorySelect: (categoryId: string) => void
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void
  completionStatus: CategoryCompletionStatus[]
  className?: string
}
```

**Features:**
- Expandable/collapsible categories
- Subcategory navigation
- Subcategory completion status
- Question count per subcategory
- Visual status indicators for both categories and subcategories

---

### FixedQuestionContainer

Container with fixed dimensions for consistent UI.

**Props:**
```typescript
interface FixedQuestionContainerProps {
  children: React.ReactNode
  className?: string
}
```

**Features:**
- Fixed container dimensions
- Proper scrolling when content exceeds container
- Responsive design
- Prevents layout shifts

---

### EnhancedRAPIDQuestionnaireLoader

Enhanced loader component that loads and structures RAPID questionnaire data with database integration and caching.

**Props:**
```typescript
interface EnhancedRAPIDQuestionnaireLoaderProps {
  assessmentType: AssessmentType
  version?: string
  onQuestionsLoaded: (questions: RAPIDQuestionnaireStructure) => void
  onError?: (error: string) => void
  enableCaching?: boolean
  fallbackToStatic?: boolean
}
```

**Features:**
- Loads RAPID questionnaire from database API (`/api/questionnaires/rapid`)
- Client-side caching with TTL (5 minutes default)
- Fallback to static data if database unavailable
- Organizes questions by categories and subcategories
- Handles different structures for Exploratory vs Migration
- Retry mechanism for failed loads
- Loading and error states

**Note:** This component is used internally by `DatabaseIntegratedAssessmentWizard`. The legacy `RAPIDQuestionnaireLoader` may still exist but is not actively used.

---

### ResponseReviewModal

Comprehensive review of all responses before completion.

**Props:**
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
```

**Features:**
- Display all questions and answers organized by category
- Highlight unanswered required questions
- Direct navigation to specific questions for editing
- Final completion validation

---

### AssessmentViewer

Read-only viewer for completed assessments. Uses the `useAssessmentViewer` hook for data fetching.

**Props:**
```typescript
interface AssessmentViewerProps {
  assessmentId: string
  onClose: () => void
  onEdit?: () => void
}
```

**Features:**
- Display all assessment data in read-only mode
- Session-based data organization (via `organizeBySessions` utility)
- Chronological session ordering
- Visual session separation
- Progress indicators per session
- Automatic data fetching via `useAssessmentViewer` hook
- Error handling with retry functionality
- Loading states

**Hook: useAssessmentViewer**

Custom hook that fetches assessment data:

```typescript
interface UseAssessmentViewerResult {
  assessment: Assessment | null
  responses: AssessmentResponses | null
  sections: QuestionSection[] | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

---

### AsyncReportGenerator

Handles asynchronous report generation via External API Gateway.

**Props:**
```typescript
interface AsyncReportGeneratorProps {
  assessment: Assessment
  responses: AssessmentResponses
  onReportRequested: (requestId: string) => void
  onReportCompleted: (report: AssessmentReport) => void
}
```

**Features:**
- Send report generation requests to External API Gateway
- Track request status
- Handle asynchronous completion
- Retry functionality for failed requests

---

### ReportStatusTracker

Tracks report generation request status.

**Props:**
```typescript
interface ReportStatusTrackerProps {
  requests: ReportGenerationRequest[]
  onRefreshStatus: () => void
  onViewReport: (reportId: string) => void
  onRetryGeneration: (requestId: string) => void
  pollingInterval?: number
}
```

**Features:**
- Query MongoDB for status updates
- Display request history
- Handle different status states (PENDING, PROCESSING, COMPLETED, FAILED)
- Automatic and manual refresh

## Data Models

### Assessment

The Assessment type is defined in both `types/assessment.ts` and `types/rapid-questionnaire.ts`. The RAPID-specific version includes additional fields:

```typescript
interface Assessment {
  id: string
  name: string
  companyId: string
  userId: string
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  currentCategory: string
  currentSubcategory?: string
  totalCategories: number
  responses: AssessmentResponses // Category-based structure
  categoryStatuses: {
    [categoryId: string]: CategoryCompletionStatus
  }
  rapidQuestionnaireVersion: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  // Legacy fields (may still exist in some assessments):
  currentStep?: number
  totalSteps?: number
}
```

**Note:** The assessment uses a category-based response structure where responses are organized by category ID, then by question ID within each category.

### RAPID Questionnaire Structure

Defined in `types/rapid-questionnaire.ts`:

```typescript
interface RAPIDQuestionnaireStructure {
  version: string
  assessmentType: AssessmentType
  totalQuestions: number
  categories: RAPIDCategory[]
  lastUpdated: Date
}

interface RAPIDCategory {
  id: string
  title: string
  description?: string
  subcategories: RAPIDSubcategory[]
  totalQuestions: number
  completionPercentage: number
  status: CompletionStatus
}

interface RAPIDSubcategory {
  id: string
  title: string
  questions: RAPIDQuestion[]
  questionCount: number
}

interface RAPIDQuestion {
  id: string
  number: string
  text: string
  description?: string
  type: QuestionType
  required: boolean
  options?: string[]
  category: string
  subcategory: string
}

type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number'
type CompletionStatus = 'not_started' | 'partial' | 'completed'
type AssessmentType = 'EXPLORATORY' | 'MIGRATION'

interface CategoryCompletionStatus {
  categoryId: string
  status: CompletionStatus
  completionPercentage: number
  lastModified: Date
}

interface AssessmentResponses {
  [categoryId: string]: {
    [questionId: string]: any
  }
}
```

## API Integration

### Key Endpoints

**Assessments:**
- `GET /api/assessments?companyId={id}` - List assessments for a company
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/[id]` - Get assessment with statistics
- `PUT /api/assessments/[id]` - Update assessment (currentCategory, currentSubcategory)
- `DELETE /api/assessments/[id]` - Delete assessment
- `GET /api/assessments/[id]/responses` - Get assessment responses
- `PUT /api/assessments/[id]/responses` - Save category-based responses
- `PATCH /api/assessments/[id]/responses` - Complete assessment (action: 'complete')
- `GET /api/assessments/[id]/review` - Get review data
- `GET /api/assessments/[id]/validate` - Validate assessment

**RAPID Questionnaires:**
- `GET /api/questionnaires/rapid?type={type}&version={version}` - Get RAPID questionnaire
- `POST /api/questionnaires/rapid` - Store RAPID questionnaire
- `POST /api/questionnaires/rapid/init` - Initialize RAPID questionnaires in database

See [API Documentation](../api/README.md) for detailed endpoint documentation.

## State Management

### Assessment State

The module uses React state management with the following key states:

1. **Company Selection**: Selected company ID
2. **Assessment List**: All assessments for the company
3. **Current Assessment**: Active assessment being worked on
4. **Questionnaire Data**: Loaded RAPID questionnaire structure
5. **Responses**: Current responses by category
6. **Category Status**: Completion status for each category
7. **Current Category**: Currently active category
8. **Review Data**: Comprehensive review information

### Auto-save Mechanism

- **Interval-based**: Saves every 30 seconds
- **Navigation-based**: Saves when navigating between categories
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Retry mechanism for failed saves

## Validation

### Response Validation

- **Required Fields**: Validates required questions are answered
- **Field Types**: Validates response types match question types
- **Category Completion**: Tracks completion status per category
- **Overall Completion**: Validates all required fields before allowing completion

### Completion Requirements

- All required questions must be answered
- All categories must have required fields completed
- Assessment must be in IN_PROGRESS status
- No validation errors

## Error Handling

### Client-Side Errors

- **Network Errors**: Retry mechanism with exponential backoff
- **Validation Errors**: Real-time feedback with error messages
- **Save Errors**: Preserve unsaved data and retry
- **Load Errors**: Graceful degradation with error boundaries

### Server-Side Errors

- **400 Bad Request**: Validation errors with specific field messages
- **404 Not Found**: Resource not found with helpful messages
- **500 Internal Server Error**: Generic error with logging

## Testing

### Unit Tests

- Component rendering
- Form validation
- State management
- API integration

### Property-Based Tests

- RAPID questionnaire structure consistency
- Response preservation during navigation
- Category progression validation
- Assessment completion detection
- Visual completion indicators

### Integration Tests

- End-to-end assessment flow
- Auto-save functionality
- Report generation workflow
- Category navigation

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load questionnaire data on demand
2. **Caching**: Cache questionnaire structure
3. **Debouncing**: Debounce auto-save operations
4. **Virtual Scrolling**: For long question lists
5. **Code Splitting**: Split large components

### Best Practices

- Minimize re-renders with React.memo
- Use useCallback for event handlers
- Optimize state updates
- Implement proper loading states

## Accessibility

### WCAG Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Sufficient contrast ratios

## Future Enhancements

1. **Offline Support**: PWA with offline capabilities
2. **Collaboration**: Multi-user assessment editing
3. **Templates**: Pre-configured assessment templates
4. **Export**: Export assessments to various formats
5. **Analytics**: Assessment completion analytics

## Hooks

### useAssessmentViewer

Custom hook for fetching and managing assessment viewer data.

**Location:** `src/hooks/useAssessmentViewer.ts`

**Usage:**
```typescript
const { assessment, responses, sections, isLoading, error, refetch } = useAssessmentViewer(assessmentId)
```

**Returns:**
- `assessment`: Assessment object or null
- `responses`: AssessmentResponses object or null
- `sections`: QuestionSection[] array or null
- `isLoading`: boolean loading state
- `error`: string error message or null
- `refetch`: function to manually refetch data

## Utilities

### Session Data Organization

The `organizeBySessions` utility (in `utils/session-data-utils.ts`) organizes assessment responses by session for display in the AssessmentViewer.

## Related Documentation

- [API Documentation](../api/README.md)
- [Company Settings Module](./company-settings.md)
- [Architecture Documentation](../architecture/README.md)

