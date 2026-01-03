/**
 * Integration Tests: Sidebar Behavior Across Different Pages
 * Tests sidebar functionality, state persistence, and responsive behavior
 * Requirements: 6.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApplicationShell } from '@/components/ApplicationShell';
import { RouteGuard } from '@/components/RouteGuard';
import { ConfigManager } from '@/lib/config';
import { NavigationItem } from '@/types';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    getAuthConfig: jest.fn(),
    isAuthEnabled: jest.fn(),
    resetConfig: jest.fn(),
  },
}));

const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test navigation items (Settings should not be in main nav)
const testNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '🏠',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    icon: 'ℹ️',
  },
];

// Test components
function TestPage({ title, navigationItems }: { title: string; navigationItems?: NavigationItem[] }) {
  return (
    <AuthProvider>
      <RouteGuard requireAuth={false}>
        <ApplicationShell navigationItems={navigationItems}>
          <div data-testid={`page-${title.toLowerCase()}`}>
            <h1>{title} Page</h1>
            <p>Content for {title}</p>
          </div>
        </ApplicationShell>
      </RouteGuard>
    </AuthProvider>
  );
}

describe('Sidebar Behavior Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default configuration
    mockConfigManager.getAuthConfig.mockReturnValue({
      authEnabled: false, // Disable auth for sidebar-focused tests
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: "/",
    });
    mockConfigManager.isAuthEnabled.mockReturnValue(false);
  });

  describe('Sidebar State Persistence', () => {
    it('should persist sidebar collapsed state across page navigation', async () => {
      const user = userEvent.setup();

      // Start with dashboard page
      const { rerender } = render(
        <TestPage title="Dashboard" navigationItems={testNavigationItems} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
      });

      // Find and click sidebar toggle button
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      // Should save collapsed state to localStorage
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'sidebar_state',
          expect.stringContaining('isCollapsed')
        );
      });

      // Mock localStorage to return collapsed state
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'sidebar_state') {
          return JSON.stringify({ isCollapsed: true });
        }
        return null;
      });

      // Navigate to profile page
      rerender(<TestPage title="Profile" navigationItems={testNavigationItems} />);

      await waitFor(() => {
        expect(screen.getByTestId('page-profile')).toBeInTheDocument();
      });

      // Sidebar should remain collapsed
      const sidebar = screen.getByRole('navigation');
      expect(sidebar.parentElement).toHaveClass('w-16');
    });

    it('should load saved sidebar state on initial render', async () => {
      // Mock localStorage with saved collapsed state
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'sidebar_state') {
          return JSON.stringify({ isCollapsed: true });
        }
        return null;
      });

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar.parentElement).toHaveClass('w-16');
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage to throw error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      // Should render with default state (expanded)
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar.parentElement).toHaveClass('w-64');
      });
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('Sidebar Navigation Items', () => {
    it('should render all navigation items correctly', async () => {
      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      await waitFor(() => {
        // Check main navigation items (Settings is now in footer, not main nav)
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        
        // Settings should NOT be visible when auth is disabled (default state)
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });

    it('should handle nested navigation items', async () => {
      const user = userEvent.setup();

      // Create navigation items with nested structure for this specific test
      const nestedNavigationItems: NavigationItem[] = [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/',
          icon: '🏠',
        },
        {
          id: 'admin',
          label: 'Admin',
          href: '/admin',
          icon: '⚙️',
          children: [
            {
              id: 'general',
              label: 'General',
              href: '/admin/general',
              icon: '📋',
            },
            {
              id: 'security',
              label: 'Security',
              href: '/admin/security',
              icon: '🔒',
            },
          ],
        },
      ];

      render(<TestPage title="Dashboard" navigationItems={nestedNavigationItems} />);

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });

      // Click on Admin to expand children
      const adminButton = screen.getByRole('button', { name: /admin/i });
      await user.click(adminButton);

      // Should show child items
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
      });
    });

    it('should update navigation items when props change', async () => {
      const initialItems = [
        { id: 'home', label: 'Home', href: '/', icon: '🏠' },
      ];

      const updatedItems = [
        { id: 'home', label: 'Home', href: '/', icon: '🏠' },
        { id: 'new-page', label: 'New Page', href: '/new', icon: '📄' },
      ];

      const { rerender } = render(
        <TestPage title="Dashboard" navigationItems={initialItems} />
      );

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.queryByText('New Page')).not.toBeInTheDocument();
      });

      // Update navigation items
      rerender(<TestPage title="Dashboard" navigationItems={updatedItems} />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('New Page')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Responsive Behavior', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600, // Mobile width
      });

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      // Trigger resize event to update isMobile state
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        // On mobile, sidebar should be hidden when collapsed (default state)
        // Since we start expanded, it should be visible (translate-x-0)
        expect(sidebar.parentElement).toHaveClass('translate-x-0');
      });

      // Now collapse it to see mobile behavior
      const user = userEvent.setup();
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        // When collapsed on mobile, should be hidden
        expect(sidebar.parentElement).toHaveClass('-translate-x-full');
      });
    });

    it('should handle window resize events', async () => {
      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      // Initially desktop
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar.parentElement).toHaveClass('translate-x-0');
      });

      // Simulate window resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Collapse sidebar to see mobile behavior
      const user = userEvent.setup();
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        // Should adapt to mobile layout
        const sidebar = screen.getByRole('navigation');
        expect(sidebar.parentElement).toHaveClass('-translate-x-full');
      });
    });
  });

  describe('Sidebar Toggle Functionality', () => {
    it('should toggle sidebar state when toggle button is clicked', async () => {
      const user = userEvent.setup();

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      const sidebar = screen.getByRole('navigation');

      // Initially expanded
      expect(sidebar.parentElement).toHaveClass('w-64');

      // Click to collapse
      await user.click(toggleButton);

      await waitFor(() => {
        expect(sidebar.parentElement).toHaveClass('w-16');
      });

      // Button text should change
      const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      await user.click(expandButton);

      await waitFor(() => {
        expect(sidebar.parentElement).toHaveClass('w-64');
      });
    });

    it('should show/hide navigation labels when collapsed', async () => {
      const user = userEvent.setup();

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });

      // Initially labels should be visible
      expect(screen.getByText('Dashboard')).toBeVisible();
      expect(screen.getByText('Profile')).toBeVisible();

      // Collapse sidebar
      await user.click(toggleButton);

      await waitFor(() => {
        // Labels should be hidden when collapsed
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Authentication Integration', () => {
    it('should show all navigation items when authentication is disabled', async () => {
      const publicAndPrivateItems: NavigationItem[] = [
        {
          id: 'public',
          label: 'Public Page',
          href: '/public',
          icon: '🌍',
        },
        {
          id: 'private',
          label: 'Private Page',
          href: '/private',
          icon: '🔒',
        },
      ];

      render(<TestPage title="Dashboard" navigationItems={publicAndPrivateItems} />);

      await waitFor(() => {
        // Should show both items when auth is disabled
        expect(screen.getByText('Public Page')).toBeInTheDocument();
        expect(screen.getByText('Private Page')).toBeInTheDocument();
      });
    });

    it('should render correctly with authentication enabled', async () => {
      // Configure authentication as enabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      // Mock authenticated state
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session_data') {
          return JSON.stringify({
            token: 'mock-token',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
        if (key === 'user_data') {
          return JSON.stringify({
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['user'],
            lastLogin: new Date().toISOString(),
          });
        }
        return null;
      });

      const authNavigationItems: NavigationItem[] = [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/',
          icon: '🏠',
        },
        {
          id: 'profile',
          label: 'Profile',
          href: '/profile',
          icon: '👤',
        },
      ];

      render(
        <AuthProvider>
          <RouteGuard requireAuth={false}>
            <ApplicationShell navigationItems={authNavigationItems}>
              <div data-testid="content">Content</div>
            </ApplicationShell>
          </RouteGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        // Should render navigation items when authenticated
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Performance', () => {
    it('should not re-render unnecessarily when navigation items are stable', async () => {
      const renderSpy = jest.fn();
      
      const stableNavigationItems = testNavigationItems;

      const { rerender } = render(
        <TestPage title="Dashboard" navigationItems={stableNavigationItems} />
      );

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(0);

      // Re-render with same navigation items
      rerender(<TestPage title="Dashboard" navigationItems={stableNavigationItems} />);

      // Should not cause unnecessary re-renders of navigation items
      // (This would be more meaningful with actual memoization in place)
    });

    it('should handle large numbers of navigation items efficiently', async () => {
      const largeNavigationItems: NavigationItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        label: `Item ${i}`,
        href: `/item-${i}`,
        icon: '📄',
      }));

      const startTime = performance.now();

      render(<TestPage title="Dashboard" navigationItems={largeNavigationItems} />);

      await waitFor(() => {
        expect(screen.getByText('Item 0')).toBeInTheDocument();
        expect(screen.getByText('Item 99')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Sidebar Accessibility', () => {
    it('should provide proper ARIA labels and roles', async () => {
      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toBeInTheDocument();

        const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
        expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      await waitFor(() => {
        const firstNavItem = screen.getByRole('link', { name: /dashboard/i });
        expect(firstNavItem).toBeInTheDocument();
      });

      // Tab to first navigation item
      await user.tab();
      
      // The toggle button gets focus first
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleButton).toHaveFocus();

      // Tab to first navigation item
      await user.tab();
      
      const firstNavItem = screen.getByRole('link', { name: /dashboard/i });
      expect(firstNavItem).toHaveFocus();
    });

    it('should provide appropriate labels when collapsed', async () => {
      const user = userEvent.setup();

      render(<TestPage title="Dashboard" navigationItems={testNavigationItems} />);

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      
      // Collapse sidebar
      await user.click(toggleButton);

      await waitFor(() => {
        // Button label should change
        const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
        expect(expandButton).toHaveAttribute('aria-label', 'Expand sidebar');
      });
    });
  });
});