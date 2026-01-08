# Project Structure - Navigation and Company Creation Fixes

## Updated: Thu Jan  8 15:17:41 +07 2026

## Files I'm Working With:
- `src/components/Sidebar.tsx` - Main navigation sidebar component
- `src/components/company-settings/CompanyContainer.tsx` - Company container with state management
- `src/components/company-settings/CompanyDashboard.tsx` - Company dashboard UI component

## Changes Made:
- Thu Jan  8 15:16:51 +07 2026 **Modified**: `src/components/Sidebar.tsx` - Fixed Nav bar reload issue
  - Added `prefetch={true}` prop to Link component for better performance
  - Added `scroll={false}` prop to prevent page scroll to top on navigation
  - This prevents full page reload when clicking navigation items

- Thu Jan  8 15:16:51 +07 2026 **Modified**: `src/components/company-settings/CompanyContainer.tsx` - Fixed Company creation not showing
  - Fixed response extraction to handle multiple response formats:
    - `response.data` (from API response structure)
    - `response.company` (from type definition)
    - `response` directly (if response is company object)
  - Added error handling if company data not found
  - Improved state update logic to ensure new company is added to list immediately

- Thu Jan  8 15:17:41 +07 2026 **Modified**: `src/components/company-settings/CompanyDashboard.tsx` - Enhanced company filtering
  - Added filter to exclude inactive companies (isActive === false)
  - Ensures only active companies are displayed in the list

- Thu Jan  8 15:20:39 +07 2026 **Modified**: `src/app/ai-assessment/page.tsx` - Fixed page flashing on navigation
  - Changed initial `isLoading` state from `true` to `false` to prevent flash
  - Added `useRef` to track if companies have been loaded to prevent duplicate loading
  - Optimized loading condition to only show spinner when actively loading and no companies exist
  - This prevents the page from flashing/reloading when navigating from other pages

- Thu Jan  8 15:23:12 +07 2026 **Modified**: `src/components/RouteGuard.tsx` - Fixed loading flash on navigation
  - Changed loading states to return `null` instead of showing spinner
  - This prevents full-page loading spinner from flashing when navigating between pages
  - Loading is now handled more gracefully without blocking the UI

- Thu Jan  8 15:23:12 +07 2026 **Modified**: `src/components/ApplicationShell.tsx` - Removed auth loading check
  - Removed `config.authEnabled && loading` check from loading condition
  - Only show loading on initial mount (`!isMounted`), not on navigation
  - This prevents spinner from showing when navigating between pages

- Thu Jan  8 15:23:12 +07 2026 **Modified**: `src/components/ai-assessment/assessment/AssessmentContainer.tsx` - Changed loading to overlay
  - Changed from conditional rendering (show/hide dashboard) to overlay loading
  - Dashboard always renders, loading spinner shows as overlay when needed
  - This prevents layout shift and flashing when loading assessments

- Thu Jan  8 15:25:40 +07 2026 **Modified**: `src/app/ai-assessment/page.tsx` - Changed loading to content area only
  - Changed from full-page loading to overlay loading in content area
  - Nav bar (Sidebar) stays visible during loading
  - Loading and error messages now show as overlay in content area only
  - This ensures nav bar is always visible while content loads

- Thu Jan  8 15:25:40 +07 2026 **Modified**: `src/components/ApplicationShell.tsx` - Show sidebar during initial mount loading
  - When `!isMounted` and sidebar should be shown, render sidebar with loading in content area
  - This ensures nav bar is visible even during initial page load
  - Only show full-page loading when sidebar is not needed (e.g., login page)

- Thu Jan  8 15:27:11 +07 2026 **Modified**: `src/components/ai-assessment/assessment/AssessmentContainer.tsx` - Fixed React Hooks error
  - Moved `useEffect` for wizard mode reset before early return
  - This follows React Hooks rules: all hooks must be called in the same order on every render
  - Prevents "Rendered more hooks than during the previous render" error

- Thu Jan  8 15:30:52 +07 2026 **Modified**: `src/lib/models/Company.ts` - Fixed duplicate key error when creating company
  - Added logic to drop old indexes: `name_userId`, `userId_1`, `userId_1_createdAt_-1`
  - Created unique index on `name` field (since userId is removed)
  - Added duplicate name check before creating company
  - Added error handling for duplicate key errors with better error messages

- Thu Jan  8 15:30:52 +07 2026 **Modified**: `src/lib/db-init.ts` - Updated company index initialization
  - Added logic to drop old userId-related indexes before creating new ones
  - Ensures clean index migration when userId is removed

- Thu Jan  8 15:33:36 +07 2026 **Modified**: `src/lib/models/Company.ts` - Improved company name uniqueness logic
  - Changed duplicate check to only check against active companies (isActive: true)
  - Inactive companies can have duplicate names
  - Created partial unique index `name_unique_active` that only applies to active companies
  - Enhanced error handling with specific error types and messages
  - Added validation for empty company name

- Thu Jan  8 15:33:36 +07 2026 **Modified**: `src/app/api/companies/route.ts` - Enhanced error handling
  - Added specific error handling for duplicate name errors (409 Conflict)
  - Added specific error handling for empty name errors (400 Bad Request)
  - Enhanced MongoDB duplicate key error detection and messaging
  - Better error context and user-friendly messages

- Thu Jan  8 15:33:36 +07 2026 **Modified**: `src/lib/db-init.ts` - Updated to create partial unique index
  - Creates partial unique index `name_unique_active` for active companies only
  - Drops old `name_unique` index if exists
  - Allows inactive companies to have duplicate names

- Thu Jan  8 15:37:23 +07 2026 **Modified**: `src/lib/models/Company.ts` - Removed unique indexes temporarily
  - Drops all unique indexes on name: `name_unique`, `name_unique_active`, `name_userId`
  - Creates non-unique index `name_1` for performance only (not uniqueness)
  - Uniqueness checking is now done in application code only
  - This allows creating companies without index conflicts

- Thu Jan  8 15:37:23 +07 2026 **Modified**: `src/lib/db-init.ts` - Removed unique indexes temporarily
  - Drops all unique name indexes before creating new ones
  - Creates non-unique index `name_1` instead of unique index
  - User doesn't want database optimization yet

- Thu Jan  8 15:37:23 +07 2026 **Modified**: `src/lib/company-api-client.ts` - Enhanced error extraction
  - Extracts error message from API response properly
  - Includes status code and response data in error object
  - Better error context for error handling

- Thu Jan  8 15:37:23 +07 2026 **Modified**: `src/utils/company-error-handling.ts` - Enhanced error detection
  - Checks HTTP status codes (409, 400) from API response
  - Extracts error message from responseData
  - Better detection of duplicate name errors
  - More specific error messages for different error types
