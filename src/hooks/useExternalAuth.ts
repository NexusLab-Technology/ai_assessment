/**
 * External Authentication Integration Hook
 * Provides hooks for external authentication system integration
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { useEffect, useCallback, useState } from 'react';
import { User } from '@/types';
import { 
  authProviderRegistry, 
  authHookRegistry, 
  externalAuthIntegration 
} from '@/lib/AuthProviderRegistry';
import { ConfigManager } from '@/lib/config';

/**
 * External authentication status
 */
export interface ExternalAuthStatus {
  isAvailable: boolean;
  isAuthenticated: boolean;
  user?: User;
  expiresAt?: Date;
  loading: boolean;
  error?: string;
}

/**
 * Hook for external authentication integration
 * Provides non-interference integration with external authentication systems
 */
export function useExternalAuth() {
  const [status, setStatus] = useState<ExternalAuthStatus>({
    isAvailable: false,
    isAuthenticated: false,
    loading: true,
  });

  const isAuthEnabled = ConfigManager.isAuthEnabled();

  /**
   * Check external authentication availability
   */
  const checkExternalAuth = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));

      const isAvailable = await externalAuthIntegration.isExternalAuthAvailable();
      
      if (isAvailable) {
        const externalStatus = await externalAuthIntegration.getExternalAuthStatus();
        setStatus({
          isAvailable: true,
          isAuthenticated: externalStatus.isAuthenticated,
          user: externalStatus.user,
          expiresAt: externalStatus.expiresAt,
          loading: false,
        });
      } else {
        setStatus({
          isAvailable: false,
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'External auth check failed',
      }));
    }
  }, []);

  /**
   * Sync with external authentication state
   */
  const syncWithExternal = useCallback(async (isAuthenticated: boolean, user?: User) => {
    if (!isAuthEnabled) {
      // When auth is disabled, execute onAuthDisabled hooks
      await authHookRegistry.executeOnAuthDisabled();
      return;
    }

    try {
      await externalAuthIntegration.syncWithExternalAuth(isAuthenticated, user);
    } catch (error) {
      console.error('Failed to sync with external auth:', error);
    }
  }, [isAuthEnabled]);

  /**
   * Handle external authentication events
   */
  const handleExternalEvent = useCallback(async (event: {
    type: 'login' | 'logout' | 'session_expired' | 'user_updated';
    user?: User;
    timestamp?: Date;
  }) => {
    if (!isAuthEnabled) {
      return; // Don't interfere when auth is disabled
    }

    try {
      await externalAuthIntegration.handleExternalAuthEvent({
        ...event,
        timestamp: event.timestamp || new Date(),
      });
      
      // Refresh external auth status after handling event
      await checkExternalAuth();
    } catch (error) {
      console.error('Failed to handle external auth event:', error);
    }
  }, [isAuthEnabled, checkExternalAuth]);

  /**
   * Register external authentication sync callback
   */
  const registerSyncCallback = useCallback((name: string, callback: Function) => {
    externalAuthIntegration.registerSyncCallback(name, callback);
  }, []);

  /**
   * Unregister external authentication sync callback
   */
  const unregisterSyncCallback = useCallback((name: string) => {
    externalAuthIntegration.unregisterSyncCallback(name);
  }, []);

  // Initialize external auth check on mount
  useEffect(() => {
    checkExternalAuth();
  }, [checkExternalAuth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      externalAuthIntegration.cleanup();
    };
  }, []);

  return {
    status,
    checkExternalAuth,
    syncWithExternal,
    handleExternalEvent,
    registerSyncCallback,
    unregisterSyncCallback,
    isAuthEnabled,
  };
}

/**
 * Hook for registering authentication providers
 */
export function useAuthProviderRegistry() {
  const [providers, setProviders] = useState(authProviderRegistry.getAllProviders());
  const [initialized, setInitialized] = useState(false);

  /**
   * Initialize the provider registry
   */
  const initialize = useCallback(async () => {
    if (initialized) return;
    
    try {
      await authProviderRegistry.initialize();
      setInitialized(true);
      setProviders(authProviderRegistry.getAllProviders());
    } catch (error) {
      console.error('Failed to initialize auth provider registry:', error);
    }
  }, [initialized]);

  /**
   * Register a new authentication provider
   */
  const registerProvider = useCallback(async (provider: any) => {
    try {
      authProviderRegistry.register(provider);
      setProviders(authProviderRegistry.getAllProviders());
    } catch (error) {
      console.error('Failed to register auth provider:', error);
      throw error;
    }
  }, []);

  /**
   * Unregister an authentication provider
   */
  const unregisterProvider = useCallback((providerName: string) => {
    try {
      authProviderRegistry.unregister(providerName);
      setProviders(authProviderRegistry.getAllProviders());
    } catch (error) {
      console.error('Failed to unregister auth provider:', error);
      throw error;
    }
  }, []);

  /**
   * Get enabled providers
   */
  const getEnabledProviders = useCallback(() => {
    return authProviderRegistry.getEnabledProviders();
  }, []);

  /**
   * Check if providers are available
   */
  const hasProviders = useCallback(() => {
    return authProviderRegistry.hasProviders();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      authProviderRegistry.cleanup();
    };
  }, []);

  return {
    providers,
    initialized,
    registerProvider,
    unregisterProvider,
    getEnabledProviders,
    hasProviders,
    initialize,
  };
}

/**
 * Hook for registering authentication hooks
 */
export function useAuthHookRegistry() {
  const [hooks, setHooks] = useState(authHookRegistry.getAllHooks());

  /**
   * Register a new authentication hook
   */
  const registerHook = useCallback((hook: any) => {
    try {
      authHookRegistry.registerHook(hook);
      setHooks(authHookRegistry.getAllHooks());
    } catch (error) {
      console.error('Failed to register auth hook:', error);
      throw error;
    }
  }, []);

  /**
   * Unregister an authentication hook
   */
  const unregisterHook = useCallback((hookName: string) => {
    try {
      authHookRegistry.unregisterHook(hookName);
      setHooks(authHookRegistry.getAllHooks());
    } catch (error) {
      console.error('Failed to unregister auth hook:', error);
      throw error;
    }
  }, []);

  /**
   * Get registered hook by name
   */
  const getHook = useCallback((hookName: string) => {
    return authHookRegistry.getHook(hookName);
  }, []);

  return {
    hooks,
    registerHook,
    unregisterHook,
    getHook,
  };
}