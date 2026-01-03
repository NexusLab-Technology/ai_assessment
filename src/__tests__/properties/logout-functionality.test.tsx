/**
 * Property-Based Tests for Logout Functionality
 * Feature: configurable-auth-framework, Properties 13-17: Logout functionality
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ApplicationShell } from '@/components/ApplicationShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { DEFAULT_NAVIGATION } from '@/lib/constants';
import fc from 'fast-check';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    isAuthEnabled: jest.fn(() => true),
    getAuthConfig: jest.fn(),
    getDefaultRoute: () => '/',
  },
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

// Mock AuthContext
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockUseAuth(),
}));

// Import mocked modules
import { ConfigManager } from '@/lib/config';
const mockGetAuthConfig = ConfigManager.getAuthConfig as jest.MockedFunction<typeof ConfigManager.getAuthConfig>;

describe('Logout Functionality Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockPush.mockClear();
    mockLogout.mockClear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 13: Logout button visibility
   * For any authentication state, when authentication is enabled and user is authenticated, 
   * the logout button should be displayed in a prominent location
   * Validates: Requirements 3.1.1
   */
  describe('Property 13: Logout button visibility', () => {
    it('should display logout button when authentication is enabled and user is authenticated', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // sidebarCollapsed
          fc.record({
            id: fc.string({ minLength: 1 }),
            username: fc.string({ minLength: 1 }),
            email: fc.option(fc.emailAddress()),
            roles: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
            lastLogin: fc.date(),
          }), // user
          (sidebarCollapsed, user) => {
            cleanup();

            // Setup: Authentication enabled and user authenticated
            mockGetAuthConfig.mockReturnValue({
              authEnabled: true,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: user,
              loading: false,
              logout: mockLogout,
            });

            const { container } = render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Should display logout button
            const logoutButton = screen.getByRole('button', { name: /logout/i });
            expect(logoutButton).toBeInTheDocument();
            expect(logoutButton).toHaveTextContent('Logout');

            // Should be in a prominent location (sidebar footer)
            const sidebar = container.querySelector('[class*="flex-shrink-0"]');
            expect(sidebar).toBeInTheDocument();
            expect(sidebar).toContainElement(logoutButton);

            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display logout button when authentication is disabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isAuthenticated
          fc.boolean(), // sidebarCollapsed
          (isAuthenticated, sidebarCollapsed) => {
            cleanup();

            // Setup: Authentication disabled
            mockGetAuthConfig.mockReturnValue({
              authEnabled: false,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: isAuthenticated,
              user: isAuthenticated ? { id: '1', username: 'test', roles: ['user'], lastLogin: new Date() } : null,
              loading: false,
              logout: mockLogout,
            });

            render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Should not display logout button
            expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();

            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display logout button when user is not authenticated', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // sidebarCollapsed
          (sidebarCollapsed) => {
            cleanup();

            // Setup: Authentication enabled but user not authenticated
            mockGetAuthConfig.mockReturnValue({
              authEnabled: true,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: false,
              user: null,
              loading: false,
              logout: mockLogout,
            });

            render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Should not display logout button
            expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();

            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Logout session clearing
   * For any authenticated session, clicking the logout button should immediately clear the authentication session
   * Validates: Requirements 3.1.2
   */
  describe('Property 14: Logout session clearing', () => {
    it('should call logout function when logout button is clicked', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            username: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            email: fc.option(fc.emailAddress()),
            roles: fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1 }),
            lastLogin: fc.date(),
          }), // user
          (user) => {
            cleanup();
            mockLogout.mockClear(); // Clear mock before each property run

            // Setup: Authentication enabled and user authenticated
            mockGetAuthConfig.mockReturnValue({
              authEnabled: true,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: user,
              loading: false,
              logout: mockLogout,
            });

            render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            
            // Click logout button
            fireEvent.click(logoutButton);

            // Should call logout function exactly once
            expect(mockLogout).toHaveBeenCalledTimes(1);

            cleanup();
          }
        ),
        { numRuns: 50 } // Reduced runs for stability
      );
    });
  });

  /**
   * Property 15: Logout redirect behavior
   * For any logout action, the system should redirect the user to the login page after logout
   * Validates: Requirements 3.1.3
   */
  describe('Property 15: Logout redirect behavior', () => {
    it('should redirect to login page after successful logout', async () => {
      cleanup();
      mockLogout.mockClear();
      mockPush.mockClear();

      // Setup: Authentication enabled and user authenticated
      mockGetAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });

      const testUser = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        lastLogin: new Date(),
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: testUser,
        loading: false,
        logout: mockLogout,
      });

      // Mock logout to resolve successfully
      mockLogout.mockResolvedValue(undefined);

      render(
        <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
          <div>Test Content</div>
        </ApplicationShell>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      
      // Click logout button
      fireEvent.click(logoutButton);

      // Wait for async logout to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should redirect to login page
      expect(mockPush).toHaveBeenCalledWith('/login');

      cleanup();
    });

    it('should redirect to login page even if logout fails', async () => {
      cleanup();
      mockLogout.mockClear();
      mockPush.mockClear();

      // Setup: Authentication enabled and user authenticated
      mockGetAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });

      const testUser = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        lastLogin: new Date(),
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: testUser,
        loading: false,
        logout: mockLogout,
      });

      // Mock logout to reject
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      render(
        <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
          <div>Test Content</div>
        </ApplicationShell>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      
      // Click logout button
      fireEvent.click(logoutButton);

      // Wait for async logout to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still redirect to login page even if logout fails
      expect(mockPush).toHaveBeenCalledWith('/login');

      cleanup();
    });
  });

  /**
   * Property 16: Logout button conditional rendering
   * For any authentication configuration, when authentication is disabled, the logout button should not be displayed
   * Validates: Requirements 3.1.4
   */
  describe('Property 16: Logout button conditional rendering', () => {
    it('should not display logout button when authentication is disabled regardless of user state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isAuthenticated
          fc.option(fc.record({
            id: fc.string({ minLength: 1 }),
            username: fc.string({ minLength: 1 }),
            email: fc.option(fc.emailAddress()),
            roles: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
            lastLogin: fc.date(),
          })), // user (can be null)
          (isAuthenticated, user) => {
            cleanup();

            // Setup: Authentication disabled
            mockGetAuthConfig.mockReturnValue({
              authEnabled: false,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: isAuthenticated,
              user: user,
              loading: false,
              logout: mockLogout,
            });

            render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Should never display logout button when auth is disabled
            expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();

            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: Logout button accessibility
   * For any authenticated page within the application, the logout button should be accessible and functional
   * Validates: Requirements 3.1.5
   */
  describe('Property 17: Logout button accessibility', () => {
    it('should be accessible from any authenticated page', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            username: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            email: fc.option(fc.emailAddress()),
            roles: fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1 }),
            lastLogin: fc.date(),
          }), // user
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // page content
          (user, pageContent) => {
            cleanup();

            // Setup: Authentication enabled and user authenticated
            mockGetAuthConfig.mockReturnValue({
              authEnabled: true,
              sessionTimeout: 3600000,
              rememberSidebar: true,
              defaultRoute: '/',
            });

            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: user,
              loading: false,
              logout: mockLogout,
            });

            render(
              <ApplicationShell navigationItems={DEFAULT_NAVIGATION}>
                <div data-testid="page-content">{pageContent}</div>
              </ApplicationShell>
            );

            // Should have logout button accessible
            const logoutButton = screen.getByRole('button', { name: /logout/i });
            expect(logoutButton).toBeInTheDocument();
            expect(logoutButton).toBeVisible();

            // Should have proper accessibility attributes
            expect(logoutButton).toHaveAttribute('aria-label', 'Logout');

            // Should be functional (clickable)
            expect(logoutButton).not.toBeDisabled();

            // Page content should also be present (check if it contains the content)
            const pageContentElement = screen.getByTestId('page-content');
            expect(pageContentElement.textContent).toContain(pageContent.trim());

            cleanup();
          }
        ),
        { numRuns: 50 } // Reduced runs for stability
      );
    });
  });
});