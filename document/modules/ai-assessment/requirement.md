# AI Assessment Module - Requirements

## Introduction

AI Assessment module เป็นส่วนหนึ่งของ application ที่ให้ผู้ใช้สามารถประเมินความพร้อมในการใช้ GenAI ได้ โดยรองรับทั้งการพัฒนา AI ใหม่และการ migrate AI ที่มีอยู่ ผ่านการตอบแบบสอบถามแบบขั้นตอน และสร้างรายงานผลการประเมินด้วย AI

Module นี้รวมถึง:
- Core Assessment Functionality
- Assessment Status UI (รวมอยู่ใน module นี้)
- Report Generation (รวมอยู่ใน module นี้)

## Glossary

- **AI_Assessment_System**: ระบบประเมินความพร้อม GenAI
- **Assessment**: การประเมินหนึ่งครั้ง ประกอบด้วยคำถามหลายขั้นตอน
- **Company**: บริษัทหรือองค์กรที่ทำการประเมิน
- **Exploratory_Path**: เส้นทางสำหรับการพัฒนา AI ใหม่
- **Migration_Path**: เส้นทางสำหรับการ migrate AI ที่มีอยู่
- **Assessment_Report**: รายงานผลการประเมินที่สร้างด้วย AI
- **RAPID_Questionnaire**: แบบสอบถาม RAPID ที่มี 162 คำถาม
- **Category**: หมวดหมู่ของคำถาม (5 สำหรับ Exploratory, 6 สำหรับ Migration)
- **Subcategory**: หมวดหมู่ย่อยภายในแต่ละ category
- **Status_Indicator**: สัญลักษณ์แสดงสถานะของ Assessment
- **View_Mode**: โหมดแสดงข้อมูลที่กรอกแล้วโดยไม่สามารถแก้ไขได้

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
3. WHEN a user selects "New AI Development", THE AI_Assessment_System SHALL initialize an Exploratory_Path assessment with 5 categories
4. WHEN a user selects "Migrate Existing AI", THE AI_Assessment_System SHALL initialize a Migration_Path assessment with 6 categories
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

### Requirement 6: External API Integration for Report Generation

**User Story:** As a user, I want the system to generate reports through an external API service, so that report generation doesn't block the user interface and can be processed asynchronously.

#### Acceptance Criteria

1. WHEN a user completes an assessment, THE AI_Assessment_System SHALL call an external API Gateway to initiate report generation
2. THE AI_Assessment_System SHALL send assessment data to the external API Gateway endpoint
3. WHEN the external API receives the request, THE External_API_Gateway SHALL create a report record and push the request to an SQS queue
4. THE AI_Assessment_System SHALL receive a request ID from the external API for tracking purposes
5. THE AI_Assessment_System SHALL NOT directly invoke AWS Bedrock services
6. WHEN the Lambda_Function processes the request, it SHALL pull from SQS and generate the report using AWS Bedrock
7. THE AI_Assessment_System SHALL provide status tracking by querying report records from MongoDB_Database

### Requirement 7: Asynchronous Report Generation and Status Tracking

**User Story:** As a user, I want to track the status of my report generation requests and receive notifications when reports are ready, so that I can access my assessment results when they're completed.

#### Acceptance Criteria

1. WHEN a user requests report generation, THE AI_Assessment_System SHALL display the request status as "PENDING"
2. THE AI_Assessment_System SHALL check report generation status by querying the MongoDB_Database directly
3. WHEN a report is being processed, THE AI_Assessment_System SHALL display status as "PROCESSING" with estimated completion time
4. WHEN a report generation is completed, THE AI_Assessment_System SHALL display status as "COMPLETED" and enable report viewing
5. WHEN a report generation fails, THE AI_Assessment_System SHALL display status as "FAILED" with error details and retry option
6. THE AI_Assessment_System SHALL maintain a history of all report generation requests for each assessment
7. THE AI_Assessment_System SHALL allow users to retry failed report generation requests

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

### Requirement 9: Enhanced Category-Based Progress Navigation

**User Story:** As a user, I want to see visual indicators of my progress by category and navigate between categories easily, so that I can efficiently track and complete different sections of my assessment.

#### Acceptance Criteria

1. WHEN displaying the progress navigation, THE AI_Assessment_System SHALL show a left sidebar with main category headers and subcategories that can be clicked to jump between sections
2. WHEN a category has saved responses, THE AI_Assessment_System SHALL display visual indicators (checkmarks, progress bars, or completion percentages) to show completion status
3. WHEN a category has partial responses, THE AI_Assessment_System SHALL display different visual indicators to show partial completion with specific progress percentages
4. THE AI_Assessment_System SHALL allow users to click on any category or subcategory to navigate directly to that section
5. WHEN navigating via category navigation, THE AI_Assessment_System SHALL preserve the current section's responses before navigation
6. THE AI_Assessment_System SHALL highlight the current active category and subcategory in the navigation sidebar
7. WHEN on mobile devices, THE AI_Assessment_System SHALL provide a collapsible category navigation that doesn't interfere with the main content area

### Requirement 10: Fixed-Size Question Display Interface

**User Story:** As a user, I want the question display area to have a consistent and fixed size, so that the interface remains visually stable and professional throughout my assessment.

#### Acceptance Criteria

1. WHEN displaying questions in the main content area, THE AI_Assessment_System SHALL maintain a fixed-size container for question content that doesn't change based on question length or type
2. THE AI_Assessment_System SHALL implement proper scrolling within the question container when content exceeds the fixed dimensions
3. WHEN switching between questions or categories, THE AI_Assessment_System SHALL maintain the same container dimensions to prevent layout shifts
4. THE AI_Assessment_System SHALL ensure the fixed-size question container is responsive and adapts appropriately to different screen sizes while maintaining proportional stability
5. THE AI_Assessment_System SHALL provide adequate padding and spacing within the fixed container to ensure readability and visual appeal
6. WHEN displaying different question types (text, dropdown, checkbox, etc.), THE AI_Assessment_System SHALL ensure all elements fit properly within the fixed container dimensions

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

### Requirement 12: RAPID Questionnaire Integration

**User Story:** As a user, I want to answer the complete RAPID questionnaire with all updated questions and categories, so that I can provide comprehensive AI readiness assessment information.

#### Acceptance Criteria

1. THE AI_Assessment_System SHALL implement the complete RAPID questionnaire structure with 162 total questions organized by categories
2. FOR Exploratory Path, THE AI_Assessment_System SHALL include: Use Case Discovery (48 questions in 5 subcategories), Data Readiness (25 questions in 4 subcategories), Compliance & Integration (27 questions in 5 subcategories), Model Evaluation (guided process), and Business Value & ROI (10 questions)
3. FOR Migration Path, THE AI_Assessment_System SHALL include all Exploratory categories plus Current System Assessment (52 questions in 8 subcategories)
4. WHEN displaying questions, THE AI_Assessment_System SHALL show the complete question text, descriptions, and any specific formatting from the RAPID questionnaire
5. THE AI_Assessment_System SHALL organize questions within each category by their defined subcategories for better navigation
6. THE AI_Assessment_System SHALL preserve the original question numbering and structure from the RAPID questionnaire
7. WHEN a user completes a category, THE AI_Assessment_System SHALL calculate and display completion statistics matching the RAPID structure

### Requirement 13: Assessment Status Display (from Assessment Status UI)

**User Story:** As a user, I want to see appropriate status indicators for each assessment, so that I can quickly understand which assessments need completion and which are finished.

#### Acceptance Criteria

1. WHEN an Assessment is not completed, THE Assessment_List SHALL display an edit icon instead of a view icon
2. WHEN an Assessment is completed, THE Assessment_List SHALL display a view icon
3. THE Status_Indicator SHALL clearly differentiate between completed and incomplete assessments
4. WHEN displaying assessment status, THE Assessment_List SHALL maintain visual consistency with existing design

### Requirement 14: Assessment Action Management (from Assessment Status UI)

**User Story:** As a user, I want different action options based on assessment status, so that I can either continue editing incomplete assessments or review completed ones.

#### Acceptance Criteria

1. WHEN a user clicks on an incomplete Assessment, THE System SHALL navigate to edit mode
2. WHEN a user clicks on a completed Assessment, THE System SHALL navigate to view mode
3. THE Action_Button SHALL be contextually appropriate for the assessment status
4. WHEN navigating to edit mode, THE System SHALL preserve existing assessment data
5. WHEN navigating to view mode, THE System SHALL prevent data modification

### Requirement 15: Completed Assessment Viewer (from Assessment Status UI)

**User Story:** As a user, I want to view all previously entered data in completed assessments, so that I can review the complete assessment history organized by session.

#### Acceptance Criteria

1. WHEN viewing a completed Assessment, THE System SHALL display all entered data from top to bottom
2. WHEN displaying assessment data, THE System SHALL organize information by session
3. WHEN showing session data, THE System SHALL clearly separate each session visually
4. THE View_Mode SHALL display all questions and their corresponding answers
5. WHEN in view mode, THE System SHALL prevent any data editing or modification
6. THE Session_Data SHALL be displayed in chronological order
7. WHEN displaying sessions, THE System SHALL include session metadata (date, time, progress)
