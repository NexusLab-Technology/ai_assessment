# Implementation Plan: AI Assessment Module with RAPID Integration

## Overview

Implementation plan สำหรับ AI Assessment module ที่เน้นการพัฒนาแบบ phase-based โดยเริ่มจาก UI/UX foundation ก่อน แล้วค่อยเพิ่ม data persistence และ **External API Gateway integration** ในภายหลัง เพื่อให้สามารถทดสอบ application flow ได้เร็วขึ้น โดยระบบจะไม่เรียก AWS Bedrock โดยตรง แต่จะส่งข้อมูลไปยัง External API Gateway ที่จะจัดการการสร้างรายงานผ่าน Lambda functions และ SQS queue

**ฟีเจอร์ใหม่ที่เพิ่มเข้ามา:**
- **RAPID Questionnaire Integration**: คำถามใหม่ทั้งหมด 162 ข้อจาก RAPID Assessment Questionnaires
- **Category-Based Navigation**: จัดระเบียบคำถามตาม categories (5 สำหรับ Exploratory, 6 สำหรับ Migration)
- **Enhanced Progress Sidebar**: แสดง progress navigation ด้านซ้ายที่คลิกกระโดดได้
- **Fixed-Size Question Container**: กล่องคำถามขนาดคงที่เพื่อ UI ที่สวยและเสถียร
- **Response Review System**: ให้ผู้ใช้สามารถดูคำตอบที่กรอกไปแล้วและทบทวนทั้งหมดก่อนส่ง assessment
- **Asynchronous Report Generation**: ใช้ External API Gateway + Lambda + SQS แทนการเรียก AWS Bedrock โดยตรง พร้อม status tracking และ polling mechanism

## Tasks

### Phase 1: Enhanced UI/UX Foundation with RAPID Integration (Week 1-2)

- [x] 1. Setup RAPID questionnaire data structure and core interfaces
  - Create TypeScript interfaces for RAPID questionnaire structure
  - Parse RAPID_Questionnaires_FINAL.md into structured data
  - Set up component folder structure for enhanced AI Assessment module
  - Configure mock data files with RAPID structure for development
  - _Requirements: 4.1, 14.1, 14.2, 14.3_

- [x] 1.1 Write property test for RAPID questionnaire structure
  - **Property 1: RAPID questionnaire structure consistency**
  - **Validates: Requirements 4.1, 14.1**

- [x] 2. Implement CategoryNavigationSidebar component
  - [x] 2.1 Create CategoryNavigationSidebar component with RAPID categories
    - Display main categories in left sidebar (5 for Exploratory, 6 for Migration)
    - Handle category selection and state management
    - Show visual progress indicators for each category
    - Implement responsive design for mobile devices
    - _Requirements: 12.1, 12.2, 4.2, 4.3_

  - [x] 2.2 Write property test for category navigation
    - **Property 7: Category navigation sidebar**
    - **Validates: Requirements 12.1**

- [x] 3. Build FixedQuestionContainer component
  - [x] 3.1 Create FixedQuestionContainer with consistent dimensions
    - Maintain fixed container size across all question types
    - Implement proper scrolling when content exceeds container
    - Provide responsive design for different screen sizes
    - Prevent layout shifts during navigation
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 3.2 Write property test for fixed container behavior
    - **Property 9: Fixed container dimensions**
    - **Validates: Requirements 13.1, 13.3**

- [x] 4. Implement RAPIDQuestionnaireLoader component
  - [x] 4.1 Create RAPIDQuestionnaireLoader with RAPID data integration
    - Load and parse RAPID questionnaire structure from data source
    - Organize questions by categories for both assessment types
    - Handle different structures for Exploratory vs Migration paths
    - Cache questionnaire data for performance
    - _Requirements: 14.4, 14.6, 4.2, 4.3_

  - [x] 4.2 Write property test for questionnaire loading
    - **Property 2: Exploratory path category structure**
    - **Property 3: Migration path category structure**
    - **Validates: Requirements 4.2, 4.3, 14.2, 14.3**

- [x] 5. Build enhanced AssessmentWizard with category-based flow
  - [x] 5.1 Create AssessmentWizard component with category navigation
    - Implement category-based questionnaire flow instead of step-based
    - Handle form validation and error display for categories
    - Auto-save responses every 30 seconds with category structure
    - Coordinate with CategoryNavigationSidebar and FixedQuestionContainer
    - _Requirements: 4.4, 4.5, 5.1, 5.2_

  - [x] 5.2 Write property test for category-based navigation
    - **Property 4: Response preservation during navigation**
    - **Validates: Requirements 4.4, 12.5**

- [x] 6. Implement EnhancedProgressTracker with category visualization
  - [x] 6.1 Create EnhancedProgressTracker component
    - Display visual progress for each category instead of steps
    - Allow direct navigation to categories by clicking
    - Show completion indicators and progress percentages
    - Highlight current active category
    - _Requirements: 12.2, 12.3, 12.4, 12.6_

  - [x] 6.2 Write property test for visual progress indicators
    - **Property 8: Visual completion indicators**
    - **Validates: Requirements 12.2**

- [x] 7. Add category-based response management
  - [x] 7.1 Implement category navigation with localStorage persistence
    - Create category navigation buttons instead of Previous/Next
    - Handle category validation before allowing navigation
    - Store responses in localStorage organized by categories for Phase 1
    - Implement "Complete Assessment" button when all categories done
    - _Requirements: 4.5, 4.6, 5.3_

  - [x] 7.2 Write property test for category progression validation
    - **Property 5: Category progression validation**
    - **Validates: Requirements 4.5**

  - [x] 7.3 Write property test for assessment completion
    - **Property 6: Assessment completion detection**
    - **Validates: Requirements 4.6**

- [x] 8. Build ResponseReviewModal with category organization
  - [x] 8.1 Create ResponseReviewModal component
    - Display comprehensive summary organized by categories
    - Highlight unanswered required questions
    - Allow direct navigation to specific categories for editing
    - Provide final completion validation based on RAPID structure
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 8.2 Write property test for response review completeness
    - **Property 11: Complete question information display**
    - **Validates: Requirements 14.4**

- [x] 9. Checkpoint - Enhanced UI Flow Testing with RAPID Integration
  - Ensure all components render correctly with RAPID data structure
  - Test complete assessment flow with category-based navigation
  - Test response review functionality with RAPID categories
  - Test fixed-size question container with various question types
  - Verify navigation between categories works properly
  - All property-based tests passing for enhanced features

### Phase 2: Data Integration with Category Structure (Week 3-4)

- [x] 10. Setup MongoDB connection and enhanced schemas for RAPID structure
  - [x] 10.1 Configure MongoDB connection and RAPID questionnaire schemas
    - Set up MongoDB connection string and database configuration
    - Create database schemas for RAPID questionnaires, category-based assessments
    - Implement proper indexing for category-based queries
    - Store RAPID questionnaire structure in MongoDB
    - _Requirements: 5.4, 14.1, 14.5_

  - [x] 10.2 Create API routes for category-based assessment operations
    - Implement GET /api/questionnaires/rapid for RAPID data
    - Create PUT /api/assessments/[id]/responses for category-based saves
    - Add GET /api/assessments/[id]/review for category review
    - Implement category-based CRUD operations
    - _Requirements: 2.2, 2.4, 2.5, 8.1_

  - [x] 10.3 Write property test for category-based data persistence
    - **Property 4: Response preservation during navigation**
    - **Validates: Requirements 4.4, 12.5**

- [x] 11. Implement enhanced auto-save functionality for categories
  - [x] 11.1 Replace localStorage with API calls for category structure
    - Implement auto-save every 30 seconds for category responses
    - Add immediate save on category navigation
    - Track category completion status (not_started, partial, completed)
    - Handle network errors and retry logic for category operations
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.2 Write property test for category-based auto-save
    - **Property 12: Original numbering preservation**
    - **Validates: Requirements 14.6**

- [x] 12. Add category-based response review API endpoints
  - [x] 12.1 Implement category-based assessment review API
    - Create GET /api/assessments/[id]/review endpoint for categories
    - Calculate completion status for each category
    - Return organized response summary by categories
    - Handle validation for category-based assessment completion
    - _Requirements: 11.4, 11.6, 11.7_

  - [x] 12.2 Write property test for category review data accuracy
    - **Property 10: Category review data accuracy**
    - **Validates: Requirements 11.4, 11.6, 11.7**

- [x] 13. Add comprehensive error handling and loading states
  - [x] 13.1 Implement error boundaries and user feedback for categories
    - Add loading spinners for all category-based async operations
    - Create error messages for category navigation failures
    - Implement retry mechanisms for failed category operations
    - Add form validation error display for category forms
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Checkpoint - Data Integration Testing with RAPID Structure
  - Test all CRUD operations with real MongoDB and RAPID structure
  - Verify category-based auto-save functionality works correctly
  - Test category-based response review API with various completion states
  - Ensure error handling provides good user experience for categories
  - Ask user for feedback on category-based data persistence behavior

### Phase 3: Enhanced Features Integration (Week 5)

- [x] 15. Complete CategoryNavigationSidebar integration with real data
  - [x] 15.1 Finalize CategoryNavigationSidebar with database integration
    - Connect CategoryNavigationSidebar to real RAPID questionnaire data
    - Implement real-time category completion status updates
    - Add proper error handling for category loading failures
    - Test category navigation with various assessment states
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 15.2 Write integration test for category navigation
    - Test end-to-end category navigation with real data
    - Verify category completion status accuracy
    - Test category switching preserves responses
    - _Requirements: 12.1, 12.4, 12.5_

- [x] 16. Complete FixedQuestionContainer responsive behavior
  - [x] 16.1 Finalize FixedQuestionContainer responsive design
    - Test fixed container behavior across all screen sizes
    - Ensure proper scrolling with various question content lengths
    - Verify layout stability during category transitions
    - Optimize container dimensions for mobile devices
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 16.2 Write responsive behavior tests
    - Test container dimensions across different screen sizes
    - Verify scrolling behavior with long content
    - Test layout stability during navigation
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 17. Integrate RAPIDQuestionnaireLoader with database
  - [x] 17.1 Complete RAPIDQuestionnaireLoader database integration
    - Connect RAPIDQuestionnaireLoader to MongoDB RAPID data
    - Implement caching for RAPID questionnaire data
    - Add proper error handling for questionnaire loading
    - Test with both Exploratory and Migration assessment types
    - _Requirements: 14.1, 14.4, 14.6_

  - [x] 17.2 Write property test for RAPID data loading
    - **Property 1: RAPID questionnaire structure consistency**
    - **Property 11: Complete question information display**
    - **Validates: Requirements 4.1, 14.1, 14.4**

- [x] 18. Test enhanced progress tracking with category completion
  - [x] 18.1 Complete EnhancedProgressTracker integration
    - Test progress tracking with real category completion data
    - Verify visual indicators update correctly
    - Test clickable category navigation functionality
    - Ensure progress calculations are accurate for RAPID structure
    - _Requirements: 12.2, 12.3, 12.6_

  - [x] 18.2 Write integration test for progress tracking
    - Test progress visualization with various completion states
    - Verify category highlighting and navigation
    - Test progress calculation accuracy
    - _Requirements: 12.2, 12.6_

- [x] 19. Add comprehensive validation for RAPID structure
  - [x] 19.1 Implement RAPID structure validation
    - Validate RAPID questionnaire data integrity
    - Add validation for category-based responses
    - Implement completion validation based on RAPID requirements
    - Add error handling for invalid RAPID data
    - _Requirements: 4.5, 14.7_

  - [x] 19.2 Write validation tests
    - Test RAPID structure validation
    - Test category completion validation
    - Test response validation against RAPID requirements
    - _Requirements: 4.5, 14.7_

- [ ] 20. Checkpoint - Enhanced Features Integration Testing
  - Test all enhanced features with real data integration
  - Verify CategoryNavigationSidebar works with database
  - Test FixedQuestionContainer responsive behavior
  - Test RAPIDQuestionnaireLoader with MongoDB
  - Verify enhanced progress tracking accuracy
  - Test comprehensive RAPID structure validation
  - Ask user for feedback on enhanced features integration

### Phase 4: External API Integration for Asynchronous Report Generation (Week 6)

- [ ] 21. Implement External API Gateway integration for report generation
  - [ ] 21.1 Create External API client for report generation requests
    - Implement API client for External API Gateway communication
    - Create report generation request payload with assessment data
    - Handle External API authentication and error responses
    - Add request ID tracking for asynchronous processing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 21.2 Write integration test for External API communication
    - Test report generation request to External API Gateway
    - Verify request payload structure and authentication
    - Test error handling for External API failures
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 22. Build AsyncReportGenerator with External API integration
  - [ ] 22.1 Create AsyncReportGenerator component for External API
    - Implement report generation through External API Gateway calls
    - Add request status tracking and display
    - Handle asynchronous report completion workflow
    - Provide retry functionality for failed External API requests
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 22.2 Write test for asynchronous report generation
    - Test External API report generation workflow
    - Verify status tracking through database queries
    - Test retry functionality for failed requests
    - _Requirements: 7.1, 7.2, 7.5, 7.7_

- [ ] 23. Implement ReportStatusTracker with database polling
  - [ ] 23.1 Build ReportStatusTracker with MongoDB status queries
    - Implement periodic querying of MongoDB for report status updates
    - Display request history and current status from database records
    - Handle different status states (PENDING, PROCESSING, COMPLETED, FAILED)
    - Add automatic refresh and manual refresh capabilities from database
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 23.2 Write test for database status tracking
    - Test database querying mechanism with various status records
    - Verify status update handling and display from MongoDB
    - Test automatic and manual refresh functionality
    - _Requirements: 7.2, 7.3, 7.6_

- [ ] 24. Add comprehensive error handling for External API integration
  - [ ] 24.1 Implement External API error handling and recovery
    - Handle External API Gateway timeouts and failures
    - Implement exponential backoff for polling requests
    - Add user-friendly error messages for External API issues
    - Provide fallback mechanisms when External API is unavailable
    - _Requirements: 7.5, 7.7_

  - [ ] 24.2 Write error handling tests for External API
    - Test External API timeout and failure scenarios
    - Verify error message display and recovery mechanisms
    - Test retry logic and exponential backoff
    - _Requirements: 7.5, 7.7_

- [ ] 25. Checkpoint - External API Integration Testing
  - Test complete External API Gateway integration workflow
  - Verify asynchronous report generation through External API
  - Test status tracking through database queries instead of API polling
  - Ensure error handling provides good user experience
  - Test retry functionality for failed External API requests
  - Ask user for feedback on External API integration

## Notes

- Tasks focus on RAPID questionnaire integration with category-based navigation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties for RAPID structure
- Unit tests validate specific examples and edge cases
- Phase-based approach allows for early testing and feedback with RAPID integration
- Enhanced features include category-based navigation, fixed-size containers, and RAPID-aware reporting
- Category-based structure replaces step-based approach for better user experience
- RAPID questionnaire provides comprehensive AI readiness assessment framework

## Task Status Summary

**All tasks are now required for comprehensive implementation:**
- ✅ No optional tasks - all features will be implemented from start
- ✅ Property-based tests are required for all core functionality
- ✅ Unit tests are required for specific examples and edge cases
- ✅ Integration tests are required for end-to-end workflows
- ✅ Comprehensive testing approach ensures high quality delivery

**Total Tasks:** 25 main tasks with comprehensive testing coverage
**Total Properties:** 12 correctness properties covering all RAPID features
**Implementation Timeline:** 6 weeks with 4 phases of development

This comprehensive approach ensures that all RAPID questionnaire features, category-based navigation, fixed-size containers, and enhanced user experience are fully implemented and thoroughly tested from the beginning.