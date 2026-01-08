/**
 * Authentication Service
 * Extracted from AuthContext.tsx for better code organization (Rule 2 compliance)
 * 
 * Handles:
 * - Authentication business logic
 * - Session management
 * - Provider authentication
 * - NO UI rendering
 */

import { LoginCredentials, User, Session } from '@/types';
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

/**
 * Authentication function using provider registry
 */
export async function authenticateWithProviders(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
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
export async function mockAuthenticate(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
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
 * Clear session from localStorage and cookies
 */
export function clearSession(): void {
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
}

/**
 * Load session from localStorage
 */
export function loadSession(): Session | null {
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
}

/**
 * Save session to localStorage and cookies
 */
export function saveSession(user: User, token: string): void {
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
}

/**
 * Login function
 */
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  const config = ConfigManager.getAuthConfig();
  
  // If authentication is disabled, always return success
  if (!config.authEnabled) {
    // Execute onAuthDisabled hooks to ensure non-interference
    await authHookRegistry.executeOnAuthDisabled();
    return {
      success: true,
      user: {
        id: 'mock-user',
        username: 'Anonymous',
        roles: ['user'],
        lastLogin: new Date(),
      },
    };
  }
  
  // Validate credentials
  const validation = validateLoginCredentials(credentials);
  if (!validation.isValid) {
    console.error('Invalid credentials:', validation.errors);
    return {
      success: false,
      error: validation.errors.join(', '),
    };
  }

  try {
    const result = await authenticateWithProviders(credentials);
    
    if (result.success && result.user) {
      const token = generateSessionToken();
      
      // Save session
      saveSession(result.user, token);
      
      // Sync with external authentication systems
      await externalAuthIntegration.syncWithExternalAuth(true, result.user);
      
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
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Logout function
 */
export async function logout(user: User | null, session: Session | null): Promise<void> {
  const config = ConfigManager.getAuthConfig();
  
  // If authentication is disabled, do nothing
  if (!config.authEnabled) {
    return;
  }
  
  // Execute beforeLogout hooks if user is authenticated
  if (user && session) {
    await authHookRegistry.executeBeforeLogout(user, session);
  }
  
  const userId = user?.id;
  
  clearSession();
  
  // Sync with external authentication systems
  await externalAuthIntegration.syncWithExternalAuth(false);
  
  // Execute afterLogout hooks
  if (userId) {
    await authHookRegistry.executeAfterLogout(userId);
  }
}

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user: User | null; error?: string }> {
  const config = ConfigManager.getAuthConfig();
  
  // If authentication is disabled, do nothing
  if (!config.authEnabled) {
    return {
      isAuthenticated: true,
      user: {
        id: 'mock-user',
        username: 'Anonymous',
        roles: ['user'],
        lastLogin: new Date(),
      },
    };
  }
  
  try {
    const session = loadSession();
    
    if (session) {
      // Execute beforeValidateSession hooks
      const validatedToken = await authHookRegistry.executeBeforeValidateSession(session.token);
      if (!validatedToken) {
        // Session validation blocked by hook
        clearSession();
        return {
          isAuthenticated: false,
          user: null,
        };
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
        
        return {
          isAuthenticated: true,
          user: userWithDates,
        };
      }
    }
    
    // No valid session found
    clearSession();
    return {
      isAuthenticated: false,
      user: null,
    };
  } catch (error) {
    console.error('Auth check error:', error);
    clearSession();
    return {
      isAuthenticated: false,
      user: null,
      error: error instanceof Error ? error.message : 'Authentication check failed',
    };
  }
}
