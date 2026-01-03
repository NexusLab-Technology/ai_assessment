import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { ApplicationShell, withApplicationShell } from '../ApplicationShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';
import { NavigationItem } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    getAuthConfig: jest.fn(),
    isAuthEnabled: jest.fn(),
    resetConfig: jest.fn(),
  },
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

// Mock navigation items
const mockNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '🏠',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
];

/**
 * Test wrapper component with AuthProvider
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('ApplicationShell', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default config
    mockConfigManager.getAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    });
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  /**
   * Property 9: Authentication UI conditional rendering
   * For any authentication configuration, when authentication is disabled, 
   * no login-related UI components should be rendered
   * **Validates: Requirements 1.4**
   */
  describe('Property 9: Authentication UI conditional rendering', () => {
    it('should not render login-related UI components when authentication is disabled', () => {
      // Test with authentication disabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      const { container } = render(
        <ApplicationShell showSidebar={true} navigationItems={mockNavigationItems}>
          <div data-testid="app-content">Test Content</div>
        </ApplicationShell>
      );

      // Property assertion: When authentication is disabled, no login-related UI should be rendered
      // Should not show authentication loading states
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
      
      // Should show main content directly (no authentication checks)
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      
      // Should not have any authentication-related text or elements
      expect(container).not.toHaveTextContent('Loading...');
      expect(container).not.toHaveTextContent('Sign in');
      expect(container).not.toHaveTextContent('Login');
      expect(container).not.toHaveTextContent('Authentication');
      
      // Should render the application shell without authentication barriers
      expect(container.querySelector('main')).toBeInTheDocument();

      // Should show sidebar when auth is disabled (no authentication barrier)
      const hasSidebarLayout = 
        container.querySelector('.h-screen.flex') && 
        container.querySelector('.flex-shrink-0');
      expect(hasSidebarLayout).toBeTruthy();
    });

    it('should not show sidebar when showSidebar is false and auth is disabled', () => {
      // Test with authentication disabled and sidebar disabled
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: false,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(false);

      const { container } = render(
        <ApplicationShell showSidebar={false} navigationItems={mockNavigationItems}>
          <div data-testid="app-content">Test Content</div>
        </ApplicationShell>
      );

      // Should show main content
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      
      // Should NOT have sidebar layout classes when sidebar is disabled
      const hasSidebarLayout = 
        container.querySelector('.h-screen.flex') && 
        container.querySelector('.flex-shrink-0');
      expect(hasSidebarLayout).toBeFalsy();
    });

    it('should handle authentication enabled scenarios correctly', () => {
      // Test with authentication enabled and authenticated user
      mockConfigManager.getAuthConfig.mockReturnValue({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
      mockConfigManager.isAuthEnabled.mockReturnValue(true);

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
          lastLogin: new Date(),
        },
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { container } = render(
        <TestWrapper>
          <ApplicationShell showSidebar={true} navigationItems={mockNavigationItems}>
            <div data-testid="app-content">Application Content</div>
          </ApplicationShell>
        </TestWrapper>
      );

      // Should render application content for authenticated users
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      
      // Should show sidebar when authenticated
      const hasSidebarLayout = 
        container.querySelector('.h-screen.flex') && 
        container.querySelector('.flex-shrink-0');
      expect(hasSidebarLayout).toBeTruthy();
    });
  });

  describe('Unit Tests', () => {
    describe('Basic Rendering', () => {
      it('should render children correctly', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        render(
          <TestWrapper>
            <ApplicationShell>
              <div data-testid="test-child">Test Child</div>
            </ApplicationShell>
          </TestWrapper>
        );

        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });

      it('should apply custom className', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const { container } = render(
          <TestWrapper>
            <ApplicationShell className="custom-class">
              <div>Test Content</div>
            </ApplicationShell>
          </TestWrapper>
        );

        expect(container.querySelector('.custom-class')).toBeInTheDocument();
      });

      it('should render with default navigation items when none provided', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        render(
          <TestWrapper>
            <ApplicationShell showSidebar={true}>
              <div data-testid="content">Content</div>
            </ApplicationShell>
          </TestWrapper>
        );

        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    describe('Authentication Mode Rendering', () => {
      it('should render simple layout when authentication is disabled', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const { container } = render(
          <ApplicationShell showSidebar={true}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should render main content
        expect(screen.getByTestId('content')).toBeInTheDocument();
        
        // Should have main element
        expect(container.querySelector('main')).toBeInTheDocument();
        
        // Should have sidebar layout classes when showSidebar is true
        const hasSidebarLayout = 
          container.querySelector('.h-screen.flex') && 
          container.querySelector('.flex-shrink-0');
        expect(hasSidebarLayout).toBeTruthy();
      });

      it('should render simple layout without sidebar when showSidebar is false', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const { container } = render(
          <ApplicationShell showSidebar={false}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should render main content
        expect(screen.getByTestId('content')).toBeInTheDocument();
        
        // Should have main element
        expect(container.querySelector('main')).toBeInTheDocument();
        
        // Should NOT have sidebar layout classes
        const hasSidebarLayout = 
          container.querySelector('.h-screen.flex') && 
          container.querySelector('.flex-shrink-0');
        expect(hasSidebarLayout).toBeFalsy();
      });

      it('should render loading state when authentication is enabled and loading', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: true,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        // Mock useAuth to return loading state
        mockUseAuth.mockReturnValue({
          isAuthenticated: false,
          user: null,
          loading: true,
          login: jest.fn(),
          logout: jest.fn(),
          checkAuth: jest.fn(),
        });

        const { container } = render(
          <TestWrapper>
            <ApplicationShell>
              <div data-testid="content">Test Content</div>
            </ApplicationShell>
          </TestWrapper>
        );

        // Should show loading spinner
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        
        // Should not show main content while loading
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      });

      it('should render authenticated layout when user is authenticated', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: true,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        // Mock useAuth to return authenticated state
        mockUseAuth.mockReturnValue({
          isAuthenticated: true,
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['user'],
            lastLogin: new Date(),
          },
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
          checkAuth: jest.fn(),
        });

        const { container } = render(
          <TestWrapper>
            <ApplicationShell showSidebar={true}>
              <div data-testid="content">Test Content</div>
            </ApplicationShell>
          </TestWrapper>
        );

        // Should render main content
        expect(screen.getByTestId('content')).toBeInTheDocument();
        
        // Should have sidebar layout when authenticated
        const hasSidebarLayout = 
          container.querySelector('.h-screen.flex') && 
          container.querySelector('.flex-shrink-0');
        expect(hasSidebarLayout).toBeTruthy();
      });

      it('should not show sidebar when authentication is enabled but user is not authenticated', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: true,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        // Mock useAuth to return unauthenticated state
        mockUseAuth.mockReturnValue({
          isAuthenticated: false,
          user: null,
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
          checkAuth: jest.fn(),
        });

        const { container } = render(
          <TestWrapper>
            <ApplicationShell showSidebar={true}>
              <div data-testid="content">Test Content</div>
            </ApplicationShell>
          </TestWrapper>
        );

        // Should render main content
        expect(screen.getByTestId('content')).toBeInTheDocument();
        
        // Should NOT have sidebar layout when not authenticated
        const hasSidebarLayout = 
          container.querySelector('.h-screen.flex') && 
          container.querySelector('.flex-shrink-0');
        expect(hasSidebarLayout).toBeFalsy();
      });
    });

    describe('Sidebar Integration', () => {
      it('should handle sidebar state persistence when rememberSidebar is enabled', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        // Mock localStorage with saved sidebar state
        const mockGetItem = jest.fn().mockReturnValue('{"isCollapsed":true}');
        Object.defineProperty(window, 'localStorage', {
          value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
          writable: true,
        });

        render(
          <ApplicationShell showSidebar={true}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should attempt to load from localStorage
        expect(mockGetItem).toHaveBeenCalledWith('sidebar_state');
      });

      it('should not load sidebar state when rememberSidebar is disabled', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: false,
        defaultRoute: "/",
        });

        const mockGetItem = jest.fn();
        Object.defineProperty(window, 'localStorage', {
          value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
          writable: true,
        });

        render(
          <ApplicationShell showSidebar={true}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should not attempt to load from localStorage
        expect(mockGetItem).not.toHaveBeenCalled();
      });

      it('should handle localStorage errors gracefully', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        // Mock localStorage to throw error
        const mockGetItem = jest.fn().mockImplementation(() => {
          throw new Error('localStorage error');
        });
        Object.defineProperty(window, 'localStorage', {
          value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
          writable: true,
        });

        // Mock console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        render(
          <ApplicationShell showSidebar={true}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should handle error gracefully
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('Error loading sidebar state:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      it('should use custom navigation items when provided', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const customNavItems: NavigationItem[] = [
          {
            id: 'custom',
            label: 'Custom Item',
            href: '/custom',
            icon: '🔧',
          },
        ];

        render(
          <ApplicationShell showSidebar={true} navigationItems={customNavItems}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    describe('Responsive Layout', () => {
      it('should apply responsive classes for sidebar layout', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const { container } = render(
          <ApplicationShell showSidebar={true}>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should have responsive flex layout for sidebar
        const mainContent = container.querySelector('.flex-1.flex.flex-col');
        expect(mainContent).toBeInTheDocument();
      });

      it('should have proper container structure', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const { container } = render(
          <ApplicationShell>
            <div data-testid="content">Test Content</div>
          </ApplicationShell>
        );

        // Should have main element
        expect(container.querySelector('main')).toBeInTheDocument();
        
        // Should have max-width container
        expect(container.querySelector('.max-w-7xl')).toBeInTheDocument();
        
        // Should have proper padding classes
        expect(container.querySelector('.py-6')).toBeInTheDocument();
      });
    });

    describe('Higher-Order Component', () => {
      it('should create wrapped component with withApplicationShell', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const TestComponent = () => <div data-testid="wrapped-content">Wrapped Content</div>;
        const WrappedComponent = withApplicationShell(TestComponent);

        render(<WrappedComponent />);
        expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
      });

      it('should pass shell props to withApplicationShell', () => {
        mockConfigManager.getAuthConfig.mockReturnValue({
          authEnabled: false,
          sessionTimeout: 3600000,
          rememberSidebar: true,
          defaultRoute: "/",
        });

        const TestComponent = () => <div data-testid="wrapped-content">Wrapped Content</div>;
        const { withApplicationShell } = require('../ApplicationShell');
        const WrappedComponent = withApplicationShell(TestComponent, { 
          showSidebar: false,
          className: 'wrapped-shell' 
        });

        const { container } = render(<WrappedComponent />);
        
        expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
        expect(container.querySelector('.wrapped-shell')).toBeInTheDocument();
      });

      it('should set correct displayName for wrapped component', () => {
        const TestComponent = () => <div>Test</div>;
        TestComponent.displayName = 'TestComponent';
        
        const { withApplicationShell } = require('../ApplicationShell');
        const WrappedComponent = withApplicationShell(TestComponent);
        
        expect(WrappedComponent.displayName).toBe('withApplicationShell(TestComponent)');
      });

      it('should handle component without displayName', () => {
        const TestComponent = () => <div>Test</div>;
        
        const { withApplicationShell } = require('../ApplicationShell');
        const WrappedComponent = withApplicationShell(TestComponent);
        
        expect(WrappedComponent.displayName).toBe('withApplicationShell(TestComponent)');
      });
    });
  });
});