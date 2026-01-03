'use client';

import { useEffect, useState } from 'react';
import { ConfigManager } from '@/lib/config';
import { AuthContextType, AuthState } from '@/types';

/**
 * Hook for conditional authentication based on configuration
 * Returns mock authenticated state when auth is disabled
 */
export function useConditionalAuth(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const config = ConfigManager.getAuthConfig();
    
    if (!config.authEnabled) {
      // When auth is disabled, provide a mock authenticated state
      setAuthState({
        isAuthenticated: true,
        user: {
          id: 'mock-user',
          username: 'Anonymous',
          roles: ['user'],
          lastLogin: new Date(),
        },
        loading: false,
      });
    } else {
      // When auth is enabled, start with unauthenticated state
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  }, []);

  // Mock functions for when auth is disabled
  const mockLogin = async (): Promise<boolean> => {
    return true; // Always succeed when auth is disabled
  };

  const mockLogout = (): void => {
    // No-op when auth is disabled
  };

  const mockCheckAuth = async (): Promise<void> => {
    // No-op when auth is disabled
  };

  return {
    ...authState,
    login: mockLogin,
    logout: mockLogout,
    checkAuth: mockCheckAuth,
  };
}