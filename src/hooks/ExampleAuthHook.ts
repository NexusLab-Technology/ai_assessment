/**
 * Example Authentication Hook
 * Demonstrates how to implement authentication hooks for external system integration
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { IAuthHook } from '@/interfaces/AuthProvider';
import { User, Session, LoginCredentials } from '@/types';

/**
 * Example Authentication Hook
 * Demonstrates integration with external systems during authentication lifecycle
 */
export class ExampleAuthHook implements IAuthHook {
  readonly name = 'example-auth-hook';

  private externalSystemAvailable = false;

  constructor() {
    // Check if external system is available
    this.checkExternalSystem();
  }

  /**
   * Called before authentication attempt
   */
  async beforeAuthenticate(credentials: LoginCredentials): Promise<LoginCredentials | null> {
    console.log(`[${this.name}] Before authenticate:`, credentials.username);

    // Example: Add additional validation or modify credentials
    if (credentials.username.includes('blocked')) {
      console.log(`[${this.name}] Blocking authentication for user:`, credentials.username);
      return null; // Block authentication
    }

    // Example: Validate credentials or add logging
    // For this example, we'll just return the original credentials
    // In a real implementation, you might validate against external systems
    // or add additional context without modifying the credentials structure
    
    console.log(`[${this.name}] Processing credentials for external system integration`);
    
    return credentials;
  }

  /**
   * Called after successful authentication
   */
  async afterAuthenticate(user: User, session: Session): Promise<void> {
    console.log(`[${this.name}] After authenticate:`, user.username);

    // Example: Sync with external system
    if (this.externalSystemAvailable) {
      await this.syncUserWithExternalSystem(user);
    }

    // Example: Log authentication event
    await this.logAuthenticationEvent('login', user, session);

    // Example: Send notification
    await this.sendAuthenticationNotification('login', user);
  }

  /**
   * Called before session validation
   */
  async beforeValidateSession(sessionToken: string): Promise<string | null> {
    console.log(`[${this.name}] Before validate session:`, sessionToken.substring(0, 10) + '...');

    // Example: Check external system session validity
    if (this.externalSystemAvailable) {
      const isValidInExternalSystem = await this.validateWithExternalSystem(sessionToken);
      if (!isValidInExternalSystem) {
        console.log(`[${this.name}] Session invalid in external system`);
        return null; // Block validation
      }
    }

    return sessionToken;
  }

  /**
   * Called after session validation
   */
  async afterValidateSession(user: User, session: Session): Promise<void> {
    console.log(`[${this.name}] After validate session:`, user.username);

    // Example: Update external system session
    if (this.externalSystemAvailable) {
      await this.updateExternalSystemSession(user, session);
    }

    // Example: Log session validation
    await this.logAuthenticationEvent('session_validated', user, session);
  }

  /**
   * Called before logout
   */
  async beforeLogout(user: User, session: Session): Promise<void> {
    console.log(`[${this.name}] Before logout:`, user.username);

    // Example: Notify external systems before logout
    if (this.externalSystemAvailable) {
      await this.notifyExternalSystemLogout(user, session);
    }

    // Example: Save user activity before logout
    await this.saveUserActivity(user, 'logout_initiated');
  }

  /**
   * Called after logout
   */
  async afterLogout(userId: string): Promise<void> {
    console.log(`[${this.name}] After logout:`, userId);

    // Example: Clean up external system data
    if (this.externalSystemAvailable) {
      await this.cleanupExternalSystemData(userId);
    }

    // Example: Log logout event
    await this.logAuthenticationEvent('logout', { id: userId } as User);

    // Example: Send logout notification
    await this.sendAuthenticationNotification('logout', { id: userId } as User);
  }

  /**
   * Called when authentication is disabled
   */
  async onAuthDisabled(): Promise<void> {
    console.log(`[${this.name}] Authentication disabled - ensuring non-interference`);

    // Example: Disable external system integration
    if (this.externalSystemAvailable) {
      await this.disableExternalSystemIntegration();
    }

    // Example: Log authentication disabled event
    console.log(`[${this.name}] External system integration disabled to prevent interference`);
  }

  /**
   * Check if external system is available
   */
  private async checkExternalSystem(): Promise<void> {
    try {
      // Example: Check for external system availability
      // This could be an API call, environment variable check, etc.
      this.externalSystemAvailable = process.env.EXTERNAL_AUTH_SYSTEM_URL !== undefined;
      
      if (this.externalSystemAvailable) {
        console.log(`[${this.name}] External system available`);
      } else {
        console.log(`[${this.name}] External system not available`);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to check external system:`, error);
      this.externalSystemAvailable = false;
    }
  }

  /**
   * Generate external system ID
   */
  private generateExternalId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sync user with external system
   */
  private async syncUserWithExternalSystem(user: User): Promise<void> {
    try {
      console.log(`[${this.name}] Syncing user with external system:`, user.username);
      
      // Example: Make API call to external system
      // await fetch(`${process.env.EXTERNAL_AUTH_SYSTEM_URL}/sync-user`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(user),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[${this.name}] User synced with external system`);
    } catch (error) {
      console.error(`[${this.name}] Failed to sync user with external system:`, error);
    }
  }

  /**
   * Validate session with external system
   */
  private async validateWithExternalSystem(sessionToken: string): Promise<boolean> {
    try {
      console.log(`[${this.name}] Validating session with external system`);
      
      // Example: Make API call to external system
      // const response = await fetch(`${process.env.EXTERNAL_AUTH_SYSTEM_URL}/validate-session`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${sessionToken}` },
      // });
      // return response.ok;
      
      // Simulate API call - always return true for demo
      await new Promise(resolve => setTimeout(resolve, 50));
      return true;
    } catch (error) {
      console.error(`[${this.name}] Failed to validate with external system:`, error);
      return false;
    }
  }

  /**
   * Update external system session
   */
  private async updateExternalSystemSession(user: User, session: Session): Promise<void> {
    try {
      console.log(`[${this.name}] Updating external system session for:`, user.username);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`[${this.name}] External system session updated`);
    } catch (error) {
      console.error(`[${this.name}] Failed to update external system session:`, error);
    }
  }

  /**
   * Notify external system of logout
   */
  private async notifyExternalSystemLogout(user: User, session: Session): Promise<void> {
    try {
      console.log(`[${this.name}] Notifying external system of logout:`, user.username);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`[${this.name}] External system notified of logout`);
    } catch (error) {
      console.error(`[${this.name}] Failed to notify external system of logout:`, error);
    }
  }

  /**
   * Clean up external system data
   */
  private async cleanupExternalSystemData(userId: string): Promise<void> {
    try {
      console.log(`[${this.name}] Cleaning up external system data for user:`, userId);
      
      // Simulate cleanup
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`[${this.name}] External system data cleaned up`);
    } catch (error) {
      console.error(`[${this.name}] Failed to cleanup external system data:`, error);
    }
  }

  /**
   * Disable external system integration
   */
  private async disableExternalSystemIntegration(): Promise<void> {
    try {
      console.log(`[${this.name}] Disabling external system integration`);
      
      // Example: Notify external system that integration is disabled
      // This ensures the external system knows not to expect auth events
      
      this.externalSystemAvailable = false;
      console.log(`[${this.name}] External system integration disabled`);
    } catch (error) {
      console.error(`[${this.name}] Failed to disable external system integration:`, error);
    }
  }

  /**
   * Log authentication event
   */
  private async logAuthenticationEvent(
    eventType: string, 
    user: User, 
    session?: Session
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        userId: user.id,
        username: user.username,
        sessionToken: session?.token?.substring(0, 10) + '...',
        source: this.name,
      };

      console.log(`[${this.name}] Auth event logged:`, logEntry);
      
      // Example: Send to logging service
      // await this.sendToLoggingService(logEntry);
    } catch (error) {
      console.error(`[${this.name}] Failed to log authentication event:`, error);
    }
  }

  /**
   * Send authentication notification
   */
  private async sendAuthenticationNotification(
    eventType: string, 
    user: User
  ): Promise<void> {
    try {
      console.log(`[${this.name}] Sending ${eventType} notification for:`, user.username);
      
      // Example: Send email, push notification, etc.
      // await this.sendNotification({
      //   type: eventType,
      //   user: user,
      //   timestamp: new Date(),
      // });
      
      // Simulate notification
      await new Promise(resolve => setTimeout(resolve, 25));
      
      console.log(`[${this.name}] Notification sent`);
    } catch (error) {
      console.error(`[${this.name}] Failed to send authentication notification:`, error);
    }
  }

  /**
   * Save user activity
   */
  private async saveUserActivity(user: User, activity: string): Promise<void> {
    try {
      console.log(`[${this.name}] Saving user activity:`, user.username, activity);
      
      // Example: Save to database or analytics service
      const activityRecord = {
        userId: user.id,
        username: user.username,
        activity,
        timestamp: new Date().toISOString(),
        source: this.name,
      };

      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 25));
      
      console.log(`[${this.name}] User activity saved:`, activityRecord);
    } catch (error) {
      console.error(`[${this.name}] Failed to save user activity:`, error);
    }
  }
}