# Project Structure - Code Review Against Application-instruction

## Module: Code Review
## Updated: Thu Jan  8 10:47:22 +07 2026

## Files I'm Working With:
- All source code files in `src/` directory
- Organized by 5 modules:
  1. AI Assessment Module - `src/components/ai-assessment/`
  2. Authentication Module - `src/components/`, `src/contexts/`, `src/hooks/`
  3. Route Protection Module - `src/components/RouteGuard.tsx`
  4. Company Settings Module - `src/components/company-settings/`
  5. Sidebar Navigation Module - `src/components/Sidebar.tsx`, `src/components/SidebarContainer.tsx`

## Rules to Check:
1. **Rule 1**: NextJS Core Application - must use NextJS
2. **Rule 2**: Directory Structure & Separation
   - `components/` directory: UI components ONLY - NO business logic
   - `containers/` directory: Application flow and business logic ONLY - NO UI rendering
3. **Rule 3**: File Size Limitation - files MUST NOT exceed 400-500 lines
4. **Rule 4**: Time Handling - must use local machine time

## Changes Made:
- Thu Jan  8 10:47:22 +07 2026 **Started**: Code review against Application-instruction rules
- Thu Jan  8 10:48:33 +07 2026 **Created**: `document/doing/code-review-findings.md` - Comprehensive review findings
- Thu Jan  8 10:48:33 +07 2026 **Completed**: Review of all 5 modules
- Thu Jan  8 10:52:23 +07 2026 **Created**: `src/containers/` directory structure (Phase 1 complete)
- Thu Jan  8 10:52:39 +07 2026 **Created**: `src/utils/time-helpers.ts` - Local time utility functions
- Thu Jan  8 10:52:39 +07 2026 **Modified**: `src/components/ai-assessment/QuestionnaireFlow.tsx` - Fixed time handling (Rule 4)
- Thu Jan  8 10:52:39 +07 2026 **Modified**: `src/components/ai-assessment/ErrorBoundary.tsx` - Fixed time handling (Rule 4)
- Thu Jan  8 10:52:39 +07 2026 **Modified**: `src/components/ai-assessment/ReportViewer.tsx` - Fixed time handling (Rule 4)
- Thu Jan  8 10:54:13 +07 2026 **Created**: 3 extracted files for DatabaseIntegratedAssessmentWizard.tsx (343 lines total)
- Thu Jan  8 10:54:13 +07 2026 **Modified**: `DatabaseIntegratedAssessmentWizard.tsx` - Refactored to use hooks (482 lines - compliant ✅)
- Thu Jan  8 10:56:24 +07 2026 **Created**: 3 extracted files for QuestionnaireFlow.tsx (379 lines total)
- Thu Jan  8 10:56:24 +07 2026 **Modified**: `QuestionnaireFlow.tsx` - Refactored to use hooks (383 lines - compliant ✅)
- Thu Jan  8 10:57:00 +07 2026 **Created**: 3 extracted files for RAPIDAssessmentWizard.tsx (324 lines total)
- Thu Jan  8 10:57:00 +07 2026 **Modified**: `RAPIDAssessmentWizard.tsx` - Refactored to use hooks (402 lines - compliant ✅)
- Thu Jan  8 10:58:30 +07 2026 **Created**: 2 extracted files for DatabaseIntegratedProgressTracker.tsx (255 lines total)
- Thu Jan  8 10:58:30 +07 2026 **Modified**: `DatabaseIntegratedProgressTracker.tsx` - Refactored to use hooks (344 lines - compliant ✅)
- Thu Jan  8 10:59:24 +07 2026 **Created**: `src/containers/ai-assessment/AssessmentContainerLogic.tsx` (221 lines) - Business logic
- Thu Jan  8 10:59:24 +07 2026 **Modified**: `src/components/ai-assessment/AssessmentContainer.tsx` - Refactored to use container (332 lines - compliant ✅)
- Thu Jan  8 11:00:53 +07 2026 **Created**: `src/lib/services/auth-service.ts` (234 lines) - Authentication business logic
- Thu Jan  8 11:00:53 +07 2026 **Modified**: `src/contexts/AuthContext.tsx` - Refactored to use service (147 lines - compliant ✅)
- Thu Jan  8 11:10:47 +07 2026 **Modified**: `document/project-structure.md` - Updated to reflect all structural changes

## Key Findings:
1. **Missing containers/ directory** - Rule 2 violation
2. **4 files exceed 500 lines** - Rule 3 violations:
   - DatabaseIntegratedAssessmentWizard.tsx (653 lines)
   - QuestionnaireFlow.tsx (586 lines)
   - RAPIDAssessmentWizard.tsx (534 lines)
   - DatabaseIntegratedProgressTracker.tsx (534 lines)
3. **3 files use UTC time** - Rule 4 violations:
   - QuestionnaireFlow.tsx (toISOString)
   - ErrorBoundary.tsx (toISOString)
   - ReportViewer.tsx (toISOString)
4. **Business logic in components/** - Rule 2 violations:
   - AssessmentContainer.tsx (API calls)
   - AuthContext.tsx (authentication logic)

## Fix Plan Created:
- Thu Jan  8 10:50:42 +07 2026 **Created**: `document/doing/fix-plan.md` - Comprehensive plan to fix all violations
  - Phase 1: Create containers/ directory structure
  - Phase 2: Fix time handling (3 files)
  - Phase 3: Split large files (4 files)
  - Phase 4: Move business logic to containers (2 files)
  - Phase 5: Testing & verification
