# RAPID Assessment Platform - Technical Specifications Summary

## Quick Reference for Development with AWS Kiro

### Project Overview
A Next.js web application for conducting comprehensive GenAI readiness assessments, supporting both new AI development and migration scenarios.

---

## Technology Stack

**Frontend Framework**
- Next.js 14 with App Router
- React 18 with Server Components
- TypeScript for type safety
- TailwindCSS for styling
- shadcn/ui component library

**Backend & Services**
- Next.js API Routes for serverless endpoints
- AWS SDK for JavaScript v3

**AWS Services**
- Amazon Cognito: User authentication and authorization
- Amazon DynamoDB: Primary database for assessments and user data
- Amazon S3: Document storage and generated reports
- AWS Bedrock: AI model access (Claude, Amazon Nova, Llama)
- Amazon Comprehend: Text analysis (optional)
- AWS Amplify: Deployment and hosting
- Amazon CloudFront: CDN for global content delivery

---

## Database Schema (DynamoDB Tables)

### Assessments Table
```
Primary Key: assessmentId (String)
GSI: userId-index on userId field

Fields:
- assessmentId: String (UUID)
- userId: String (Cognito User ID)
- organizationName: String
- assessmentType: String ("EXPLORATORY" | "MIGRATION")
- status: String ("DRAFT" | "IN_PROGRESS" | "COMPLETED")
- currentStep: Number (1-8 for exploratory, 1-9 for migration)
- responses: Map (nested object structure)
  - useCaseDiscovery: Map
  - currentSystemAssessment: Map (migration only)
  - dataReadiness: Map
  - compliance: Map
  - modelEvaluation: Map
  - businessValue: Map
  - implementationPlan: Map
- createdAt: String (ISO timestamp)
- updatedAt: String (ISO timestamp)
- completedAt: String (ISO timestamp, nullable)
```

### Reports Table
```
Primary Key: reportId (String)
GSI: assessmentId-index on assessmentId field

Fields:
- reportId: String (UUID)
- assessmentId: String
- userId: String
- format: String ("PDF" | "DOCX" | "JSON")
- s3Bucket: String
- s3Key: String
- presignedUrl: String (temporary, expires in 7 days)
- generatedAt: String (ISO timestamp)
- metadata: Map
  - assessmentType: String
  - organizationName: String
  - generationDuration: Number (seconds)
```

### Users Table (managed by Cognito, but tracked in DynamoDB)
```
Primary Key: userId (String)

Fields:
- userId: String (Cognito User ID)
- email: String
- name: String
- organization: String
- role: String ("ADMIN" | "USER" | "VIEWER")
- createdAt: String
- lastLoginAt: String
```

---

## API Routes Structure

### Authentication
- POST /api/auth/signup - Create new user
- POST /api/auth/signin - User login
- POST /api/auth/signout - User logout
- GET /api/auth/session - Get current session

### Assessments
- GET /api/assessments - List all assessments for user
- POST /api/assessments - Create new assessment
- GET /api/assessments/[id] - Get specific assessment
- PUT /api/assessments/[id] - Update assessment
- DELETE /api/assessments/[id] - Delete assessment
- POST /api/assessments/[id]/submit - Submit completed assessment

### Questionnaires
- GET /api/questionnaires/[type] - Get questionnaire structure
- POST /api/assessments/[id]/responses - Save responses
- GET /api/assessments/[id]/progress - Get completion progress

### Model Evaluation
- POST /api/models/test - Test a specific Bedrock model
- POST /api/models/compare - Compare multiple models
- GET /api/models/available - List available Bedrock models

### Reports
- POST /api/reports/generate - Generate assessment report
- GET /api/reports/[id] - Get report metadata
- GET /api/reports/[id]/download - Download report file
- GET /api/reports/assessment/[assessmentId] - Get reports for assessment

---

## Application Routes (Pages)

### Public Routes
- / - Landing page with path selection
- /login - Sign in page
- /signup - Registration page

### Protected Routes (require authentication)
- /dashboard - Assessment dashboard (list view)
- /assessments/new - Create new assessment
- /assessments/[id] - Assessment detail/edit page
- /assessments/[id]/step/[stepNumber] - Questionnaire step
- /assessments/[id]/review - Review before submission
- /assessments/[id]/report - View generated report
- /model-evaluation - Model testing workspace
- /profile - User profile and settings

---

## Key Components Structure

### Layout Components
- AppLayout - Main application shell with navigation
- AuthLayout - Layout for authentication pages
- AssessmentLayout - Layout for assessment flow with progress indicator

### Feature Components
- AssessmentCard - Display assessment summary
- AssessmentList - Grid/list of assessments with filters
- ProgressTracker - Visual progress indicator
- QuestionnaireStep - Single question/section component
- ModelComparisonTable - Side-by-side model results
- ReportViewer - Interactive report display
- NavigationButtons - Previous/Next/Save buttons

### Form Components
- TextInput - Text field with validation
- TextArea - Multi-line text input
- Select - Dropdown selection
- MultiSelect - Multiple option selection
- RadioGroup - Radio button group
- CheckboxGroup - Checkbox group
- FileUpload - File upload component
- DatePicker - Date selection
- NumericInput - Number input with validation
- MatrixQuestion - Grid/matrix question type

### UI Components (shadcn/ui)
- Button, Card, Dialog, Dropdown, Input, Label
- Select, Table, Tabs, Toast, Tooltip
- Alert, Badge, Progress, Skeleton

---

## AWS Bedrock Integration

### Model Configuration
```typescript
const AVAILABLE_MODELS = {
  NOVA_PRO: 'amazon.nova-pro-v1:0',
  NOVA_LITE: 'amazon.nova-lite-v1:0',
  CLAUDE_SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_HAIKU: 'anthropic.claude-3-5-haiku-20241022-v2:0',
  LLAMA_3_1: 'meta.llama3-1-405b-instruct-v1:0'
}
```

### Model Testing Parameters
```typescript
interface ModelTestRequest {
  modelId: string
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

interface ModelTestResult {
  modelId: string
  response: string
  latency: number // milliseconds
  inputTokens: number
  outputTokens: number
  cost: number // estimated
  timestamp: string
}
```

### Report Generation with Bedrock
```typescript
// Use Claude Sonnet for report generation
const generateReportSummary = async (assessmentData: Assessment) => {
  const prompt = `Generate an executive summary for this GenAI assessment...`
  
  const response = await bedrockClient.invokeModel({
    modelId: AVAILABLE_MODELS.CLAUDE_SONNET,
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  })
  
  return response
}
```

---

## State Management

### Global State (React Context)
- AuthContext - User authentication state
- AssessmentContext - Current assessment state
- ThemeContext - UI theme preferences

### Local State (React Hooks)
- useState for component-level state
- useReducer for complex state logic
- useEffect for side effects
- Custom hooks for reusable logic

---

## Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1

# DynamoDB
DYNAMODB_ASSESSMENTS_TABLE=rapid-assessments
DYNAMODB_REPORTS_TABLE=rapid-reports
DYNAMODB_USERS_TABLE=rapid-users

# S3
S3_REPORTS_BUCKET=rapid-assessment-reports
S3_UPLOADS_BUCKET=rapid-user-uploads

# Bedrock
BEDROCK_REGION=us-east-1

# Application
NEXT_PUBLIC_APP_URL=https://rapid-assessment.example.com
NODE_ENV=development
```

---

## Questionnaire Structure (JSON Schema)

### Example Use Case Discovery Section
```json
{
  "sectionId": "use-case-discovery",
  "title": "Use Case Discovery",
  "description": "Understanding your business context and GenAI objectives",
  "questions": [
    {
      "id": "business-problem",
      "type": "textarea",
      "label": "What business problem(s) does your GenAI application aim to solve?",
      "description": "Establishes the fundamental business purpose",
      "required": true,
      "validation": {
        "minLength": 50,
        "maxLength": 1000
      }
    },
    {
      "id": "use-case-state",
      "type": "select",
      "label": "What is the current state of this use case?",
      "required": true,
      "options": [
        { "value": "ideated", "label": "Ideated - Concept stage" },
        { "value": "planned", "label": "Planned - Requirements defined" },
        { "value": "in-progress", "label": "In Progress - Development started" },
        { "value": "pilot", "label": "Pilot - Testing with users" },
        { "value": "production", "label": "Production - Live deployment" }
      ]
    }
  ]
}
```

---

## Report Template Structure

### Executive Summary Section
```typescript
interface ExecutiveSummary {
  organizationName: string
  assessmentType: 'EXPLORATORY' | 'MIGRATION'
  assessmentDate: string
  keyFindings: string[]
  primaryRecommendation: string
  estimatedROI: {
    implementationCost: number
    annualBenefit: number
    paybackPeriod: number // months
    threeYearValue: number
  }
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  readinessScore: number // 0-100
}
```

### Model Evaluation Section
```typescript
interface ModelEvaluationResults {
  modelsCompared: string[]
  testPrompts: number
  recommendedModel: {
    modelId: string
    modelName: string
    rationale: string
  }
  comparisons: {
    modelId: string
    modelName: string
    averageLatency: number
    averageCost: number
    qualityScore: number // 0-100
    accuracyScore: number // 0-100
    strengthsAndWeaknesses: {
      strengths: string[]
      weaknesses: string[]
    }
  }[]
}
```

---

## Development Workflow with Kiro

### 1. Initial Setup
Use Kiro to scaffold the Next.js project with TypeScript, configure TailwindCSS, and set up the basic folder structure. Let Kiro generate the initial AWS SDK configurations and environment variable templates.

### 2. Component Development
Leverage Kiro's AI capabilities to generate React components based on the design specifications. Use Kiro's code completion to implement form validation, error handling, and responsive design patterns.

### 3. API Route Implementation
Use Kiro to create serverless API routes with proper error handling, authentication middleware, and AWS SDK integrations. Let Kiro help with DynamoDB query patterns and S3 upload logic.

### 4. AWS Integration
Utilize Kiro's understanding of AWS services to implement Cognito authentication flows, DynamoDB CRUD operations, S3 file management, and Bedrock model invocations with proper error handling.

### 5. Testing and Optimization
Use Kiro to generate test cases, identify performance bottlenecks, and suggest optimizations for both frontend rendering and backend API responses.

---

## Key Features Implementation Notes

### Progress Tracking
Implement auto-save functionality that saves responses every 30 seconds or when the user navigates away from a question. Store the current step number in the assessment record to enable resume functionality.

### Model Evaluation Workspace
Create a split-pane interface where users can input prompts on the left and see real-time responses from multiple models on the right. Implement a scoring matrix that allows users to rate responses across multiple dimensions.

### Report Generation
Use AWS Bedrock to analyze assessment responses and generate natural language insights. Combine AI-generated content with structured data to create comprehensive reports. Support multiple export formats by converting a canonical HTML representation to PDF or DOCX.

### Real-time Collaboration (Future Enhancement)
Consider implementing WebSocket connections or Server-Sent Events for real-time updates when multiple team members work on the same assessment.

---

## Performance Considerations

### Frontend Optimization
- Implement React Server Components for initial page loads
- Use dynamic imports for code splitting
- Optimize images with Next.js Image component
- Implement skeleton loading states for better UX

### Backend Optimization
- Use DynamoDB batch operations when possible
- Implement caching for frequently accessed data
- Use S3 Transfer Acceleration for large file uploads
- Optimize Bedrock prompts for faster response times

### Cost Optimization
- Use DynamoDB on-demand pricing for variable workloads
- Implement S3 lifecycle policies to archive old reports
- Monitor Bedrock token usage and optimize prompts
- Use CloudFront caching to reduce origin requests

---

## Security Best Practices

### Authentication & Authorization
- Implement JWT token validation on all protected routes
- Use Cognito user groups for role-based access control
- Implement session timeouts and refresh token rotation
- Add CSRF protection for state-changing operations

### Data Protection
- Encrypt sensitive data in DynamoDB using AWS KMS
- Use S3 bucket policies to restrict access
- Implement proper CORS policies
- Sanitize user inputs to prevent XSS attacks

### API Security
- Implement rate limiting on API routes
- Use AWS WAF to protect against common attacks
- Log all API access for security monitoring
- Validate all inputs on both client and server

---

This specification provides a comprehensive foundation for developing the RAPID Assessment Platform with AWS Kiro. The modular structure allows for incremental development and testing of each component while maintaining a clear path toward the complete solution.
