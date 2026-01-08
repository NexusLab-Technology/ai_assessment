# Fix Plan - Application-instruction Compliance

## Plan Date: Thu Jan  8 10:50:42 +07 2026

## Overview
This plan addresses all violations found in the code review to ensure full compliance with Application-instruction.md rules.

## Violations Summary
- **Rule 2 (Directory Structure)**: 2 violations
- **Rule 3 (File Size)**: 4 violations  
- **Rule 4 (Time Handling)**: 3 violations
- **Total**: 9 violations to fix

---

## PHASE 1: Create Directory Structure (Rule 2)

### Task 1.1: Create `containers/` Directory Structure
**Priority**: High  
**Estimated Time**: 30 minutes

**Steps**:
1. Create `src/containers/` directory
2. Create subdirectories:
   - `src/containers/ai-assessment/` - For AI Assessment business logic
   - `src/containers/authentication/` - For authentication business logic
   - `src/containers/company-settings/` - For company settings business logic (if needed)

**Files to Create**:
- `src/containers/ai-assessment/AssessmentContainerLogic.tsx` - Business logic from AssessmentContainer
- `src/containers/authentication/AuthService.tsx` - Authentication business logic from AuthContext

**Dependencies**: None

---

## PHASE 2: Fix Time Handling (Rule 4)

### Task 2.1: Create Local Time Utility
**Priority**: High  
**Estimated Time**: 15 minutes

**Steps**:
1. Create `src/utils/time-helpers.ts` with local time formatting functions
2. Functions to create:
   - `formatLocalDateTime(date: Date): string` - Format date/time in local timezone
   - `formatLocalDate(date: Date): string` - Format date only in local timezone
   - `getLocalISOString(date: Date): string` - Get ISO string in local timezone

**Files to Create**:
- `src/utils/time-helpers.ts`

**Dependencies**: None

### Task 2.2: Fix QuestionnaireFlow.tsx
**Priority**: High  
**Estimated Time**: 10 minutes

**File**: `src/components/ai-assessment/QuestionnaireFlow.tsx`  
**Line**: 153  
**Current**: `lastSaved: new Date().toISOString()`  
**Fix**: Use `formatLocalDateTime(new Date())` from time-helpers

**Dependencies**: Task 2.1

### Task 2.3: Fix ErrorBoundary.tsx
**Priority**: High  
**Estimated Time**: 10 minutes

**File**: `src/components/ai-assessment/ErrorBoundary.tsx`  
**Line**: 68  
**Current**: `timestamp: new Date().toISOString()`  
**Fix**: Use `formatLocalDateTime(new Date())` from time-helpers

**Dependencies**: Task 2.1

### Task 2.4: Fix ReportViewer.tsx
**Priority**: High  
**Estimated Time**: 10 minutes

**File**: `src/components/ai-assessment/ReportViewer.tsx`  
**Line**: 316  
**Current**: `new Date().toISOString().split('T')[0]`  
**Fix**: Use `formatLocalDate(new Date())` from time-helpers

**Dependencies**: Task 2.1

---

## PHASE 3: Split Large Files (Rule 3)

### Task 3.1: Split DatabaseIntegratedAssessmentWizard.tsx (653 lines)
**Priority**: High  
**Estimated Time**: 2 hours

**File**: `src/components/ai-assessment/DatabaseIntegratedAssessmentWizard.tsx`  
**Target**: Split into files under 500 lines each

**Strategy**:
1. Extract questionnaire loading logic → `DatabaseIntegratedAssessmentWizardLoader.tsx` (~150 lines)
2. Extract state management logic → `DatabaseIntegratedAssessmentWizardState.tsx` (~200 lines)
3. Extract validation logic → `DatabaseIntegratedAssessmentWizardValidation.tsx` (~150 lines)
4. Keep main component → `DatabaseIntegratedAssessmentWizard.tsx` (~150 lines)

**Files to Create**:
- `src/components/ai-assessment/DatabaseIntegratedAssessmentWizardLoader.tsx`
- `src/components/ai-assessment/DatabaseIntegratedAssessmentWizardState.tsx`
- `src/components/ai-assessment/DatabaseIntegratedAssessmentWizardValidation.tsx`

**Files to Modify**:
- `src/components/ai-assessment/DatabaseIntegratedAssessmentWizard.tsx` (refactor to use extracted logic)

**Dependencies**: None

### Task 3.2: Split QuestionnaireFlow.tsx (586 lines)
**Priority**: High  
**Estimated Time**: 2 hours

**File**: `src/components/ai-assessment/QuestionnaireFlow.tsx`  
**Target**: Split into files under 500 lines each

**Strategy**:
1. Extract auto-save logic → `QuestionnaireFlowAutoSave.tsx` (~150 lines)
2. Extract navigation logic → `QuestionnaireFlowNavigation.tsx` (~150 lines)
3. Extract response handling → `QuestionnaireFlowResponses.tsx` (~150 lines)
4. Keep main component → `QuestionnaireFlow.tsx` (~136 lines)

**Files to Create**:
- `src/components/ai-assessment/QuestionnaireFlowAutoSave.tsx`
- `src/components/ai-assessment/QuestionnaireFlowNavigation.tsx`
- `src/components/ai-assessment/QuestionnaireFlowResponses.tsx`

**Files to Modify**:
- `src/components/ai-assessment/QuestionnaireFlow.tsx` (refactor to use extracted logic)

**Dependencies**: Task 2.2 (time handling fix)

### Task 3.3: Split RAPIDAssessmentWizard.tsx (534 lines)
**Priority**: High  
**Estimated Time**: 1.5 hours

**File**: `src/components/ai-assessment/RAPIDAssessmentWizard.tsx`  
**Target**: Split into files under 500 lines each

**Strategy**:
1. Extract category management → `RAPIDAssessmentWizardCategories.tsx` (~150 lines)
2. Extract question rendering → `RAPIDAssessmentWizardQuestions.tsx` (~150 lines)
3. Extract progress tracking → `RAPIDAssessmentWizardProgress.tsx` (~100 lines)
4. Keep main component → `RAPIDAssessmentWizard.tsx` (~134 lines)

**Files to Create**:
- `src/components/ai-assessment/RAPIDAssessmentWizardCategories.tsx`
- `src/components/ai-assessment/RAPIDAssessmentWizardQuestions.tsx`
- `src/components/ai-assessment/RAPIDAssessmentWizardProgress.tsx`

**Files to Modify**:
- `src/components/ai-assessment/RAPIDAssessmentWizard.tsx` (refactor to use extracted logic)

**Dependencies**: None

### Task 3.4: Split DatabaseIntegratedProgressTracker.tsx (534 lines)
**Priority**: High  
**Estimated Time**: 1.5 hours

**File**: `src/components/ai-assessment/DatabaseIntegratedProgressTracker.tsx`  
**Target**: Split into files under 500 lines each

**Strategy**:
1. Extract progress calculation → `DatabaseIntegratedProgressTrackerLogic.tsx` (~200 lines)
2. Extract UI rendering → `DatabaseIntegratedProgressTrackerUI.tsx` (~200 lines)
3. Keep main component → `DatabaseIntegratedProgressTracker.tsx` (~134 lines)

**Files to Create**:
- `src/components/ai-assessment/DatabaseIntegratedProgressTrackerLogic.tsx`
- `src/components/ai-assessment/DatabaseIntegratedProgressTrackerUI.tsx`

**Files to Modify**:
- `src/components/ai-assessment/DatabaseIntegratedProgressTracker.tsx` (refactor to use extracted logic)

**Dependencies**: None

---

## PHASE 4: Move Business Logic to Containers (Rule 2)

### Task 4.1: Extract Business Logic from AssessmentContainer.tsx
**Priority**: High  
**Estimated Time**: 2 hours

**File**: `src/components/ai-assessment/AssessmentContainer.tsx`  
**Current Issue**: Contains API calls and business logic

**Strategy**:
1. Create `src/containers/ai-assessment/AssessmentContainerLogic.tsx`
2. Move all API calls to container:
   - `loadAssessments()` → container
   - `handleCreateAssessment()` → container
   - `handleDeleteAssessment()` → container
   - `handleSaveResponses()` → container
   - `handleCompleteAssessment()` → container
3. Keep UI rendering in `AssessmentContainer.tsx`
4. Connect component to container via props/hooks

**Files to Create**:
- `src/containers/ai-assessment/AssessmentContainerLogic.tsx`

**Files to Modify**:
- `src/components/ai-assessment/AssessmentContainer.tsx` (remove business logic, use container)

**Dependencies**: Task 1.1

### Task 4.2: Extract Business Logic from AuthContext.tsx
**Priority**: Medium  
**Estimated Time**: 2 hours

**File**: `src/contexts/AuthContext.tsx`  
**Current Issue**: Contains authentication business logic

**Strategy**:
1. Create `src/containers/authentication/AuthService.tsx` or `src/lib/services/auth-service.ts`
2. Move authentication logic to service:
   - Login logic
   - Logout logic
   - Session management
   - Token handling
3. Keep state management in `AuthContext.tsx`
4. Context calls service methods

**Files to Create**:
- `src/lib/services/auth-service.ts` (preferred location for services)

**Files to Modify**:
- `src/contexts/AuthContext.tsx` (use service, keep state only)

**Dependencies**: Task 1.1

---

## PHASE 5: Testing & Verification

### Task 5.1: Test All Changes
**Priority**: High  
**Estimated Time**: 1 hour

**Steps**:
1. Run existing tests
2. Test each module functionality
3. Verify no regressions
4. Check file sizes (all under 500 lines)
5. Verify time displays show local time
6. Verify business logic is in containers/services

**Dependencies**: All previous tasks

### Task 5.2: Update Imports
**Priority**: Medium  
**Estimated Time**: 30 minutes

**Steps**:
1. Update all imports for moved files
2. Update imports for new utility functions
3. Verify no broken imports

**Dependencies**: All previous tasks

---

## EXECUTION ORDER

### Week 1: Foundation & Quick Fixes
1. ✅ Task 1.1: Create containers/ directory structure
2. ✅ Task 2.1: Create local time utility
3. ✅ Task 2.2-2.4: Fix time handling (3 files)

### Week 2: Split Large Files
4. ✅ Task 3.1: Split DatabaseIntegratedAssessmentWizard.tsx
5. ✅ Task 3.2: Split QuestionnaireFlow.tsx
6. ✅ Task 3.3: Split RAPIDAssessmentWizard.tsx
7. ✅ Task 3.4: Split DatabaseIntegratedProgressTracker.tsx

### Week 3: Architecture Refactoring
8. ✅ Task 4.1: Extract business logic from AssessmentContainer
9. ✅ Task 4.2: Extract business logic from AuthContext

### Week 4: Testing & Cleanup
10. ✅ Task 5.1: Test all changes
11. ✅ Task 5.2: Update imports

---

## ESTIMATED TOTAL TIME
- **Total Estimated Time**: ~12 hours
- **Critical Path**: Phases 1-3 (must complete before Phase 4)
- **Can be done in parallel**: Tasks 2.2-2.4, Tasks 3.1-3.4

---

## RISK ASSESSMENT

### Low Risk:
- Creating containers/ directory
- Creating time utility
- Fixing time handling

### Medium Risk:
- Splitting large files (need to ensure functionality preserved)
- Moving business logic (need to ensure state management works)

### Mitigation:
- Test after each major change
- Keep backups
- Review changes before committing
- Test incrementally

---

## SUCCESS CRITERIA

### Rule 2 Compliance:
- ✅ `containers/` directory exists
- ✅ All business logic moved to containers/services
- ✅ Components contain only UI code
- ✅ No API calls in components

### Rule 3 Compliance:
- ✅ All files under 500 lines
- ✅ Large files split into manageable pieces

### Rule 4 Compliance:
- ✅ All time displays use local time
- ✅ No `toISOString()` for user-facing time
- ✅ Time utility functions created and used

### General:
- ✅ All tests pass
- ✅ No functionality broken
- ✅ Code follows Application-instruction rules

---

## NOTES

1. **Cookie Expiration**: `AuthContext.tsx` uses `toUTCString()` for cookies - this is acceptable as it's a browser requirement, not user-facing

2. **Incremental Approach**: Can fix violations one module at a time to minimize risk

3. **Backward Compatibility**: Ensure all existing functionality continues to work after refactoring

4. **Documentation**: Update any documentation that references moved files

---

## STATUS: 📋 Plan Created
Ready to execute. Start with Phase 1.
