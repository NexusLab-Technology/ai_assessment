# Sidebar Navigation Module - Structure

## Overview

This module provides the main application navigation structure:
- **Main Navigation Sidebar** (left) - Primary app navigation
- **Application Layout** - Container that manages Navbar + Core Application layout

## Files

- `src/components/Sidebar.tsx` - **Main Navigation Sidebar** (Navbar component)
  - Primary application navigation
  - Located on the left side
  - Used only for navigation (no business logic)
  
- `src/components/ApplicationShell.tsx` - **Application Layout** (App Shell)
  - Main layout container
  - Divides app into 2 parts:
    - **Left**: Main Navigation Sidebar (uses Sidebar component)
    - **Right**: Core Application Content (main content area)

## Props

```typescript
interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  navigationItems: NavigationItem[]
  onLogout?: () => void
}
```
