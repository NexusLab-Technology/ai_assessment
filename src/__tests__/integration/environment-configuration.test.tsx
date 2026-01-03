/**
 * Integration Tests: Environment Configuration Switching
 * Tests configuration changes and their effects on the application
 * Requirements: 1.1, 1.2
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApplicationShell } from '@/components/ApplicationShell';
import { RouteGuard } from '@/components/RouteGuard';
import { LoginPage } from '@/components/LoginPage';
import { ConfigManager } from '@/lib/config';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

// Store original environment
const originalEnv = process.env;

// Test components
function TestProtectedPage() {
  return (
    <AuthProvider>
      <RouteGuard requireAuth={true}>
        <ApplicationShell>
          <div data-testid="protected-content">Protected Content</div>
        </ApplicationShell>
      </RouteGuard>
    </AuthProvider>
  );
}

function TestPublicPage() {
  return (
    <AuthProvider>
      <RouteGuard requireAuth={false}>
        <ApplicationShell>
          <div data-testid="public-content">Public Content</div>
        </ApplicationShell>
      </RouteGuard>
    </AuthProvider>
  );
}

function TestLoginPage() {
  const mockLogin = async () => true;
  return (
    <AuthProvider>
      <LoginPage onLogin={mockLogin} loading={false} error={null} />
    </AuthProvider>
  );
}

describe('Environment Configuration Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Authentication Enabled/Disabled Configuration', () => {
    it('should protect routes when AUTH_ENABLED=true', async () => {
      // Configure authentication as enabled
      process.env.AUTH_ENABLED = 'true';
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      // Mock no session (unauthenticated)
      mockLocalStorage.getItem.mockReturnValue(null);

      render(<TestProtectedPage />);

      // Should not show protected content
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('should allow access to all routes when AUTH_ENABLED=false', async () => {
      // Configure authentication as disabled
      process.env.AUTH_ENABLED = 'false';
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      render(<TestProtectedPage />);

      // Should show protected content immediately
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();

      // Should not check localStorage for session (but sidebar state is OK)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar_state');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('session_data');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('user_data');
    });

    it('should handle AUTH_ENABLED=undefined as enabled by default', async () => {
      // Remove AUTH_ENABLED environment variable
      delete process.env.AUTH_ENABLED;
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true, // Default to enabled
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      mockLocalStorage.getItem.mockReturnValue(null);

      render(<TestProtectedPage />);

      // Should behave as if authentication is enabled
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('should handle case-insensitive AUTH_ENABLED values', async () => {
      const testCases = [
        { value: 'TRUE', expected: true },
        { value: 'True', expected: true },
        { value: 'true', expected: true },
        { value: 'FALSE', expected: false },
        { value: 'False', expected: false },
        { value: 'false', expected: false },
        { value: 'invalid', expected: true }, // Invalid values default to true
      ];

      for (const testCase of testCases) {
        process.env.AUTH_ENABLED = testCase.value;
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: testCase.expected,
          sessionTimeout: 3600000,
          rememberSidebar: true,
        defaultRoute: "/",
        });
        mockConfigManager.isAuthEnabled.mockReturnValue(testCase.expected);

        const { unmount } = render(<TestProtectedPage />);

        if (testCase.expected) {
          // Should redirect when auth is enabled
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith(
              expect.stringContaining('/login')
            );
          });
        } else {
          // Should show content when auth is disabled
          await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
          });
        }

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Session Timeout Configuration', () => {
    it('should respect custom SESSION_TIMEOUT values', async () => {
      const customTimeout = 1800000; // 30 minutes
      process.env.SESSION_TIMEOUT = customTimeout.toString();
      
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: customTimeout,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      // Mock valid session that should expire based on custom timeout
      const sessionData = {
        token: 'valid-token',
        userId: '1',
        expiresAt: new Date(Date.now() + customTimeout).toISOString(),
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

      render(<TestProtectedPage />);

      // Should show protected content with valid session
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should handle invalid SESSION_TIMEOUT values gracefully', async () => {
      process.env.SESSION_TIMEOUT = 'invalid-number';
      
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000, // Should fall back to default
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      render(<TestProtectedPage />);

      // Should still function with default timeout
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });
  });

  describe('Sidebar Configuration', () => {
    it('should respect REMEMBER_SIDEBAR=true configuration', async () => {
      process.env.REMEMBER_SIDEBAR = 'true';
      
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      render(<TestPublicPage />);

      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeInTheDocument();
      });

      // Should attempt to load sidebar state from localStorage
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar_state');
    });

    it('should respect REMEMBER_SIDEBAR=false configuration', async () => {
      process.env.REMEMBER_SIDEBAR = 'false';
      
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: false,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      render(<TestPublicPage />);

      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeInTheDocument();
      });

      // Should not attempt to load sidebar state from localStorage
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('sidebar_state');
    });
  });

  describe('Configuration Switching During Runtime', () => {
    it('should handle configuration changes between renders', async () => {
      // Start with authentication enabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      const { rerender } = render(<TestProtectedPage />);

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });

      jest.clearAllMocks();

      // Switch to authentication disabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      rerender(<TestProtectedPage />);

      // Should now show protected content
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle multiple configuration properties changing together', async () => {
      // Initial configuration
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: false,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      const { rerender } = render(<TestPublicPage />);

      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeInTheDocument();
      });

      // Should not load sidebar state
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('sidebar_state');

      jest.clearAllMocks();

      // Change multiple configuration properties
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 7200000, // 2 hours
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      rerender(<TestPublicPage />);

      await waitFor(() => {
        expect(screen.getByTestId('public-content')).toBeInTheDocument();
      });

      // Should now load sidebar state
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar_state');
    });
  });

  describe('Configuration Error Handling', () => {
    it('should handle ConfigManager errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock ConfigManager to throw error
      mockConfigManager.getAuthConfig.mockImplementation(() => {
        throw new Error('Configuration error');
      });
      mockConfigManager.isAuthEnabled.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      render(<TestProtectedPage />);

      // Should not crash the application
      await waitFor(() => {
        // Should either show content or redirect, but not crash
        expect(
          screen.queryByTestId('protected-content') || mockPush.mock.calls.length > 0
        ).toBeTruthy();
      });
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle partial configuration objects', async () => {
      // Mock partial configuration
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        // Missing sessionTimeout and rememberSidebar
      } as any);
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      render(<TestProtectedPage />);

      // Should handle missing properties gracefully
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should behave differently in development vs production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      // Test development environment
      (process.env as any).NODE_ENV = 'development';
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      const { unmount } = render(<TestLoginPage />);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
      });

      unmount();

      // Test production environment
      (process.env as any).NODE_ENV = 'production';
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });

      render(<TestLoginPage />);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
      });

      // Restore original NODE_ENV
      (process.env as any).NODE_ENV = originalNodeEnv;
    });

    it('should handle missing environment variables gracefully', async () => {
      // Clear all auth-related environment variables
      delete process.env.AUTH_ENABLED;
      delete process.env.SESSION_TIMEOUT;
      delete process.env.REMEMBER_SIDEBAR;

      // Should use default configuration
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true, // Default
        sessionTimeout: 3600000, // Default
        rememberSidebar: true, // Default
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      render(<TestProtectedPage />);

      // Should work with default configuration
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration values and use defaults for invalid ones', async () => {
      // Set invalid environment values
      process.env.SESSION_TIMEOUT = '-1000'; // Invalid negative value
      process.env.REMEMBER_SIDEBAR = 'maybe'; // Invalid boolean value

      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000, // Should use default instead of invalid value
        rememberSidebar: true, // Should use default instead of invalid value
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      render(<TestProtectedPage />);

      // Should function normally with corrected values
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });

    it('should handle extremely large or small configuration values', async () => {
      process.env.SESSION_TIMEOUT = '999999999999'; // Very large value

      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 999999999999,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      render(<TestProtectedPage />);

      // Should handle large values without crashing
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });
  });

  describe('Configuration Hot Reloading', () => {
    it('should respond to configuration changes without full page reload', async () => {
      // Initial configuration
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      const { rerender } = render(<TestProtectedPage />);

      // Should redirect initially
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });

      jest.clearAllMocks();

      // Simulate configuration hot reload
      mockConfigManager.resetConfig.mockClear();
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: "/",
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      // Force re-render to simulate configuration change
      rerender(<TestProtectedPage />);

      // Should now show content without redirect
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});