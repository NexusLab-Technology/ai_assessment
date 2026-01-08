# Function-Based Grouping Plan

## Analysis Date: Thu Jan  8 11:34:43 +07 2026

## Current Status:
- **Total .tsx files**: 36 files
- **Main components** (excluding common/ and hooks/): 22 files
- **Before cleanup**: 48 files
- **After cleanup**: 36 files (ลดลง 12 ไฟล์ ✅)

## Proposed Function-Based Grouping:

### 1. **Wizards/** - Assessment Wizard Components (3 files)
- `DatabaseIntegratedAssessmentWizard.tsx` - Main database-integrated wizard
- `RAPIDAssessmentWizard.tsx` - RAPID questionnaire wizard
- `QuestionnaireFlow.tsx` - Legacy questionnaire flow

### 2. **Progress/** - Progress Tracking Components (3 files)
- `DatabaseIntegratedProgressTracker.tsx` - Database-integrated tracker
- `EnhancedProgressTracker.tsx` - Enhanced tracker
- `ProgressTracker.tsx` - Basic tracker

### 3. **Reports/** - Report Generation & Viewing Components (4 files)
- `AsyncReportGenerator.tsx` - Async report generator
- `ReportGenerator.tsx` - Report generator
- `ReportStatusTracker.tsx` - Report status tracker
- `ReportViewer.tsx` - Report viewer

### 4. **Navigation/** - Navigation Components (3 files)
- `CategoryNavigationSidebar.tsx` - Category navigation
- `EnhancedCategoryNavigationWithSubcategories.tsx` - Enhanced category nav
- `SubSidebar.tsx` - Module navigation sidebar

### 5. **Questions/** - Question Components (2 files)
- `QuestionStep.tsx` - Question step component
- `FixedQuestionContainer.tsx` - Fixed question container
- `RAPIDQuestionnaireLoader.tsx` - RAPID questionnaire loader

### 6. **Assessment/** - Assessment Management Components (4 files)
- `AssessmentContainer.tsx` - Main container
- `AssessmentDashboard.tsx` - Dashboard
- `AssessmentViewer.tsx` - Assessment viewer
- `CompanySelector.tsx` - Company selector

### 7. **Modals/** - Modal Components (1 file)
- `ResponseReviewModal.tsx` - Response review modal

## Proposed Structure:

```
src/components/ai-assessment/
├── common/                          # Shared utilities (4 files) ✅
├── hooks/                          # Extracted hooks (11 files) ✅
├── wizards/                        # Wizard components (3 files)
│   ├── DatabaseIntegratedAssessmentWizard.tsx
│   ├── RAPIDAssessmentWizard.tsx
│   └── QuestionnaireFlow.tsx
├── progress/                       # Progress tracking (3 files)
│   ├── DatabaseIntegratedProgressTracker.tsx
│   ├── EnhancedProgressTracker.tsx
│   └── ProgressTracker.tsx
├── reports/                        # Report components (4 files)
│   ├── AsyncReportGenerator.tsx
│   ├── ReportGenerator.tsx
│   ├── ReportStatusTracker.tsx
│   └── ReportViewer.tsx
├── navigation/                     # Navigation components (3 files)
│   ├── CategoryNavigationSidebar.tsx
│   ├── EnhancedCategoryNavigationWithSubcategories.tsx
│   └── SubSidebar.tsx
├── questions/                      # Question components (3 files)
│   ├── QuestionStep.tsx
│   ├── FixedQuestionContainer.tsx
│   └── RAPIDQuestionnaireLoader.tsx
├── assessment/                     # Assessment management (4 files)
│   ├── AssessmentContainer.tsx
│   ├── AssessmentDashboard.tsx
│   ├── AssessmentViewer.tsx
│   └── CompanySelector.tsx
└── modals/                         # Modal components (1 file)
    └── ResponseReviewModal.tsx
```

## Benefits:

1. **Clear Function Separation**: Files grouped by their primary function
2. **Easy Navigation**: Easy to find related components
3. **Better Maintainability**: Related code in same directory
4. **Scalability**: Easy to add new components to appropriate groups
5. **Logical Organization**: Matches how developers think about features

## Files to Move: 20 files
