/**
 * Authentication Provider Registry Implementation
 * Manages registration and execution of custom authentication providers
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { 
  IAuthProvider, 
  IAuthProviderRegistry, 
  IAuthHook, 
  IAuthHookRegistry,
  IExternalAuthIntegration,
  AuthResult 
} from '@/interfaces/AuthProvider';
import { User, Session, LoginCredentials } from '@/types';
import { ConfigManager } from './config';

/**
 * Authentication Provider Registry
 * Manages multiple authentication providers with priority-based execution
 */
export class AuthProviderRegistry implements IAuthProviderRegistry {
  private providers: Map<string, IAuthProvider> = new Map();
  private initialized: boolean = false;

  /**
   * Register an authentication provider
   */
  register(provider: IAuthProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Authentication provider '${provider.name}' is already registered`);
    }

    this.providers.set(provider.name, provider);
    
    // Initialize provider if registry is already initialized
    if (this.initialized) {
      provider.initialize().catch(error => {
        console.error(`Failed to initialize auth provider '${provider.name}':`, error);
      });
    }
  }

  /**
   * Unregister an authentication provider
   */
  unregister(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.cleanup().catch(error => {
        console.error(`Failed to cleanup auth provider '${providerName}':`, error);
      });
      this.providers.delete(providerName);
    }
  }

  /**
   * Get registered provider by name
   */
  getProvider(providerName: string): IAuthProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * Get all registered providers sorted by priority
   */
  getAllProviders(): IAuthProvider[] {
    return Array.from(this.providers.values())
      .sort((a, b) => b.config.priority - a.config.priority);
  }

  /**
   * Get enabled providers sorted by priority
   */
  getEnabledProviders(): IAuthProvider[] {
    return this.getAllProviders()
      .filter(provider => provider.config.enabled);
  }

  /**
   * Check if any providers are registered
   */
  hasProviders(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Initialize all registered providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const initPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        await provider.initialize();
      } catch (error) {
        console.error(`Failed to initialize auth provider '${provider.name}':`, error);
      }
    });

    await Promise.all(initPromises);
    this.initialized = true;
  }

  /**
   * Cleanup all registered providers
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        await provider.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup auth provider '${provider.name}':`, error);
      }
    });

    await Promise.all(cleanupPromises);
    this.providers.clear();
    this.initialized = false;
  }

  /**
   * Attempt authentication using registered providers
   * Tries providers in priority order until one succeeds
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    const enabledProviders = this.getEnabledProviders();
    
    if (enabledProviders.length === 0) {
      return {
        success: false,
        error: 'No authentication providers available'
      };
    }

    for (const provider of enabledProviders) {
      try {
        const result = await provider.authenticate(credentials);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Auth provider '${provider.name}' failed:`, error);
      }
    }

    return {
      success: false,
      error: 'Authentication failed with all providers'
    };
  }

  /**
   * Validate session using registered providers
   */
  async validateSession(sessionToken: string): Promise<AuthResult> {
    const enabledProviders = this.getEnabledProviders();
    
    if (enabledProviders.length === 0) {
      return {
        success: false,
        error: 'No authentication providers available'
      };
    }

    for (const provider of enabledProviders) {
      try {
        const result = await provider.validateSession(sessionToken);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Session validation failed with provider '${provider.name}':`, error);
      }
    }

    return {
      success: false,
      error: 'Session validation failed with all providers'
    };
  }
}

/**
 * Authentication Hook Registry
 * Manages authentication lifecycle hooks for external system integration
 */
export class AuthHookRegistry implements IAuthHookRegistry {
  private hooks: Map<string, IAuthHook> = new Map();

  /**
   * Register an authentication hook
   */
  registerHook(hook: IAuthHook): void {
    if (this.hooks.has(hook.name)) {
      throw new Error(`Authentication hook '${hook.name}' is already registered`);
    }
    this.hooks.set(hook.name, hook);
  }

  /**
   * Unregister an authentication hook
   */
  unregisterHook(hookName: string): void {
    this.hooks.delete(hookName);
  }

  /**
   * Get registered hook by name
   */
  getHook(hookName: string): IAuthHook | null {
    return this.hooks.get(hookName) || null;
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): IAuthHook[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Execute beforeAuthenticate hooks
   */
  async executeBeforeAuthenticate(credentials: LoginCredentials): Promise<LoginCredentials | null> {
    let modifiedCredentials = credentials;

    for (const hook of this.hooks.values()) {
      if (hook.beforeAuthenticate) {
        try {
          const result = await hook.beforeAuthenticate(modifiedCredentials);
          if (result === null) {
            return null; // Hook blocked authentication
          }
          modifiedCredentials = result;
        } catch (error) {
          console.error(`Hook '${hook.name}' beforeAuthenticate failed:`, error);
        }
      }
    }

    return modifiedCredentials;
  }

  /**
   * Execute afterAuthenticate hooks
   */
  async executeAfterAuthenticate(user: User, session: Session): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(async (hook) => {
      if (hook.afterAuthenticate) {
        try {
          await hook.afterAuthenticate(user, session);
        } catch (error) {
          console.error(`Hook '${hook.name}' afterAuthenticate failed:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute beforeValidateSession hooks
   */
  async executeBeforeValidateSession(sessionToken: string): Promise<string | null> {
    let modifiedToken = sessionToken;

    for (const hook of this.hooks.values()) {
      if (hook.beforeValidateSession) {
        try {
          const result = await hook.beforeValidateSession(modifiedToken);
          if (result === null) {
            return null; // Hook blocked validation
          }
          modifiedToken = result;
        } catch (error) {
          console.error(`Hook '${hook.name}' beforeValidateSession failed:`, error);
        }
      }
    }

    return modifiedToken;
  }

  /**
   * Execute afterValidateSession hooks
   */
  async executeAfterValidateSession(user: User, session: Session): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(async (hook) => {
      if (hook.afterValidateSession) {
        try {
          await hook.afterValidateSession(user, session);
        } catch (error) {
          console.error(`Hook '${hook.name}' afterValidateSession failed:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute beforeLogout hooks
   */
  async executeBeforeLogout(user: User, session: Session): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(async (hook) => {
      if (hook.beforeLogout) {
        try {
          await hook.beforeLogout(user, session);
        } catch (error) {
          console.error(`Hook '${hook.name}' beforeLogout failed:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute afterLogout hooks
   */
  async executeAfterLogout(userId: string): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(async (hook) => {
      if (hook.afterLogout) {
        try {
          await hook.afterLogout(userId);
        } catch (error) {
          console.error(`Hook '${hook.name}' afterLogout failed:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute onAuthDisabled hooks
   */
  async executeOnAuthDisabled(): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(async (hook) => {
      if (hook.onAuthDisabled) {
        try {
          await hook.onAuthDisabled();
        } catch (error) {
          console.error(`Hook '${hook.name}' onAuthDisabled failed:`, error);
        }
      }
    });

    await Promise.all(promises);
  }
}

/**
 * External Authentication Integration
 * Provides non-interference integration with external authentication systems
 */
export class ExternalAuthIntegration implements IExternalAuthIntegration {
  private isEnabled: boolean;
  private externalAuthCallbacks: Map<string, Function> = new Map();

  constructor() {
    this.isEnabled = ConfigManager.isAuthEnabled();
  }

  /**
   * Check if external authentication system is available
   */
  async isExternalAuthAvailable(): Promise<boolean> {
    // Check for common external auth indicators
    if (typeof window !== 'undefined') {
      // Check for common external auth libraries/objects
      const externalAuthSystems = [
        'Auth0',
        'firebase',
        'AWS',
        'okta',
        'keycloak',
        'supabase'
      ];

      return externalAuthSystems.some(system => 
        (window as any)[system] !== undefined
      );
    }

    // Server-side check for external auth environment variables
    const externalAuthEnvVars = [
      'AUTH0_DOMAIN',
      'FIREBASE_API_KEY',
      'AWS_COGNITO_USER_POOL_ID',
      'OKTA_DOMAIN',
      'KEYCLOAK_URL',
      'SUPABASE_URL'
    ];

    return externalAuthEnvVars.some(envVar => 
      process.env[envVar] !== undefined
    );
  }

  /**
   * Get external authentication status
   */
  async getExternalAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: User;
    expiresAt?: Date;
  }> {
    // When authentication is disabled, don't interfere with external systems
    if (!this.isEnabled) {
      return {
        isAuthenticated: true, // Assume authenticated to avoid interference
      };
    }

    // Default implementation - can be extended for specific external systems
    return {
      isAuthenticated: false,
    };
  }

  /**
   * Synchronize with external authentication state
   */
  async syncWithExternalAuth(isAuthenticated: boolean, user?: User): Promise<void> {
    // When authentication is disabled, don't interfere with external systems
    if (!this.isEnabled) {
      return;
    }

    // Execute registered sync callbacks
    for (const [name, callback] of this.externalAuthCallbacks) {
      try {
        await callback({ isAuthenticated, user });
      } catch (error) {
        console.error(`External auth sync callback '${name}' failed:`, error);
      }
    }
  }

  /**
   * Handle external authentication events
   */
  async handleExternalAuthEvent(event: {
    type: 'login' | 'logout' | 'session_expired' | 'user_updated';
    user?: User;
    timestamp: Date;
  }): Promise<void> {
    // When authentication is disabled, don't interfere with external systems
    if (!this.isEnabled) {
      return;
    }

    // Log external auth events for debugging
    console.debug('External auth event:', event);

    // Handle different event types
    switch (event.type) {
      case 'login':
        // External system logged in - sync if needed
        break;
      case 'logout':
        // External system logged out - sync if needed
        break;
      case 'session_expired':
        // External session expired - handle gracefully
        break;
      case 'user_updated':
        // External user data updated - sync if needed
        break;
    }
  }

  /**
   * Register external authentication sync callback
   */
  registerSyncCallback(name: string, callback: Function): void {
    this.externalAuthCallbacks.set(name, callback);
  }

  /**
   * Unregister external authentication sync callback
   */
  unregisterSyncCallback(name: string): void {
    this.externalAuthCallbacks.delete(name);
  }

  /**
   * Cleanup external authentication integration
   */
  async cleanup(): Promise<void> {
    this.externalAuthCallbacks.clear();
  }
}

// Global instances
export const authProviderRegistry = new AuthProviderRegistry();
export const authHookRegistry = new AuthHookRegistry();
export const externalAuthIntegration = new ExternalAuthIntegration();