# Implementation Notes - Navigation and Company Creation Fixes

## Goal: Fix Nav bar reload issue and Company creation not showing issue
## Started: Thu Jan  8 15:15:31 +07 2026
## Updated: Thu Jan  8 15:17:41 +07 2026

## Problem Identified:
1. **Nav bar reload issue**: When clicking navigation items in the sidebar, the page was reloading instead of using client-side navigation
2. **Company creation not showing**: After creating a new company, it didn't appear in the list until manual page refresh

## Implementation Details:
- Thu Jan  8 15:16:51 +07 2026 **Changed** `src/components/Sidebar.tsx` - Fixed Nav bar reload
  - **What**: Added prefetch and scroll props to Next.js Link component
  - **Why**: To prevent full page reload and improve navigation performance
  - **Details**: 
    - Added `prefetch={true}` to enable Next.js prefetching for better performance
    - Added `scroll={false}` to prevent automatic scroll to top on navigation
    - This ensures smooth client-side navigation without page reload

- Thu Jan  8 15:16:51 +07 2026 **Changed** `src/components/company-settings/CompanyContainer.tsx` - Fixed Company creation not showing
  - **What**: Fixed response extraction and state update logic
  - **Why**: Response structure can vary, need to handle all possible formats
  - **Details**:
    - Enhanced response extraction to check multiple formats:
      - `response.data` (standard API response)
      - `response.company` (type definition format)
      - `response` directly (if response is company object)
    - Added error handling with clear error message if company data not found
    - Ensured new company is added to state immediately after creation
    - Improved logging for debugging

- Thu Jan  8 15:17:41 +07 2026 **Changed** `src/components/company-settings/CompanyDashboard.tsx` - Enhanced filtering
  - **What**: Added filter to exclude inactive companies
  - **Why**: Only active companies should be displayed in the UI
  - **Details**:
    - Added check for `company.isActive !== false` in filter logic
    - Handles both active companies (isActive: true) and legacy companies (isActive: undefined)

## Issues & Solutions:
- Thu Jan  8 15:16:51 +07 2026 **Problem**: Nav bar was causing full page reload when clicking navigation items
 - **Solution**: Added `prefetch={true}` and `scroll={false}` props to Next.js Link component to enable client-side navigation without reload

- Thu Jan  8 15:16:51 +07 2026 **Problem**: Company creation response structure was inconsistent, causing new company not to appear
 - **Solution**: Enhanced response extraction to handle multiple response formats (data, company, or direct object) with proper error handling

- Thu Jan  8 15:17:41 +07 2026 **Problem**: Inactive companies might be displayed
 - **Solution**: Added filter to exclude companies with isActive === false

## Issues & Solutions (continued):
- Thu Jan  8 15:20:39 +07 2026 **Problem**: AI Assessment page was flashing/reloading when navigating from Nav bar
 - **Solution**: Changed initial loading state to `false` and optimized loading condition. Added `useRef` to prevent duplicate loading on navigation. Only show loading spinner when actively loading and no companies exist.

- Thu Jan  8 15:23:12 +07 2026 **Problem**: Multiple loading states (RouteGuard, ApplicationShell, AssessmentContainer) were causing page flashing
 - **Solution**: 
   - RouteGuard: Changed loading states to return `null` instead of showing spinner to prevent flash
   - ApplicationShell: Removed auth loading check, only show loading on initial mount
   - AssessmentContainer: Changed from conditional rendering to overlay loading to prevent layout shift
   - This ensures smooth navigation without full-page reloads or flashing spinners

## Issues & Solutions (continued):
- Thu Jan  8 15:25:40 +07 2026 **Problem**: User wants loading to show only in content area, nav bar must stay visible
 - **Solution**: 
   - Changed AI Assessment page loading from full-page to overlay in content area
   - Updated ApplicationShell to show sidebar during initial mount loading
   - Loading and error messages now appear as overlay in content area only
   - Nav bar (Sidebar) is always visible during loading

- Thu Jan  8 15:27:11 +07 2026 **Problem**: React Hooks error - "Rendered more hooks than during the previous render"
 - **Solution**: 
   - Moved `useEffect` hook that was after early return to before early return
   - React Hooks rules require all hooks to be called in the same order on every render
   - Early return (`if (!selectedCompany)`) was causing hooks to be called conditionally
   - Now all hooks are called before any conditional returns

## Issues & Solutions (continued):
- Thu Jan  8 15:30:52 +07 2026 **Problem**: Duplicate key error when creating company - MongoDB still has `name_userId` index
 - **Solution**: 
   - Added logic to drop old indexes (`name_userId`, `userId_1`, `userId_1_createdAt_-1`) in `createIndexes()` method
   - Created unique index on `name` field (since userId is removed)
   - Added duplicate name check before creating company
   - Added error handling for duplicate key errors with user-friendly messages
   - Updated `db-init.ts` to drop old indexes during initialization

- Thu Jan  8 15:33:36 +07 2026 **Problem**: User wants company name uniqueness only for active companies, and better error handling
 - **Solution**: 
   - Changed duplicate check to only check against active companies (isActive: true or undefined)
   - Inactive companies (isActive: false) can have duplicate names
   - Created partial unique index `name_unique_active` that only applies to active companies using `partialFilterExpression`
   - Enhanced error handling in `Company.create()` with specific error types:
     - Empty name validation
     - Duplicate name detection
     - MongoDB duplicate key error handling
     - Generic error handling with context
   - Enhanced API route error handling:
     - 409 Conflict for duplicate names
     - 400 Bad Request for validation errors
     - 500 for other errors with detailed messages
   - Updated `db-init.ts` to create partial unique index instead of full unique index

- Thu Jan  8 15:37:23 +07 2026 **Problem**: Still having issues creating companies (409 error) and error handling not clear
 - **Solution**: 
   - Removed all unique indexes on name temporarily (user doesn't want database optimization yet)
   - Drops indexes: `name_userId`, `name_unique`, `name_unique_active`
   - Creates non-unique index `name_1` for performance only
   - Uniqueness checking is now done in application code only
   - Enhanced error extraction in `company-api-client.ts`:
     - Extracts error message from API response properly
     - Includes status code and response data in error object
   - Enhanced error detection in `company-error-handling.ts`:
     - Checks HTTP status codes (409, 400) from API response
     - Extracts error message from responseData
     - Better detection of duplicate name errors with specific messages
   - This allows creating companies without index conflicts while maintaining uniqueness check in code

## Current Status:
- ✅ Nav bar now uses client-side navigation without page reload
- ✅ Company creation immediately shows new company in list
- ✅ Inactive companies are filtered out
- ✅ AI Assessment page no longer flashes when navigating from Nav bar
- ✅ RouteGuard and ApplicationShell loading states optimized to prevent flash
- ✅ AssessmentContainer uses overlay loading instead of conditional rendering
- ✅ Loading now shows only in content area - nav bar stays visible
- ✅ React Hooks error fixed - all hooks called before early returns
- ✅ Duplicate key error fixed - all unique indexes dropped temporarily
- ✅ Company name uniqueness only applies to active companies - inactive companies can have duplicates
- ✅ Enhanced error handling with specific error types and user-friendly messages
- ✅ Error messages now properly extracted from API response and displayed to users
- ✅ Non-unique index created for performance - uniqueness checked in application code
- ✅ No linter errors
- ✅ Ready for user testing
