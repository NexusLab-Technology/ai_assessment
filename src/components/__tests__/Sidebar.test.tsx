import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';
import { NavigationItem } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock ConfigManager
jest.mock('../../lib/config', () => ({
  ConfigManager: {
    getAuthConfig: jest.fn(() => ({
      rememberSidebar: true,
      authEnabled: true,
      sessionTimeout: 3600000,
    })),
    isAuthEnabled: jest.fn(() => true),
  },
}));

// Get the mocked ConfigManager for test manipulation
const { ConfigManager: mockConfigManager } = jest.requireMock('../../lib/config');

// Mock useAuth hook
const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar', () => {
  const mockOnToggle = jest.fn();
  
  const defaultNavigationItems: NavigationItem[] = [
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
  ];

  const defaultProps = {
    isCollapsed: false,
    onToggle: mockOnToggle,
    navigationItems: defaultNavigationItems,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default authenticated state with auth enabled
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    
    // Default auth enabled
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render sidebar with navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    // Settings is now in footer, not main nav
    expect(screen.getByText('Settings')).toBeInTheDocument(); // Should be in footer
    
    // Icons should be visible
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings icon in footer
  });

  it('should render collapsed sidebar', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    // Navigation title should not be visible when collapsed
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    
    // Icons should still be visible
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
    
    // Labels should not be visible when collapsed
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should handle toggle button click', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    await user.click(toggleButton);
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show correct toggle button label based on collapsed state', () => {
    const { rerender } = render(<Sidebar {...defaultProps} isCollapsed={false} />);
    
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    
    rerender(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('should render navigation links with correct hrefs', () => {
    render(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    const profileLink = screen.getByRole('link', { name: /profile/i });
    
    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('should handle empty navigation items', () => {
    render(<Sidebar {...defaultProps} navigationItems={[]} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should expand/collapse nested navigation items', async () => {
    // Create navigation items with nested structure for this test
    const nestedNavigationItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '🏠',
        href: '/',
      },
      {
        id: 'admin',
        label: 'Admin',
        icon: '⚙️',
        href: '/admin',
        children: [
          {
            id: 'general',
            label: 'General',
            icon: '📋',
            href: '/admin/general',
          },
        ],
      },
    ];

    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} navigationItems={nestedNavigationItems} />);
    
    // Admin should be a button (has children)
    const adminButton = screen.getByRole('button', { name: /admin/i });
    expect(adminButton).toBeInTheDocument();
    
    // General should not be visible initially
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    
    // Click to expand
    await user.click(adminButton);
    
    // General should now be visible
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('should not show nested items when sidebar is collapsed', () => {
    // Create navigation items with nested structure for this test
    const nestedNavigationItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '🏠',
        href: '/',
      },
      {
        id: 'admin',
        label: 'Admin',
        icon: '⚙️',
        href: '/admin',
        children: [
          {
            id: 'general',
            label: 'General',
            icon: '📋',
            href: '/admin/general',
          },
        ],
      },
    ];

    render(<Sidebar {...defaultProps} isCollapsed={true} navigationItems={nestedNavigationItems} />);
    
    // Should have Settings icon in footer (1) + Admin icon in nav (1) = 2 total
    expect(screen.getAllByText('⚙️')).toHaveLength(2);
    expect(screen.queryByText('General')).not.toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    // The mock returns '/' so dashboard should be active
    render(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-indigo-100');
    expect(dashboardLink).toHaveClass('text-indigo-700');
  });

  it('should render app version in footer', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('App v1.0.0')).toBeInTheDocument();
  });

  it('should not show footer version when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    expect(screen.queryByText('App v1.0.0')).not.toBeInTheDocument();
  });

  it('should save sidebar state to localStorage when toggling', async () => {
    const user = userEvent.setup();
    const mockSetItem = jest.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: mockSetItem,
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    
    render(<Sidebar {...defaultProps} />);
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    await user.click(toggleButton);
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith(
      'sidebar_state',
      expect.stringContaining('isCollapsed')
    );
  });

  it('should hide Settings when not authenticated', () => {
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Settings should not be visible when not authenticated
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
    
    // Icons should be visible for main nav items
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    
    // Settings icon should not be visible
    expect(screen.queryByText('⚙️')).not.toBeInTheDocument();
  });

  it('should show Settings when authenticated and auth is enabled', () => {
    // Mock authenticated state with auth enabled (default)
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Settings should be visible when authenticated and auth enabled
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    
    // All icons should be visible
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings icon in footer
  });

  it('should hide Settings when authentication is disabled', () => {
    // Mock authentication disabled
    mockConfigManager.isAuthEnabled.mockReturnValue(false);
    
    // Mock authenticated state (but auth is disabled)
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Settings should not be visible when auth is disabled
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
    
    // Icons should be visible for main nav items
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    
    // Settings icon should not be visible
    expect(screen.queryByText('⚙️')).not.toBeInTheDocument();
    
    // Logout button should also not be visible when auth is disabled
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});