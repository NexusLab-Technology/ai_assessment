// Core authentication types
export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  lastLogin: Date;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Configuration types
export interface AuthConfig {
  authEnabled: boolean;
  sessionTimeout: number;
  rememberSidebar: boolean;
  defaultRoute: string;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: NavigationItem[];
}

export interface NavigationConfig {
  items: NavigationItem[];
  defaultCollapsed: boolean;
  showLabels: boolean;
  defaultRoute: string; // Default landing page route
}

// Sidebar types
export interface SidebarState {
  isCollapsed: boolean;
  isMobile: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  navigationItems: NavigationItem[];
  onLogout?: () => void;
}

// Application Shell types
export interface ApplicationShellProps {
  children: React.ReactNode;
  navigationItems?: NavigationItem[];
  showSidebar?: boolean;
  className?: string;
}

// Route Guard types
export interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

// Login Page types
export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

// Application State
export interface AppState {
  auth: AuthState;
  sidebar: SidebarState;
  navigation: NavigationConfig;
}

// External Authentication Provider types
export interface AuthProvider {
  name: string;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  refreshToken?: () => Promise<string | null>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Error types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'CONFIG_ERROR'
  | 'UNKNOWN_ERROR';

// Event types for authentication
export interface AuthEvent {
  type: 'LOGIN' | 'LOGOUT' | 'SESSION_EXPIRED' | 'AUTH_CHECK';
  timestamp: Date;
  user?: User;
  error?: AuthError;
}

// Hook types for external integration
export interface AuthHooks {
  onLogin?: (user: User) => void | Promise<void>;
  onLogout?: () => void | Promise<void>;
  onSessionExpired?: () => void | Promise<void>;
  onAuthError?: (error: AuthError) => void | Promise<void>;
}