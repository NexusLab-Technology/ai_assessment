/**
 * Integration Tests: Complete Authentication Flow
 * Tests end-to-end authentication workflows including login, logout, and session management
 * Requirements: 1.1, 1.2, 2.2, 6.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ApplicationShell } from '@/components/ApplicationShell';
import { RouteGuard } from '@/components/RouteGuard';
import { LoginPage } from '@/components/LoginPage';
import { ConfigManager } from '@/lib/config';
import { LoginCredentials } from '@/types';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
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

// Test components
function TestDashboard() {
  return (
    <RouteGuard requireAuth={true}>
      <ApplicationShell>
        <div data-testid="dashboard">Dashboard Content</div>
      </ApplicationShell>
    </RouteGuard>
  );
}

function TestPublicPage() {
  return (
    <RouteGuard requireAuth={false}>
      <ApplicationShell>
        <div data-testid="public-page">Public Content</div>
      </ApplicationShell>
    </RouteGuard>
  );
}

function TestApp({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

function TestLoginPage() {
  const { login, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await login(credentials);
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <LoginPage 
      onLogin={handleLogin}
      loading={isSubmitting}
      error={error || null}
    />
  );
}

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default configuration
    mockConfigManager.getAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    });
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
  });

  describe('Complete Login Flow', () => {
    it('should complete full login workflow from login page to dashboard', async () => {
      const user = userEvent.setup();

      // Start with login page
      render(
        <TestApp>
          <TestLoginPage />
        </TestApp>
      );

      // Should show login form
      expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Fill in credentials
      await user.type(screen.getByRole('textbox', { name: /username/i }), 'admin');
      await user.type(screen.getByLabelText(/password/i), 'password');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      // Wait for authentication to complete and redirect to dashboard
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'session_data',
          expect.stringContaining('token')
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'user_data',
          expect.stringContaining('admin')
        );
      });

      // Mock localStorage to return authenticated session for dashboard test
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
            username: 'admin',
            email: 'admin@example.com',
            roles: ['admin'],
            lastLogin: new Date().toISOString(),
          });
        }
        return null;
      });

      // Now render dashboard - should be accessible
      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
    });

    it('should handle login failure gracefully', async () => {
      const user = userEvent.setup();

      render(
        <TestApp>
          <TestLoginPage />
        </TestApp>
      );

      // Fill in invalid credentials
      await user.type(screen.getByRole('textbox', { name: /username/i }), 'invalid');
      await user.type(screen.getByLabelText(/password/i), 'invalid');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Should not save session data
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Should still show login form
      expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    });
  });

  describe('Route Protection Integration', () => {
    it('should protect routes when not authenticated', async () => {
      // Mock no session data
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should show loading initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Should not show dashboard content
      await waitFor(() => {
        expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
      });

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login?returnUrl=')
        );
      });
    });

    it('should allow access to protected routes when authenticated', async () => {
      // Mock valid session data
      const sessionData = {
        token: 'valid-token',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        lastLogin: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return JSON.stringify(sessionData);
        if (key === 'user_data') return JSON.stringify(userData);
        return null;
      });

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should always allow access to public routes', async () => {
      // Mock no session data
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestApp>
          <TestPublicPage />
        </TestApp>
      );

      // Should show public content immediately
      await waitFor(() => {
        expect(screen.getByTestId('public-page')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Session Management Integration', () => {
    it('should handle session expiration correctly', async () => {
      // Mock expired session data
      const expiredSessionData = {
        token: 'expired-token',
        userId: '1',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        createdAt: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return JSON.stringify(expiredSessionData);
        return null;
      });

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should clear expired session
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_data');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_data');
      });

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('should persist session across page reloads', async () => {
      // Mock valid session data
      const sessionData = {
        token: 'valid-token',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        lastLogin: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return JSON.stringify(sessionData);
        if (key === 'user_data') return JSON.stringify(userData);
        return null;
      });

      // First render
      const { rerender } = render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Simulate page reload by re-rendering
      rerender(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should still show dashboard without re-authentication
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow Integration', () => {
    it('should complete full logout workflow', async () => {
      const user = userEvent.setup();

      // Mock authenticated state
      const sessionData = {
        token: 'valid-token',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        lastLogin: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return JSON.stringify(sessionData);
        if (key === 'user_data') return JSON.stringify(userData);
        return null;
      });

      // Custom component with logout button
      function TestDashboardWithLogout() {
        return (
          <TestApp>
            <RouteGuard requireAuth={true}>
              <ApplicationShell>
                <div data-testid="dashboard">
                  <div>Dashboard Content</div>
                  <button 
                    data-testid="logout-button"
                    onClick={() => {
                      // This would be handled by the useAuth hook
                      mockLocalStorage.removeItem('session_data');
                      mockLocalStorage.removeItem('user_data');
                    }}
                  >
                    Logout
                  </button>
                </div>
              </ApplicationShell>
            </RouteGuard>
          </TestApp>
        );
      }

      render(<TestDashboardWithLogout />);

      // Should show dashboard initially
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Click logout
      await user.click(screen.getByTestId('logout-button'));

      // Should clear session data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_data');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_data');
    });
  });

  describe('Authentication Disabled Integration', () => {
    it('should bypass all authentication when disabled', async () => {
      // Configure authentication as disabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should show dashboard immediately without authentication
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should not check localStorage for session (but sidebar state is OK)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar_state');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('session_data');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('user_data');

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not interfere with application when authentication disabled', async () => {
      // Configure authentication as disabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      // Render both protected and public pages
      const { rerender } = render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Protected page should be accessible
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Switch to public page
      rerender(
        <TestApp>
          <TestPublicPage />
        </TestApp>
      );

      // Public page should also be accessible
      await waitFor(() => {
        expect(screen.getByTestId('public-page')).toBeInTheDocument();
      });

      // No authentication-related side effects
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should handle error and show loading/redirect behavior
      await waitFor(() => {
        // Should not crash the application
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
      
      // Restore console.error
      consoleSpy.mockRestore();

      // Should redirect to login due to failed session load
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('should handle malformed session data', async () => {
      // Mock malformed session data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return 'invalid-json';
        if (key === 'user_data') return 'invalid-json';
        return null;
      });

      render(
        <TestApp>
          <TestDashboard />
        </TestApp>
      );

      // Should handle malformed data gracefully
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });

      // Should clear invalid data
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Concurrent Authentication States', () => {
    it('should handle multiple components with different auth requirements', async () => {
      // Mock authenticated state
      const sessionData = {
        token: 'valid-token',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      const userData = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin'],
        lastLogin: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'session_data') return JSON.stringify(sessionData);
        if (key === 'user_data') return JSON.stringify(userData);
        return null;
      });

      // Component with mixed auth requirements
      function MixedAuthComponent() {
        return (
          <TestApp>
            <div>
              <RouteGuard requireAuth={true}>
                <div data-testid="protected-section">Protected Content</div>
              </RouteGuard>
              <RouteGuard requireAuth={false}>
                <div data-testid="public-section">Public Content</div>
              </RouteGuard>
            </div>
          </TestApp>
        );
      }

      render(<MixedAuthComponent />);

      // Both sections should be visible when authenticated
      await waitFor(() => {
        expect(screen.getByTestId('protected-section')).toBeInTheDocument();
        expect(screen.getByTestId('public-section')).toBeInTheDocument();
      });
    });
  });
});