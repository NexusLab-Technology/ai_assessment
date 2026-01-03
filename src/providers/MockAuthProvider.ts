/**
 * Mock Authentication Provider
 * Example implementation of IAuthProvider for testing and demonstration
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { 
  IAuthProvider, 
  AuthResult, 
  AuthProviderConfig 
} from '@/interfaces/AuthProvider';
import { User, Session, LoginCredentials } from '@/types';

/**
 * Mock Authentication Provider
 * Demonstrates how to implement custom authentication providers
 */
export class MockAuthProvider implements IAuthProvider {
  readonly name = 'mock-auth-provider';
  readonly config: AuthProviderConfig;

  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private isInitialized = false;

  constructor(config: Partial<AuthProviderConfig> = {}) {
    this.config = {
      name: this.name,
      enabled: true,
      priority: 1,
      settings: {},
      ...config,
    };

    // Add mock users for testing
    this.users.set('admin', {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin', 'user'],
      lastLogin: new Date(),
    });

    this.users.set('user', {
      id: '2',
      username: 'user',
      email: 'user@example.com',
      roles: ['user'],
      lastLogin: new Date(),
    });
  }

  /**
   * Initialize the authentication provider
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`Initializing ${this.name} authentication provider`);
    
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isInitialized = true;
    console.log(`${this.name} authentication provider initialized`);
  }

  /**
   * Authenticate user with credentials
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Provider not initialized',
      };
    }

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = this.users.get(credentials.username);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Simple password check (in real implementation, use proper hashing)
    const validPasswords = {
      'admin': 'admin123',
      'user': 'user123',
    };

    if (credentials.password !== validPasswords[credentials.username as keyof typeof validPasswords]) {
      return {
        success: false,
        error: 'Invalid password',
      };
    }

    // Create session
    const sessionToken = this.generateSessionToken();
    const session: Session = {
      token: sessionToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(),
    };

    this.sessions.set(sessionToken, session);

    // Update last login
    user.lastLogin = new Date();

    return {
      success: true,
      user,
      session,
    };
  }

  /**
   * Validate existing session
   */
  async validateSession(sessionToken: string): Promise<AuthResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Provider not initialized',
      };
    }

    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Check if session is expired
    if (session.expiresAt <= new Date()) {
      this.sessions.delete(sessionToken);
      return {
        success: false,
        error: 'Session expired',
      };
    }

    // Get user data
    const user = Array.from(this.users.values()).find(u => u.id === session.userId);
    
    if (!user) {
      this.sessions.delete(sessionToken);
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      user,
      session,
    };
  }

  /**
   * Refresh session token
   */
  async refreshSession(refreshToken: string): Promise<AuthResult> {
    // For simplicity, treat refresh token same as session token
    const validationResult = await this.validateSession(refreshToken);
    
    if (!validationResult.success || !validationResult.user) {
      return validationResult;
    }

    // Create new session
    const newSessionToken = this.generateSessionToken();
    const newSession: Session = {
      token: newSessionToken,
      userId: validationResult.user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(),
    };

    // Remove old session
    this.sessions.delete(refreshToken);
    
    // Add new session
    this.sessions.set(newSessionToken, newSession);

    return {
      success: true,
      user: validationResult.user,
      session: newSession,
    };
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionToken: string): Promise<void> {
    this.sessions.delete(sessionToken);
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.id === userId) || null;
  }

  /**
   * Check if provider is available and healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Clean up resources when provider is unregistered
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.name} authentication provider`);
    this.sessions.clear();
    this.isInitialized = false;
  }

  /**
   * Generate a mock session token
   */
  private generateSessionToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a mock user (for testing purposes)
   */
  addMockUser(username: string, user: User): void {
    this.users.set(username, user);
  }

  /**
   * Get all active sessions (for testing purposes)
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions (for testing purposes)
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }
}