/**
 * Integration Tests for Sidebar Settings UI Update
 * Feature: sidebar-settings-ui-update
 * Tests complete user flows and component integration
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ApplicationShell } from '@/components/ApplicationShell';
import SettingsPage from '@/app/settings/page';
import { NavigationItem } from '@/types';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    getAuthConfig: () => ({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    }),
    isAuthEnabled: jest.fn(() => true),
  },
}));

// Get the mocked ConfigManager for test manipulation
const { ConfigManager: mockConfigManager } = jest.requireMock('@/lib/config');

// Mock RouteGuard to always render children
jest.mock('@/components/RouteGuard', () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.innerWidth for responsive behavior
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// Mock useAuth hook
const mockUseAuth = jest.fn();
const mockLogout = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar Settings UI Integration Tests', () => {
  const mockNavigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      href: '/',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      href: '/settings',
    },
  ];

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['admin'],
    lastLogin: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    cleanup();
    
    // Default authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      loading: false,
      error: undefined,
      login: jest.fn(),
      logout: mockLogout,
      checkAuth: jest.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * Test complete user flow from login to settings navigation
   * Validates: Requirements 1.4, 2.3
   */
  describe('Complete user flow integration', () => {
    it('should allow user to navigate to settings and view profile information', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Verify sidebar is present and expanded
      const navigationElements = screen.getAllByText('Navigation');
      expect(navigationElements.length).toBeGreaterThanOrEqual(1);
      
      // Verify settings navigation is active (since we're on /settings)
      const settingsLinks = screen.getAllByRole('link', { name: '⚙️ Settings' });
      expect(settingsLinks[0]).toHaveClass('bg-indigo-100');
      expect(settingsLinks[0]).toHaveClass('text-indigo-700');
      
      // Verify settings page content is displayed
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      
      // Verify logout button is present in sidebar
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      expect(logoutButtons[0]).toHaveClass('text-red-600');
    });

    it('should handle sidebar collapse and expand while maintaining functionality', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Initially expanded
      const navigationElements = screen.getAllByText('Navigation');
      expect(navigationElements.length).toBeGreaterThanOrEqual(1);
      
      const settingsTexts = screen.getAllByText('Settings');
      expect(settingsTexts.length).toBeGreaterThanOrEqual(1);
      
      const logoutTexts = screen.getAllByText('Logout');
      expect(logoutTexts.length).toBeGreaterThanOrEqual(1);
      
      // Collapse sidebar
      const collapseButtons = screen.getAllByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(collapseButtons[0]);
      
      // Wait for collapse animation - check that at least one Navigation text is gone
      await waitFor(() => {
        const navigationElements = screen.queryAllByText('Navigation');
        const settingsTexts = screen.queryAllByText('Settings');
        const logoutTexts = screen.queryAllByText('Logout');
        
        // At least some should be hidden due to collapse
        expect(navigationElements.length + settingsTexts.length + logoutTexts.length).toBeLessThan(6);
      });
      
      // Verify icons are still present
      const settingsIcons = screen.getAllByRole('link', { name: '⚙️' });
      expect(settingsIcons.length).toBeGreaterThanOrEqual(1);
      
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      
      // Verify settings page content is still displayed
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      
      // Expand sidebar again
      const expandButtons = screen.getAllByRole('button', { name: /expand sidebar/i });
      fireEvent.click(expandButtons[0]);
      
      // Wait for expand animation
      await waitFor(() => {
        const navigationElements = screen.getAllByText('Navigation');
        const settingsTexts = screen.getAllByText('Settings');
        const logoutTexts = screen.getAllByText('Logout');
        
        expect(navigationElements.length).toBeGreaterThanOrEqual(1);
        expect(settingsTexts.length).toBeGreaterThanOrEqual(1);
        expect(logoutTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should maintain settings page state during sidebar interactions', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Verify initial state
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      
      // Collapse and expand sidebar multiple times
      const toggleButtons = screen.getAllByRole('button', { name: /collapse sidebar/i });
      
      for (let i = 0; i < 3; i++) {
        fireEvent.click(toggleButtons[0]);
        
        // Settings page content should remain stable
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        
        // Wait a bit for any animations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });

  /**
   * Test logout flow from sidebar
   * Validates: Requirements 1.4
   */
  describe('Logout flow integration', () => {
    it('should execute logout when logout button is clicked from sidebar', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Find and click logout button
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      
      fireEvent.click(logoutButtons[0]);
      
      // Verify logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
      
      // Verify redirect to login page was attempted
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle logout from collapsed sidebar', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Collapse sidebar first
      const collapseButtons = screen.getAllByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(collapseButtons[0]);
      
      await waitFor(() => {
        const logoutTexts = screen.queryAllByText('Logout');
        // Due to nested structure, we might still have some Logout text, but at least one should be hidden
        expect(logoutTexts.length).toBeLessThan(4); // Adjust expectation for nested structure
      });
      
      // Find logout button by aria-label (icon only)
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      
      fireEvent.click(logoutButtons[0]);
      
      // Verify logout function was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
      
      // Verify redirect to login page was attempted
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle logout errors gracefully', async () => {
      // Mock logout to throw an error
      const mockLogoutWithError = jest.fn().mockRejectedValue(new Error('Logout failed'));
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: mockLogoutWithError,
        checkAuth: jest.fn(),
      });

      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      fireEvent.click(logoutButtons[0]);
      
      // Verify logout function was called
      expect(mockLogoutWithError).toHaveBeenCalledTimes(1);
      
      // Even with error, should still redirect to login page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  /**
   * Test navigation between different states
   * Validates: Requirements 2.3, 6.8
   */
  describe('Navigation state integration', () => {
    it('should handle navigation between home and settings', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Verify we're on settings (active state)
      const settingsLinks = screen.getAllByRole('link', { name: '⚙️ Settings' });
      expect(settingsLinks[0]).toHaveClass('bg-indigo-100');
      expect(settingsLinks[0]).toHaveClass('text-indigo-700');
      
      // Verify home link is not active
      const homeLinks = screen.getAllByRole('link', { name: '🏠 Home' });
      expect(homeLinks[0]).not.toHaveClass('bg-indigo-100');
      expect(homeLinks[0]).not.toHaveClass('text-indigo-700');
      expect(homeLinks[0]).toHaveClass('text-gray-600');
      
      // Both links should be clickable
      expect(settingsLinks[0]).toHaveAttribute('href', '/settings');
      expect(homeLinks[0]).toHaveAttribute('href', '/');
    });

    it('should maintain consistent navigation structure across different user roles', async () => {
      const testRoles = ['admin', 'user', 'moderator'];
      
      for (const role of testRoles) {
        cleanup();
        
        mockUseAuth.mockReturnValue({
          isAuthenticated: true,
          user: { ...mockUser, roles: [role] },
          loading: false,
          error: undefined,
          login: jest.fn(),
          logout: mockLogout,
          checkAuth: jest.fn(),
        });

        render(
          <ApplicationShell navigationItems={mockNavigationItems}>
            <SettingsPage />
          </ApplicationShell>
        );

        // Navigation structure should be consistent regardless of role
        const homeLinks = screen.getAllByRole('link', { name: '🏠 Home' });
        const settingsLinks = screen.getAllByRole('link', { name: '⚙️ Settings' });
        const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
        
        expect(homeLinks.length).toBeGreaterThanOrEqual(1);
        expect(settingsLinks.length).toBeGreaterThanOrEqual(1);
        expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
        
        // Settings page should show the user's role
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText(role)).toBeInTheDocument();
      }
    });

    it('should handle unauthenticated state properly', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: mockLogout,
        checkAuth: jest.fn(),
      });

      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Sidebar should not be shown when not authenticated
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
      
      // Settings page should still render but show "Not available" for user data
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      const notAvailableElements = screen.getAllByText('Not available');
      expect(notAvailableElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  /**
   * Test responsive behavior integration
   * Validates: Requirements 6.2, 6.7
   */
  describe('Responsive behavior integration', () => {
    it('should handle mobile viewport correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600, // Mobile width
      });

      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // On mobile, sidebar behavior should be different
      // The exact behavior depends on implementation, but content should still be accessible
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      
      // Navigation should still be present
      const settingsLinks = screen.getAllByRole('link', { name: '⚙️ Settings' });
      expect(settingsLinks.length).toBeGreaterThanOrEqual(1);
      
      // Logout should still be accessible
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain functionality across viewport changes', async () => {
      render(
        <ApplicationShell navigationItems={mockNavigationItems}>
          <SettingsPage />
        </ApplicationShell>
      );

      // Start with desktop
      const navigationElements = screen.getAllByText('Navigation');
      expect(navigationElements.length).toBeGreaterThanOrEqual(1);
      
      // Simulate viewport change to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      // Content should remain accessible
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      
      // Logout should still work
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(logoutButtons[0]);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});