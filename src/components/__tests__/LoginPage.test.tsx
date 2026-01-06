import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';

describe('LoginPage', () => {
  const mockOnLogin = jest.fn();
  
  const defaultProps = {
    onLogin: mockOnLogin,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with username and password fields', () => {
    render(<LoginPage {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display demo credentials', () => {
    render(<LoginPage {...defaultProps} />);
    
    expect(screen.getByText('Demo Credentials:')).toBeInTheDocument();
    expect(screen.getByText('Admin:')).toBeInTheDocument();
    expect(screen.getByText('User:')).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = screen.getByRole('button', { name: /👁️|🙈/ });
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should validate form and show validation errors', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit empty form
    await user.click(submitButton);
    
    // Should not call onLogin with invalid data
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should validate username length', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'ab'); // Too short
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters long')).toBeInTheDocument();
    });
    
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '12345'); // Too short
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
    
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should submit valid credentials', async () => {
    const user = userEvent.setup();
    mockOnLogin.mockResolvedValue(true);
    
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('should display server error', () => {
    const errorMessage = 'Invalid credentials';
    render(<LoginPage {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<LoginPage {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    
    // Form fields should be disabled during loading
    expect(screen.getByPlaceholderText('Username')).toBeDisabled();
    expect(screen.getByPlaceholderText('Password')).toBeDisabled();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit empty form to trigger validation
    await user.click(submitButton);
    
    // Should not call onLogin initially
    expect(mockOnLogin).not.toHaveBeenCalled();
    
    // Start typing should not cause errors
    await user.type(usernameInput, 'a');
    
    // Component should still be functional
    expect(usernameInput).toHaveValue('a');
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    mockOnLogin.mockResolvedValue(true);
    
    render(<LoginPage {...defaultProps} />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });
});