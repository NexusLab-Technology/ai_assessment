'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types';

/**
 * Hook for managing login page state and interactions
 */
export function useLoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle login attempt
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setError(null);
    
    try {
      const success = await login(credentials);
      
      if (!success) {
        setError('Invalid username or password. Please try again.');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
      return false;
    }
  }, [login]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleLogin,
    loading,
    error,
    clearError,
  };
}