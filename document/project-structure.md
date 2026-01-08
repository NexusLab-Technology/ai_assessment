# Project Structure - RAPID AI Assessment Platform

## Overview

The RAPID AI Assessment Platform is a comprehensive Next.js 14+ application built with TypeScript that enables organizations to assess their GenAI readiness through structured questionnaires. The platform supports both exploratory assessments for new AI development and migration assessments for existing AI systems.

## Current Status

### Module Implementation Status

- ✅ **AI Assessment Module** - COMPLETED
  - RAPID questionnaire integration (162 questions)
  - Category-based navigation
  - Assessment Status UI (included)
  - Report Generation (included)
- ✅ **Authentication Module** - COMPLETED
  - Configurable authentication framework
  - Environment-based control
  - Session management
- ✅ **Route Protection Module** - COMPLETED
  - Route protection based on auth state
  - Automatic redirect handling
- ✅ **Company Settings Module** - COMPLETED
  - Company CRUD operations
  - Assessment count tracking
- ✅ **Sidebar Navigation Module** - COMPLETED
  - Collapsible navigation
  - State persistence

### Documentation Status

- ✅ **Module Documentation** - COMPLETED
  - 3 module groups documented
  - 5 modules with complete documentation (6 files each)
  - Total: 30 documentation files

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Database**: MongoDB
- **Testing**: Jest + Testing Library + fast-check (Property-based testing)
- **External Services**: AWS Bedrock (via External API Gateway), MongoDB

## Project Architecture

### Core Modules

The platform is organized into 3 module groups with 5 total modules:

#### 1. AI Assessment Group
- **AI Assessment Module**: RAPID questionnaire-based assessment system with category navigation
  - Includes Assessment Status UI functionality (status indicators and viewer)
  - Includes Report Generation functionality (asynchronous report generation)

#### 2. Security Group
- **Authentication Module**: Configurable authentication framework with environment-based control
- **Route Protection Module**: Route protection based on authentication state

#### 3. Supporting Modules
- **Company Settings Module**: Company management and organization
- **Sidebar Navigation Module**: Collapsible navigation sidebar with responsive behavior

### Directory Structure

```
ai_assessment/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── ai-assessment/           # AI Assessment main page
│   │   ├── ai-assessment-basic/     # Basic assessment demo
│   │   ├── ai-assessment-simple/    # Simple assessment demo
│   │   ├── ai-assessment-demo/       # Enhanced assessment demo
│   │   ├── company-settings/         # Company management page
│   │   ├── login/                   # Login page
│   │   ├── settings/                # User settings page
│   │   ├── profile/                 # User profile page
│   │   ├── api/                     # API routes
│   │   │   ├── assessments/        # Assessment CRUD operations
│   │   │   ├── companies/           # Company CRUD operations
│   │   │   ├── questionnaires/      # Questionnaire data endpoints
│   │   │   ├── reports/             # Report generation endpoints
│   │   │   ├── aws/                 # AWS integration endpoints
│   │   │   └── db/                  # Database initialization
│   │   ├── layout.tsx               # Root layout with AuthProvider
│   │   └── page.tsx                 # Home dashboard
│   │
│   ├── components/                  # React components (UI ONLY - NO business logic)
│   │   ├── ai-assessment/          # AI Assessment components
│   │   │   ├── AssessmentContainer.tsx          # Main container (UI only, uses container logic)
│   │   │   ├── AssessmentDashboard.tsx
│   │   │   ├── AssessmentWizard.tsx
│   │   │   ├── AssessmentViewer.tsx
│   │   │   ├── CategoryNavigationSidebar.tsx
│   │   │   ├── FixedQuestionContainer.tsx
│   │   │   ├── RAPIDQuestionnaireLoader.tsx
│   │   │   ├── ResponseReviewModal.tsx
│   │   │   ├── AsyncReportGenerator.tsx
│   │   │   ├── ReportStatusTracker.tsx
│   │   │   ├── DatabaseIntegratedAssessmentWizard.tsx  # Main wizard (refactored, 482 lines)
│   │   │   ├── DatabaseIntegratedAssessmentWizardLoader.tsx  # Extracted hook
│   │   │   ├── DatabaseIntegratedAssessmentWizardState.tsx   # Extracted hook
│   │   │   ├── DatabaseIntegratedAssessmentWizardValidation.tsx  # Extracted hook
│   │   │   ├── QuestionnaireFlow.tsx              # Main flow (refactored, 383 lines)
│   │   │   ├── QuestionnaireFlowAutoSave.tsx      # Extracted hook
│   │   │   ├── QuestionnaireFlowNavigation.tsx    # Extracted hook
│   │   │   ├── QuestionnaireFlowResponses.tsx     # Extracted hook
│   │   │   ├── RAPIDAssessmentWizard.tsx          # Main wizard (refactored, 402 lines)
│   │   │   ├── RAPIDAssessmentWizardCategories.tsx    # Extracted hook
│   │   │   ├── RAPIDAssessmentWizardQuestions.tsx      # Extracted hook
│   │   │   ├── RAPIDAssessmentWizardProgress.tsx      # Extracted hook
│   │   │   ├── DatabaseIntegratedProgressTracker.tsx  # Main tracker (refactored, 344 lines)
│   │   │   ├── DatabaseIntegratedProgressTrackerLogic.tsx  # Extracted hook
│   │   │   └── DatabaseIntegratedProgressTrackerUI.tsx    # Extracted hook
│   │   ├── company-settings/        # Company Settings components
│   │   │   ├── CompanyDashboard.tsx
│   │   │   ├── CompanyForm.tsx
│   │   │   ├── CompanyCard.tsx
│   │   │   └── CompanySearch.tsx
│   │   ├── ApplicationShell.tsx    # Main layout with sidebar
│   │   ├── AuthWrapper.tsx         # Auth provider wrapper
│   │   ├── RouteGuard.tsx          # Route protection component
│   │   ├── Sidebar.tsx             # Main navigation sidebar
│   │   └── LoginPage.tsx           # Login form component
│   │
│   ├── containers/                 # Business logic containers (NO UI rendering)
│   │   ├── ai-assessment/         # AI Assessment business logic
│   │   │   └── AssessmentContainerLogic.tsx  # Assessment CRUD operations
│   │   ├── authentication/         # Authentication business logic (empty - using services)
│   │   └── company-settings/       # Company Settings business logic (empty - ready for future)
│   │
│   ├── contexts/                   # React contexts (state management only)
│   │   └── AuthContext.tsx         # Authentication context (refactored, uses auth-service)
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAssessmentViewer.ts
│   │   ├── useAutoSave.ts
│   │   ├── useConditionalAuth.ts
│   │   ├── useExternalAuth.ts
│   │   └── useValidation.ts
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── api-client.ts           # API client utilities
│   │   ├── api-utils.ts            # API helper functions
│   │   ├── AuthProviderRegistry.ts # External auth integration
│   │   ├── config.ts               # Environment configuration
│   │   ├── constants.ts            # Application constants
│   │   ├── mongodb.ts              # MongoDB connection
│   │   ├── models/                 # Data models
│   │   │   ├── Assessment.ts
│   │   │   ├── Company.ts
│   │   │   └── Report.ts
│   │   ├── services/               # Business logic services (NO UI)
│   │   │   ├── auth-service.ts     # Authentication business logic (extracted from AuthContext)
│   │   │   ├── rapid-questionnaire-service.ts
│   │   │   └── assessment-service.ts
│   │   └── validation/             # Validation utilities
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── assessment.ts           # Assessment types
│   │   ├── company.ts              # Company types
│   │   ├── rapid-questionnaire.ts  # RAPID questionnaire types
│   │   └── index.ts                # Common types
│   │
│   ├── utils/                      # Utility functions
│   │   ├── assessment-helpers.ts
│   │   ├── company-validation.ts
│   │   ├── rapid-questionnaire-utils.ts
│   │   ├── time-helpers.ts         # Local time formatting utilities (Rule 4 compliance)
│   │   └── error-handling.ts
│   │
│   ├── middleware.ts               # Next.js middleware
│   │
│   └── __tests__/                  # Test suite
│       ├── api/                    # API route tests
│       ├── components/             # Component tests
│       ├── integration/            # Integration tests
│       ├── properties/              # Property-based tests
│       └── unit/                    # Unit tests
│
├── .kiro/
│   └── specs/                      # Feature specifications
│       ├── ai-assessment/          # AI Assessment specs
│       ├── company-settings/       # Company Settings specs
│       └── assessment-status-ui/   # Status UI specs
│
├── document/                       # Project documentation
│   ├── Application-instruction.md
│   ├── project-structure.md        # This file
│   ├── requirement/                # Requirements documents
│   ├── modules/                    # Module documentation (3 groups, 5 modules)
│   │   ├── README.md              # Module overview
│   │   ├── ai-assessment/         # AI Assessment Group (1 module)
│   │   │   ├── README.md
│   │   │   ├── requirement.md
│   │   │   ├── structure.md
│   │   │   ├── flow.md
│   │   │   ├── feature.md
│   │   │   └── checklist.md
│   │   ├── security/              # Security Group (2 modules)
│   │   │   ├── authentication/
│   │   │   │   ├── README.md
│   │   │   │   ├── requirement.md
│   │   │   │   ├── structure.md
│   │   │   │   ├── flow.md
│   │   │   │   ├── feature.md
│   │   │   │   └── checklist.md
│   │   │   └── route-protection/
│   │   │       ├── README.md
│   │   │       ├── requirement.md
│   │   │       ├── structure.md
│   │   │       ├── flow.md
│   │   │       ├── feature.md
│   │   │       └── checklist.md
│   │   └── supporting/            # Supporting Modules (2 modules)
│   │       ├── company-settings/
│   │       │   ├── README.md
│   │       │   ├── requirement.md
│   │       │   ├── structure.md
│   │       │   ├── flow.md
│   │       │   ├── feature.md
│   │       │   └── checklist.md
│   │       └── sidebar-navigation/
│   │           ├── README.md
│   │           ├── requirement.md
│   │           ├── structure.md
│   │           ├── flow.md
│   │           ├── feature.md
│   │           └── checklist.md
│   └── doing/                      # Work tracking files
│
├── docs/                          # Generated documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # Architecture docs
│   ├── modules/                   # Module documentation
│   └── testing/                   # Testing documentation
│
└── assessment-question/           # RAPID questionnaire data
    └── RAPID_Questionnaires_FINAL.md
```

## Key Features

### 1. Authentication System
- Environment-based authentication control
- Configurable session management
- Route protection (client and server-side)
- External system integration support

### 2. AI Assessment Module
- **RAPID Questionnaire Integration**: 162 questions organized by categories
- **Category-Based Navigation**: 5 categories for Exploratory, 6 for Migration
- **Enhanced Progress Tracking**: Visual progress indicators with clickable navigation
- **Fixed-Size Question Container**: Consistent UI with proper scrolling
- **Response Review System**: Comprehensive review before completion
- **Auto-save Functionality**: Automatic saving every 30 seconds
- **Asynchronous Report Generation**: External API Gateway integration
- **Code Organization**: 
  - Components split into smaller files (all under 500 lines)
  - Business logic extracted to containers/services
  - Custom hooks for reusable logic

### 3. Company Settings Module
- Company CRUD operations
- Assessment count tracking
- Search functionality
- Integration with AI Assessment module

### 4. Route Protection Module
- Route protection based on authentication state
- Automatic redirect to login when needed
- Return URL preservation
- Configurable auth-enabled/disabled modes

### 5. Sidebar Navigation Module
- Collapsible navigation sidebar
- Responsive design with mobile support
- State persistence (remembers collapsed/expanded state)
- Active route highlighting

## Data Models

### MongoDB Collections

1. **companies**: Company information
2. **assessments**: Assessment data with category-based responses
3. **rapid_questionnaires**: RAPID questionnaire structure
4. **reports**: Generated assessment reports
5. **report_requests**: Asynchronous report generation requests

## API Structure

### Assessment APIs
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/[id]` - Get assessment
- `PUT /api/assessments/[id]` - Update assessment
- `DELETE /api/assessments/[id]` - Delete assessment
- `GET /api/assessments/[id]/responses` - Get responses
- `PUT /api/assessments/[id]/responses` - Save responses
- `GET /api/assessments/[id]/review` - Get review summary

### Company APIs
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get company
- `PUT /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company
- `GET /api/companies/search` - Search companies

### Questionnaire APIs
- `GET /api/questionnaires/rapid` - Get RAPID questionnaire
- `GET /api/questionnaires/rapid/init` - Initialize questionnaires

### Report APIs
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/[id]` - Get report

## Testing Strategy

- **Unit Tests**: Component and function-level testing
- **Integration Tests**: End-to-end workflow testing
- **Property-Based Tests**: Universal correctness properties
- **Test Coverage**: Comprehensive coverage across all modules

## Development Workflow

1. **Phase 1**: UI/UX Foundation with RAPID Integration
2. **Phase 2**: Data Integration with MongoDB
3. **Phase 3**: Enhanced Features Integration
4. **Phase 4**: External API Integration for Report Generation

## Environment Configuration

Key environment variables:
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: Database name
- `AUTH_ENABLED`: Enable/disable authentication
- `SESSION_TIMEOUT`: Session timeout in milliseconds
- `EXTERNAL_API_GATEWAY_URL`: External API Gateway endpoint

## Code Organization & Compliance

### Application-instruction Compliance

The codebase follows strict coding rules defined in `Application-instruction.md`:

- **Rule 1: NextJS Core Application** ✅
  - Uses Next.js 14+ with App Router
  - All components use `'use client'` directive where needed

- **Rule 2: Directory Structure & Separation** ✅
  - `components/` directory: UI components ONLY (no business logic)
  - `containers/` directory: Business logic ONLY (no UI rendering)
  - `lib/services/` directory: Service layer for business logic
  - Clean separation of concerns

- **Rule 3: File Size Limitation** ✅
  - All files are under 500 lines
  - Large components split into smaller, focused files
  - Extracted hooks for reusable logic

- **Rule 4: Time Handling** ✅
  - All user-facing time displays use local machine time
  - `src/utils/time-helpers.ts` provides local time utilities
  - No UTC/server time for user-facing updates

### Refactoring Summary

**Files Created (14 files)**:
- 11 extracted hook files from large components
- 1 container logic file (`containers/ai-assessment/AssessmentContainerLogic.tsx`)
- 1 service file (`lib/services/auth-service.ts`)
- 1 utility file (`utils/time-helpers.ts`)

**Files Refactored (8 files)**:
- 5 large components split and refactored (all now under 500 lines)
- 1 context refactored to use service layer
- 3 files fixed for time handling compliance

## Current State

All major features are implemented and tested. The platform is ready for production use with comprehensive assessment capabilities, company management, and asynchronous report generation. All code complies with Application-instruction rules.

### Module Organization

The platform follows a modular architecture with 3 main groups:

1. **AI Assessment Group** (1 module)
   - Core assessment functionality with RAPID integration
   - Includes Assessment Status UI and Report Generation features

2. **Security Group** (2 modules)
   - Authentication system with configurable framework
   - Route protection with automatic redirect handling

3. **Supporting Modules** (2 modules)
   - Company management and organization
   - Navigation sidebar with responsive design

All modules are fully documented with comprehensive documentation (requirements, structure, flow, features, and checklists) located in `document/modules/`.
