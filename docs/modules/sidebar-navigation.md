# Sidebar Navigation Module

The Sidebar Navigation Module provides a responsive, collapsible navigation system with state persistence and seamless integration with the authentication framework.

## Overview

The Sidebar Navigation Module offers a complete navigation solution that adapts to different screen sizes and authentication states. It provides a collapsible sidebar with customizable navigation items, state persistence, and responsive behavior.

### Key Features

- **Collapsible Design** - Toggle between expanded and collapsed states
- **State Persistence** - Remember sidebar state across sessions
- **Responsive Behavior** - Automatic adaptation to mobile and desktop
- **Authentication Integration** - Conditional rendering based on auth state
- **Customizable Navigation** - Flexible navigation item configuration
- **Accessibility Support** - Full keyboard navigation and screen reader support
- **Icon Integration** - Support for custom icons and labels

## Components

### Sidebar

The main sidebar component that provides collapsible navigation.

```tsx
import { Sidebar } from '@/components/Sidebar';

function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar 
        navigationItems={navigationItems}
        isCollapsed={false}
        onToggle={(collapsed) => console.log('Sidebar toggled:', collapsed)}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

**Props:**
- `navigationItems: NavigationItem[]` - Array of navigation items
- `isCollapsed?: boolean` - Initial collapsed state
- `onToggle?: (collapsed: boolean) => void` - Toggle callback
- `className?: string` - Additional CSS classes
- `showToggleButton?: boolean` - Show/hide toggle button (default: true)

**Features:**
- Smooth expand/collapse animations
- Responsive breakpoint handling
- State persistence via localStorage
- Keyboard navigation support
- Custom icon and label rendering

### SidebarContainer

A container component that manages sidebar state and persistence.

```tsx
import { SidebarContainer } from '@/components/SidebarContainer';

function App() {
  return (
    <SidebarContainer>
      {({ isCollapsed, toggle, navigationItems }) => (
        <Sidebar 
          navigationItems={navigationItems}
          isCollapsed={isCollapsed}
          onToggle={toggle}
        />
      )}
    </SidebarContainer>
  );
}
```

**Features:**
- Automatic state management
- localStorage persistence
- Default navigation items
- Responsive state handling

### ApplicationShell

The main application layout that integrates sidebar with content area.

```tsx
import { ApplicationShell } from '@/components/ApplicationShell';

function Layout({ children }) {
  return (
    <ApplicationShell 
      showSidebar={true}
      navigationItems={customNavItems}
    >
      {children}
    </ApplicationShell>
  );
}
```

**Props:**
- `children: React.ReactNode` - Main content
- `showSidebar?: boolean` - Show/hide sidebar
- `navigationItems?: NavigationItem[]` - Custom navigation items
- `className?: string` - Additional CSS classes
- `sidebarProps?: Partial<SidebarProps>` - Props passed to Sidebar

## Navigation Configuration

### NavigationItem Interface

```tsx
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  requireAuth?: boolean;
  roles?: string[];
  external?: boolean;
}
```

### Default Navigation Items

```tsx
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    requireAuth: false
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: UserIcon,
    requireAuth: true
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: CogIcon,
    requireAuth: true,
    children: [
      {
        id: 'settings-general',
        label: 'General',
        href: '/settings/general',
        requireAuth: true
      },
      {
        id: 'settings-security',
        label: 'Security',
        href: '/settings/security',
        requireAuth: true,
        roles: ['admin']
      }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    href: '/help',
    icon: QuestionMarkIcon,
    requireAuth: false
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    icon: InformationIcon,
    requireAuth: false
  }
];
```

### Custom Navigation Configuration

```tsx
import { NavigationItem } from '@/types';
import { 
  ChartBarIcon, 
  DocumentIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

const customNavigationItems: NavigationItem[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    requireAuth: true,
    roles: ['admin', 'analyst']
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: DocumentIcon,
    requireAuth: true,
    badge: 5 // Show notification badge
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/users',
    icon: UsersIcon,
    requireAuth: true,
    roles: ['admin'],
    children: [
      {
        id: 'users-list',
        label: 'All Users',
        href: '/users',
        requireAuth: true,
        roles: ['admin']
      },
      {
        id: 'users-roles',
        label: 'Roles & Permissions',
        href: '/users/roles',
        requireAuth: true,
        roles: ['admin']
      }
    ]
  },
  {
    id: 'external-docs',
    label: 'Documentation',
    href: 'https://docs.example.com',
    icon: DocumentIcon,
    external: true,
    requireAuth: false
  }
];
```

## State Management

### Sidebar State

The sidebar maintains several pieces of state:

```tsx
interface SidebarState {
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean; // Mobile overlay state
  activeItem: string | null;
  expandedItems: string[]; // For nested navigation
}
```

### State Persistence

Sidebar state is automatically persisted to localStorage:

```tsx
// Storage keys
const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  SIDEBAR_EXPANDED_ITEMS: 'sidebar_expanded_items'
};

// State persistence
const saveSidebarState = (state: Partial<SidebarState>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEYS.SIDEBAR_COLLAPSED, 
      JSON.stringify(state.isCollapsed)
    );
    
    if (state.expandedItems) {
      localStorage.setItem(
        STORAGE_KEYS.SIDEBAR_EXPANDED_ITEMS,
        JSON.stringify(state.expandedItems)
      );
    }
  }
};

// State loading
const loadSidebarState = (): Partial<SidebarState> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const collapsed = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    const expandedItems = localStorage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED_ITEMS);
    
    return {
      isCollapsed: collapsed ? JSON.parse(collapsed) : false,
      expandedItems: expandedItems ? JSON.parse(expandedItems) : []
    };
  } catch (error) {
    console.error('Failed to load sidebar state:', error);
    return {};
  }
};
```

## Responsive Behavior

### Breakpoints

The sidebar adapts to different screen sizes:

```tsx
const BREAKPOINTS = {
  mobile: 768, // Below this width, sidebar becomes overlay
  tablet: 1024, // Tablet-specific behavior
  desktop: 1280 // Desktop behavior
};

// Responsive hook
function useResponsiveSidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < BREAKPOINTS.mobile);
      setIsTablet(width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { isMobile, isTablet };
}
```

### Mobile Behavior

On mobile devices, the sidebar becomes an overlay:

```tsx
// Mobile sidebar styles
const mobileStyles = {
  overlay: 'fixed inset-0 z-50 bg-black bg-opacity-50',
  sidebar: 'fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform',
  open: 'translate-x-0',
  closed: '-translate-x-full'
};

// Mobile sidebar component
function MobileSidebar({ isOpen, onClose, navigationItems }) {
  return (
    <>
      {isOpen && (
        <div 
          className={mobileStyles.overlay}
          onClick={onClose}
        />
      )}
      <div className={`
        ${mobileStyles.sidebar}
        ${isOpen ? mobileStyles.open : mobileStyles.closed}
      `}>
        <SidebarContent 
          navigationItems={navigationItems}
          onItemClick={onClose}
        />
      </div>
    </>
  );
}
```

## Authentication Integration

### Conditional Navigation Items

Navigation items can be conditionally rendered based on authentication state:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function NavigationList({ items }: { items: NavigationItem[] }) {
  const { isAuthenticated, user } = useAuth();
  
  const filteredItems = items.filter(item => {
    // Check authentication requirement
    if (item.requireAuth && !isAuthenticated) {
      return false;
    }
    
    // Check role requirements
    if (item.roles && user) {
      const hasRequiredRole = item.roles.some(role => 
        user.roles.includes(role)
      );
      if (!hasRequiredRole) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <ul>
      {filteredItems.map(item => (
        <NavigationItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

### Authentication-Aware Sidebar

```tsx
function AuthAwareSidebar() {
  const { isAuthenticated, user } = useAuth();
  const config = ConfigManager.getAuthConfig();
  
  // Don't show auth-specific items when auth is disabled
  const navigationItems = config.authEnabled 
    ? getAuthenticatedNavigationItems(isAuthenticated, user)
    : getPublicNavigationItems();
  
  return (
    <Sidebar 
      navigationItems={navigationItems}
      showUserInfo={config.authEnabled && isAuthenticated}
    />
  );
}
```

## Styling and Theming

### CSS Classes

The sidebar uses a comprehensive set of CSS classes for styling:

```css
/* Sidebar container */
.sidebar {
  @apply flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300;
}

.sidebar--collapsed {
  @apply w-16;
}

.sidebar--expanded {
  @apply w-64;
}

/* Navigation items */
.nav-item {
  @apply flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors;
}

.nav-item--active {
  @apply bg-blue-50 text-blue-700 border-r-2 border-blue-700;
}

.nav-item--collapsed {
  @apply justify-center px-2;
}

/* Icons */
.nav-icon {
  @apply w-5 h-5 mr-3 flex-shrink-0;
}

.nav-icon--collapsed {
  @apply mr-0;
}

/* Labels */
.nav-label {
  @apply truncate transition-opacity;
}

.nav-label--collapsed {
  @apply opacity-0 w-0;
}

/* Toggle button */
.sidebar-toggle {
  @apply p-2 rounded-md hover:bg-gray-100 transition-colors;
}

/* Mobile overlay */
.sidebar-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-40;
}

.sidebar-mobile {
  @apply fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform;
}
```

### Custom Themes

```tsx
interface SidebarTheme {
  background: string;
  border: string;
  text: string;
  activeBackground: string;
  activeText: string;
  hoverBackground: string;
  iconColor: string;
}

const themes: Record<string, SidebarTheme> = {
  light: {
    background: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-700',
    activeBackground: 'bg-blue-50',
    activeText: 'text-blue-700',
    hoverBackground: 'hover:bg-gray-100',
    iconColor: 'text-gray-500'
  },
  dark: {
    background: 'bg-gray-900',
    border: 'border-gray-700',
    text: 'text-gray-300',
    activeBackground: 'bg-blue-900',
    activeText: 'text-blue-300',
    hoverBackground: 'hover:bg-gray-800',
    iconColor: 'text-gray-400'
  }
};

// Apply theme
function ThemedSidebar({ theme = 'light' }) {
  const themeClasses = themes[theme];
  
  return (
    <div className={`sidebar ${themeClasses.background} ${themeClasses.border}`}>
      {/* Sidebar content with theme classes */}
    </div>
  );
}
```

## Accessibility

### Keyboard Navigation

The sidebar supports full keyboard navigation:

```tsx
function AccessibleSidebar() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, navigationItems.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Activate focused item
        break;
      case 'Escape':
        // Close mobile sidebar
        break;
    }
  };
  
  return (
    <nav 
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyDown}
    >
      {/* Navigation items */}
    </nav>
  );
}
```

### Screen Reader Support

```tsx
function AccessibleNavigationItem({ item, isActive, isCollapsed }) {
  return (
    <Link
      href={item.href}
      className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      title={isCollapsed ? item.label : undefined}
    >
      {item.icon && (
        <item.icon 
          className="nav-icon"
          aria-hidden="true"
        />
      )}
      <span 
        className={`nav-label ${isCollapsed ? 'sr-only' : ''}`}
        aria-hidden={isCollapsed}
      >
        {item.label}
      </span>
      {item.badge && (
        <span 
          className="badge"
          aria-label={`${item.badge} notifications`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
```

## Testing

### Unit Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';

const mockNavigationItems = [
  { id: '1', label: 'Home', href: '/', icon: HomeIcon },
  { id: '2', label: 'Profile', href: '/profile', icon: UserIcon }
];

test('should toggle sidebar collapse state', () => {
  const onToggle = jest.fn();
  
  render(
    <Sidebar 
      navigationItems={mockNavigationItems}
      isCollapsed={false}
      onToggle={onToggle}
    />
  );
  
  const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
  fireEvent.click(toggleButton);
  
  expect(onToggle).toHaveBeenCalledWith(true);
});

test('should persist sidebar state to localStorage', () => {
  const localStorageMock = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  render(<SidebarContainer />);
  
  // Trigger state change
  fireEvent.click(screen.getByRole('button', { name: /toggle/i }));
  
  expect(localStorageMock.setItem).toHaveBeenCalledWith(
    'sidebar_collapsed',
    'true'
  );
});
```

### Property Testing

```tsx
import * as fc from 'fast-check';

describe('Sidebar Properties', () => {
  it('should maintain state consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          isCollapsed: fc.boolean(),
          navigationItems: fc.array(fc.record({
            id: fc.string(),
            label: fc.string(),
            href: fc.string()
          }))
        }),
        (testConfig) => {
          const { isCollapsed, navigationItems } = testConfig;
          
          const { container } = render(
            <Sidebar 
              navigationItems={navigationItems}
              isCollapsed={isCollapsed}
            />
          );
          
          // Property: Sidebar should reflect collapsed state
          const sidebar = container.querySelector('.sidebar');
          const hasCollapsedClass = sidebar?.classList.contains('sidebar--collapsed');
          
          expect(hasCollapsedClass).toBe(isCollapsed);
          
          // Property: All navigation items should be rendered
          navigationItems.forEach(item => {
            expect(screen.getByText(item.label)).toBeInTheDocument();
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Integration Testing

```tsx
test('should integrate with authentication system', async () => {
  const authNavigationItems = [
    { id: '1', label: 'Public', href: '/public', requireAuth: false },
    { id: '2', label: 'Private', href: '/private', requireAuth: true }
  ];
  
  // Test unauthenticated state
  render(
    <AuthProvider>
      <ApplicationShell navigationItems={authNavigationItems}>
        <div>Content</div>
      </ApplicationShell>
    </AuthProvider>
  );
  
  expect(screen.getByText('Public')).toBeInTheDocument();
  expect(screen.queryByText('Private')).not.toBeInTheDocument();
  
  // Test authenticated state
  // ... authenticate user
  
  await waitFor(() => {
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Memoization

```tsx
import { memo, useMemo } from 'react';

const NavigationItem = memo(({ item, isActive, isCollapsed }) => {
  return (
    <Link href={item.href} className={getItemClasses(isActive, isCollapsed)}>
      {item.icon && <item.icon className="nav-icon" />}
      <span className="nav-label">{item.label}</span>
    </Link>
  );
});

function Sidebar({ navigationItems, isCollapsed }) {
  const filteredItems = useMemo(() => {
    return navigationItems.filter(item => {
      // Apply filtering logic
      return shouldShowItem(item);
    });
  }, [navigationItems, /* dependencies */]);
  
  return (
    <nav>
      {filteredItems.map(item => (
        <NavigationItem 
          key={item.id}
          item={item}
          isActive={isActive(item)}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
}
```

### Virtual Scrolling

For large navigation lists:

```tsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedNavigation({ items, height = 400 }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <NavigationItem item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={48}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Sidebar state not persisting

**Cause:** localStorage not available or quota exceeded

**Solution:**
```tsx
const saveSidebarState = (state) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sidebar_state', JSON.stringify(state));
    }
  } catch (error) {
    console.warn('Failed to save sidebar state:', error);
    // Fallback to memory storage or disable persistence
  }
};
```

#### 2. Mobile sidebar not closing on navigation

**Cause:** Missing onItemClick handler

**Solution:**
```tsx
function MobileSidebar({ onClose }) {
  const handleItemClick = () => {
    onClose(); // Close sidebar on mobile after navigation
  };
  
  return (
    <NavigationList 
      items={navigationItems}
      onItemClick={handleItemClick}
    />
  );
}
```

#### 3. Icons not displaying

**Cause:** Icon components not imported or incorrect props

**Solution:**
```tsx
// Ensure icons are properly imported
import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';

// Check icon component props
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: HomeIcon // Component reference, not JSX
  }
];
```

## Requirements Mapping

This module implements the following requirements:

- **6.1** - Collapsible sidebar navigation with toggle functionality
- **6.2** - Sidebar state persistence across browser sessions
- **6.3** - Responsive behavior for mobile and desktop
- **6.4** - Navigation item configuration and customization
- **6.5** - State management and localStorage integration
- **6.7** - Accessibility support and keyboard navigation
- **3.4** - Integration with ApplicationShell layout component
- **7.3** - Comprehensive documentation and examples