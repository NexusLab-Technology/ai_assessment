# Design Document

## Overview

ปรับปรุงหน้าแสดงรายการ Assessment ให้แสดงสถานะและการดำเนินการที่เหมาะสมตามสถานะของ Assessment แต่ละรายการ โดยเฉพาะการแยกแยะระหว่าง Assessment ที่ยังไม่เสร็จสิ้น (แสดงไอคอน edit) และ Assessment ที่เสร็จสิ้นแล้ว (แสดงไอคอน view พร้อมโหมดดูข้อมูลแบบ read-only)

## Architecture

### Component Structure

```
AssessmentDashboard (Modified)
├── Assessment List Items
│   ├── Status Icons (Edit/View based on completion)
│   ├── Action Buttons (contextual)
│   └── Assessment Metadata
└── Assessment Viewer (New)
    ├── Session-based Data Display
    ├── Read-only Question Responses
    └── Navigation Controls
```

### Data Flow

1. **Assessment Status Detection**: ตรวจสอบ `assessment.status` เพื่อกำหนดไอคอนและการดำเนินการ
2. **Action Routing**: นำทางไปยัง edit mode หรือ view mode ตามสถานะ
3. **Data Retrieval**: โหลดข้อมูลการตอบคำถามทั้งหมดสำหรับ view mode
4. **Session Organization**: จัดกลุ่มข้อมูลตาม session และแสดงตามลำดับเวลา

## Components and Interfaces

### Modified AssessmentDashboard Component

```typescript
interface AssessmentDashboardProps {
  company: Company | null
  assessments: Assessment[]
  onCreateAssessment: () => void
  onSelectAssessment: (assessment: Assessment) => void
  onViewAssessment: (assessment: Assessment) => void // New prop
  onDeleteAssessment: (assessmentId: string) => void
  isLoading?: boolean
  isDeletingAssessment?: string | null
}
```

### New AssessmentViewer Component

```typescript
interface AssessmentViewerProps {
  assessment: Assessment
  responses: AssessmentResponses
  sections: QuestionSection[]
  onClose: () => void
  onEdit?: () => void // Optional edit action for completed assessments
}

interface SessionData {
  sessionId: string
  timestamp: Date
  stepId: string
  stepTitle: string
  responses: { [questionId: string]: any }
  questions: Question[]
}

interface ViewerState {
  sessions: SessionData[]
  isLoading: boolean
  error?: string
}
```

### Enhanced Assessment Types

```typescript
// Extend existing Assessment interface
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
  // New fields for session tracking
  sessions?: AssessmentSession[]
}

interface AssessmentSession {
  id: string
  stepId: string
  timestamp: Date
  responses: { [questionId: string]: any }
  metadata?: {
    duration?: number
    userAgent?: string
    ipAddress?: string
  }
}
```

## Data Models

### Session Data Structure

```typescript
interface SessionDataModel {
  // Group responses by session/step
  organizeBySessions(responses: AssessmentResponses, sections: QuestionSection[]): SessionData[]
  
  // Format session data for display
  formatSessionForDisplay(session: SessionData): DisplaySession
  
  // Extract metadata from responses
  extractSessionMetadata(responses: AssessmentResponses): SessionMetadata[]
}

interface DisplaySession {
  title: string
  subtitle: string
  timestamp: string
  questions: DisplayQuestion[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

interface DisplayQuestion {
  id: string
  label: string
  type: string
  response: any
  formattedResponse: string
  isRequired: boolean
}
```

### API Extensions

```typescript
// New API endpoints for assessment viewing
interface AssessmentViewAPI {
  // Get complete assessment data for viewing
  getAssessmentForViewing(assessmentId: string): Promise<{
    assessment: Assessment
    responses: AssessmentResponses
    sections: QuestionSection[]
    sessions: AssessmentSession[]
  }>
  
  // Get formatted session data
  getSessionData(assessmentId: string): Promise<SessionData[]>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status-based Icon Display
*For any* assessment in the assessment list, the displayed icon should be an edit icon when the assessment is not completed, and a view icon when the assessment is completed
**Validates: Requirements 1.1, 1.2**

### Property 2: Status Indicator Differentiation
*For any* two assessments with different completion statuses, their status indicators should be visually different
**Validates: Requirements 1.3**

### Property 3: Status-based Navigation
*For any* assessment, clicking on it should navigate to edit mode if incomplete, and to view mode if completed
**Validates: Requirements 2.1, 2.2**

### Property 4: Contextual Action Buttons
*For any* assessment, the action button should match the expected action type (edit/view) based on the assessment's completion status
**Validates: Requirements 2.3**

### Property 5: Data Preservation in Edit Mode
*For any* assessment with existing data, navigating to edit mode should preserve all previously entered assessment data
**Validates: Requirements 2.4**

### Property 6: Read-only View Mode
*For any* completed assessment in view mode, all form elements should be read-only and prevent data modification
**Validates: Requirements 2.5, 3.5**

### Property 7: Complete Data Display
*For any* completed assessment, view mode should display all previously entered data without omission
**Validates: Requirements 3.1**

### Property 8: Session-based Organization
*For any* assessment with multiple data entry sessions, the view mode should organize and group data by session
**Validates: Requirements 3.2**

### Property 9: Session Visual Separation
*For any* assessment view with multiple sessions, each session should be visually separated from others
**Validates: Requirements 3.3**

### Property 10: Question-Answer Completeness
*For any* session in view mode, every question should have its corresponding answer displayed
**Validates: Requirements 3.4**

### Property 11: Chronological Session Ordering
*For any* assessment with multiple sessions, sessions should be displayed in chronological order by timestamp
**Validates: Requirements 3.6**

### Property 12: Session Metadata Completeness
*For any* session displayed in view mode, it should include all required metadata (date, time, progress information)
**Validates: Requirements 3.7**

## Error Handling

### Assessment Loading Errors
- **Network Failures**: แสดง error message พร้อม retry option
- **Invalid Assessment ID**: Redirect กลับไปหน้า assessment list
- **Permission Errors**: แสดง access denied message

### Data Integrity Errors
- **Missing Response Data**: แสดง warning และ partial data ที่มีอยู่
- **Corrupted Session Data**: Skip corrupted sessions และแสดง warning
- **Incomplete Metadata**: ใช้ default values สำหรับ metadata ที่หายไป

### UI State Management
- **Loading States**: แสดง skeleton loaders ระหว่างโหลดข้อมูล
- **Empty States**: แสดง appropriate messages เมื่อไม่มีข้อมูล
- **Error Recovery**: ให้ options สำหรับ retry หรือ fallback actions

## Testing Strategy

### Unit Testing
- **Icon Display Logic**: ทดสอบการแสดงไอคอนที่ถูกต้องตามสถานะ
- **Navigation Routing**: ทดสอบการ route ไปยัง edit/view mode
- **Data Formatting**: ทดสอบการ format ข้อมูลสำหรับการแสดงผล
- **Session Organization**: ทดสอบการจัดกลุ่มข้อมูลตาม session

### Property-Based Testing
- **Status-Icon Mapping**: ทดสอบ property ที่ไอคอนตรงกับสถานะ assessment
- **Navigation Consistency**: ทดสอบ property ที่ navigation ตรงกับสถานะ
- **Data Preservation**: ทดสอบ property ที่ข้อมูลไม่สูญหายระหว่าง navigation
- **Read-only Enforcement**: ทดสอบ property ที่ view mode ป้องกันการแก้ไข
- **Session Ordering**: ทดสอบ property ที่ session เรียงตามเวลา
- **Metadata Completeness**: ทดสอบ property ที่ metadata ครบถ้วน

### Integration Testing
- **End-to-End Workflows**: ทดสอบ flow จาก assessment list ไปยัง edit/view mode
- **API Integration**: ทดสอบการโหลดและบันทึกข้อมูล assessment
- **State Synchronization**: ทดสอบการ sync state ระหว่าง components

### Configuration Requirements
- **Property Tests**: รัน minimum 100 iterations ต่อ property test
- **Test Tags**: แต่ละ property test ต้องมี tag ที่อ้างอิง design property
- **Tag Format**: **Feature: assessment-status-ui, Property {number}: {property_text}**