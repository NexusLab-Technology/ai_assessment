import { AuthConfig } from '@/types';

/**
 * ConfigManager - Centralized configuration management for authentication behavior
 * Reads from environment variables and provides type-safe configuration access
 */
export class ConfigManager {
  private static config: AuthConfig | null = null;

  /**
   * Get the complete authentication configuration
   * @returns AuthConfig object with all configuration values
   */
  static getAuthConfig(): AuthConfig {
    if (!this.config) {
      this.config = {
        authEnabled: this.parseAuthEnabled(),
        sessionTimeout: this.parseSessionTimeout(),
        rememberSidebar: this.parseRememberSidebar(),
        defaultRoute: this.parseDefaultRoute(),
      };
    }
    return this.config;
  }

  /**
   * Check if authentication is enabled
   * @returns boolean indicating if authentication is required
   */
  static isAuthEnabled(): boolean {
    return this.getAuthConfig().authEnabled;
  }

  /**
   * Get the default route for the application
   * @returns string representing the default landing page route
   */
  static getDefaultRoute(): string {
    return this.getAuthConfig().defaultRoute;
  }

  /**
   * Parse AUTH_ENABLED environment variable
   * Defaults to true if not set or invalid
   */
  private static parseAuthEnabled(): boolean {
    const authEnabled = process.env.AUTH_ENABLED || process.env.NEXT_PUBLIC_AUTH_ENABLED;
    
    // If not set, default to true (secure default)
    if (authEnabled === undefined || authEnabled === null || authEnabled === '') {
      return true;
    }
    
    // Only return false if explicitly set to "false" (case insensitive)
    if (authEnabled.toLowerCase() === 'false') {
      return false;
    }
    
    // For "true" or any other value, default to true (secure default)
    return true;
  }

  /**
   * Parse SESSION_TIMEOUT environment variable
   * Defaults to 1 hour (3600000ms) if not set or invalid
   */
  private static parseSessionTimeout(): number {
    const timeout = process.env.SESSION_TIMEOUT || process.env.NEXT_PUBLIC_SESSION_TIMEOUT;
    
    if (!timeout) {
      return 3600000; // 1 hour default
    }
    
    const parsed = parseInt(timeout, 10);
    return isNaN(parsed) ? 3600000 : parsed;
  }

  /**
   * Parse REMEMBER_SIDEBAR environment variable
   * Defaults to true if not set or invalid
   */
  private static parseRememberSidebar(): boolean {
    const remember = process.env.REMEMBER_SIDEBAR || process.env.NEXT_PUBLIC_REMEMBER_SIDEBAR;
    
    if (remember === undefined || remember === null) {
      return true; // Default to remembering sidebar state
    }
    
    return remember.toLowerCase() === 'true';
  }

  /**
   * Parse DEFAULT_ROUTE environment variable
   * Defaults to '/' (Home) if not set or invalid
   * Prioritizes NEXT_PUBLIC_DEFAULT_ROUTE over DEFAULT_ROUTE
   */
  private static parseDefaultRoute(): string {
    const route = process.env.NEXT_PUBLIC_DEFAULT_ROUTE || process.env.DEFAULT_ROUTE;
    
    if (!route || route.trim() === '') {
      return '/'; // Default to Home page
    }
    
    // Ensure route starts with '/'
    return route.startsWith('/') ? route : `/${route}`;
  }

  /**
   * Reset configuration cache (useful for testing)
   */
  static resetConfig(): void {
    this.config = null;
  }
}