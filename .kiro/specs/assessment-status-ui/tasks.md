# Implementation Plan: Assessment Status UI

## Overview

ปรับปรุงหน้าแสดงรายการ Assessment ให้แสดงสถานะและการดำเนินการที่เหมาะสมตามสถานะของ Assessment แต่ละรายการ โดยเพิ่มโหมดดูข้อมูลสำหรับ Assessment ที่เสร็จสิ้นแล้ว

## Tasks

- [x] 1. Update AssessmentDashboard component for status-based icons and actions
  - Modify icon display logic to show edit icon for incomplete assessments and view icon for completed assessments
  - Update action button handlers to route to appropriate mode based on assessment status
  - Add new onViewAssessment prop to handle view mode navigation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 1.1 Write property test for status-based icon display
  - **Property 1: Status-based Icon Display**
  - **Validates: Requirements 1.1, 1.2**

- [x] 1.2 Write property test for status-based navigation
  - **Property 3: Status-based Navigation**
  - **Validates: Requirements 2.1, 2.2**

- [x] 2. Create AssessmentViewer component for read-only assessment viewing
  - Create new component to display completed assessment data in read-only mode
  - Implement session-based data organization and display
  - Add navigation controls and close functionality
  - Ensure all form elements are read-only and prevent data modification
  - _Requirements: 3.1, 3.2, 3.4, 2.5_

- [x] 2.1 Write property test for read-only view mode
  - **Property 6: Read-only View Mode**
  - **Validates: Requirements 2.5, 3.5**

- [x] 2.2 Write property test for complete data display
  - **Property 7: Complete Data Display**
  - **Validates: Requirements 3.1**

- [x] 3. Implement session data organization and display logic
  - Create utility functions to organize assessment responses by session
  - Implement chronological ordering of sessions by timestamp
  - Add session metadata extraction and formatting
  - Create visual separation between sessions in the UI
  - _Requirements: 3.2, 3.3, 3.6, 3.7_

- [x] 3.1 Write property test for session-based organization
  - **Property 8: Session-based Organization**
  - **Validates: Requirements 3.2**

- [x] 3.2 Write property test for chronological session ordering
  - **Property 11: Chronological Session Ordering**
  - **Validates: Requirements 3.6**

- [x] 3.3 Write property test for session metadata completeness
  - **Property 12: Session Metadata Completeness**
  - **Validates: Requirements 3.7**

- [x] 4. Extend API endpoints for assessment viewing
  - Add new API endpoint to fetch complete assessment data for viewing
  - Implement session data retrieval and formatting
  - Add error handling for missing or corrupted data
  - _Requirements: 3.1, 3.2, 3.7_

- [x] 4.1 Write unit tests for API endpoints
  - Test assessment data retrieval for viewing
  - Test session data formatting and organization
  - Test error handling for invalid assessment IDs

- [x] 5. Update routing and navigation logic
  - Modify assessment selection logic to route to edit or view mode based on status
  - Ensure data preservation when navigating to edit mode
  - Add proper error handling and loading states
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5.1 Write property test for data preservation in edit mode
  - **Property 5: Data Preservation in Edit Mode**
  - **Validates: Requirements 2.4**

- [x] 6. Enhance UI components for visual differentiation
  - Update status indicators to clearly differentiate between completed and incomplete assessments
  - Implement contextual action buttons that match assessment status
  - Add visual separation between sessions in the viewer
  - Ensure question-answer completeness in display
  - _Requirements: 1.3, 2.3, 3.3, 3.4_

- [x] 6.1 Write property test for status indicator differentiation
  - **Property 2: Status Indicator Differentiation**
  - **Validates: Requirements 1.3**

- [x] 6.2 Write property test for contextual action buttons
  - **Property 4: Contextual Action Buttons**
  - **Validates: Requirements 2.3**

- [x] 6.3 Write property test for question-answer completeness
  - **Property 10: Question-Answer Completeness**
  - **Validates: Requirements 3.4**

- [x] 7. Checkpoint - Ensure all tests pass and functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add error handling and loading states
  - Implement proper error handling for assessment loading failures
  - Add loading states for data fetching operations
  - Create fallback UI for missing or corrupted data
  - Add retry mechanisms for failed operations
  - _Requirements: All requirements (error handling)_

- [x] 8.1 Write integration tests for error handling
  - Test network failure scenarios
  - Test invalid assessment ID handling
  - Test corrupted data recovery

- [x] 9. Final integration and testing
  - Wire all components together in the main assessment flow
  - Test end-to-end workflows from assessment list to edit/view modes
  - Verify all requirements are met and properties hold
  - _Requirements: All requirements_

- [x] 9.1 Write integration tests for complete workflows
  - Test complete flow from assessment list to edit mode
  - Test complete flow from assessment list to view mode
  - Test data consistency across navigation

- [x] 10. Final checkpoint - Complete testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality works correctly