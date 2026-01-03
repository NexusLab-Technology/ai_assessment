'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginPage } from '@/components/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

/**
 * Login Page Content Component
 * Handles user authentication and redirects
 */
function LoginPageContent() {
  const { login, isAuthenticated, loading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Get return URL from query parameters, fallback to default route
  const defaultRoute = ConfigManager.getDefaultRoute();
  const returnUrl = searchParams.get('returnUrl') || defaultRoute;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, loading, router, returnUrl]);

  // Check if authentication is enabled with error handling
  let config;
  try {
    config = ConfigManager.getAuthConfig();
  } catch (error) {
    console.error('ConfigManager error in Login page, using default configuration:', error);
    // Fallback to default configuration
    config = {
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    };
  }
  
  // If authentication is disabled, redirect to default route
  useEffect(() => {
    if (!config.authEnabled) {
      router.push(defaultRoute);
    }
  }, [config.authEnabled, router, defaultRoute]);

  /**
   * Handle login form submission
   */
  const handleLogin = async (credentials: { username: string; password: string }): Promise<boolean> => {
    setIsLoggingIn(true);

    try {
      const success = await login(credentials);
      
      if (success) {
        // Login successful - don't redirect immediately, let the useEffect handle it
        // This prevents race conditions with authentication state updates
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login page if authentication is disabled
  if (!config.authEnabled) {
    return null;
  }

  // Don't render login page if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      loading={isLoggingIn}
      error={error || null}
    />
  );
}

/**
 * Login Page Component with Suspense boundary
 */
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}