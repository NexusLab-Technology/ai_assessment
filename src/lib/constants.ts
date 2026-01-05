/**
 * Authentication framework constants
 */

import { NavigationItem } from '@/types';

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_DATA: 'session_data',
  SIDEBAR_STATE: 'sidebar_state',
} as const;

// Default configuration values
export const DEFAULT_CONFIG = {
  SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
  AUTH_ENABLED: true,
  REMEMBER_SIDEBAR: true,
  SIDEBAR_COLLAPSED: false,
  DEFAULT_ROUTE: '/', // Home as default landing page
} as const;

// Authentication error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Authentication event types
export const AUTH_EVENTS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  AUTH_CHECK: 'AUTH_CHECK',
} as const;

// Default navigation items (main navigation - only Home)
export const DEFAULT_NAVIGATION: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    href: '/',
  },
  {
    id: 'ai-assessment',
    label: 'AI Assessment',
    icon: '🤖',
    href: '/ai-assessment',
  },
  {
    id: 'company-settings',
    label: 'Company Settings',
    icon: '🏢',
    href: '/company-settings',
  },
];

// User action navigation items (for footer section)
export const USER_ACTION_NAVIGATION: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    href: '/settings',
  },
];

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;