/**
 * Property-Based Tests for Default Landing Page
 * Feature: configurable-auth-framework, Property 19: Default landing page
 */

import { ConfigManager } from '@/lib/config';
import { DEFAULT_CONFIG } from '@/lib/constants';
import fc from 'fast-check';

// Mock environment variables
const originalEnv = process.env;

describe('Default Landing Page Properties', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset ConfigManager cache
    ConfigManager.resetConfig();
  });

  afterEach(() => {
    process.env = originalEnv;
    ConfigManager.resetConfig();
  });

  /**
   * Property 19: Default landing page
   * For any initial application access, the system should set Home as the default landing page
   * Validates: Requirements 6.8
   */
  describe('Property 19: Default landing page', () => {
    it('should always return "/" as the default route when no environment variable is set', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // authEnabled
          fc.integer({ min: 1000, max: 10000 }), // sessionTimeout
          fc.boolean(), // rememberSidebar
          (authEnabled, sessionTimeout, rememberSidebar) => {
            // Set up environment without DEFAULT_ROUTE
            process.env.AUTH_ENABLED = authEnabled.toString();
            process.env.SESSION_TIMEOUT = sessionTimeout.toString();
            process.env.REMEMBER_SIDEBAR = rememberSidebar.toString();
            delete process.env.DEFAULT_ROUTE;
            delete process.env.NEXT_PUBLIC_DEFAULT_ROUTE;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const config = ConfigManager.getAuthConfig();
            const defaultRoute = ConfigManager.getDefaultRoute();

            // Should always default to Home page
            expect(defaultRoute).toBe('/');
            expect(config.defaultRoute).toBe('/');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use environment variable when DEFAULT_ROUTE is set', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('/'),
            fc.constant('/home'),
            fc.constant('/dashboard'),
            fc.constant('/profile'),
            fc.string({ minLength: 1 }).map(s => `/${s}`)
          ), // defaultRoute
          (defaultRoute) => {
            // Set up environment with DEFAULT_ROUTE
            process.env.DEFAULT_ROUTE = defaultRoute;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const config = ConfigManager.getAuthConfig();
            const retrievedDefaultRoute = ConfigManager.getDefaultRoute();

            // Should use the environment variable value
            expect(retrievedDefaultRoute).toBe(defaultRoute.startsWith('/') ? defaultRoute : `/${defaultRoute}`);
            expect(config.defaultRoute).toBe(defaultRoute.startsWith('/') ? defaultRoute : `/${defaultRoute}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure default route always starts with "/"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // route without leading slash
          (routeWithoutSlash) => {
            // Set up environment with route that doesn't start with /
            process.env.DEFAULT_ROUTE = routeWithoutSlash;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const defaultRoute = ConfigManager.getDefaultRoute();

            // Should always start with /
            expect(defaultRoute).toMatch(/^\/.*$/);
            
            // If the route is empty or only whitespace, should default to "/"
            if (routeWithoutSlash.trim() === '') {
              expect(defaultRoute).toBe('/');
            } else if (routeWithoutSlash.startsWith('/')) {
              // If route already starts with /, should return as-is
              expect(defaultRoute).toBe(routeWithoutSlash);
            } else {
              // Otherwise, should prepend /
              expect(defaultRoute).toBe(`/${routeWithoutSlash}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty or whitespace DEFAULT_ROUTE by falling back to "/"', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n'),
            fc.constant('  \t  \n  ')
          ), // emptyOrWhitespace
          (emptyOrWhitespace) => {
            // Set up environment with empty or whitespace DEFAULT_ROUTE
            process.env.DEFAULT_ROUTE = emptyOrWhitespace;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const defaultRoute = ConfigManager.getDefaultRoute();

            // Should fall back to Home page
            expect(defaultRoute).toBe('/');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize NEXT_PUBLIC_DEFAULT_ROUTE over DEFAULT_ROUTE', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).map(s => `/${s}`), // serverRoute
          fc.string({ minLength: 1 }).map(s => `/${s}`), // clientRoute
          (serverRoute, clientRoute) => {
            fc.pre(serverRoute !== clientRoute); // Ensure they're different

            // Set up both environment variables
            process.env.DEFAULT_ROUTE = serverRoute;
            process.env.NEXT_PUBLIC_DEFAULT_ROUTE = clientRoute;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const defaultRoute = ConfigManager.getDefaultRoute();

            // Should use the client-side environment variable
            expect(defaultRoute).toBe(clientRoute);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('/'),
            fc.constant('/home'),
            fc.constant('/dashboard'),
            fc.string({ minLength: 1 }).map(s => `/${s}`)
          ), // defaultRoute
          (defaultRoute) => {
            // Set up environment
            process.env.DEFAULT_ROUTE = defaultRoute;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            // Call multiple times
            const route1 = ConfigManager.getDefaultRoute();
            const route2 = ConfigManager.getDefaultRoute();
            const route3 = ConfigManager.getDefaultRoute();

            // Should be consistent
            expect(route1).toBe(route2);
            expect(route2).toBe(route3);
            expect(route1).toBe(defaultRoute);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should integrate properly with auth config', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // authEnabled
          fc.integer({ min: 1000, max: 10000 }), // sessionTimeout
          fc.boolean(), // rememberSidebar
          fc.string({ minLength: 1 }).map(s => `/${s}`), // defaultRoute
          (authEnabled, sessionTimeout, rememberSidebar, defaultRoute) => {
            // Set up complete environment
            process.env.AUTH_ENABLED = authEnabled.toString();
            process.env.SESSION_TIMEOUT = sessionTimeout.toString();
            process.env.REMEMBER_SIDEBAR = rememberSidebar.toString();
            process.env.DEFAULT_ROUTE = defaultRoute;

            // Reset config to pick up new environment
            ConfigManager.resetConfig();

            const config = ConfigManager.getAuthConfig();

            // Should have all properties including defaultRoute
            expect(config.authEnabled).toBe(authEnabled);
            expect(config.sessionTimeout).toBe(sessionTimeout);
            expect(config.rememberSidebar).toBe(rememberSidebar);
            expect(config.defaultRoute).toBe(defaultRoute);

            // getDefaultRoute should return the same value
            expect(ConfigManager.getDefaultRoute()).toBe(defaultRoute);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use constant DEFAULT_CONFIG value when available', () => {
      // This test verifies that our constant matches the expected default
      expect(DEFAULT_CONFIG.DEFAULT_ROUTE).toBe('/');
      
      fc.assert(
        fc.property(
          fc.boolean(), // irrelevant parameter to make it a property test
          (_irrelevant) => {
            // Clear environment variables
            delete process.env.DEFAULT_ROUTE;
            delete process.env.NEXT_PUBLIC_DEFAULT_ROUTE;

            // Reset config
            ConfigManager.resetConfig();

            const defaultRoute = ConfigManager.getDefaultRoute();

            // Should match the constant
            expect(defaultRoute).toBe(DEFAULT_CONFIG.DEFAULT_ROUTE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});