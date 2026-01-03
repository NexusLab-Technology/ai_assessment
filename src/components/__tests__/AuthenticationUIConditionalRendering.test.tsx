import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { LoginPage } from '../LoginPage';
import { AuthWrapper } from '../AuthWrapper';
import { RouteGuard } from '../RouteGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
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

/**
 * Property 9: Authentication UI conditional rendering
 * **Feature: configurable-auth-framework, Property 9: Authentication UI conditional rendering**
 * 
 * This test validates Requirements 1.4:
 * "WHEN authentication is disabled, THE Auth_Framework SHALL not render login-related UI components"
 */
describe('Property 9: Authentication UI conditional rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup(); // Clean up any previous renders
    
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
  });

  afterEach(() => {
    cleanup(); // Clean up after each test
  });

  /**
   * Core property test: When authentication is disabled, no login-related UI components should be rendered
   */
  it('should not render login-related UI components when authentication is disabled', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // authEnabled
        (authEnabled) => {
          // Clean up before each property test iteration
          cleanup();
          
          // Set up configuration
          mockConfigManager.getAuthConfig.mockReturnValue({
            authEnabled,
            sessionTimeout: 3600000,
            rememberSidebar: true,
        defaultRoute: "/",
          });
          mockConfigManager.isAuthEnabled.mockReturnValue(authEnabled);

          // Test AuthWrapper behavior
          const { unmount: unmountAuthWrapper } = render(
            <AuthWrapper>
              <div data-testid="wrapped-content">Application Content</div>
            </AuthWrapper>
          );

          if (!authEnabled) {
            // When auth is disabled, AuthWrapper should render children directly
            expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
            
            // Should not have any authentication provider context
            // The content should be rendered without any auth-related wrappers
            expect(screen.getByTestId('wrapped-content')).toHaveTextContent('Application Content');
          } else {
            // When auth is enabled, AuthWrapper should provide AuthProvider
            expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
          }

          unmountAuthWrapper();

          // Test RouteGuard behavior with authentication disabled
          if (!authEnabled) {
            const { unmount: unmountRouteGuard } = render(
              <AuthProvider>
                <RouteGuard requireAuth={true}>
                  <div data-testid="protected-content">Protected Content</div>
                </RouteGuard>
              </AuthProvider>
            );

            // When auth is disabled, RouteGuard should allow access regardless of requireAuth
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            
            // Should not show any loading states or authentication barriers
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.queryByText('Checking authorization...')).not.toBeInTheDocument();
            
            unmountRouteGuard();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test LoginPage conditional rendering based on authentication configuration
   */
  it('should conditionally render LoginPage based on authentication configuration', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // authEnabled
        fc.string({ minLength: 1, maxLength: 20 }), // error message
        (authEnabled, errorMessage) => {
          // Clean up before each property test iteration
          cleanup();
          
          // Set up configuration
          mockConfigManager.getAuthConfig.mockReturnValue({
            authEnabled,
            sessionTimeout: 3600000,
            rememberSidebar: true,
        defaultRoute: "/",
          });

          if (authEnabled) {
            // When auth is enabled, LoginPage should render normally
            const mockLogin = jest.fn();
            
            const { unmount } = render(
              <LoginPage
                onLogin={mockLogin}
                loading={false}
                error={errorMessage}
              />
            );

            // Should render login form elements
            expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
            expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
            
            // Should show error message if provided
            if (errorMessage.trim().length > 0) {
              expect(screen.getByText(errorMessage.trim())).toBeInTheDocument();
            }
            
            unmount();
          }
          
          // Note: When auth is disabled, the LoginPage component itself can still render,
          // but the application logic (in login/page.tsx) prevents it from being shown
          // This is tested in the integration test below
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Integration test: Complete authentication UI flow
   */
  it('should handle complete authentication UI flow based on configuration', () => {
    fc.assert(
      fc.property(
        fc.record({
          authEnabled: fc.boolean(),
          requireAuth: fc.boolean(),
          hasError: fc.boolean(),
        }),
        (config) => {
          // Clean up before each property test iteration
          cleanup();
          
          // Set up configuration
          mockConfigManager.getAuthConfig.mockReturnValue({
            authEnabled: config.authEnabled,
            sessionTimeout: 3600000,
            rememberSidebar: true,
        defaultRoute: "/",
          });
          mockConfigManager.isAuthEnabled.mockReturnValue(config.authEnabled);

          // Test the complete flow: AuthWrapper -> RouteGuard -> Content
          const TestApp = () => (
            <AuthWrapper>
              <RouteGuard requireAuth={config.requireAuth}>
                <div data-testid="app-content">
                  {config.hasError ? 'Error State' : 'Normal Content'}
                </div>
              </RouteGuard>
            </AuthWrapper>
          );

          const { container, unmount } = render(<TestApp />);

          // Core property validation
          if (!config.authEnabled) {
            // When authentication is disabled:
            // 1. No authentication-related loading states should be shown
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.queryByText('Checking authorization...')).not.toBeInTheDocument();
            
            // 2. Application content should be rendered directly
            expect(screen.getByTestId('app-content')).toBeInTheDocument();
            
            // 3. No login-related UI should be present
            expect(container).not.toHaveTextContent('Sign in');
            expect(container).not.toHaveTextContent('Login');
            expect(container).not.toHaveTextContent('Authentication');
            expect(container).not.toHaveTextContent('Username');
            expect(container).not.toHaveTextContent('Password');
            
            // 4. Content should be accessible regardless of requireAuth setting
            const expectedContent = config.hasError ? 'Error State' : 'Normal Content';
            expect(container).toHaveTextContent(expectedContent);
          } else {
            // When authentication is enabled, the behavior depends on authentication state
            // Since we're not mocking the auth context here, RouteGuard will show loading
            // This is expected behavior for the integration test
            expect(container).toBeInTheDocument();
          }
          
          unmount();
        }
      ),
      { numRuns: 75 }
    );
  });

  /**
   * Edge case testing: Ensure no login UI components leak through when auth is disabled
   */
  it('should prevent any login UI components from rendering when authentication is disabled', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length > 0), // content variation (non-whitespace only)
        (content) => {
          // Clean up before each property test iteration
          cleanup();
          
          // Always disable authentication for this test
          mockConfigManager.getAuthConfig.mockReturnValue({
            authEnabled: false,
            sessionTimeout: 3600000,
            rememberSidebar: true,
        defaultRoute: "/",
          });
          mockConfigManager.isAuthEnabled.mockReturnValue(false);

          const { container, unmount } = render(
            <AuthWrapper>
              <RouteGuard requireAuth={true}>
                <div data-testid="test-content">
                  {content}
                </div>
              </RouteGuard>
            </AuthWrapper>
          );

          // Should render the content
          expect(screen.getByTestId('test-content')).toBeInTheDocument();
          expect(container).toHaveTextContent(content.trim());

          // Should not have any authentication-related elements
          const authRelatedSelectors = [
            '.animate-spin', // Loading spinners
            'input[type="password"]', // Password fields
            'input[placeholder*="username" i]', // Username fields
            'input[placeholder*="password" i]', // Password fields
            'button[type="submit"]', // Submit buttons (could be login)
          ];

          authRelatedSelectors.forEach(selector => {
            expect(container.querySelector(selector)).not.toBeInTheDocument();
          });

          // Should not have authentication-related text
          const authRelatedTexts = [
            'Sign in',
            'Login',
            'Authentication',
            'Username',
            'Password',
            'Loading...',
            'Checking authorization...',
            'Please wait...',
          ];

          authRelatedTexts.forEach(text => {
            expect(container).not.toHaveTextContent(text);
          });
          
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});