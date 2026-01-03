import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { ConfigManager } from '../../lib/config';

// Mock the config manager
jest.mock('../../lib/config');
const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

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

// Test component that uses the auth context
function TestComponent() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="username">{user?.username || 'no-user'}</div>
      <button onClick={() => login({ username: 'admin', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  let consoleSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigManager.getAuthConfig.mockReturnValue({
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
        defaultRoute: "/",
    });
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Suppress console.error warnings in tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  it('should provide authentication context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
  });

  it('should handle successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('admin');
    });
  });

  it('should handle logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // First login
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    act(() => {
      logoutButton.click();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
  });

  it('should restore session from localStorage', async () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin'],
      lastLogin: new Date().toISOString(),
    };

    const mockSession = {
      token: 'mock-token',
      userId: '1',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'session_data') return JSON.stringify(mockSession);
      if (key === 'user_data') return JSON.stringify(mockUser);
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('admin');
    });
  });

  it('should clear expired session', async () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin'],
      lastLogin: new Date().toISOString(),
    };

    const expiredSession = {
      token: 'mock-token',
      userId: '1',
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      createdAt: new Date().toISOString(),
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'session_data') return JSON.stringify(expiredSession);
      if (key === 'user_data') return JSON.stringify(mockUser);
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_data');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_data');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});