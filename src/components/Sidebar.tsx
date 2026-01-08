'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarProps, NavigationItem } from '@/types';
import { ConfigManager } from '@/lib/config';
import { STORAGE_KEYS, USER_ACTION_NAVIGATION } from '@/lib/constants';
import { isBrowser, safeStringifyJSON } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Main Navigation Sidebar Component
 * 
 * Main application navigation sidebar (Navbar) located on the left side.
 * This is the primary navigation component for the entire application.
 * 
 * Features:
 * - Collapsible navigation sidebar with responsive behavior
 * - Active route highlighting
 * - State persistence
 * - User actions (Settings, Logout) when authenticated
 * 
 * Used by: ApplicationShell (App Layout)
 */
export function Sidebar({ isCollapsed, onToggle, navigationItems, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Check if authentication is enabled and user is authenticated
  const isAuthEnabled = ConfigManager.isAuthEnabled();
  const shouldShowUserActions = isAuthEnabled && isAuthenticated;

  /**
   * Check if we're on mobile
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    if (isBrowser()) {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  /**
   * Initialize expanded items based on active paths
   */
  useEffect(() => {
    const activeItems = new Set<string>();
    
    const findActiveItems = (items: NavigationItem[], parentId?: string) => {
      items.forEach(item => {
        if (item.href === pathname) {
          activeItems.add(item.id);
          if (parentId) activeItems.add(parentId);
        }
        if (item.children) {
          findActiveItems(item.children, item.id);
        }
      });
    };
    
    findActiveItems(navigationItems);
    setExpandedItems(activeItems);
  }, [pathname, navigationItems]);

  /**
   * Save sidebar state to localStorage
   */
  const saveSidebarState = useCallback((collapsed: boolean) => {
    if (!isBrowser()) return;
    
    const config = ConfigManager.getAuthConfig();
    if (config.rememberSidebar) {
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, safeStringifyJSON({ isCollapsed: collapsed }));
      } catch (error) {
        console.error('Error saving sidebar state:', error);
      }
    }
  }, []);

  /**
   * Handle toggle with state persistence
   */
  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    onToggle();
    saveSidebarState(newCollapsed);
  }, [isCollapsed, onToggle, saveSidebarState]);

  /**
   * Check if navigation item is active
   */
  const isActiveItem = useCallback((item: NavigationItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => isActiveItem(child));
    }
    return false;
  }, [pathname]);

  /**
   * Toggle expanded state for navigation item
   */
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  /**
   * Render navigation item
   */
  const renderNavigationItem = useCallback((item: NavigationItem, level: number = 0) => {
    const isActive = isActiveItem(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    const itemClasses = `
      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
      ${isActive 
        ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
      ${level > 0 ? 'ml-4' : ''}
    `.trim();

    const iconClasses = `
      flex-shrink-0 w-5 h-5 mr-3 transition-transform duration-200
      ${isActive ? 'text-indigo-500' : 'text-gray-400'}
    `.trim();

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={itemClasses}
            aria-expanded={isExpanded}
          >
            <span className={iconClasses}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <span className={`ml-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </>
            )}
          </button>
        ) : (
          <Link 
            href={item.href} 
            className={itemClasses}
            prefetch={true}
            scroll={false}
          >
            <span className={iconClasses}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span>{item.label}</span>
            )}
          </Link>
        )}
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [isCollapsed, isActiveItem, expandedItems, toggleExpanded]);

  /**
   * Handle mobile overlay click
   */
  const handleOverlayClick = useCallback(() => {
    if (isMobile && !isCollapsed) {
      handleToggle();
    }
  }, [isMobile, isCollapsed, handleToggle]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobile ? 
            `fixed inset-y-0 left-0 z-30 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}` : 
            'relative'
          }
        `.trim()}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold text-gray-900">
              Navigation
            </h1>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="w-5 h-5 block">
              {isCollapsed ? '▶' : '◀'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          {/* User Actions - Settings - only show when auth is enabled and user is authenticated */}
          {shouldShowUserActions && USER_ACTION_NAVIGATION.map(item => (
            <div key={item.id} className="mb-3">
              <Link
                href={item.href}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${pathname === item.href 
                    ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `.trim()}
              >
                <span className={`
                  flex-shrink-0 w-5 h-5 mr-3 transition-transform duration-200
                  ${pathname === item.href ? 'text-indigo-500' : 'text-gray-400'}
                `.trim()}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </div>
          ))}

          {/* Logout button - only show when auth is enabled and user is authenticated */}
          {shouldShowUserActions && onLogout && (
            <div className="mb-3">
              <button
                onClick={onLogout}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                  text-red-600 hover:bg-red-50 hover:text-red-700
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                `.trim()}
                aria-label="Logout"
              >
                <span className="flex-shrink-0 w-5 h-5 mr-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                {!isCollapsed && <span>Logout</span>}
              </button>
            </div>
          )}
          
          {/* App version */}
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              App v1.0.0
            </div>
          )}
        </div>
      </div>
    </>
  );
}