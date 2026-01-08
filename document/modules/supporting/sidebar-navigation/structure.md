# Sidebar Navigation Module - Structure

## Files

- `src/components/Sidebar.tsx` - Main sidebar component
- `src/components/SidebarContainer.tsx` - Container with state management

## Props

```typescript
interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  navigationItems: NavigationItem[]
  onLogout?: () => void
}
```
