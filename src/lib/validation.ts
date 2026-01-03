import { LoginCredentials, User, Session } from '@/types';

/**
 * Validation utilities for authentication data
 */

/**
 * Validate login credentials
 */
export function validateLoginCredentials(credentials: LoginCredentials): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.username || credentials.username.trim().length === 0) {
    errors.push('Username is required');
  }

  if (!credentials.password || credentials.password.length === 0) {
    errors.push('Password is required');
  }

  if (credentials.username && credentials.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (credentials.password && credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user object
 */
export function validateUser(user: any): user is User {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    Array.isArray(user.roles) &&
    (user.email === undefined || typeof user.email === 'string') &&
    (user.lastLogin instanceof Date || typeof user.lastLogin === 'string')
  );
}

/**
 * Validate session object
 */
export function validateSession(session: any): session is Session {
  return (
    session &&
    typeof session === 'object' &&
    typeof session.token === 'string' &&
    session.token.length > 0 && // Token must not be empty
    typeof session.userId === 'string' &&
    session.userId.length > 0 && // UserId must not be empty
    (session.expiresAt instanceof Date || typeof session.expiresAt === 'string') &&
    (session.createdAt instanceof Date || typeof session.createdAt === 'string')
  );
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password meets security requirements
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain special characters');
  }

  return {
    isStrong: score >= 4,
    score,
    feedback,
  };
}