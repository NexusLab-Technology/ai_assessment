import {
  validateLoginCredentials,
  validateUser,
  validateSession,
  sanitizeInput,
  validateEmail,
  validatePasswordStrength,
} from '../validation';
import { User, Session } from '@/types';

describe('Validation utilities', () => {
  describe('validateLoginCredentials', () => {
    it('should validate correct credentials', () => {
      const credentials = { username: 'testuser', password: 'password123' };
      const result = validateLoginCredentials(credentials);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty username', () => {
      const credentials = { username: '', password: 'password123' };
      const result = validateLoginCredentials(credentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username is required');
    });

    it('should reject empty password', () => {
      const credentials = { username: 'testuser', password: '' };
      const result = validateLoginCredentials(credentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject short username', () => {
      const credentials = { username: 'ab', password: 'password123' };
      const result = validateLoginCredentials(credentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('should reject short password', () => {
      const credentials = { username: 'testuser', password: '12345' };
      const result = validateLoginCredentials(credentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });
  });

  describe('validateUser', () => {
    it('should validate correct user object', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        lastLogin: new Date(),
      };
      
      expect(validateUser(user)).toBe(true);
    });

    it('should validate user without email', () => {
      const user = {
        id: '123',
        username: 'testuser',
        roles: ['user'],
        lastLogin: new Date(),
      };
      
      expect(validateUser(user)).toBe(true);
    });

    it('should reject invalid user object', () => {
      const invalidUser = {
        id: 123, // Should be string
        username: 'testuser',
        roles: ['user'],
        lastLogin: new Date(),
      };
      
      expect(validateUser(invalidUser)).toBe(false);
    });
  });

  describe('validateSession', () => {
    it('should validate correct session object', () => {
      const session: Session = {
        token: 'abc123',
        userId: '123',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };
      
      expect(validateSession(session)).toBe(true);
    });

    it('should reject invalid session object', () => {
      const invalidSession = {
        token: 'abc123',
        userId: 123, // Should be string
        expiresAt: new Date(),
        createdAt: new Date(),
      };
      
      expect(validateSession(invalidSession)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace', () => {
      const input = '  test input  ';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('test input');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      
      expect(result.isStrong).toBe(true);
      expect(result.score).toBe(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = validatePasswordStrength('weak');
      
      expect(result.isStrong).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });
});