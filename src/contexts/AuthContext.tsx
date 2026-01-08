/**
 * Authentication Context
 * Refactored to use auth service for better code organization (Rule 2 compliance)
 * 
 * This context handles state management only. Business logic is in lib/services/auth-service.ts
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, AuthState, LoginCredentials, User } from '@/types';
import { ConfigManager } from '@/lib/config';
import { authProviderRegistry } from '@/lib/AuthProviderRegistry';
import { login as authLogin, logout as authLogout, checkAuth as authCheckAuth, loadSession } from '@/lib/services/auth-service';

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Check if authentication is enabled with error handling
  let config;
  try {
    config = ConfigManager.getAuthConfig();
  } catch (error) {
    console.error('ConfigManager error, using default configuration:', error);
    // Fallback to default configuration
    config = {
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
    };
  }
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !config.authEnabled, // If auth is disabled, consider user authenticated
    user: !config.authEnabled ? {
      id: 'mock-user',
      username: 'Anonymous',
      roles: ['user'],
      lastLogin: new Date(),
    } : null,
    loading: !config.authEnabled ? false : true, // No loading needed if auth is disabled
    error: undefined,
  });

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await authLogin(credentials);
      
      if (result.success && result.user) {
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          loading: false,
          error: undefined,
        });
        return true;
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false,
          error: result.error || 'Authentication failed'
        }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
      return false;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    const session = loadSession();
    await authLogout(authState.user, session);
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: undefined,
    });
  }, [authState.user]);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const result = await authCheckAuth();
      
      setAuthState({
        isAuthenticated: result.isAuthenticated,
        user: result.user,
        loading: false,
        error: result.error,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      });
    }
  }, []);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize provider registry
      await authProviderRegistry.initialize();
      
      // Check authentication status
      await checkAuth();
    };
    
    initializeAuth();
  }, [checkAuth]);

  /**
   * Set up session expiration check
   */
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    
    const checkSessionExpiration = () => {
      const session = loadSession();
      if (!session) {
        logout();
      }
    };
    
    // Check every minute
    const interval = setInterval(checkSessionExpiration, 60000);
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, logout]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
