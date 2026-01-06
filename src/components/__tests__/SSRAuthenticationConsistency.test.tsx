import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ApplicationShell } from '../ApplicationShell';
import { RouteGuard } from '../RouteGuard';
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

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

/**
 * Test Component that simulates SSR behavior
 */
function SSRTestComponent({ 
  children 
}: { 
  authEnabled: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <ApplicationShell>
        {children}
      </ApplicationShell>
    </RouteGuard>
  );
}

describe('SSR Authentication Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage for SSR environment
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

  /**
   * Property 11: Server-side rendering authentication consistency
   * For any authentication configuration and state, the authentication behavior
   * should be consistent between server-side rendering and client-side hydration
   * **Validates: Requirements 8.2**
   */
  describe('Property 11: Server-side rendering authentication consistency', () => {
    it('should handle authentication state consistently between server and client', () => {
      fc.assert(
        fc.property(
          // Generate authentication configuration and state
          fc.record({
            authEnabled: fc.boolean(),
            isAuthenticated: fc.boolean(),
            loading: fc.boolean(),
            hasValidSession: fc.boolean(),
            sessionExpired: fc.boolean(),
          }),
          (testConfig) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled: testConfig.authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });
            mockConfigManager.isAuthEnabled.mockReturnValue(testConfig.authEnabled);

            // Mock authentication state
            mockUseAuth.mockReturnValue({
              isAuthenticated: testConfig.isAuthenticated,
              user: testConfig.isAuthenticated ? {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['user'],
                lastLogin: new Date(),
              } : null,
              loading: testConfig.loading,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            // Simulate server-side rendering by rendering the component
            const { container: serverContainer } = render(
              <SSRTestComponent
                authEnabled={testConfig.authEnabled}
                isAuthenticated={testConfig.isAuthenticated}
                loading={testConfig.loading}
              >
                <div data-testid="app-content">Test Content</div>
              </SSRTestComponent>
            );

            // Simulate client-side hydration by re-rendering with same props
            const { container: clientContainer } = render(
              <SSRTestComponent
                authEnabled={testConfig.authEnabled}
                isAuthenticated={testConfig.isAuthenticated}
                loading={testConfig.loading}
              >
                <div data-testid="app-content">Test Content</div>
              </SSRTestComponent>
            );

            // Property assertion: Server and client should render consistently
            
            if (!testConfig.authEnabled) {
              // When auth is disabled, both server and client should render content directly
              expect(serverContainer.querySelector('[data-testid="app-content"]')).toBeTruthy();
              expect(clientContainer.querySelector('[data-testid="app-content"]')).toBeTruthy();
              
              // Should not show loading states when auth is disabled
              expect(serverContainer.querySelector('.animate-spin')).toBeFalsy();
              expect(clientContainer.querySelector('.animate-spin')).toBeFalsy();
              
              // Both should have the same structure
              expect(serverContainer.innerHTML).toBe(clientContainer.innerHTML);
            } else {
              // When auth is enabled, behavior depends on authentication state
              if (testConfig.loading) {
                // Both should show loading state
                expect(serverContainer.querySelector('.animate-spin')).toBeTruthy();
                expect(clientContainer.querySelector('.animate-spin')).toBeTruthy();
                
                // Should not show app content while loading
                expect(serverContainer.querySelector('[data-testid="app-content"]')).toBeFalsy();
                expect(clientContainer.querySelector('[data-testid="app-content"]')).toBeFalsy();
              } else if (testConfig.isAuthenticated) {
                // Both should show authenticated content
                expect(serverContainer.querySelector('[data-testid="app-content"]')).toBeTruthy();
                expect(clientContainer.querySelector('[data-testid="app-content"]')).toBeTruthy();
                
                // Should not show loading states
                expect(serverContainer.querySelector('.animate-spin')).toBeFalsy();
                expect(clientContainer.querySelector('.animate-spin')).toBeFalsy();
              } else {
                // Both should show authorization checking state for unauthenticated users
                expect(serverContainer.querySelector('.animate-spin')).toBeTruthy();
                expect(clientContainer.querySelector('.animate-spin')).toBeTruthy();
              }
              
              // Server and client should have identical structure
              expect(serverContainer.innerHTML).toBe(clientContainer.innerHTML);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent authentication state during hydration', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // authEnabled
          fc.boolean(), // isAuthenticated
          (authEnabled, isAuthenticated) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });
            mockConfigManager.isAuthEnabled.mockReturnValue(authEnabled);

            // Mock consistent authentication state
            const authState = {
              isAuthenticated: authEnabled ? isAuthenticated : true, // Always authenticated when auth disabled
              user: (authEnabled ? isAuthenticated : true) ? {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['user'],
                lastLogin: new Date(),
              } : null,
              loading: false,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            };

            mockUseAuth.mockReturnValue(authState);

            // Render multiple times to simulate SSR + hydration
            const renders = Array.from({ length: 3 }, () => 
              render(
                <SSRTestComponent
                  authEnabled={authEnabled}
                  isAuthenticated={authState.isAuthenticated}
                  loading={false}
                >
                  <div data-testid="test-content">Consistent Content</div>
                </SSRTestComponent>
              )
            );

            // All renders should produce identical results
            const firstRenderHTML = renders[0].container.innerHTML;
            renders.forEach((renderResult) => {
              expect(renderResult.container.innerHTML).toBe(firstRenderHTML);
              
              // All should show content when not loading
              if (!authEnabled || authState.isAuthenticated) {
                expect(renderResult.container.querySelector('[data-testid="test-content"]')).toBeTruthy();
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle session state consistently across server and client', () => {
      fc.assert(
        fc.property(
          fc.record({
            authEnabled: fc.boolean(),
            hasStoredSession: fc.boolean(),
            sessionValid: fc.boolean(),
            userAgent: fc.string(),
          }),
          (testConfig) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled: testConfig.authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });

            // Mock localStorage session data
            const mockLocalStorage = {
              getItem: jest.fn().mockImplementation((key) => {
                if (!testConfig.hasStoredSession) return null;
                
                if (key === 'session_data') {
                  return JSON.stringify({
                    token: 'mock-token',
                    expiresAt: testConfig.sessionValid 
                      ? new Date(Date.now() + 3600000).toISOString()
                      : new Date(Date.now() - 3600000).toISOString(),
                    createdAt: new Date().toISOString(),
                  });
                }
                
                if (key === 'user_data') {
                  return JSON.stringify({
                    id: '1',
                    username: 'testuser',
                    email: 'test@example.com',
                    roles: ['user'],
                    lastLogin: new Date().toISOString(),
                  });
                }
                
                return null;
              }),
              setItem: jest.fn(),
              removeItem: jest.fn(),
              clear: jest.fn(),
            };
            
            Object.defineProperty(window, 'localStorage', {
              value: mockLocalStorage,
              writable: true,
            });

            // Determine expected authentication state
            const shouldBeAuthenticated = !testConfig.authEnabled || 
              (testConfig.hasStoredSession && testConfig.sessionValid);

            mockUseAuth.mockReturnValue({
              isAuthenticated: shouldBeAuthenticated,
              user: shouldBeAuthenticated ? {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['user'],
                lastLogin: new Date(),
              } : null,
              loading: false,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            // Simulate server-side render
            const serverRender = render(
              <SSRTestComponent
                authEnabled={testConfig.authEnabled}
                isAuthenticated={shouldBeAuthenticated}
                loading={false}
              >
                <div data-testid="session-content">Session Test</div>
              </SSRTestComponent>
            );

            // Simulate client-side hydration
            const clientRender = render(
              <SSRTestComponent
                authEnabled={testConfig.authEnabled}
                isAuthenticated={shouldBeAuthenticated}
                loading={false}
              >
                <div data-testid="session-content">Session Test</div>
              </SSRTestComponent>
            );

            // Property assertion: Session handling should be consistent
            if (!testConfig.authEnabled || shouldBeAuthenticated) {
              // Should show content when auth is disabled or user is authenticated
              expect(serverRender.container.querySelector('[data-testid="session-content"]')).toBeTruthy();
              expect(clientRender.container.querySelector('[data-testid="session-content"]')).toBeTruthy();
            }

            // Server and client should render identically
            expect(serverRender.container.innerHTML).toBe(clientRender.container.innerHTML);
          }
        ),
        { numRuns: 75 }
      );
    });

    it('should prevent hydration mismatches in authentication UI', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // authEnabled
          fc.boolean(), // showSidebar
          (authEnabled, showSidebar) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });

            // Mock consistent state
            mockUseAuth.mockReturnValue({
              isAuthenticated: !authEnabled || true, // Always authenticated when auth disabled
              user: (!authEnabled || true) ? {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['user'],
                lastLogin: new Date(),
              } : null,
              loading: false,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            // Render the same component multiple times to check consistency
            const renders = [1, 2, 3].map(() => 
              render(
                <ApplicationShell showSidebar={showSidebar}>
                  <div data-testid="hydration-test">Hydration Test Content</div>
                </ApplicationShell>
              )
            );

            // All renders should be identical (no hydration mismatch)
            const baselineHTML = renders[0].container.innerHTML;
            renders.forEach((renderResult) => {
              expect(renderResult.container.innerHTML).toBe(baselineHTML);
              
              // Should consistently show or hide sidebar based on config
              const hasSidebarLayout = 
                renderResult.container.querySelector('.h-screen.flex') && 
                renderResult.container.querySelector('.flex-shrink-0');
              
              if (showSidebar && (!authEnabled || true)) {
                expect(hasSidebarLayout).toBeTruthy();
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});