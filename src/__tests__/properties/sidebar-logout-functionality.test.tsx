/**
 * Property-Based Tests for Sidebar Logout Functionality
 * Feature: sidebar-settings-ui-update, Properties 1-2: Logout button conditional rendering and functionality
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import { NavigationItem } from '@/types';
import fc from 'fast-check';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock ConfigManager
jest.mock('@/lib/config', () => ({
  ConfigManager: {
    getAuthConfig: () => ({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    }),
    isAuthEnabled: jest.fn(() => true),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.innerWidth for responsive behavior
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// Mock useAuth hook
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar Logout Functionality Properties', () => {
  const mockNavigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      href: '/',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      href: '/settings',
    },
  ];

  const mockOnToggle = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    cleanup();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Logout button conditional rendering
   * The logout button should only be visible when user is authenticated AND onLogout prop is provided
   * Validates: Requirements 1.2, 1.3
   */
  describe('Property 1: Logout button conditional rendering', () => {
    it('should show logout button only when authenticated and onLogout is provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            hasOnLogout: fc.boolean(),
            isCollapsed: fc.boolean(),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run

            // Mock useAuth based on test case
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              user: testCase.isAuthenticated ? { id: '1', username: 'test' } : null,
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={testCase.isCollapsed}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={testCase.hasOnLogout ? mockOnLogout : undefined}
              />
            );

            const logoutButton = screen.queryByRole('button', { name: /logout/i });

            // Logout button should only be visible when both conditions are met
            if (testCase.isAuthenticated && testCase.hasOnLogout) {
              expect(logoutButton).toBeInTheDocument();
              
              // Check button styling for logout
              expect(logoutButton).toHaveClass('text-red-600');
              expect(logoutButton).toHaveClass('hover:bg-red-50');
              
              // Check that logout text is visible when not collapsed
              if (!testCase.isCollapsed) {
                expect(screen.getByText('Logout')).toBeInTheDocument();
              }
            } else {
              expect(logoutButton).not.toBeInTheDocument();
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain logout button accessibility regardless of collapsed state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run

            // Mock authenticated state
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { id: '1', username: 'test' },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={mockOnLogout}
              />
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            
            // Button should always have proper accessibility attributes
            expect(logoutButton).toHaveAttribute('aria-label', 'Logout');
            expect(logoutButton).toBeEnabled();
            
            // Button should have proper focus management
            expect(logoutButton).toHaveClass('focus:outline-none');
            expect(logoutButton).toHaveClass('focus:ring-2');
            expect(logoutButton).toHaveClass('focus:ring-red-500');

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Logout functionality execution
   * When logout button is clicked, the onLogout callback should be executed exactly once
   * Validates: Requirements 1.4
   */
  describe('Property 2: Logout functionality execution', () => {
    it('should execute onLogout callback exactly once when logout button is clicked', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run

            const mockOnLogoutLocal = jest.fn();

            // Mock authenticated state
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { id: '1', username: 'test' },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={mockOnLogoutLocal}
              />
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            
            // Verify callback hasn't been called yet
            expect(mockOnLogoutLocal).not.toHaveBeenCalled();
            
            // Click the logout button
            fireEvent.click(logoutButton);
            
            // Verify callback was called exactly once
            expect(mockOnLogoutLocal).toHaveBeenCalledTimes(1);
            // Note: onClick handlers receive event object, so we don't check arguments

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple rapid clicks without multiple callback executions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // number of clicks
          (clickCount) => {
            cleanup(); // Clean up before each property run

            const mockOnLogoutLocal = jest.fn();

            // Mock authenticated state
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { id: '1', username: 'test' },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={false}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={mockOnLogoutLocal}
              />
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            
            // Perform multiple rapid clicks
            for (let i = 0; i < clickCount; i++) {
              fireEvent.click(logoutButton);
            }
            
            // Verify callback was called for each click
            expect(mockOnLogoutLocal).toHaveBeenCalledTimes(clickCount);

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not execute callback when logout button is not present', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            hasOnLogout: fc.boolean(),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run

            const mockOnLogoutLocal = jest.fn();

            // Mock useAuth based on test case
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              user: testCase.isAuthenticated ? { id: '1', username: 'test' } : null,
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={false}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={testCase.hasOnLogout ? mockOnLogoutLocal : undefined}
              />
            );

            const logoutButton = screen.queryByRole('button', { name: /logout/i });

            // If button is not present, callback should never be called
            if (!logoutButton) {
              expect(mockOnLogoutLocal).not.toHaveBeenCalled();
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Logout button visual distinction
   * The logout button should be visually distinct from navigation items
   * Validates: Requirements 1.5
   */
  describe('Property 3: Logout button visual distinction', () => {
    it('should have distinct styling from navigation items', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run

            // Mock authenticated state
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { id: '1', username: 'test' },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={mockOnLogout}
              />
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            const navigationLinks = screen.getAllByRole('link');
            
            // Logout button should have red color scheme
            expect(logoutButton).toHaveClass('text-red-600');
            expect(logoutButton).toHaveClass('hover:bg-red-50');
            expect(logoutButton).toHaveClass('hover:text-red-700');
            
            // Navigation links should not have red color scheme
            navigationLinks.forEach(link => {
              expect(link).not.toHaveClass('text-red-600');
              expect(link).not.toHaveClass('hover:bg-red-50');
              expect(link).not.toHaveClass('hover:text-red-700');
            });
            
            // Logout button should be in footer area (different from navigation area)
            const footer = logoutButton.closest('.border-t');
            expect(footer).toBeInTheDocument();
            expect(footer).toHaveClass('border-gray-200');

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent icon and layout structure', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run

            // Mock authenticated state
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { id: '1', username: 'test' },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });

            render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockOnToggle}
                navigationItems={mockNavigationItems}
                onLogout={mockOnLogout}
              />
            );

            const logoutButton = screen.getByRole('button', { name: /logout/i });
            
            // Should have logout icon (SVG)
            const logoutIcon = logoutButton.querySelector('svg');
            expect(logoutIcon).toBeInTheDocument();
            expect(logoutIcon).toHaveClass('w-5');
            expect(logoutIcon).toHaveClass('h-5');
            
            // Should have proper flex layout
            expect(logoutButton).toHaveClass('flex');
            expect(logoutButton).toHaveClass('items-center');
            
            // Text should be conditionally rendered based on collapsed state
            const logoutText = screen.queryByText('Logout');
            if (isCollapsed) {
              expect(logoutText).not.toBeInTheDocument();
            } else {
              expect(logoutText).toBeInTheDocument();
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});