# Technical Specifications - RAPID AI Assessment Platform

## Overview

This document provides comprehensive technical specifications for the RAPID AI Assessment Platform, including system requirements, technology stack, data models, API specifications, and implementation details.

## System Requirements

### Runtime Environment

- **Node.js**: Version 18.x or higher (check with `node --version`)
- **Next.js**: Version 14.2.0 or higher (as per package.json)
- **React**: Version 18.3.0 or higher (as per package.json)
- **TypeScript**: Version 5.4.0 or higher (as per package.json)

### Database

- **MongoDB**: Version 7.0.0 or higher
- **Connection**: MongoDB URI connection string
- **Collections**: companies, assessments, rapid_questionnaires, reports, report_requests

### External Services

- **AWS Bedrock**: For AI-powered report generation (via External API Gateway)
- **External API Gateway**: Receives report generation requests
- **AWS Lambda**: Processes report generation requests
- **Amazon SQS**: Queue for asynchronous report processing

## Technology Stack

### Frontend

- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Heroicons, Lucide React

### Backend

- **API**: Next.js API Routes (Serverless)
- **Database**: MongoDB 7.0.0+ (native driver, not Mongoose)
- **Validation**: Custom validation utilities and services
- **AWS Integration**: AWS SDK v3 for Bedrock Runtime

### Testing

- **Framework**: Jest
- **Testing Library**: @testing-library/react
- **Property Testing**: fast-check
- **Test Environment**: jsdom

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler

## Data Models

### Company Model

```typescript
interface Company {
  id: string                    // MongoDB ObjectId as string
  name: string                  // 2-100 characters, required
  description?: string           // Max 500 characters, optional
  createdAt: Date               // ISO 8601 date
  updatedAt: Date               // ISO 8601 date
  assessmentCount: number       // Computed field
}

interface CompanyDocument {
  _id: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  userId: string                // Owner of the company
}
```

**Validation Rules**:
- Name: Required, 2-100 characters, unique per user
- Description: Optional, max 500 characters

---

### Assessment Model

```typescript
interface Assessment {
  id: string                    // MongoDB ObjectId as string
  name: string                  // Required
  companyId: string             // Reference to Company
  userId: string                // Owner of the assessment
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  currentCategory: string       // Current active category
  currentSubcategory?: string   // Current active subcategory
  totalCategories: number       // 4 for Exploratory, 5 for Migration
  responses: {
    [categoryId: string]: {
      [questionId: string]: any
    }
  }
  categoryStatuses: {
    [categoryId: string]: {
      categoryId: string
      status: 'not_started' | 'partial' | 'completed'
      completionPercentage: number  // 0-100
      lastModified: Date
      requiredQuestionsCount: number
      answeredRequiredCount: number
      totalQuestionsCount: number
      answeredTotalCount: number
    }
  }
  rapidQuestionnaireVersion: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  // Legacy fields (for backward compatibility)
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
}
```

**Validation Rules**:
- Name: Required, non-empty
- Type: Must be EXPLORATORY or MIGRATION
- CompanyId: Must reference existing company
- Responses: Validated against questionnaire structure

---

### RAPID Questionnaire Model

```typescript
interface RAPIDQuestionnaire {
  version: string
  assessmentType: 'EXPLORATORY' | 'MIGRATION'
  totalQuestions: number
  categories: RAPIDCategory[]
  createdAt: Date
  updatedAt: Date
}

interface RAPIDCategory {
  id: string
  title: string
  description: string
  questionCount: number
  subcategories: RAPIDSubcategory[]
}

interface RAPIDSubcategory {
  id: string
  title: string
  description: string
  questions: RAPIDQuestion[]
}

interface RAPIDQuestion {
  id: string
  number: string                 // Original question number
  text: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number'
  required: boolean
  options?: string[]             // For select, radio, checkbox
  category: string
}
```

**Question Structure**:
- **Exploratory Path**: 4 categories, 110 total questions
  - Use Case Discovery: 48 questions
  - Data Readiness: 25 questions
  - Compliance & Integration: 27 questions
  - Business Value & ROI: 10 questions
- **Migration Path**: 5 categories, 162 total questions
  - Use Case Discovery: 48 questions
  - Current System Assessment: 52 questions (Migration only)
  - Data Readiness: 25 questions
  - Compliance & Integration: 27 questions
  - Business Value & ROI: 10 questions

---

### Report Model

```typescript
interface Report {
  id: string                     // MongoDB ObjectId as string
  assessmentId: string           // Reference to Assessment
  companyId: string              // Reference to Company
  userId: string                 // Owner of the report
  htmlContent: string            // Generated HTML report
  generatedAt: Date
  metadata: {
    assessmentType: string
    companyName: string
    generationDuration: number   // Milliseconds
    bedrockModel: string
  }
}

interface ReportRequest {
  id: string
  assessmentId: string
  companyId: string
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

---

## API Specifications

### Base URL

All API endpoints are prefixed with `/api`

### Authentication

Most endpoints require authentication. The system uses a configurable authentication framework.

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

See [API Documentation](./api/README.md) for detailed endpoint specifications.

## RAPID Questionnaire Structure

### Exploratory Path (4 Categories)

1. **Use Case Discovery** (48 questions)
   - Business Context and Use Case Definition (12 questions)
   - Evaluation and Success Metrics (10 questions)
   - Stakeholder Analysis (10 questions)
   - Risk Assessment (8 questions)
   - Use Case Scenarios (8 questions)

2. **Data Readiness** (25 questions)
   - Data Availability and Sources (7 questions)
   - Data Quality and Preparation (6 questions)
   - Data Governance and Management (6 questions)
   - Data Integration and Infrastructure (6 questions)

3. **Compliance & Integration** (27 questions)
   - Regulatory Compliance (6 questions)
   - Security Requirements (6 questions)
   - Integration Points (5 questions)
   - Data Privacy (5 questions)
   - Audit Requirements (5 questions)

4. **Business Value & ROI** (10 questions)
   - Business Impact and Value Measurement
   - ROI Calculation and Financial Analysis

### Migration Path (5 Categories)

Includes all Exploratory categories plus:

5. **Current System Assessment** (52 questions)
   - Existing AI System Analysis
   - Current Architecture Assessment
   - Performance Metrics Evaluation
   - Integration Points Analysis
   - Data Migration Readiness
   - Technical Debt Assessment
   - Migration Risks Analysis

**Note**: Model Evaluation is a guided process handled separately, not as a questionnaire category.

## Assessment Workflow

### 1. Company Selection

- User selects a company or creates a new one
- System validates company exists
- Redirects to Company Settings if no companies exist

### 2. Assessment Creation

- User provides assessment name
- User selects assessment type (Exploratory or Migration)
- System creates assessment with initial state
- System loads appropriate RAPID questionnaire

### 3. Category Navigation

- User navigates between categories via sidebar
- System preserves responses during navigation
- System tracks category completion status
- System validates required fields before progression

### 4. Response Entry

- User answers questions by category
- System auto-saves every 30 seconds
- System saves immediately on category navigation
- System validates responses in real-time

### 5. Review & Completion

- User reviews all responses before completion
- System validates all required fields are answered
- User marks assessment as completed
- System updates assessment status to COMPLETED

### 6. Report Generation

- User requests report generation
- System sends request to External API Gateway
- System receives request ID for tracking
- System polls MongoDB for status updates
- System displays report when completed

## Auto-save Mechanism

### Implementation

- **Interval-based**: Saves every 30 seconds (30000ms, configurable via `intervalMs`)
- **Navigation-based**: Saves when navigating between categories (via `saveOnNavigation`)
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Retry mechanism for failed saves (default: 3 retries with 1s delay)
- **Category-based**: Manages responses per category for efficient updates

### Data Structure

```typescript
interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'retrying'
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

interface UseAutoSaveOptions {
  assessmentId: string
  intervalMs?: number          // Default: 30000 (30 seconds)
  maxRetries?: number          // Default: 3
  retryDelayMs?: number        // Default: 1000 (1 second)
  enabled?: boolean            // Default: true
}
```

## Report Generation Architecture

### External API Integration

1. **Request Initiation**: Frontend sends assessment data to External API Gateway
2. **Queue Processing**: External API Gateway pushes request to SQS queue
3. **Lambda Processing**: Lambda function processes queue messages
4. **Report Generation**: Lambda invokes AWS Bedrock for report generation
5. **Status Updates**: Lambda updates MongoDB with status and report content
6. **Status Polling**: Frontend polls MongoDB for status updates

### Status Flow

```
PENDING → PROCESSING → COMPLETED
                    ↓
                  FAILED (retryable)
```

## Validation Rules

### Company Validation

- **Name**: Required, 2-100 characters, unique per user
- **Description**: Optional, max 500 characters

### Assessment Validation

- **Name**: Required, non-empty
- **Type**: Must be EXPLORATORY or MIGRATION
- **CompanyId**: Must reference existing company
- **Responses**: Validated against questionnaire structure

### Response Validation

- **Required Fields**: Must be answered before completion
- **Field Types**: Response type must match question type
- **Options**: For select/radio/checkbox, value must be in options
- **Length**: Text responses validated against min/max length

## Error Handling

### Client-Side Errors

- **Network Errors**: Retry with exponential backoff
- **Validation Errors**: Real-time feedback with error messages
- **Save Errors**: Preserve unsaved data and retry
- **Load Errors**: Graceful degradation with error boundaries

### Server-Side Errors

- **400 Bad Request**: Validation errors with specific field messages
- **404 Not Found**: Resource not found with helpful messages
- **500 Internal Server Error**: Generic error with logging

## Performance Requirements

### Response Times

- **API Endpoints**: < 500ms for standard operations
- **Database Queries**: < 200ms for indexed queries
- **Page Load**: < 2s for initial page load
- **Auto-save**: Non-blocking, background operation

### Scalability

- **Concurrent Users**: Support 100+ concurrent users
- **Database**: MongoDB sharding for horizontal scaling
- **API**: Stateless design for horizontal scaling

## Security Requirements

### Authentication

- **Configurable**: Environment-based authentication control
- **Session Management**: Secure session handling with expiration
- **Route Protection**: Client and server-side protection

### Data Security

- **Input Validation**: Client and server-side validation
- **Type Safety**: TypeScript for compile-time safety
- **Error Messages**: Secure error messages (no sensitive data)
- **HTTPS**: Required in production

### API Security

- **Authentication**: Required for protected endpoints
- **Authorization**: User-based data access
- **Rate Limiting**: Protection against abuse
- **Input Sanitization**: All inputs sanitized

## Testing Requirements

### Test Coverage

- **Unit Tests**: > 80% code coverage
- **Integration Tests**: All critical workflows
- **Property-Based Tests**: All correctness properties
- **E2E Tests**: Complete user journeys

### Test Types

1. **Unit Tests**: Component and function-level
2. **Integration Tests**: API and database integration
3. **Property-Based Tests**: Universal correctness properties
4. **E2E Tests**: Complete user workflows

## Deployment Specifications

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://...
MONGODB_DB=ai-assessment

# Authentication
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
REMEMBER_SIDEBAR=true
DEFAULT_ROUTE=/

# External Services
EXTERNAL_API_GATEWAY_URL=https://...
```

### Build Process

1. **Type Checking**: TypeScript compilation
2. **Linting**: ESLint validation
3. **Testing**: Jest test suite
4. **Build**: Next.js production build
5. **Deployment**: Deploy to hosting platform

## Browser Support

### Supported Browsers

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Responsive Design

- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: Below 768px

## Accessibility Requirements

### WCAG Compliance

- **Level**: WCAG 2.1 Level AA
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Sufficient contrast ratios

## Related Documentation

- [Project Structure](../document/project-structure.md)
- [API Documentation](./api/README.md)
- [Architecture Documentation](./architecture/README.md)
- [Module Documentation](./modules/README.md)

