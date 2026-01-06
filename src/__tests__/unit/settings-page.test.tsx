/**
 * Unit Tests for Settings Page Component
 * Feature: sidebar-settings-ui-update
 * Validates: Requirements 3.1, 3.5, 4.1, 4.2
 */

import { render, screen, cleanup } from '@testing-library/react';
import SettingsPage from '@/app/settings/page';
import { User } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
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
    isAuthEnabled: () => true,
    getDefaultRoute: () => '/',
    resetConfig: jest.fn(),
  },
}));

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

// Mock useAuth hook directly
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Settings Page Component', () => {
  const mockUser: User = {
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
    
    // Default mock state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      loading: false,
      error: undefined,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * Test profile submenu section rendering
   * Validates: Requirement 3.1 - Profile submenu section with user information display
   */
  describe('Profile submenu section rendering', () => {
    it('should render profile information section with correct title', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    it('should display user information fields with labels', () => {
      render(<SettingsPage />);
      
      // Check field labels
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      
      // Check field values
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should handle missing email gracefully', () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: userWithoutEmail,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SettingsPage />);
      
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    it('should display default role when user has no roles', () => {
      const userWithoutRoles = { ...mockUser, roles: [] };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: userWithoutRoles,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SettingsPage />);
      
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should display first role when user has multiple roles', () => {
      const userWithMultipleRoles = { ...mockUser, roles: ['admin', 'user', 'moderator'] };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: userWithMultipleRoles,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SettingsPage />);
      
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.queryByText('user')).not.toBeInTheDocument();
      expect(screen.queryByText('moderator')).not.toBeInTheDocument();
    });
  });

  /**
   * Test that no password/user management features are present
   * Validates: Requirements 3.5, 4.1, 4.2 - No password management or user management features
   */
  describe('Password and user management features absence', () => {
    it('should not display password change functionality', () => {
      render(<SettingsPage />);
      
      // Check that password-related elements are not present
      expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
      expect(screen.queryByText('Current Password')).not.toBeInTheDocument();
      expect(screen.queryByText('New Password')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm Password')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('should not display user management functionality', () => {
      render(<SettingsPage />);
      
      // Check that user management elements are not present
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Update Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should not display form inputs for editing user data', () => {
      render(<SettingsPage />);
      
      // Check that no input fields are present for editing
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('testuser')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('test@example.com')).not.toBeInTheDocument();
    });

    it('should display user information as read-only text', () => {
      render(<SettingsPage />);
      
      // Verify that user data is displayed as text, not in input fields
      const usernameElement = screen.getByText('testuser');
      const emailElement = screen.getByText('test@example.com');
      const roleElement = screen.getByText('admin');
      
      expect(usernameElement.tagName).not.toBe('INPUT');
      expect(emailElement.tagName).not.toBe('INPUT');
      expect(roleElement.tagName).not.toBe('INPUT');
      
      // Verify these are not within form elements
      expect(usernameElement.closest('form')).toBeNull();
      expect(emailElement.closest('form')).toBeNull();
      expect(roleElement.closest('form')).toBeNull();
    });
  });

  /**
   * Test page structure and layout
   * Validates: Requirement 3.1 - Proper page structure with RouteGuard and ApplicationShell
   */
  describe('Page structure and layout', () => {
    it('should render with proper page structure', () => {
      const { container } = render(<SettingsPage />);
      
      // Check that the page renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle unauthenticated state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SettingsPage />);
      
      // Should still render the page structure
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      
      // Should show "Not available" for all fields when no user
      const notAvailableElements = screen.getAllByText('Not available');
      expect(notAvailableElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SettingsPage />);
      
      // During loading, the ApplicationShell shows loading screen, not the settings content
      // So we should expect the loading screen instead
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Profile Information')).not.toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(<SettingsPage />);
      
      // Check for proper heading structure
      const heading = screen.getByText('Profile Information');
      expect(heading.tagName).toBe('H2');
      
      // Check for proper container structure
      const profileSection = heading.closest('div');
      expect(profileSection).toBeInTheDocument();
    });
  });
});