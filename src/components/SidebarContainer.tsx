'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { NavigationItem, SidebarState } from '@/types';
import { ConfigManager } from '@/lib/config';
import { STORAGE_KEYS } from '@/lib/constants';
import { isBrowser, safeParseJSON } from '@/lib/utils';

/**
 * Default navigation items
 */
const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    href: '/',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    href: '/profile',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    href: '/settings',
    children: [
      {
        id: 'general',
        label: 'General',
        icon: '📋',
        href: '/settings/general',
      },
      {
        id: 'security',
        label: 'Security',
        icon: '🔒',
        href: '/settings/security',
      },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    icon: '❓',
    href: '/help',
  },
];

/**
 * SidebarContainer Props
 */
interface SidebarContainerProps {
  navigationItems?: NavigationItem[];
  children: React.ReactNode;
}

/**
 * SidebarContainer Component
 * Manages sidebar state and provides navigation context
 */
export function SidebarContainer({ 
  navigationItems = DEFAULT_NAVIGATION_ITEMS,
  children 
}: SidebarContainerProps) {
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isCollapsed: false,
    isMobile: false,
  });

  /**
   * Load sidebar state from localStorage
   */
  const loadSidebarState = useCallback((): Partial<SidebarState> => {
    if (!isBrowser()) return {};
    
    const config = ConfigManager.getAuthConfig();
    if (!config.rememberSidebar) return {};
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
      if (savedState) {
        const parsed = safeParseJSON<Partial<SidebarState>>(savedState, {});
        return parsed;
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
    
    return {};
  }, []);

  /**
   * Initialize sidebar state
   */
  useEffect(() => {
    const savedState = loadSidebarState();
    const config = ConfigManager.getAuthConfig();
    
    setSidebarState(prev => ({
      ...prev,
      isCollapsed: savedState.isCollapsed ?? false,
      isMobile: isBrowser() ? window.innerWidth < 768 : false,
    }));
  }, [loadSidebarState]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    if (!isBrowser()) return;

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setSidebarState(prev => ({
        ...prev,
        isMobile,
        // Auto-collapse on mobile
        isCollapsed: isMobile ? true : prev.isCollapsed,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setSidebarState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={sidebarState.isCollapsed}
        onToggle={toggleSidebar}
        navigationItems={navigationItems}
      />
      
      {/* Main content area */}
      <div 
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${sidebarState.isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `.trim()}
      >
        {children}
      </div>
    </div>
  );
}