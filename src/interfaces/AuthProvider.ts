/**
 * Authentication Provider Interface
 * Defines interfaces for custom authentication providers and external system integration
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { User, Session, LoginCredentials } from '@/types';

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  redirectUrl?: string;
}

/**
 * Authentication provider configuration
 */
export interface AuthProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  settings: Record<string, any>;
}

/**
 * External authentication provider interface
 * Custom authentication providers must implement this interface
 */
export interface IAuthProvider {
  /**
   * Provider name (unique identifier)
   */
  readonly name: string;

  /**
   * Provider configuration
   */
  readonly config: AuthProviderConfig;

  /**
   * Initialize the authentication provider
   * Called once when the provider is registered
   */
  initialize(): Promise<void>;

  /**
   * Authenticate user with credentials
   * @param credentials - User login credentials
   * @returns Authentication result
   */
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Validate existing session
   * @param sessionToken - Session token to validate
   * @returns Validation result with user data if valid
   */
  validateSession(sessionToken: string): Promise<AuthResult>;

  /**
   * Refresh session token
   * @param refreshToken - Refresh token
   * @returns New session data
   */
  refreshSession(refreshToken: string): Promise<AuthResult>;

  /**
   * Logout user and invalidate session
   * @param sessionToken - Session token to invalidate
   */
  logout(sessionToken: string): Promise<void>;

  /**
   * Get user profile information
   * @param userId - User identifier
   * @returns User profile data
   */
  getUserProfile(userId: string): Promise<User | null>;

  /**
   * Check if provider is available and healthy
   * @returns Health check result
   */
  healthCheck(): Promise<boolean>;

  /**
   * Clean up resources when provider is unregistered
   */
  cleanup(): Promise<void>;
}

/**
 * Authentication provider registry interface
 */
export interface IAuthProviderRegistry {
  /**
   * Register an authentication provider
   * @param provider - Provider instance to register
   */
  register(provider: IAuthProvider): void;

  /**
   * Unregister an authentication provider
   * @param providerName - Name of provider to unregister
   */
  unregister(providerName: string): void;

  /**
   * Get registered provider by name
   * @param providerName - Provider name
   * @returns Provider instance or null if not found
   */
  getProvider(providerName: string): IAuthProvider | null;

  /**
   * Get all registered providers sorted by priority
   * @returns Array of registered providers
   */
  getAllProviders(): IAuthProvider[];

  /**
   * Get enabled providers sorted by priority
   * @returns Array of enabled providers
   */
  getEnabledProviders(): IAuthProvider[];

  /**
   * Check if any providers are registered
   * @returns True if providers are available
   */
  hasProviders(): boolean;
}

/**
 * Authentication hook interface for external system integration
 */
export interface IAuthHook {
  /**
   * Hook name (unique identifier)
   */
  readonly name: string;

  /**
   * Called before authentication attempt
   * @param credentials - Login credentials
   * @returns Modified credentials or null to prevent authentication
   */
  beforeAuthenticate?(credentials: LoginCredentials): Promise<LoginCredentials | null>;

  /**
   * Called after successful authentication
   * @param user - Authenticated user
   * @param session - Created session
   */
  afterAuthenticate?(user: User, session: Session): Promise<void>;

  /**
   * Called before session validation
   * @param sessionToken - Session token being validated
   * @returns Modified token or null to prevent validation
   */
  beforeValidateSession?(sessionToken: string): Promise<string | null>;

  /**
   * Called after session validation
   * @param user - Validated user
   * @param session - Validated session
   */
  afterValidateSession?(user: User, session: Session): Promise<void>;

  /**
   * Called before logout
   * @param user - User being logged out
   * @param session - Session being terminated
   */
  beforeLogout?(user: User, session: Session): Promise<void>;

  /**
   * Called after logout
   * @param userId - ID of logged out user
   */
  afterLogout?(userId: string): Promise<void>;

  /**
   * Called when authentication is disabled
   * Allows external systems to handle non-interference logic
   */
  onAuthDisabled?(): Promise<void>;
}

/**
 * Authentication hook registry interface
 */
export interface IAuthHookRegistry {
  /**
   * Register an authentication hook
   * @param hook - Hook instance to register
   */
  registerHook(hook: IAuthHook): void;

  /**
   * Unregister an authentication hook
   * @param hookName - Name of hook to unregister
   */
  unregisterHook(hookName: string): void;

  /**
   * Get registered hook by name
   * @param hookName - Hook name
   * @returns Hook instance or null if not found
   */
  getHook(hookName: string): IAuthHook | null;

  /**
   * Get all registered hooks
   * @returns Array of registered hooks
   */
  getAllHooks(): IAuthHook[];

  /**
   * Execute beforeAuthenticate hooks
   * @param credentials - Original credentials
   * @returns Modified credentials or null if blocked
   */
  executeBeforeAuthenticate(credentials: LoginCredentials): Promise<LoginCredentials | null>;

  /**
   * Execute afterAuthenticate hooks
   * @param user - Authenticated user
   * @param session - Created session
   */
  executeAfterAuthenticate(user: User, session: Session): Promise<void>;

  /**
   * Execute beforeValidateSession hooks
   * @param sessionToken - Original session token
   * @returns Modified token or null if blocked
   */
  executeBeforeValidateSession(sessionToken: string): Promise<string | null>;

  /**
   * Execute afterValidateSession hooks
   * @param user - Validated user
   * @param session - Validated session
   */
  executeAfterValidateSession(user: User, session: Session): Promise<void>;

  /**
   * Execute beforeLogout hooks
   * @param user - User being logged out
   * @param session - Session being terminated
   */
  executeBeforeLogout(user: User, session: Session): Promise<void>;

  /**
   * Execute afterLogout hooks
   * @param userId - ID of logged out user
   */
  executeAfterLogout(userId: string): Promise<void>;

  /**
   * Execute onAuthDisabled hooks
   */
  executeOnAuthDisabled(): Promise<void>;
}

/**
 * External authentication integration interface
 * Provides non-interference integration with external authentication systems
 */
export interface IExternalAuthIntegration {
  /**
   * Check if external authentication system is available
   * @returns True if external system is available
   */
  isExternalAuthAvailable(): Promise<boolean>;

  /**
   * Get external authentication status
   * @returns External authentication state
   */
  getExternalAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: User;
    expiresAt?: Date;
  }>;

  /**
   * Synchronize with external authentication state
   * Called when authentication framework state changes
   * @param isAuthenticated - Current framework authentication state
   * @param user - Current user (if authenticated)
   */
  syncWithExternalAuth(isAuthenticated: boolean, user?: User): Promise<void>;

  /**
   * Handle external authentication events
   * Called when external system authentication state changes
   * @param event - External authentication event
   */
  handleExternalAuthEvent(event: {
    type: 'login' | 'logout' | 'session_expired' | 'user_updated';
    user?: User;
    timestamp: Date;
  }): Promise<void>;

  /**
   * Cleanup external authentication integration
   * Called when authentication is disabled
   */
  cleanup(): Promise<void>;
}