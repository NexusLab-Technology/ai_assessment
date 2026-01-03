'use client';

import React, { useState, useEffect } from 'react';
import { ApplicationShellProps, NavigationItem } from '@/types';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';
import { STORAGE_KEYS, DEFAULT_NAVIGATION } from '@/lib/constants';
import { isBrowser, safeParseJSON } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * ApplicationShell Component
 * Main layout container with sidebar integration, conditional rendering, and logout functionality
 */
export function ApplicationShell({ 
  children, 
  navigationItems = DEFAULT_NAVIGATION,
  showSidebar = true,
  className = '',
}: ApplicationShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Get authentication configuration with error handling
  let config;
  try {
    config = ConfigManager.getAuthConfig();
  } catch (error) {
    console.error('ConfigManager error in ApplicationShell, using default configuration:', error);
    // Fallback to default configuration
    config = {
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    };
  }
  
  // Use auth context (now always available)
  const { isAuthenticated, loading, logout } = useAuth();

  /**
   * Load sidebar state from localStorage
   */
  useEffect(() => {
    setIsMounted(true);
    
    if (!isBrowser() || !config.rememberSidebar) return;
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
      if (savedState) {
        const state = safeParseJSON(savedState, { isCollapsed: false });
        setSidebarCollapsed(state.isCollapsed);
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
  }, [config.rememberSidebar]);

  /**
   * Handle sidebar toggle
   */
  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  /**
   * Handle logout functionality
   */
  const handleLogout = async () => {
    try {
      // Call logout from auth context
      await logout();
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect to login page even if logout fails
      router.push('/login');
    }
  };

  /**
   * Determine if sidebar should be shown
   */
  const shouldShowSidebar = () => {
    // Don't show sidebar if explicitly disabled
    if (!showSidebar) return false;
    
    // If authentication is disabled, always show sidebar
    if (!config.authEnabled) return true;
    
    // If authentication is enabled, only show sidebar when authenticated
    return isAuthenticated;
  };

  /**
   * Render loading state
   */
  if (!isMounted || (config.authEnabled && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /**
   * Render application shell based on authentication state
   */
  const renderShell = () => {
    const showSidebarComponent = shouldShowSidebar();

    if (showSidebarComponent) {
      // Authenticated layout with sidebar - full height flex layout
      return (
        <div className={`h-screen flex bg-gray-50 ${className}`}>
          {/* Sidebar - fixed width, full height */}
          <div className="flex-shrink-0">
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggle={handleSidebarToggle}
              navigationItems={navigationItems}
              onLogout={config.authEnabled && isAuthenticated ? handleLogout : undefined}
            />
          </div>
          
          {/* Main content area - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      );
    } else {
      // Simple layout without sidebar (for login page, etc.)
      return (
        <div className={`min-h-screen bg-gray-50 ${className}`}>
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      );
    }
  };

  return renderShell();
}

/**
 * Higher-order component for wrapping pages with ApplicationShell
 */
export function withApplicationShell<P extends object>(
  Component: React.ComponentType<P>,
  shellProps?: Partial<ApplicationShellProps>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ApplicationShell {...shellProps}>
        <Component {...props} />
      </ApplicationShell>
    );
  };

  WrappedComponent.displayName = `withApplicationShell(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}