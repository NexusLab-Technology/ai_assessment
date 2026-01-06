# Requirements Document

## Introduction

AI Assessment module เป็นส่วนหนึ่งของ application ที่ให้ผู้ใช้สามารถประเมินความพร้อมในการใช้ GenAI ได้ โดยรองรับทั้งการพัฒนา AI ใหม่และการ migrate AI ที่มีอยู่ ผ่านการตอบแบบสอบถามแบบขั้นตอน และสร้างรายงานผลการประเมินด้วย AI

## Glossary

- **AI_Assessment_System**: ระบบประเมินความพร้อม GenAI
- **Assessment**: การประเมินหนึ่งครั้ง ประกอบด้วยคำถามหลายขั้นตอน
- **Company**: บริษัทหรือองค์กรที่ทำการประเมิน
- **Exploratory_Path**: เส้นทางสำหรับการพัฒนา AI ใหม่
- **Migration_Path**: เส้นทางสำหรับการ migrate AI ที่มีอยู่
- **Assessment_Report**: รายงานผลการประเมินที่สร้างด้วย AI
- **MongoDB_Database**: ฐานข้อมูล MongoDB สำหรับเก็บข้อมูล
- **AWS_Bedrock**: บริการ AI ของ AWS สำหรับสร้างรายงาน
- **Sub_Sidebar**: แถบเมนูย่อยที่แสดงชื่อ "AI Assessment"
- **Company_Settings**: ระบบจัดการข้อมูล Company

## Requirements

### Requirement 1: Module Navigation and Access

**User Story:** As a user, I want to access the AI Assessment module through the sub sidebar, so that I can navigate to assessment features easily.

#### Acceptance Criteria

1. WHEN a user views the application, THE Sub_Sidebar SHALL display "AI Assessment" as a menu item
2. WHEN a user clicks on "AI Assessment" in the sub sidebar, THE AI_Assessment_System SHALL navigate to the assessment dashboard
3. THE Sub_Sidebar SHALL highlight the "AI Assessment" item when the user is in any assessment-related page

### Requirement 2: Company Selection and Assessment Management

**User Story:** As a user, I want to select a company and manage multiple assessments for that company, so that I can organize assessments by organization.

#### Acceptance Criteria

1. WHEN a user accesses the AI Assessment module, THE AI_Assessment_System SHALL display a company selection interface if companies exist
2. WHEN a user selects a company, THE AI_Assessment_System SHALL show all assessments for that company
3. WHEN no companies exist, THE AI_Assessment_System SHALL redirect to Company_Settings to create a company first
4. THE AI_Assessment_System SHALL allow users to create new assessments with custom names for the selected company
5. WHEN creating a new assessment, THE AI_Assessment_System SHALL require an assessment name and associate it with the selected company
6. THE AI_Assessment_System SHALL display company name in the assessment interface header

### Requirement 3: Assessment Path Selection

**User Story:** As a user, I want to choose between new AI development or migration scenarios for my named assessment, so that I can follow the appropriate assessment path.

#### Acceptance Criteria

1. WHEN a user creates a new assessment, THE AI_Assessment_System SHALL prompt for assessment name first
2. AFTER naming the assessment, THE AI_Assessment_System SHALL present two path options: "New AI Development" and "Migrate Existing AI"
3. WHEN a user selects "New AI Development", THE AI_Assessment_System SHALL initialize an Exploratory_Path assessment with 7 steps
4. WHEN a user selects "Migrate Existing AI", THE AI_Assessment_System SHALL initialize a Migration_Path assessment with 8 steps
5. THE AI_Assessment_System SHALL store the assessment name, company ID, and selected path type in the Assessment record

### Requirement 4: Category-Based Questionnaire Flow with Enhanced Navigation

**User Story:** As a user, I want to complete assessment questionnaires organized by categories with enhanced navigation, so that I can efficiently provide comprehensive information about my AI readiness.

#### Acceptance Criteria

1. WHEN a user is in an assessment, THE AI_Assessment_System SHALL display the updated RAPID questionnaire structure with proper categorization
2. FOR Exploratory Path, THE AI_Assessment_System SHALL organize questions into 5 main categories: Use Case Discovery (48 questions), Data Readiness (25 questions), Compliance & Integration (27 questions), Model Evaluation (guided process), and Business Value & ROI (10 questions)
3. FOR Migration Path, THE AI_Assessment_System SHALL organize questions into 6 main categories: Use Case Discovery (same as exploratory), Current System Assessment (52 questions), Data Readiness (25 questions), Compliance & Integration (27 questions), Model Evaluation (guided process), and Business Value & ROI (10 questions)
4. WHEN a user navigates between categories or questions, THE AI_Assessment_System SHALL preserve previously entered responses
5. THE AI_Assessment_System SHALL validate required fields before allowing category or step progression
6. WHEN a user completes all categories, THE AI_Assessment_System SHALL display a "Complete Assessment" button

### Requirement 5: Assessment Data Management

**User Story:** As a user, I want my assessment responses to be saved automatically, so that I can resume my assessment later without losing data.

#### Acceptance Criteria

1. WHEN a user enters responses in any step, THE AI_Assessment_System SHALL auto-save responses to MongoDB_Database every 30 seconds
2. WHEN a user navigates away from a step, THE AI_Assessment_System SHALL save current responses to MongoDB_Database immediately
3. WHEN a user returns to a saved assessment, THE AI_Assessment_System SHALL restore all previous responses and current step position
4. THE MongoDB_Database SHALL store assessment data with proper indexing for company-based and user-based queries
5. THE AI_Assessment_System SHALL associate each assessment with a company ID for proper data organization

### Requirement 6: AWS Bedrock Integration

**User Story:** As an administrator, I want to configure AWS Bedrock access using AWS credentials, so that the system can generate AI-powered assessment reports.

#### Acceptance Criteria

1. THE AI_Assessment_System SHALL accept AWS Access Key ID and Secret Access Key for Bedrock authentication
2. WHEN AWS credentials are provided, THE AI_Assessment_System SHALL validate connectivity to AWS_Bedrock service
3. WHEN generating reports, THE AI_Assessment_System SHALL use AWS_Bedrock to analyze assessment responses and create insights
4. IF AWS credentials are invalid or missing, THE AI_Assessment_System SHALL display appropriate error messages and disable report generation

### Requirement 7: HTML Report Generation and Storage

**User Story:** As a user, I want to generate comprehensive assessment reports, so that I can review and share my AI readiness evaluation results.

#### Acceptance Criteria

1. WHEN a user completes an assessment, THE AI_Assessment_System SHALL enable report generation functionality
2. WHEN generating a report, THE AI_Assessment_System SHALL use AWS_Bedrock to analyze responses and create structured insights
3. THE AI_Assessment_System SHALL format the generated content as HTML with proper styling and structure
4. THE AI_Assessment_System SHALL store the HTML Assessment_Report directly in MongoDB_Database
5. WHEN a report is generated, THE AI_Assessment_System SHALL create a unique report ID and timestamp
6. THE AI_Assessment_System SHALL allow users to view generated reports in a formatted display
7. THE AI_Assessment_System SHALL associate reports with both assessment ID and company ID

### Requirement 8: Assessment Dashboard and Management

**User Story:** As a user, I want to view and manage assessments for the selected company from a central dashboard, so that I can track assessment history and progress by organization.

#### Acceptance Criteria

1. WHEN a user selects a company, THE AI_Assessment_System SHALL display a dashboard with all assessments for that company
2. THE AI_Assessment_System SHALL show assessment name, status (Draft, In Progress, Completed), and dates for each assessment
3. WHEN a user clicks on an assessment, THE AI_Assessment_System SHALL navigate to the appropriate step or summary view
4. THE AI_Assessment_System SHALL allow users to delete draft assessments for the selected company
5. THE AI_Assessment_System SHALL display creation date and last modified date for each assessment
6. THE AI_Assessment_System SHALL provide functionality to create new assessments for the selected company
7. THE AI_Assessment_System SHALL allow users to switch between companies without losing current context

### Requirement 8: Responsive UI Design

**User Story:** As a user, I want the assessment interface to work well on different screen sizes, so that I can complete assessments on various devices.

#### Acceptance Criteria

1. THE AI_Assessment_System SHALL display properly on desktop screens (1024px and above)
2. THE AI_Assessment_System SHALL adapt layout for tablet screens (768px to 1023px)
3. THE AI_Assessment_System SHALL provide mobile-friendly interface for screens below 768px
4. WHEN on mobile devices, THE Sub_Sidebar SHALL collapse into a hamburger menu
5. THE AI_Assessment_System SHALL maintain usability and readability across all supported screen sizes

### Requirement 9: Form Validation and Error Handling

**User Story:** As a user, I want clear feedback when I make input errors, so that I can correct them and proceed with my assessment.

#### Acceptance Criteria

1. WHEN a user submits invalid or incomplete required fields, THE AI_Assessment_System SHALL display specific error messages
2. THE AI_Assessment_System SHALL highlight invalid fields with visual indicators
3. WHEN validation errors occur, THE AI_Assessment_System SHALL prevent step progression until errors are resolved
4. THE AI_Assessment_System SHALL provide helpful hints for complex question types
5. WHEN system errors occur, THE AI_Assessment_System SHALL display user-friendly error messages and suggest recovery actions

### Requirement 10: Assessment Question Types Support

**User Story:** As a user, I want to answer different types of questions in my assessment, so that I can provide comprehensive and accurate information.

#### Acceptance Criteria

1. THE AI_Assessment_System SHALL support text input questions for descriptive responses
2. THE AI_Assessment_System SHALL support single-select dropdown questions for categorical choices
3. THE AI_Assessment_System SHALL support multi-select checkbox questions for multiple options
4. THE AI_Assessment_System SHALL support radio button questions for exclusive choices
5. THE AI_Assessment_System SHALL support textarea questions for longer text responses
6. THE AI_Assessment_System SHALL support numeric input questions with validation
7. WHEN displaying questions, THE AI_Assessment_System SHALL show question descriptions and help text where applicable

### Requirement 11: Response Review and Navigation

**User Story:** As a user, I want to review my previously filled responses and see all my answers before completing the assessment, so that I can verify my information is accurate and complete.

#### Acceptance Criteria

1. WHEN a user is in any assessment step, THE AI_Assessment_System SHALL display a clickable indicator for steps that contain saved responses
2. WHEN a user clicks on a step with saved responses, THE AI_Assessment_System SHALL navigate to that step and display the previously filled answers
3. WHEN a user reaches the final step, THE AI_Assessment_System SHALL provide a "Review All Responses" option before the complete button
4. WHEN a user selects "Review All Responses", THE AI_Assessment_System SHALL display a comprehensive summary of all questions and their corresponding answers organized by step
5. WHEN viewing the response summary, THE AI_Assessment_System SHALL allow users to click on any question to navigate directly to that step for editing
6. WHEN in the review summary, THE AI_Assessment_System SHALL highlight any required questions that remain unanswered
7. WHEN a user completes the review, THE AI_Assessment_System SHALL return to the final step with the complete assessment button enabled only if all required fields are filled

### Requirement 12: Enhanced Category-Based Progress Navigation

**User Story:** As a user, I want to see visual indicators of my progress by category and navigate between categories easily, so that I can efficiently track and complete different sections of my assessment.

#### Acceptance Criteria

1. WHEN displaying the progress navigation, THE AI_Assessment_System SHALL show a left sidebar with main category headers and subcategories that can be clicked to jump between sections
2. WHEN a category has saved responses, THE AI_Assessment_System SHALL display visual indicators (checkmarks, progress bars, or completion percentages) to show completion status
3. WHEN a category has partial responses, THE AI_Assessment_System SHALL display different visual indicators to show partial completion with specific progress percentages
4. THE AI_Assessment_System SHALL allow users to click on any category or subcategory to navigate directly to that section
5. WHEN navigating via category navigation, THE AI_Assessment_System SHALL preserve the current section's responses before navigation
6. THE AI_Assessment_System SHALL highlight the current active category and subcategory in the navigation sidebar
7. WHEN on mobile devices, THE AI_Assessment_System SHALL provide a collapsible category navigation that doesn't interfere with the main content area

### Requirement 13: Fixed-Size Question Display Interface

**User Story:** As a user, I want the question display area to have a consistent and fixed size, so that the interface remains visually stable and professional throughout my assessment.

#### Acceptance Criteria

1. WHEN displaying questions in the main content area, THE AI_Assessment_System SHALL maintain a fixed-size container for question content that doesn't change based on question length or type
2. THE AI_Assessment_System SHALL implement proper scrolling within the question container when content exceeds the fixed dimensions
3. WHEN switching between questions or categories, THE AI_Assessment_System SHALL maintain the same container dimensions to prevent layout shifts
4. THE AI_Assessment_System SHALL ensure the fixed-size question container is responsive and adapts appropriately to different screen sizes while maintaining proportional stability
5. THE AI_Assessment_System SHALL provide adequate padding and spacing within the fixed container to ensure readability and visual appeal
6. WHEN displaying different question types (text, dropdown, checkbox, etc.), THE AI_Assessment_System SHALL ensure all elements fit properly within the fixed container dimensions

### Requirement 14: RAPID Questionnaire Integration

**User Story:** As a user, I want to answer the complete RAPID questionnaire with all updated questions and categories, so that I can provide comprehensive AI readiness assessment information.

#### Acceptance Criteria

1. THE AI_Assessment_System SHALL implement the complete RAPID questionnaire structure with 162 total questions organized by categories
2. FOR Exploratory Path, THE AI_Assessment_System SHALL include: Use Case Discovery (48 questions in 5 subcategories), Data Readiness (25 questions in 4 subcategories), Compliance & Integration (27 questions in 5 subcategories), Model Evaluation (guided process), and Business Value & ROI (10 questions)
3. FOR Migration Path, THE AI_Assessment_System SHALL include all Exploratory categories plus Current System Assessment (52 questions in 8 subcategories)
4. WHEN displaying questions, THE AI_Assessment_System SHALL show the complete question text, descriptions, and any specific formatting from the RAPID questionnaire
5. THE AI_Assessment_System SHALL organize questions within each category by their defined subcategories for better navigation
6. THE AI_Assessment_System SHALL preserve the original question numbering and structure from the RAPID questionnaire
7. WHEN a user completes a category, THE AI_Assessment_System SHALL calculate and display completion statistics matching the RAPID structure