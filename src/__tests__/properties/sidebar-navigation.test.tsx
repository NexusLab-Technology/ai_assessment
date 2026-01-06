/**
 * Property-Based Tests for Simplified Sidebar Navigation
 * Feature: configurable-auth-framework, Property 18: Simplified sidebar navigation
 */

import { render, screen, cleanup } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import { DEFAULT_NAVIGATION } from '@/lib/constants';
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

// Get the mocked ConfigManager for test manipulation
const { ConfigManager: mockConfigManager } = jest.requireMock('@/lib/config');

// Mock useAuth hook
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
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

describe('Sidebar Navigation Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    cleanup();
    
    // Default authenticated state with auth enabled
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    
    // Default auth enabled
    mockConfigManager.isAuthEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 18: Simplified sidebar navigation
   * For any sidebar rendering, the navigation menu should contain only Home and Profile items and no other navigation items
   * Validates: Requirements 6.1
   */
  describe('Property 18: Simplified sidebar navigation', () => {
    it('should contain only Home navigation item in main nav', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run
            
            const mockToggle = jest.fn();
            
            const { container } = render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockToggle}
                navigationItems={DEFAULT_NAVIGATION}
              />
            );

            if (!isCollapsed) {
              // When expanded, check that only Home text is visible in main nav
              expect(container.querySelector('a[href="/"] span:last-child')).toHaveTextContent('Home');
              
              // Settings should be in footer, not main nav
              const mainNav = container.querySelector('nav');
              expect(mainNav).not.toContainElement(screen.queryByText('Settings'));
              
              // Check that no other navigation items exist in main nav
              expect(screen.queryByText('Profile')).not.toBeInTheDocument();
              expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
              expect(screen.queryByText('Examples')).not.toBeInTheDocument();
              expect(screen.queryByText('Help')).not.toBeInTheDocument();
              expect(screen.queryByText('About')).not.toBeInTheDocument();
              expect(screen.queryByText('Navigation Test')).not.toBeInTheDocument();
            } else {
              // When collapsed, text labels are hidden but icons should be present
              expect(screen.queryByText('Home')).not.toBeInTheDocument();
              expect(screen.queryByText('Profile')).not.toBeInTheDocument();
              
              // Icons should still be present (only Home in main nav)
              expect(container.querySelector('a[href="/"] span:first-child')).toHaveTextContent('🏠');
            }
            
            // Verify that DEFAULT_NAVIGATION contains exactly 1 item (only Home)
            expect(DEFAULT_NAVIGATION).toHaveLength(1);
            
            // Verify the item is Home only
            const itemLabels = DEFAULT_NAVIGATION.map(item => item.label);
            expect(itemLabels).toEqual(['Home']);
            
            // Verify the item has correct ID
            const itemIds = DEFAULT_NAVIGATION.map(item => item.id);
            expect(itemIds).toEqual(['home']);
            
            // Verify the item has correct href
            const itemHrefs = DEFAULT_NAVIGATION.map(item => item.href);
            expect(itemHrefs).toEqual(['/']);
            
            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain simplified navigation regardless of collapse state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (isCollapsed) => {
            cleanup(); // Clean up before each property run
            
            const mockToggle = jest.fn();
            
            const { container, rerender } = render(
              <Sidebar
                isCollapsed={isCollapsed}
                onToggle={mockToggle}
                navigationItems={DEFAULT_NAVIGATION}
              />
            );

            // Check initial state
            if (!isCollapsed) {
              expect(container.querySelector('a[href="/"] span:last-child')).toHaveTextContent('Home');
            } else {
              expect(container.querySelector('a[href="/"] span')).toHaveTextContent('🏠');
            }
            
            // Toggle collapse state
            rerender(
              <Sidebar
                isCollapsed={!isCollapsed}
                onToggle={mockToggle}
                navigationItems={DEFAULT_NAVIGATION}
              />
            );

            // Check toggled state
            if (isCollapsed) {
              // Was collapsed, now expanded
              expect(container.querySelector('a[href="/"] span:last-child')).toHaveTextContent('Home');
            } else {
              // Was expanded, now collapsed
              expect(container.querySelector('a[href="/"] span')).toHaveTextContent('🏠');
            }
            
            // Should still not have other navigation items in any state
            expect(screen.queryByText('Profile')).not.toBeInTheDocument();
            expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
            
            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct navigation structure for simplified navigation', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isCollapsed
          (_isCollapsed) => {
            // Verify DEFAULT_NAVIGATION structure (only Home in main nav)
            expect(DEFAULT_NAVIGATION).toEqual([
              {
                id: 'home',
                label: 'Home',
                icon: '🏠',
                href: '/',
              },
            ]);
            
            // Verify no nested children in simplified navigation
            DEFAULT_NAVIGATION.forEach(item => {
              expect(item.children).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always render exactly 1 navigation link in main nav regardless of state', () => {
      fc.assert(
        fc.property(
          fc.record({
            isCollapsed: fc.boolean(),
            isAuthenticated: fc.boolean(),
            isAuthEnabled: fc.boolean(),
          }),
          (testCase) => {
            cleanup(); // Clean up before each property run
            
            // Mock authentication state
            mockUseAuth.mockReturnValue({
              user: testCase.isAuthenticated ? { 
                id: '1', 
                username: 'testuser', 
                email: 'test@example.com', 
                roles: ['user'] 
              } : null,
              isAuthenticated: testCase.isAuthenticated,
              login: jest.fn(),
              logout: jest.fn(),
            });
            
            // Mock auth enabled state
            mockConfigManager.isAuthEnabled.mockReturnValue(testCase.isAuthEnabled);
            
            const mockToggle = jest.fn();
            
            const { container } = render(
              <Sidebar
                isCollapsed={testCase.isCollapsed}
                onToggle={mockToggle}
                navigationItems={DEFAULT_NAVIGATION}
              />
            );

            // Should always have exactly 1 navigation link in main nav (Home)
            // Plus Settings link in footer when auth enabled and authenticated
            const links = container.querySelectorAll('a[href]');
            const shouldShowSettings = testCase.isAuthEnabled && testCase.isAuthenticated;
            const expectedLinkCount = shouldShowSettings ? 2 : 1;
            expect(links).toHaveLength(expectedLinkCount);
            
            // Verify hrefs - Home always present
            expect(links[0]).toHaveAttribute('href', '/');
            
            // Settings only present when auth enabled and authenticated
            if (shouldShowSettings) {
              expect(links[1]).toHaveAttribute('href', '/settings');
            }
            
            cleanup(); // Clean up after each property run
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});