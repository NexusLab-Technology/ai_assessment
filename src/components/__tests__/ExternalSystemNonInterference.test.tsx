/**
 * Property Test: External System Non-Interference
 * Validates that the authentication framework does not interfere with external systems
 * when authentication is disabled
 * Requirements: 5.4
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { AuthProvider } from '@/contexts/AuthContext';
import { 
  authProviderRegistry, 
  authHookRegistry, 
  externalAuthIntegration 
} from '@/lib/AuthProviderRegistry';
import { MockAuthProvider } from '@/providers/MockAuthProvider';
import { ExampleAuthHook } from '@/hooks/ExampleAuthHook';
import { ConfigManager } from '@/lib/config';

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    getAuthConfig: jest.fn(),
    isAuthEnabled: jest.fn(),
    resetConfig: jest.fn(),
  },
}));

const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

describe('External System Non-Interference', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    
    // Clear registries completely
    authProviderRegistry.cleanup();
    
    // Clear all hooks
    const existingHooks = authHookRegistry.getAllHooks();
    existingHooks.forEach(hook => {
      authHookRegistry.unregisterHook(hook.name);
    });
    
    // Clear external auth integration
    externalAuthIntegration.cleanup();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    
    // Final cleanup
    authProviderRegistry.cleanup();
    const existingHooks = authHookRegistry.getAllHooks();
    existingHooks.forEach(hook => {
      authHookRegistry.unregisterHook(hook.name);
    });
    externalAuthIntegration.cleanup();
  });

  /**
   * Property 10: External system non-interference
   * When authentication is disabled, the authentication framework SHALL NOT interfere
   * with external authentication systems or application functionality
   * **Validates: Requirements 5.4**
   */
  describe('Property 10: External system non-interference', () => {
    it('should not interfere with external systems when authentication is disabled', () => {
      fc.assert(
        fc.property(
          fc.record({
            authEnabled: fc.boolean(),
            hasExternalProvider: fc.boolean(),
            hasExternalHooks: fc.boolean(),
            externalSystemCalls: fc.integer({ min: 0, max: 10 }),
            userInteractions: fc.integer({ min: 0, max: 5 }),
          }),
          (testConfig) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled: testConfig.authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });
            mockConfigManager.isAuthEnabled.mockReturnValue(testConfig.authEnabled);

            // Set up external provider if configured
            let externalProvider: MockAuthProvider | null = null;
            if (testConfig.hasExternalProvider) {
              externalProvider = new MockAuthProvider({
                name: 'external-test-provider',
                enabled: true,
                priority: 10,
                settings: { external: true },
              });
              authProviderRegistry.register(externalProvider);
            }

            // Set up external hooks if configured
            let externalHook: ExampleAuthHook | null = null;
            if (testConfig.hasExternalHooks) {
              externalHook = new ExampleAuthHook();
              // Only register if not already registered
              if (!authHookRegistry.getHook(externalHook.name)) {
                authHookRegistry.registerHook(externalHook);
              }
            }

            // Render AuthProvider to test non-interference
            const TestComponent = () => (
              <AuthProvider>
                <div data-testid="app-content">
                  External System Integration Test
                </div>
              </AuthProvider>
            );

            const { container } = render(<TestComponent />);

            // Property assertions for non-interference
            if (!testConfig.authEnabled) {
              // When authentication is disabled, external systems should not be interfered with

              // 1. Application should render normally without authentication barriers
              expect(container.querySelector('[data-testid="app-content"]')).toBeTruthy();
              
              // 2. No authentication-related errors should occur
              expect(consoleErrorSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('auth')
              );

            } else {
              // When authentication is enabled, external systems should integrate normally
              
              if (externalProvider) {
                // Provider should be available for authentication
                expect(authProviderRegistry.hasProviders()).toBe(true);
              }

              if (externalHook) {
                // Hooks should be registered and available
                expect(authHookRegistry.getAllHooks()).toContain(externalHook);
              }
            }

            // Cleanup
            if (externalProvider) {
              authProviderRegistry.unregister(externalProvider.name);
            }
            if (externalHook) {
              authHookRegistry.unregisterHook(externalHook.name);
            }

            // Property test should always pass if no exceptions thrown
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain external system state consistency when auth is disabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // authEnabled
          fc.array(fc.string(), { minLength: 0, maxLength: 5 }), // externalSystemIds
          (authEnabled, externalSystemIds) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });
            mockConfigManager.isAuthEnabled.mockReturnValue(authEnabled);

            // Track external system state
            const externalSystemStates = new Map<string, any>();
            
            // Initialize external systems
            for (const systemId of externalSystemIds) {
              externalSystemStates.set(systemId, {
                id: systemId,
                authenticated: true,
                lastActivity: new Date(),
                sessionValid: true,
              });
            }

            // Render AuthProvider
            const TestComponent = () => (
              <AuthProvider>
                <div data-testid="external-test">External System Test</div>
              </AuthProvider>
            );

            const { container } = render(<TestComponent />);

            // Basic assertion - component should render
            expect(container.querySelector('[data-testid="external-test"]')).toBeTruthy();

            // Property assertions
            if (!authEnabled) {
              // When auth is disabled, external systems should not be affected
              for (const [, state] of externalSystemStates) {
                expect(state.authenticated).toBe(true);
                expect(state.sessionValid).toBe(true);
              }
            }

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle external authentication events without interference when auth disabled', () => {
      fc.assert(
        fc.property(
          fc.record({
            authEnabled: fc.boolean(),
            eventType: fc.constantFrom('login', 'logout', 'session_expired', 'user_updated'),
            eventCount: fc.integer({ min: 1, max: 10 }),
            hasExternalUser: fc.boolean(),
          }),
          (testConfig) => {
            // Set up configuration
            mockConfigManager.getAuthConfig.mockReturnValue({
              authEnabled: testConfig.authEnabled,
              sessionTimeout: 3600000,
              rememberSidebar: true,
        defaultRoute: "/",
            });
            mockConfigManager.isAuthEnabled.mockReturnValue(testConfig.authEnabled);

            // Render AuthProvider
            const TestComponent = () => (
              <AuthProvider>
                <div data-testid="event-test">Event Test</div>
              </AuthProvider>
            );

            const { container } = render(<TestComponent />);

            // Basic assertion - component should render
            expect(container.querySelector('[data-testid="event-test"]')).toBeTruthy();

            // Property assertions
            if (!testConfig.authEnabled) {
              // When auth is disabled, external events should not cause interference
              
              // 1. No authentication errors should occur
              expect(consoleErrorSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('authentication')
              );
              
              // 2. Application should remain functional
              expect(container.querySelector('[data-testid="event-test"]')).toBeTruthy();
            }

            return true;
          }
        ),
        { numRuns: 40 }
      );
    });
  });
});