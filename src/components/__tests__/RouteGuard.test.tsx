import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { RouteGuard, withRouteGuard } from '../RouteGuard';
import { useAuth } from '../../contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ConfigManager
jest.mock('../../lib/config', () => ({
  ConfigManager: {
    getAuthConfig: jest.fn(),
  },
}));

describe('RouteGuard', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockGetAuthConfig = ConfigManager.getAuthConfig as jest.MockedFunction<typeof ConfigManager.getAuthConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
    
    mockUsePathname.mockReturnValue('/dashboard');
    
    mockGetAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
        defaultRoute: "/",
    });
  });

  it('should render children when authentication is disabled', () => {
    mockGetAuthConfig.mockReturnValue({
      authEnabled: false,
      sessionTimeout: 3600000,
      rememberSidebar: true,
        defaultRoute: "/",
    });
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render children when requireAuth is false', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard requireAuth={false}>
        <div>Public Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render children when user is authenticated', () => {
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

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show loading state when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show authorization checking state before redirect', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Checking authorization...')).toBeInTheDocument();
  });

  it('should handle different pathnames correctly', async () => {
    mockUsePathname.mockReturnValue('/settings/profile');
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fsettings%2Fprofile');
    });
  });
});

describe('withRouteGuard HOC', () => {
  const TestComponent = () => <div>Test Component</div>;
  
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockGetAuthConfig = ConfigManager.getAuthConfig as jest.MockedFunction<typeof ConfigManager.getAuthConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
        defaultRoute: "/",
    });
  });

  it('should wrap component with RouteGuard', () => {
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

    const ProtectedComponent = withRouteGuard(TestComponent);
    
    render(<ProtectedComponent />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass requireAuth parameter correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    const PublicComponent = withRouteGuard(TestComponent, false);
    
    render(<PublicComponent />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should set correct displayName', () => {
    const ProtectedComponent = withRouteGuard(TestComponent);
    
    expect(ProtectedComponent.displayName).toBe('withRouteGuard(TestComponent)');
  });

  it('should handle component without displayName', () => {
    const AnonymousComponent = () => <div>Anonymous</div>;
    const ProtectedComponent = withRouteGuard(AnonymousComponent);
    
    expect(ProtectedComponent.displayName).toBe('withRouteGuard(AnonymousComponent)');
  });
});