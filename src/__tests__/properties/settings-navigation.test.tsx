/**
 * Property-Based Tests for Settings Navigation Behavior
 * Feature: sidebar-settings-ui-update, Property 3: Settings navigation behavior
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ApplicationShell } from '@/components/ApplicationShell';
import { NavigationItem } from '@/types';
import fc from 'fast-check';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
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

// Get the mocked ConfigManager for test manipulation
const { ConfigManager: mockConfigManager } = jest.requireMock('@/lib/config');

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

describe('Settings Navigation Properties', () => {
  const mockNavigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      href: '/',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    cleanup();
    
    // Default authenticated state with auth enabled
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] },
      loading: false,
      error: undefined,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });
    
    // Default auth enabled
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * Property 3: Settings navigation behavior
   * Settings navigation should only be visible when auth is enabled and user is authenticated
   * Validates: Requirements 2.3
   */
  describe('Property 3: Settings navigation behavior', () => {
    it('should display Settings navigation item with correct properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            isCollapsed: fc.boolean(),
            showSidebar: fc.boolean(),
            isAuthEnabled: fc.boolean(),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run

            // Mock useAuth based on test case
            mockUseAuth.mockReturnValue({
              isAuthenticated: testCase.isAuthenticated,
              user: testCase.isAuthenticated ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });
            
            // Mock auth enabled state
            mockConfigManager.isAuthEnabled.mockReturnValue(testCase.isAuthEnabled);

            // Mock localStorage to return collapsed state
            mockLocalStorage.getItem.mockReturnValue(
              JSON.stringify({ isCollapsed: testCase.isCollapsed })
            );

            render(
              <ApplicationShell 
                navigationItems={mockNavigationItems}
                showSidebar={testCase.showSidebar}
              >
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Settings navigation should only be present when auth enabled, authenticated and sidebar is shown
            const shouldShowSidebar = testCase.showSidebar && testCase.isAuthEnabled && testCase.isAuthenticated;
            
            if (shouldShowSidebar) {
              // When collapsed, we need to find by href instead of name since text is hidden
              const settingsLink = testCase.isCollapsed 
                ? screen.getByRole('link', { name: '⚙️' })
                : screen.getByRole('link', { name: /settings/i });
              
              // Verify settings link properties
              expect(settingsLink).toBeInTheDocument();
              expect(settingsLink).toHaveAttribute('href', '/settings');
              
              // Verify settings icon is present
              const settingsIcon = settingsLink.querySelector('span');
              expect(settingsIcon).toBeInTheDocument();
              
              // Verify settings label visibility based on collapsed state
              if (!testCase.isCollapsed) {
                expect(screen.getByText('Settings')).toBeInTheDocument();
              } else {
                expect(screen.queryByText('Settings')).not.toBeInTheDocument();
              }
              
              // Verify settings link is clickable
              expect(settingsLink).not.toHaveAttribute('disabled');
              expect(settingsLink).not.toHaveAttribute('aria-disabled', 'true');
            } else {
              // Settings should not be visible when auth disabled, not authenticated or sidebar is hidden
              expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
              expect(screen.queryByRole('link', { name: '⚙️' })).not.toBeInTheDocument();
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain Settings navigation accessibility across different states', () => {
      fc.assert(
        fc.property(
          fc.record({
            isCollapsed: fc.boolean(),
            userRole: fc.constantFrom('admin', 'user', 'moderator'),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run

            // Mock authenticated state with auth enabled
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: [testCase.userRole] 
              },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });
            
            // Mock auth enabled
            mockConfigManager.isAuthEnabled.mockReturnValue(true);

            // Mock localStorage to return collapsed state
            mockLocalStorage.getItem.mockReturnValue(
              JSON.stringify({ isCollapsed: testCase.isCollapsed })
            );

            render(
              <ApplicationShell navigationItems={mockNavigationItems}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Find settings link based on collapsed state
            const settingsLink = testCase.isCollapsed 
              ? screen.getByRole('link', { name: '⚙️' })
              : screen.getByRole('link', { name: '⚙️ Settings' });
            
            // Verify accessibility attributes
            expect(settingsLink).toBeInTheDocument();
            expect(settingsLink).toBeVisible();
            
            // Verify link is keyboard accessible
            settingsLink.focus();
            expect(document.activeElement).toBe(settingsLink);
            
            // Verify proper ARIA attributes if any
            const ariaLabel = settingsLink.getAttribute('aria-label');
            if (ariaLabel) {
              expect(ariaLabel).toContain('Settings');
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Settings navigation interaction correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run

            // Mock authenticated state with auth enabled
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });
            
            // Mock auth enabled
            mockConfigManager.isAuthEnabled.mockReturnValue(true);

            // Mock localStorage to return collapsed state
            mockLocalStorage.getItem.mockReturnValue(
              JSON.stringify({ isCollapsed })
            );

            render(
              <ApplicationShell navigationItems={mockNavigationItems}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Find settings link based on collapsed state
            const settingsLink = isCollapsed 
              ? screen.getByRole('link', { name: '⚙️' })
              : screen.getByRole('link', { name: '⚙️ Settings' });
            
            // Verify link can be interacted with
            expect(settingsLink).toBeInTheDocument();
            expect(settingsLink).not.toHaveClass('pointer-events-none');
            expect(settingsLink).not.toHaveClass('cursor-not-allowed');
            
            // Verify hover states are available (check for active state since it's /settings)
            // When active, it has different classes than hover states
            const isActive = settingsLink.classList.contains('bg-indigo-100');
            if (!isActive) {
              expect(settingsLink).toHaveClass('hover:bg-gray-50');
              expect(settingsLink).toHaveClass('hover:text-gray-900');
            }

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent Settings navigation position and styling', () => {
      fc.assert(
        fc.property(
          fc.record({
            isCollapsed: fc.boolean(),
            navigationItemsCount: fc.integer({ min: 2, max: 5 }),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run

            // Create navigation items without Settings in main nav (Settings is now in footer)
            const dynamicNavigationItems: NavigationItem[] = [
              {
                id: 'home',
                label: 'Home',
                icon: '🏠',
                href: '/',
              },
            ];

            // Add additional items if needed
            for (let i = 1; i < testCase.navigationItemsCount; i++) {
              dynamicNavigationItems.push({
                id: `item-${i}`,
                label: `Item ${i}`,
                icon: '📄',
                href: `/item-${i}`,
              });
            }

            // Mock authenticated state with auth enabled
            mockUseAuth.mockReturnValue({
              isAuthenticated: true,
              user: { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              },
              loading: false,
              error: undefined,
              login: jest.fn(),
              logout: jest.fn(),
              checkAuth: jest.fn(),
            });
            
            // Mock auth enabled
            mockConfigManager.isAuthEnabled.mockReturnValue(true);

            // Mock localStorage to return collapsed state
            mockLocalStorage.getItem.mockReturnValue(
              JSON.stringify({ isCollapsed: testCase.isCollapsed })
            );

            render(
              <ApplicationShell navigationItems={dynamicNavigationItems}>
                <div>Test Content</div>
              </ApplicationShell>
            );

            // Find settings link based on collapsed state
            const settingsLink = testCase.isCollapsed 
              ? screen.getByRole('link', { name: '⚙️' })
              : screen.getByRole('link', { name: '⚙️ Settings' });
            
            // Verify Settings link maintains consistent styling
            expect(settingsLink).toHaveClass('flex');
            expect(settingsLink).toHaveClass('items-center');
            expect(settingsLink).toHaveClass('px-3');
            expect(settingsLink).toHaveClass('py-2');
            expect(settingsLink).toHaveClass('text-sm');
            expect(settingsLink).toHaveClass('font-medium');
            expect(settingsLink).toHaveClass('rounded-md');
            expect(settingsLink).toHaveClass('transition-colors');
            
            // Verify Settings is always present in footer regardless of other navigation items
            expect(settingsLink).toBeInTheDocument();
            
            // Verify Settings icon is consistently sized
            const settingsIcon = settingsLink.querySelector('span');
            expect(settingsIcon).toHaveClass('w-5');
            expect(settingsIcon).toHaveClass('h-5');

            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});