# Code Organization Plan - AI Assessment Module

## Analysis Date: Thu Jan  8 11:30:47 +07 2026

## Current Status

### Files Exceeding 500 Lines (Rule 3 Violation)
1. **ResponseReviewModal.tsx** - 560 lines ❌ (MUST FIX)

### Files Near 500 Lines (Monitor)
1. **ReportViewer.tsx** - 484 lines (OK but close)
2. **DatabaseIntegratedAssessmentWizard.tsx** - 478 lines (OK but close)

### Files to Group

#### 1. DatabaseIntegratedAssessmentWizard Hooks (3 files)
- `DatabaseIntegratedAssessmentWizardLoader.tsx` (107 lines)
- `DatabaseIntegratedAssessmentWizardState.tsx` (98 lines)
- `DatabaseIntegratedAssessmentWizardValidation.tsx` (134 lines)
- **Total**: 339 lines
- **Group to**: `hooks/database-integrated/`

#### 2. DatabaseIntegratedProgressTracker Hooks (2 files)
- `DatabaseIntegratedProgressTrackerLogic.tsx` (141 lines)
- `DatabaseIntegratedProgressTrackerUI.tsx` (137 lines)
- **Total**: 278 lines
- **Group to**: `hooks/progress-tracker/`

#### 3. QuestionnaireFlow Hooks (3 files)
- `QuestionnaireFlowAutoSave.tsx` (71 lines)
- `QuestionnaireFlowNavigation.tsx` (96 lines)
- `QuestionnaireFlowResponses.tsx` (212 lines)
- **Total**: 379 lines
- **Group to**: `hooks/questionnaire-flow/`

#### 4. RAPIDAssessmentWizard Hooks (3 files)
- `RAPIDAssessmentWizardCategories.tsx` (110 lines)
- `RAPIDAssessmentWizardQuestions.tsx` (113 lines)
- `RAPIDAssessmentWizardProgress.tsx` (105 lines)
- **Total**: 328 lines
- **Group to**: `hooks/rapid-wizard/`

#### 5. Common/Utility Components (3 files)
- `ErrorBoundary.tsx` (186 lines)
- `ErrorMessage.tsx` (300 lines)
- `LoadingSpinner.tsx` (187 lines)
- **Total**: 673 lines
- **Group to**: `common/`

## Proposed Structure

```
src/components/ai-assessment/
├── common/                          # Shared utility components
│   ├── ErrorBoundary.tsx
│   ├── ErrorMessage.tsx
│   └── LoadingSpinner.tsx
├── hooks/                          # Extracted hooks (organized by feature)
│   ├── database-integrated/       # DatabaseIntegratedAssessmentWizard hooks
│   │   ├── DatabaseIntegratedAssessmentWizardLoader.tsx
│   │   ├── DatabaseIntegratedAssessmentWizardState.tsx
│   │   └── DatabaseIntegratedAssessmentWizardValidation.tsx
│   ├── progress-tracker/          # DatabaseIntegratedProgressTracker hooks
│   │   ├── DatabaseIntegratedProgressTrackerLogic.tsx
│   │   └── DatabaseIntegratedProgressTrackerUI.tsx
│   ├── questionnaire-flow/         # QuestionnaireFlow hooks
│   │   ├── QuestionnaireFlowAutoSave.tsx
│   │   ├── QuestionnaireFlowNavigation.tsx
│   │   └── QuestionnaireFlowResponses.tsx
│   └── rapid-wizard/              # RAPIDAssessmentWizard hooks
│       ├── RAPIDAssessmentWizardCategories.tsx
│       ├── RAPIDAssessmentWizardQuestions.tsx
│       └── RAPIDAssessmentWizardProgress.tsx
├── AssessmentContainer.tsx         # Main container
├── AssessmentDashboard.tsx
├── AssessmentViewer.tsx
├── AsyncReportGenerator.tsx
├── CategoryNavigationSidebar.tsx
├── CompanySelector.tsx
├── DatabaseIntegratedAssessmentWizard.tsx
├── DatabaseIntegratedProgressTracker.tsx
├── EnhancedCategoryNavigationWithSubcategories.tsx
├── EnhancedProgressTracker.tsx
├── FixedQuestionContainer.tsx
├── ProgressTracker.tsx
├── QuestionnaireFlow.tsx
├── QuestionStep.tsx
├── RAPIDAssessmentWizard.tsx
├── RAPIDQuestionnaireLoader.tsx
├── ReportGenerator.tsx
├── ReportStatusTracker.tsx
├── ReportViewer.tsx
├── ResponseReviewModal.tsx        # NEEDS SPLIT (560 lines)
├── SubSidebar.tsx
└── index.ts
```

## Action Plan

### Phase 1: Fix Rule 3 Violation
1. Split ResponseReviewModal.tsx (560 lines) into smaller files

### Phase 2: Create Directory Structure
1. Create `common/` directory
2. Create `hooks/` directory with subdirectories
3. Move files to appropriate directories

### Phase 3: Update Imports
1. Update all imports in components
2. Update index.ts exports
3. Verify no broken imports

### Phase 4: Verification
1. Check all file sizes (must be < 500 lines)
2. Verify imports work
3. Test application

## Benefits

1. **Better Organization**: Related files grouped together
2. **Easier Navigation**: Clear directory structure
3. **Maintainability**: Easier to find and update related code
4. **Compliance**: All files under 500 lines
5. **Scalability**: Easy to add new hooks/components
