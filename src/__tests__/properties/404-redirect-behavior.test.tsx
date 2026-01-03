/**
 * Property-Based Tests for 404 Redirect Behavior
 * Feature: Custom 404 error handling based on authentication state
 */

import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';
import fc from 'fast-check';

// Mock next/navigation
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    isAuthEnabled: jest.fn(() => true),
    getAuthConfig: () => ({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    }),
  },
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import mocked modules after mocking
import { ConfigManager } from '@/lib/config';
const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

describe('404 Redirect Behavior Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });
  });

  /**
   * Property 1: Authentication enabled redirect behavior
   * When auth is enabled, redirect should depend on authentication state
   */
  describe('Property 1: Authentication enabled redirect behavior', () => {
    it('should redirect authenticated users to home when auth is enabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // loading state
          (loading) => {
            jest.clearAllMocks();
            
            // Mock auth enabled and user authenticated
            mockConfigManager.isAuthEnabled.mockReturnValue(true);
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              loading,
              user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] },
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              if (!loading) {
                // Should redirect to home when authenticated
                expect(mockReplace).toHaveBeenCalledWith('/');
                expect(mockReplace).not.toHaveBeenCalledWith('/login');
              } else {
                // Should not redirect while loading
                expect(mockReplace).not.toHaveBeenCalled();
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should redirect unauthenticated users to login when auth is enabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // loading state
          (loading) => {
            jest.clearAllMocks();
            
            // Mock auth enabled and user not authenticated
            mockConfigManager.isAuthEnabled.mockReturnValue(true);
            mockUseAuth.mockReturnValue({
              isAuthenticated: false,
              loading,
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              if (!loading) {
                // Should redirect to login when not authenticated
                expect(mockReplace).toHaveBeenCalledWith('/login');
                expect(mockReplace).not.toHaveBeenCalledWith('/');
              } else {
                // Should not redirect while loading
                expect(mockReplace).not.toHaveBeenCalled();
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Authentication disabled redirect behavior
   * When auth is disabled, always redirect to home regardless of auth state
   */
  describe('Property 2: Authentication disabled redirect behavior', () => {
    it('should always redirect to home when auth is disabled', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            loading: fc.boolean(),
            hasUser: fc.boolean(),
          }),
          (testCase) => {
            jest.clearAllMocks();
            
            // Mock auth disabled
            mockConfigManager.isAuthEnabled.mockReturnValue(false);
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              loading: testCase.loading,
              user: testCase.hasUser ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              if (!testCase.loading) {
                // Should always redirect to home when auth is disabled
                expect(mockReplace).toHaveBeenCalledWith('/');
                expect(mockReplace).not.toHaveBeenCalledWith('/login');
              } else {
                // Should not redirect while loading
                expect(mockReplace).not.toHaveBeenCalled();
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Loading state behavior
   * Should not redirect while authentication is loading
   */
  describe('Property 3: Loading state behavior', () => {
    it('should not redirect while loading regardless of other states', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthEnabled: fc.boolean(),
            isAuthenticated: fc.boolean(),
            hasUser: fc.boolean(),
          }),
          (testCase) => {
            jest.clearAllMocks();
            
            // Mock loading state
            mockConfigManager.isAuthEnabled.mockReturnValue(testCase.isAuthEnabled);
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              loading: true, // Always loading
              user: testCase.hasUser ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              // Should not redirect while loading
              expect(mockReplace).not.toHaveBeenCalled();
              expect(mockPush).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: UI consistency
   * Should always show loading UI while determining redirect
   */
  describe('Property 4: UI consistency', () => {
    it('should show loading UI consistently', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthEnabled: fc.boolean(),
            isAuthenticated: fc.boolean(),
            loading: fc.boolean(),
          }),
          (testCase) => {
            jest.clearAllMocks();
            
            mockConfigManager.isAuthEnabled.mockReturnValue(testCase.isAuthEnabled);
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              loading: testCase.loading,
              user: testCase.isAuthenticated ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              // Should always show loading UI
              expect(screen.getAllByText('กำลังเปลี่ยนเส้นทาง...')[0]).toBeInTheDocument();
              
              // Should show loading spinner
              const spinner = document.querySelector('.animate-spin');
              expect(spinner).toBeInTheDocument();
            } finally {
              // Clean up after each test
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: Redirect method consistency
   * Should always use router.replace (not push) for redirects
   */
  describe('Property 5: Redirect method consistency', () => {
    it('should use replace method for all redirects', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthEnabled: fc.boolean(),
            isAuthenticated: fc.boolean(),
          }),
          (testCase) => {
            jest.clearAllMocks();
            
            mockConfigManager.isAuthEnabled.mockReturnValue(testCase.isAuthEnabled);
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              loading: false, // Not loading
              user: testCase.isAuthenticated ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              // Should use replace, never push
              expect(mockReplace).toHaveBeenCalledTimes(1);
              expect(mockPush).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 6: Error handling behavior
   * Should handle ConfigManager errors gracefully
   */
  describe('Property 6: Error handling behavior', () => {
    it('should redirect to home when ConfigManager throws error', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            loading: fc.boolean(),
          }),
          (testCase) => {
            jest.clearAllMocks();
            
            // Mock ConfigManager error
            mockConfigManager.isAuthEnabled.mockImplementation(() => {
              throw new Error('Config error');
            });
            
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              loading: testCase.loading,
              user: testCase.isAuthenticated ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            const { unmount } = render(<NotFound />);

            try {
              if (!testCase.loading) {
                // Should fallback to home redirect on error
                expect(mockReplace).toHaveBeenCalledWith('/');
              } else {
                // Should not redirect while loading
                expect(mockReplace).not.toHaveBeenCalled();
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});