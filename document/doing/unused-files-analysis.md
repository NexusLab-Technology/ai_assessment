# Unused Files Analysis

## Analysis Date: Thu Jan  8 11:22:09 +07 2026

## AI Assessment Module - File Usage Analysis

### Total Files: 48 files

---

## ✅ USED FILES (Currently in use)

### Core Components (Used in main app)
1. **AssessmentContainer.tsx** ✅ - Main container, used in `/ai-assessment/page.tsx`
2. **AssessmentDashboard.tsx** ✅ - Used by AssessmentContainer
3. **AssessmentViewer.tsx** ✅ - Used by AssessmentContainer
4. **CompanySelector.tsx** ✅ - Used in `/ai-assessment/page.tsx` and AssessmentContainer
5. **CategoryNavigationSidebar.tsx** ✅ - Used in multiple places
6. **FixedQuestionContainer.tsx** ✅ - Used in demo pages
7. **ErrorBoundary.tsx** ✅ - Used by AssessmentContainer
8. **LoadingSpinner.tsx** ✅ - Used by AssessmentContainer
9. **ErrorMessage.tsx** ✅ - Used by AssessmentContainer

### Database Integrated Components (Active)
10. **DatabaseIntegratedAssessmentWizard.tsx** ✅ - Main wizard, used by AssessmentContainer
11. **DatabaseIntegratedAssessmentWizardLoader.tsx** ✅ - Used by DatabaseIntegratedAssessmentWizard
12. **DatabaseIntegratedAssessmentWizardState.tsx** ✅ - Used by DatabaseIntegratedAssessmentWizard
13. **DatabaseIntegratedAssessmentWizardValidation.tsx** ✅ - Used by DatabaseIntegratedAssessmentWizard
14. **DatabaseIntegratedProgressTracker.tsx** ✅ - Used by DatabaseIntegratedAssessmentWizard
15. **DatabaseIntegratedProgressTrackerLogic.tsx** ✅ - Used by DatabaseIntegratedProgressTracker
16. **DatabaseIntegratedProgressTrackerUI.tsx** ✅ - Used by DatabaseIntegratedProgressTracker

### Questionnaire Flow Components (Active)
17. **QuestionnaireFlow.tsx** ✅ - Main flow component
18. **QuestionnaireFlowAutoSave.tsx** ✅ - Used by QuestionnaireFlow
19. **QuestionnaireFlowNavigation.tsx** ✅ - Used by QuestionnaireFlow
20. **QuestionnaireFlowResponses.tsx** ✅ - Used by QuestionnaireFlow

### RAPID Components (Active)
21. **RAPIDAssessmentWizard.tsx** ✅ - Main RAPID wizard
22. **RAPIDAssessmentWizardCategories.tsx** ✅ - Used by RAPIDAssessmentWizard
23. **RAPIDAssessmentWizardQuestions.tsx** ✅ - Used by RAPIDAssessmentWizard
24. **RAPIDAssessmentWizardProgress.tsx** ✅ - Used by RAPIDAssessmentWizard
25. **RAPIDQuestionnaireLoader.tsx** ✅ - Used in multiple places
26. **QuestionStep.tsx** ✅ - Used by EnhancedAssessmentWizard, RAPIDAssessmentWizard, QuestionnaireFlow

### Report Components (Active)
27. **AsyncReportGenerator.tsx** ✅ - Used for report generation
28. **ReportStatusTracker.tsx** ✅ - Used for tracking report status
29. **ReportViewer.tsx** ✅ - Used for viewing reports
30. **ResponseReviewModal.tsx** ✅ - Used for reviewing responses

### Sub-navigation
31. **SubSidebar.tsx** ✅ - Module navigation sidebar

---

## ⚠️ POTENTIALLY UNUSED FILES (Need verification)

### Enhanced Components (May be legacy/demo)
32. **EnhancedAssessmentWizard.tsx** ⚠️ - Only used in tests, not in main app
33. **EnhancedAssessmentWizardWithErrorHandling.tsx** ⚠️ - Only used in tests
34. **EnhancedCategoryNavigationSidebar.tsx** ⚠️ - Only used in tests
35. **EnhancedCategoryNavigationWithSubcategories.tsx** ⚠️ - Only used in DatabaseIntegratedAssessmentWizard (check if needed)
36. **EnhancedFixedQuestionContainer.tsx** ⚠️ - Only used in tests
37. **EnhancedProgressTracker.tsx** ⚠️ - Exported in index.ts but usage unclear
38. **EnhancedRAPIDQuestionnaireLoader.tsx** ⚠️ - Only used in tests

### Legacy/Demo Components
39. **AssessmentWizard.tsx** ⚠️ - Used in `/ai-assessment-demo/page.tsx` (demo page only)
40. **ProgressTracker.tsx** ⚠️ - Exported in index.ts but usage unclear
41. **RAPIDQuestionStep.tsx** ❌ - NOT FOUND IN IMPORTS (likely unused)
42. **ReportGenerator.tsx** ⚠️ - Imported in AssessmentContainer but commented out in index.ts (TODO: Phase 3)

### Utility Components (May be unused)
43. **AutoSaveIndicator.tsx** ⚠️ - Used in EnhancedAssessmentWizard (which is only in tests)
44. **CategoryResponseManager.tsx** ⚠️ - Only used in tests
45. **FormValidationError.tsx** ⚠️ - Only used in tests
46. **ValidationIndicator.tsx** ⚠️ - Only used in tests

### AWS Components (May be unused)
47. **AWSCredentialsForm.tsx** ⚠️ - Only used in tests
48. **AWSSettingsPage.tsx** ⚠️ - Only used internally by AWSCredentialsForm (check if page exists)

---

## ❌ CONFIRMED UNUSED FILES

### AI Assessment Module
1. **RAPIDQuestionStep.tsx** ❌ - No imports found anywhere (SAFE TO DELETE)

### Potentially Unused (Only in tests/demo pages)
2. **EnhancedAssessmentWizard.tsx** ⚠️ - Only used in tests
3. **EnhancedAssessmentWizardWithErrorHandling.tsx** ⚠️ - Only used in tests  
4. **EnhancedCategoryNavigationSidebar.tsx** ⚠️ - Only used in tests
5. **EnhancedFixedQuestionContainer.tsx** ⚠️ - Only used in tests
6. **EnhancedRAPIDQuestionnaireLoader.tsx** ⚠️ - Only used in tests
7. **AutoSaveIndicator.tsx** ⚠️ - Only used in EnhancedAssessmentWizard (tests)
8. **CategoryResponseManager.tsx** ⚠️ - Only used in tests
9. **FormValidationError.tsx** ⚠️ - Only used in tests
10. **ValidationIndicator.tsx** ⚠️ - Only used in tests
11. **AWSCredentialsForm.tsx** ⚠️ - Only used in tests
12. **AWSSettingsPage.tsx** ⚠️ - Check if route exists

### Demo Pages (Check if needed)
- `/ai-assessment-demo` - Uses AssessmentWizard (legacy)
- `/ai-assessment-basic` - Uses FixedQuestionContainer
- `/ai-assessment-simple` - Uses CategoryNavigationSidebar + FixedQuestionContainer

---

## 📊 Summary

### AI Assessment Module
- **Total Files**: 48
- **Confirmed Used**: 31 files
- **Potentially Unused (tests/demo only)**: 16 files
- **Confirmed Unused**: 1 file (RAPIDQuestionStep.tsx)

### Company Settings Module
- **Total Files**: 7
- **All Files Used**: 7 files ✅

---

## 🔍 Recommendations

### High Priority (Safe to remove if confirmed unused)
1. **RAPIDQuestionStep.tsx** - No usage found
2. **EnhancedAssessmentWizard.tsx** - Only in tests, check if needed
3. **EnhancedAssessmentWizardWithErrorHandling.tsx** - Only in tests
4. **EnhancedCategoryNavigationSidebar.tsx** - Only in tests
5. **EnhancedFixedQuestionContainer.tsx** - Only in tests
6. **EnhancedRAPIDQuestionnaireLoader.tsx** - Only in tests

### Medium Priority (Verify usage)
1. **ReportGenerator.tsx** - Commented out in index.ts, imported in AssessmentContainer but may not be used
2. **ProgressTracker.tsx** - Exported but usage unclear
3. **EnhancedProgressTracker.tsx** - Exported but usage unclear
4. **AutoSaveIndicator.tsx** - Only used in Enhanced components (tests)
5. **CategoryResponseManager.tsx** - Only in tests
6. **FormValidationError.tsx** - Only in tests
7. **ValidationIndicator.tsx** - Only in tests
8. **AWSCredentialsForm.tsx** - Only in tests
9. **AWSSettingsPage.tsx** - Check if page route exists

### Low Priority (Keep for now)
1. **AssessmentWizard.tsx** - Used in demo page
2. **EnhancedCategoryNavigationWithSubcategories.tsx** - Used in DatabaseIntegratedAssessmentWizard

---

## Company Settings Module - File Usage Analysis

### Total Files: 7 files

### ✅ USED FILES
1. **CompanyCard.tsx** ✅ - Used in CompanyDashboard
2. **CompanyDashboard.tsx** ✅ - Used in `/company-settings/page.tsx`
3. **CompanyForm.tsx** ✅ - Used in CompanyDashboard
4. **CompanySearch.tsx** ✅ - Used in CompanyDashboard

### ✅ ALL FILES USED
5. **CompanyContainer.tsx** ✅ - Used in `/company-settings/page.tsx`
6. **CompanyErrorBoundary.tsx** ✅ - Used in CompanyContainer
7. **Tooltip.tsx** ✅ - Used in CompanyDashboard and CompanyCard

---

## Next Steps

1. Verify if demo pages (`/ai-assessment-demo`, `/ai-assessment-basic`, `/ai-assessment-simple`) are still needed
2. Check if Enhanced components are needed for future features
3. Verify AWS components usage
4. **ReportGenerator.tsx** - ✅ CONFIRMED USED in AssessmentContainer (line 268)
5. Check CompanyContainer, CompanyErrorBoundary, Tooltip usage in company-settings module
