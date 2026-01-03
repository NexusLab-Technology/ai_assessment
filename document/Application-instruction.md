# Application Instructions - Configurable Authentication Framework

## Overview
This application provides a configurable authentication framework with sidebar navigation for NextJS applications.

## Current UI Layout
The sidebar currently has this structure:
1. **Header** - Navigation title with collapse button
2. **Main Navigation** - Home and Settings links
3. **Footer** - Logout button and app version

## User Request
Move the Settings navigation item to the footer area, near the logout button, to create a more logical grouping of user-related actions.

## Implementation Approach
1. Modify the Sidebar component to separate main navigation from user actions
2. Move Settings link to the footer section alongside logout
3. Update styling to maintain visual hierarchy
4. Ensure responsive behavior is preserved
5. Update tests to reflect the new layout

## Design Considerations
- Keep Home in main navigation (general app navigation)
- Group Settings with Logout (user-specific actions)
- Maintain accessibility and visual consistency
- Preserve existing functionality and behavior