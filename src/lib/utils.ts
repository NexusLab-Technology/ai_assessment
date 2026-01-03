/**
 * Utility functions for the authentication framework
 */

/**
 * Generate a random session token
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Create a session expiration date
 */
export function createSessionExpiration(timeoutMs: number): Date {
  return new Date(Date.now() + timeoutMs);
}

/**
 * Safely parse JSON from localStorage
 */
export function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify JSON for localStorage
 */
export function safeStringifyJSON(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

/**
 * Check if we're running in the browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}