# Requirements Document

## Introduction

ปรับปรุงหน้าแสดงรายการ Assessment ให้แสดงสถานะและการดำเนินการที่เหมาะสมตามสถานะของ Assessment แต่ละรายการ

## Glossary

- **Assessment**: การประเมิน AI ของบริษัท
- **Assessment_List**: หน้าแสดงรายการ Assessment ทั้งหมดของบริษัท
- **Status_Indicator**: สัญลักษณ์แสดงสถานะของ Assessment
- **Action_Button**: ปุ่มสำหรับดำเนินการกับ Assessment
- **Session_Data**: ข้อมูลที่กรอกในแต่ละ session ของ Assessment
- **View_Mode**: โหมดแสดงข้อมูลที่กรอกแล้วโดยไม่สามารถแก้ไขได้

## Requirements

### Requirement 1: Assessment Status Display

**User Story:** As a user, I want to see appropriate status indicators for each assessment, so that I can quickly understand which assessments need completion and which are finished.

#### Acceptance Criteria

1. WHEN an Assessment is not completed, THE Assessment_List SHALL display an edit icon instead of a view icon
2. WHEN an Assessment is completed, THE Assessment_List SHALL display a view icon
3. THE Status_Indicator SHALL clearly differentiate between completed and incomplete assessments
4. WHEN displaying assessment status, THE Assessment_List SHALL maintain visual consistency with existing design

### Requirement 2: Assessment Action Management

**User Story:** As a user, I want different action options based on assessment status, so that I can either continue editing incomplete assessments or review completed ones.

#### Acceptance Criteria

1. WHEN a user clicks on an incomplete Assessment, THE System SHALL navigate to edit mode
2. WHEN a user clicks on a completed Assessment, THE System SHALL navigate to view mode
3. THE Action_Button SHALL be contextually appropriate for the assessment status
4. WHEN navigating to edit mode, THE System SHALL preserve existing assessment data
5. WHEN navigating to view mode, THE System SHALL prevent data modification

### Requirement 3: Completed Assessment Viewer

**User Story:** As a user, I want to view all previously entered data in completed assessments, so that I can review the complete assessment history organized by session.

#### Acceptance Criteria

1. WHEN viewing a completed Assessment, THE System SHALL display all entered data from top to bottom
2. WHEN displaying assessment data, THE System SHALL organize information by session
3. WHEN showing session data, THE System SHALL clearly separate each session visually
4. THE View_Mode SHALL display all questions and their corresponding answers
5. WHEN in view mode, THE System SHALL prevent any data editing or modification
6. THE Session_Data SHALL be displayed in chronological order
7. WHEN displaying sessions, THE System SHALL include session metadata (date, time, progress)