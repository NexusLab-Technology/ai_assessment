'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RouteGuardProps } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

/**
 * RouteGuard Component
 * Protects routes based on authentication state and configuration
 */
export function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Check if authentication is enabled first with error handling
  let config;
  try {
    config = ConfigManager.getAuthConfig();
  } catch (error) {
    console.error('ConfigManager error in RouteGuard, using default configuration:', error);
    // Fallback to default configuration
    config = {
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    };
  }
  
  // Use auth context (now always available)
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const checkAuthorization = () => {
      // If authentication is disabled globally, allow access
      if (!config.authEnabled) {
        setIsAuthorized(true);
        return;
      }

      // If this route doesn't require auth, allow access
      if (!requireAuth) {
        setIsAuthorized(true);
        return;
      }

      // If still loading, wait
      if (loading) {
        return;
      }

      // If authenticated, allow access
      if (isAuthenticated) {
        setIsAuthorized(true);
        return;
      }

      // Not authenticated and auth is required - redirect to login
      setIsAuthorized(false);
      
      // Store the intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    };

    checkAuthorization();
  }, [isAuthenticated, loading, requireAuth, pathname, router, config.authEnabled]);

  // If authentication is disabled, render children immediately
  if (!config.authEnabled) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication (only when auth is enabled)
  // Use minimal loading to prevent flash - only show if auth is actually enabled and we're waiting
  if (config.authEnabled && loading && requireAuth) {
    // Return null to prevent flash - let ApplicationShell handle the layout
    return null;
  }

  // Show loading state while determining authorization (only when auth is enabled)
  // Use minimal loading to prevent flash
  if (config.authEnabled && !isAuthorized && requireAuth && !loading) {
    // Return null to prevent flash - redirect will happen
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true
) {
  const ProtectedComponent = (props: P) => {
    return (
      <RouteGuard requireAuth={requireAuth}>
        <Component {...props} />
      </RouteGuard>
    );
  };

  ProtectedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
}