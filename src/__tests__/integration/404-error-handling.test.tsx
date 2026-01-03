/**
 * Integration Tests: 404 Error Handling
 * Tests complete 404 redirect flow based on authentication state
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NotFound from '@/app/not-found';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

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
const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

jest.mock('@/lib/config', () => ({
  ConfigManager: {
    isAuthEnabled: jest.fn(),
    getAuthConfig: jest.fn(),
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
  writable: true,
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('404 Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default config
    mockConfigManager.getAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    });
  });

  describe('Authentication Enabled Scenarios', () => {
    beforeEach(() => {
      mockConfigManager.isAuthEnabled.mockReturnValue(true);
    });

    it('should redirect authenticated user to home on 404', async () => {
      // Mock authenticated session
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session_data') {
          return JSON.stringify({
            token: 'valid-token',
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

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should redirect to home
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });

      expect(mockReplace).not.toHaveBeenCalledWith('/login');
    });

    it('should redirect unauthenticated user to login on 404', async () => {
      // Mock no session
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should redirect to login
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });

      expect(mockReplace).not.toHaveBeenCalledWith('/');
    });

    it('should redirect to login when session is expired', async () => {
      // Mock expired session
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session_data') {
          return JSON.stringify({
            token: 'expired-token',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
            createdAt: new Date().toISOString(),
          });
        }
        return null;
      });

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should redirect to login due to expired session
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });

      expect(mockReplace).not.toHaveBeenCalledWith('/');
    });
  });

  describe('Authentication Disabled Scenarios', () => {
    beforeEach(() => {
      mockConfigManager.isAuthEnabled.mockReturnValue(false);
    });

    it('should redirect to home when auth is disabled (no session)', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should redirect to home
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });

      expect(mockReplace).not.toHaveBeenCalledWith('/login');
    });

    it('should redirect to home when auth is disabled (with session)', async () => {
      // Mock session exists but auth is disabled
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session_data') {
          return JSON.stringify({
            token: 'valid-token',
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

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should redirect to home (not login) when auth is disabled
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });

      expect(mockReplace).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Loading State Handling', () => {
    it('should show loading UI while authentication is loading', async () => {
      mockConfigManager.isAuthEnabled.mockReturnValue(true);
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should show loading UI
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      // Should eventually redirect after auth loading completes
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      mockConfigManager.isAuthEnabled.mockReturnValue(true);
      
      // Mock localStorage error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should still show loading UI
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should eventually redirect to login (fallback for auth errors)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });

    it('should handle config errors gracefully', async () => {
      // Mock ConfigManager error
      mockConfigManager.isAuthEnabled.mockImplementation(() => {
        throw new Error('Config error');
      });

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      );

      // Should still show loading UI
      expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();

      // Should eventually redirect to home (fallback behavior)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });
    });
  });

  describe('UI Consistency', () => {
    it('should always show Thai loading message', async () => {
      const scenarios = [
        { authEnabled: true, hasSession: true },
        { authEnabled: true, hasSession: false },
        { authEnabled: false, hasSession: true },
        { authEnabled: false, hasSession: false },
      ];

      for (const scenario of scenarios) {
        jest.clearAllMocks();
        
        mockConfigManager.isAuthEnabled.mockReturnValue(scenario.authEnabled);
        
        if (scenario.hasSession) {
          mockLocalStorage.getItem.mockImplementation((key: string) => {
            if (key === 'session_data') {
              return JSON.stringify({
                token: 'valid-token',
                userId: 'user-1',
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                createdAt: new Date().toISOString(),
              });
            }
            return null;
          });
        } else {
          mockLocalStorage.getItem.mockReturnValue(null);
        }

        const { unmount } = render(
          <TestWrapper>
            <NotFound />
          </TestWrapper>
        );

        // Should always show Thai loading message
        expect(screen.getByText('กำลังเปลี่ยนเส้นทาง...')).toBeInTheDocument();
        
        // Should always show loading spinner
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();

        unmount();
      }
    });
  });
});