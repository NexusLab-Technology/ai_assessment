'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, AuthState, LoginCredentials, User, Session } from '@/types';
import { ConfigManager } from '@/lib/config';
import { STORAGE_KEYS } from '@/lib/constants';
import { 
  generateSessionToken, 
  isSessionExpired, 
  createSessionExpiration,
  safeParseJSON,
  safeStringifyJSON,
  isBrowser
} from '@/lib/utils';
import { validateLoginCredentials, validateUser, validateSession } from '@/lib/validation';
import { 
  authProviderRegistry, 
  authHookRegistry, 
  externalAuthIntegration 
} from '@/lib/AuthProviderRegistry';
import { useExternalAuth } from '@/hooks/useExternalAuth';

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
 * Authentication function using provider registry
 */
async function authenticateWithProviders(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Execute beforeAuthenticate hooks
    const modifiedCredentials = await authHookRegistry.executeBeforeAuthenticate(credentials);
    if (!modifiedCredentials) {
      return {
        success: false,
        error: 'Authentication blocked by hook',
      };
    }

    // Try authentication with registered providers
    if (authProviderRegistry.hasProviders()) {
      const result = await authProviderRegistry.authenticate(modifiedCredentials);
      
      if (result.success && result.user && result.session) {
        // Execute afterAuthenticate hooks
        await authHookRegistry.executeAfterAuthenticate(result.user, result.session);
        
        return {
          success: true,
          user: result.user,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    }

    // Fallback to mock authentication if no providers
    return await mockAuthenticate(modifiedCredentials);
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Mock authentication function (fallback when no providers)
 */
async function mockAuthenticate(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock authentication logic - replace with real API call
  if (credentials.username === 'admin' && credentials.password === 'password') {
    return {
      success: true,
      user: {
        id: '1',
        username: credentials.username,
        email: 'admin@example.com',
        roles: ['admin'],
        lastLogin: new Date(),
      },
    };
  } else if (credentials.username === 'user' && credentials.password === 'password') {
    return {
      success: true,
      user: {
        id: '2',
        username: credentials.username,
        email: 'user@example.com',
        roles: ['user'],
        lastLogin: new Date(),
      },
    };
  } else {
    return {
      success: false,
      error: 'Invalid username or password',
    };
  }
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
   * Clear session from localStorage and cookies
   */
  const clearSession = useCallback((): void => {
    if (!isBrowser()) return;
    
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // Clear cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'session_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  /**
   * Load session from localStorage
   */
  const loadSession = useCallback((): Session | null => {
    if (!isBrowser()) return null;
    
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (!sessionData || !userData) return null;
      
      const session = safeParseJSON<Session | null>(sessionData, null);
      const user = safeParseJSON<User | null>(userData, null);
      
      if (!session || !user || !validateSession(session) || !validateUser(user)) {
        return null;
      }
      
      // Convert date strings back to Date objects
      const sessionWithDates = {
        ...session,
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(session.createdAt),
      };
      
      const userWithDates = {
        ...user,
        lastLogin: new Date(user.lastLogin),
      };
      
      // Check if session is expired
      if (isSessionExpired(sessionWithDates.expiresAt)) {
        clearSession();
        return null;
      }
      
      return sessionWithDates;
    } catch (error) {
      console.error('Error loading session:', error);
      clearSession();
      return null;
    }
  }, [clearSession]);

  /**
   * Save session to localStorage and cookies
   */
  const saveSession = useCallback((user: User, token: string): void => {
    if (!isBrowser()) return;
    
    try {
      const config = ConfigManager.getAuthConfig();
      const session: Session = {
        token,
        userId: user.id,
        expiresAt: createSessionExpiration(config.sessionTimeout),
        createdAt: new Date(),
      };
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, safeStringifyJSON(session));
      localStorage.setItem(STORAGE_KEYS.USER_DATA, safeStringifyJSON(user));
      
      // Also save to cookies for middleware
      const expirationDate = new Date(session.expiresAt);
      document.cookie = `auth_token=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
      document.cookie = `session_data=${safeStringifyJSON(session)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
      document.cookie = `user_data=${safeStringifyJSON(user)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    // If authentication is disabled, always return success
    if (!config.authEnabled) {
      // Execute onAuthDisabled hooks to ensure non-interference
      await authHookRegistry.executeOnAuthDisabled();
      return true;
    }
    
    // Validate credentials
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      console.error('Invalid credentials:', validation.errors);
      return false;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await authenticateWithProviders(credentials);
      
      if (result.success && result.user) {
        const token = generateSessionToken();
        
        // Save session
        saveSession(result.user, token);
        
        // Sync with external authentication systems
        await externalAuthIntegration.syncWithExternalAuth(true, result.user);
        
        // Update state
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
  }, [saveSession, config.authEnabled]);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    // If authentication is disabled, do nothing
    if (!config.authEnabled) {
      return;
    }
    
    // Execute beforeLogout hooks if user is authenticated
    if (authState.isAuthenticated && authState.user) {
      const session = loadSession();
      if (session) {
        await authHookRegistry.executeBeforeLogout(authState.user, session);
      }
    }
    
    const userId = authState.user?.id;
    
    clearSession();
    
    // Sync with external authentication systems
    await externalAuthIntegration.syncWithExternalAuth(false);
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: undefined,
    });
    
    // Execute afterLogout hooks
    if (userId) {
      await authHookRegistry.executeAfterLogout(userId);
    }
  }, [clearSession, config.authEnabled, authState.isAuthenticated, authState.user, loadSession]);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    // If authentication is disabled, do nothing
    if (!config.authEnabled) {
      return;
    }
    
    setAuthState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const session = loadSession();
      
      if (session) {
        // Execute beforeValidateSession hooks
        const validatedToken = await authHookRegistry.executeBeforeValidateSession(session.token);
        if (!validatedToken) {
          // Session validation blocked by hook
          clearSession();
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: undefined,
          });
          return;
        }

        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        const user = safeParseJSON<User | null>(userData, null);
        
        if (user && validateUser(user)) {
          // Convert date string back to Date object
          const userWithDates = {
            ...user,
            lastLogin: new Date(user.lastLogin),
          };
          
          // Execute afterValidateSession hooks
          await authHookRegistry.executeAfterValidateSession(userWithDates, session);
          
          setAuthState({
            isAuthenticated: true,
            user: userWithDates,
            loading: false,
            error: undefined,
          });
          return;
        }
      }
      
      // No valid session found
      clearSession();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: undefined,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      clearSession();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: undefined,
      });
    }
  }, [loadSession, clearSession, config.authEnabled]);

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
  }, [authState.isAuthenticated, loadSession, logout]);

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