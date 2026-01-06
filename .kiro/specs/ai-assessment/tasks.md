# Implementation Plan: AI Assessment Module

## Overview

Implementation plan สำหรับ AI Assessment module ที่เน้นการพัฒนาแบบ phase-based โดยเริ่มจาก UI/UX foundation ก่อน แล้วค่อยเพิ่ม data persistence และ external API integration ในภายหลัง เพื่อให้สามารถทดสอบ application flow ได้เร็วขึ้น

**ฟีเจอร์ใหม่ที่เพิ่มเข้ามา:**
- Response Review System: ให้ผู้ใช้ดูคำตอบที่กรอกไปแล้วและทบทวนทั้งหมดก่อนส่ง
- Enhanced Progress Visualization: แสดงสถานะความคืบหน้าแบบ visual และคลิกไปยัง step ต่างๆ ได้
- Asynchronous Report Generation: ใช้ External API + Lambda + SQS แทนการเรียก AWS Bedrock โดยตรง

## Tasks

### Phase 1: UI/UX Foundation (Week 1-2)

- [x] 1. Setup project structure and core interfaces
  - Create TypeScript interfaces for Assessment, Company, and Question types
  - Set up component folder structure for AI Assessment module
  - Configure mock data files for development
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 1.1 Write property test for TypeScript interface validation
  - **Property 10: Assessment-company relationship integrity**
  - **Validates: Requirements 5.5**

- [x] 2. Implement SubSidebar navigation component
  - [x] 2.1 Create SubSidebar component with AI Assessment menu item
    - Display "AI Assessment" menu item in sub sidebar
    - Handle active state highlighting for assessment pages
    - Implement responsive collapse for mobile devices
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write property test for SubSidebar active state
    - **Property 1: Sub-sidebar active state consistency**
    - **Validates: Requirements 1.3**

- [x] 3. Build Company Selection interface
  - [x] 3.1 Create CompanySelector component with mock data
    - Display available companies in dropdown format
    - Handle company selection and state management
    - Show "Create Company" redirect when no companies exist
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Write property test for company-based filtering
    - **Property 2: Company-based assessment filtering**
    - **Validates: Requirements 2.2**

- [x] 4. Implement Assessment Dashboard
  - [x] 4.1 Create AssessmentDashboard component
    - Display assessments for selected company using mock data
    - Show assessment status, progress, and dates
    - Implement create new assessment functionality
    - Add delete assessment for draft status
    - _Requirements: 2.4, 2.5, 8.1, 8.2, 8.3_

  - [x] 4.2 Write property test for assessment creation
    - **Property 3: Assessment creation with company association**
    - **Validates: Requirements 2.4, 2.5, 3.5**

- [x] 5. Build Assessment Creation Wizard
  - [x] 5.1 Create AssessmentWizard component structure
    - Implement assessment naming step
    - Add path selection (Exploratory vs Migration)
    - Create assessment initialization logic with mock data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.2 Write unit tests for assessment initialization
    - Test Exploratory path creates 7 steps
    - Test Migration path creates 8 steps
    - Test assessment name validation
    - _Requirements: 3.3, 3.4_

- [x] 6. Implement Multi-Step Questionnaire Flow
  - [x] 6.1 Create QuestionStep component with all question types
    - Support text, textarea, select, multiselect, radio, checkbox, number inputs
    - Implement form validation for each question type
    - Add question descriptions and help text display
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 6.2 Build ProgressTracker component
    - Display current step and total steps
    - Show progress bar with completion percentage
    - Handle responsive design for mobile devices
    - _Requirements: 4.1, 8.3, 8.4, 8.5_

  - [x] 6.3 Write property test for progress tracking
    - **Property 6: Progress indicator accuracy**
    - **Validates: Requirements 4.1**

- [x] 7. Add Navigation and Response Management
  - [x] 7.1 Implement step navigation with localStorage persistence
    - Create Previous/Next navigation buttons
    - Handle step validation before progression
    - Store responses in localStorage for Phase 1
    - Implement "Complete Assessment" button on final step
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 7.2 Write property test for step validation
    - **Property 5: Step progression and validation**
    - **Validates: Requirements 4.2, 4.4**

  - [x] 7.3 Write property test for response preservation
    - **Property 7: Response preservation during navigation**
    - **Validates: Requirements 4.3**

- [x] 8. Create Report Viewer with mock content
  - [x] 8.1 Build ReportViewer component
    - Display sample HTML report content
    - Implement responsive report layout
    - Add report metadata display (generation date, company name)
    - _Requirements: 7.6, 8.1, 8.2, 8.3_

  - [x] 8.2 Write property test for report viewing
    - **Property 14: Report viewing functionality**
    - **Validates: Requirements 7.6**

- [ ] 9. Implement Enhanced Progress Visualization
  - [ ] 9.1 Create EnhancedProgressTracker component
    - Display visual states for all steps (not started, partial, completed, current)
    - Add clickable navigation to any step
    - Show completion indicators and progress percentages
    - Implement responsive design for mobile devices
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 9.2 Write property test for visual progress indicators
    - **Property 16: Visual progress indicators consistency**
    - **Validates: Requirements 11.1, 12.1, 12.2, 12.3**

  - [ ] 9.3 Write property test for step navigation
    - **Property 15: Step navigation with response preservation**
    - **Validates: Requirements 11.2, 11.5, 12.4, 12.5**

- [ ] 10. Build Response Review System
  - [ ] 10.1 Create ResponseReviewModal component
    - Display comprehensive summary of all questions and answers
    - Organize responses by step with clear visual hierarchy
    - Highlight unanswered required questions
    - Allow direct navigation to specific questions for editing
    - _Requirements: 11.3, 11.4, 11.5, 11.6_

  - [ ] 10.2 Write property test for response review completeness
    - **Property 17: Response review completeness**
    - **Validates: Requirements 11.4, 11.6**

  - [ ] 10.3 Implement assessment completion validation
    - Add "Review All Responses" option on final step
    - Enable complete button only when all required fields are filled
    - Integrate review modal with assessment wizard
    - _Requirements: 11.3, 11.7_

  - [ ] 10.4 Write property test for completion validation
    - **Property 18: Assessment completion validation**
    - **Validates: Requirements 11.7**

- [ ] 11. Create Asynchronous Report Generation UI
  - [ ] 11.1 Build AsyncReportGenerator component
    - Create report generation request interface
    - Display "Report Generation in Progress" status
    - Show request ID and estimated completion time
    - Handle report generation initiation with mock external API
    - _Requirements: 6.1, 6.2, 7.1_

  - [ ] 11.2 Build ReportStatusTracker component
    - Display report generation request history
    - Show current status for each request
    - Implement periodic status polling (mock)
    - Add retry functionality for failed requests
    - _Requirements: 7.2, 7.3, 7.5, 7.6_

  - [ ] 11.3 Write property test for async report workflow
    - **Property 19: Asynchronous report generation workflow**
    - **Validates: Requirements 6.1, 6.2, 6.6, 7.1, 7.2, 7.3**

- [x] 12. Checkpoint - UI Flow Testing
  - Ensure all components render correctly across screen sizes
  - Test complete assessment flow with enhanced progress tracking
  - Test response review functionality with mock data
  - Test asynchronous report generation UI flow
  - Verify navigation between all screens works properly
  - Ask user for feedback on UI/UX flow including new features

### Phase 2: Data Integration (Week 3-4)

- [-] 13. Setup MongoDB connection and schemas
  - [x] 13.1 Configure MongoDB connection and environment variables
    - Set up MongoDB connection string and database configuration
    - Create database schemas for Assessments, Companies, Reports, and Report Requests
    - Implement proper indexing for performance
    - _Requirements: 5.4, 9.1_

  - [x] 13.2 Create API routes for assessment CRUD operations
    - Implement GET /api/assessments with company filtering
    - Create POST /api/assessments for assessment creation
    - Add PUT /api/assessments/[id] for updates with step status tracking
    - Implement DELETE /api/assessments/[id] for deletion
    - _Requirements: 2.2, 2.4, 2.5, 8.1_

  - [x] 13.3 Write property test for data persistence
    - **Property 8: Assessment state persistence**
    - **Validates: Requirements 5.3**

- [ ] 14. Implement enhanced auto-save functionality
  - [ ] 14.1 Replace localStorage with API calls including step status tracking
    - Implement auto-save every 30 seconds (background process)
    - Add immediate save on step navigation with step status updates
    - Track step completion status (not_started, partial, completed)
    - Handle network errors and retry logic
    - _Requirements: 5.1, 5.2, 5.3, 12.1_

  - [ ] 14.2 Write property test for navigation-triggered save
    - **Property 9: Navigation-triggered save**
    - **Validates: Requirements 5.2**

- [ ] 15. Add response review API endpoints
  - [ ] 15.1 Implement assessment review API
    - Create GET /api/assessments/[id]/review endpoint
    - Calculate completion status and required field tracking
    - Return organized response summary by step
    - Handle validation for assessment completion
    - _Requirements: 11.4, 11.6, 11.7_

  - [ ] 15.2 Write property test for review data accuracy
    - **Property 17: Response review completeness**
    - **Validates: Requirements 11.4, 11.6**

- [x] 16. Add comprehensive error handling and loading states
  - [x] 16.1 Implement error boundaries and user feedback
    - Add loading spinners for all async operations
    - Create error messages for network failures
    - Implement retry mechanisms for failed operations
    - Add form validation error display
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 17. Checkpoint - Data Integration Testing
  - Test all CRUD operations with real MongoDB
  - Verify enhanced auto-save functionality works correctly
  - Test response review API with various completion states
  - Ensure error handling provides good user experience
  - Ask user for feedback on data persistence behavior

### Phase 3: External API Integration (Week 5)

- [ ] 18. Implement External API integration for report generation
  - [ ] 18.1 Create external API client and report request management
    - Build API client for external report generation service
    - Implement report generation request creation and storage
    - Add request ID tracking and status management
    - Handle API authentication and error responses
    - _Requirements: 6.1, 6.2, 6.3, 7.1_

  - [ ] 18.2 Write property test for external API integration
    - **Property 19: Asynchronous report generation workflow**
    - **Validates: Requirements 6.1, 6.2, 6.6, 7.1, 7.2, 7.3**

- [ ] 19. Build asynchronous report status tracking system
  - [ ] 19.1 Implement report status polling and updates
    - Create periodic polling mechanism for report status
    - Handle status transitions (PENDING → PROCESSING → COMPLETED/FAILED)
    - Implement user notifications for completed reports
    - Store generated reports with proper associations
    - _Requirements: 6.6, 7.2, 7.3, 7.4, 7.7_

  - [ ] 19.2 Write property test for report data persistence
    - **Property 21: Report data persistence and associations**
    - **Validates: Requirements 7.4, 7.6, 7.7**

- [ ] 20. Add comprehensive error handling for async operations
  - [ ] 20.1 Implement retry mechanisms and error recovery
    - Handle external API failures and timeouts
    - Implement exponential backoff for retry attempts
    - Display detailed error messages and recovery options
    - Track error history and retry counts
    - _Requirements: 6.7, 7.5_

  - [ ] 20.2 Write property test for error handling
    - **Property 20: Report generation error handling**
    - **Validates: Requirements 6.7, 7.5**

- [ ] 21. Checkpoint - External API Integration Testing
  - Test report generation with various assessment types
  - Verify asynchronous status tracking works correctly
  - Test error handling and retry mechanisms
  - Ensure report storage and associations are correct
  - Ask user for feedback on async report generation flow

### Phase 4: Polish and Integration (Week 6)

- [ ] 22. Implement Company Settings integration
  - [ ] 22.1 Connect with Company Settings module
    - Handle company selection from Company Settings
    - Display company name consistently across interfaces
    - Implement proper navigation between modules
    - _Requirements: 2.6, 6.1, 6.2, 6.3, 6.4_

  - [ ] 22.2 Write property test for company name display
    - **Property 4: Company name display consistency**
    - **Validates: Requirements 2.6**

- [ ] 23. Add comprehensive form validation and accessibility
  - [ ] 23.1 Implement client and server-side validation
    - Add real-time validation for all question types
    - Implement proper error message display
    - Handle edge cases and invalid inputs
    - Add accessibility features for form validation
    - Ensure review modal is accessible
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 24. Performance optimization and caching
  - [ ] 24.1 Implement caching and performance improvements
    - Add response caching for better performance
    - Optimize database queries with proper indexing
    - Implement lazy loading for large assessment lists
    - Add compression for report storage
    - Optimize polling intervals for report status
    - _Requirements: 9.4, 9.5_

- [ ] 25. Final testing and integration
  - [ ] 25.1 Comprehensive testing and bug fixes
    - Run all property-based tests with full coverage
    - Test responsive design across all devices
    - Test enhanced progress tracking and review functionality
    - Test asynchronous report generation end-to-end
    - Verify accessibility compliance
    - Fix any remaining bugs and edge cases
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 25.2 Write integration tests for complete enhanced flow
    - Test end-to-end assessment creation and completion with review
    - Test enhanced progress tracking and navigation
    - Test asynchronous report generation workflow
    - Verify cross-module integration works correctly
    - Test error recovery scenarios
    - _Requirements: All requirements_

- [ ] 26. Final checkpoint - Complete enhanced system testing
  - Ensure all tests pass and system is stable
  - Test all new features (review, enhanced progress, async reports)
  - Verify all requirements are met and working
  - Ask user for final approval and feedback

## Notes

- All tasks are required for comprehensive testing and quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Phase-based approach allows for early testing and feedback
- New features include enhanced progress tracking, response review system, and asynchronous report generation
- External API integration replaces direct AWS Bedrock calls for better scalability
- Enhanced UI components provide better user experience and accessibility