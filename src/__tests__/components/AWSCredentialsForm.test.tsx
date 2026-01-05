/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AWSCredentialsForm from '../../components/ai-assessment/AWSCredentialsForm'

// Mock fetch
global.fetch = jest.fn()

describe('AWSCredentialsForm Component', () => {
  const mockOnCredentialsSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  const defaultProps = {
    onCredentialsSubmit: mockOnCredentialsSubmit,
    onCancel: mockOnCancel
  }

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<AWSCredentialsForm {...defaultProps} />)

      expect(screen.getByText('AWS Bedrock Configuration')).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Access Key ID/)).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Secret Access Key/)).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Region/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Test Connection/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Credentials/ })).toBeInTheDocument()
    })

    it('renders with initial credentials', () => {
      const initialCredentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        region: 'us-west-2'
      }

      render(
        <AWSCredentialsForm 
          {...defaultProps} 
          initialCredentials={initialCredentials}
        />
      )

      expect(screen.getByDisplayValue('AKIAIOSFODNN7EXAMPLE')).toBeInTheDocument()
      // Check that the select has the correct value
      const regionSelect = screen.getByDisplayValue('US West (Oregon)')
      expect(regionSelect).toBeInTheDocument()
    })

    it('shows loading state when isLoading is true', () => {
      render(<AWSCredentialsForm {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Saving.../ })).toBeDisabled()
    })

    it('displays error message when provided', () => {
      render(<AWSCredentialsForm {...defaultProps} error="Test error message" />)

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('AWS Access Key ID is required')).toBeInTheDocument()
        expect(screen.getByText('AWS Secret Access Key is required')).toBeInTheDocument()
      })

      expect(mockOnCredentialsSubmit).not.toHaveBeenCalled()
    })

    it('validates AWS Access Key ID format', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const accessKeyInput = screen.getByLabelText(/AWS Access Key ID/)
      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })

      await user.type(accessKeyInput, 'invalid-key-format')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid AWS Access Key ID format')).toBeInTheDocument()
      })

      expect(mockOnCredentialsSubmit).not.toHaveBeenCalled()
    })

    it('validates secret access key length', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const secretKeyInput = screen.getByLabelText(/AWS Secret Access Key/)
      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })

      await user.type(secretKeyInput, 'short')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('AWS Secret Access Key must be at least 40 characters')).toBeInTheDocument()
      })

      expect(mockOnCredentialsSubmit).not.toHaveBeenCalled()
    })

    it('clears validation errors when user corrects input', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const accessKeyInput = screen.getByLabelText(/AWS Access Key ID/)
      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })

      // Trigger validation error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText('AWS Access Key ID is required')).toBeInTheDocument()
      })

      // Fix the error
      await user.type(accessKeyInput, 'AKIAIOSFODNN7EXAMPLE')
      
      await waitFor(() => {
        expect(screen.queryByText('AWS Access Key ID is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles secret key visibility', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const secretKeyInput = screen.getByLabelText(/AWS Secret Access Key/)
      const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

      // Initially should be password type
      expect(secretKeyInput).toHaveAttribute('type', 'password')

      // Click to show
      await user.click(toggleButton)
      expect(secretKeyInput).toHaveAttribute('type', 'text')

      // Click to hide
      await user.click(toggleButton)
      expect(secretKeyInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Connection Testing', () => {
    it('tests connection with valid credentials', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<AWSCredentialsForm {...defaultProps} />)

      // Fill in valid credentials
      await user.type(screen.getByLabelText(/AWS Access Key ID/), 'AKIAIOSFODNN7EXAMPLE')
      await user.type(screen.getByLabelText(/AWS Secret Access Key/), 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')

      const testButton = screen.getByRole('button', { name: /Test Connection/ })
      await user.click(testButton)

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/aws/test-bedrock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          region: 'us-east-1'
        })
      })
    })

    it('handles connection test failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })

      render(<AWSCredentialsForm {...defaultProps} />)

      // Fill in credentials
      await user.type(screen.getByLabelText(/AWS Access Key ID/), 'AKIAIOSFODNN7EXAMPLE')
      await user.type(screen.getByLabelText(/AWS Secret Access Key/), 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')

      const testButton = screen.getByRole('button', { name: /Test Connection/ })
      await user.click(testButton)

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument()
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('does not test connection with invalid credentials', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      // Fill in invalid credentials
      await user.type(screen.getByLabelText(/AWS Access Key ID/), 'invalid')

      const testButton = screen.getByRole('button', { name: /Test Connection/ })
      await user.click(testButton)

      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled()
      expect(screen.getByText('Invalid AWS Access Key ID format')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits valid credentials', async () => {
      const user = userEvent.setup()
      mockOnCredentialsSubmit.mockResolvedValueOnce(undefined)

      render(<AWSCredentialsForm {...defaultProps} />)

      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-west-2'
      }

      // Fill in credentials
      await user.type(screen.getByLabelText(/AWS Access Key ID/), credentials.accessKeyId)
      await user.type(screen.getByLabelText(/AWS Secret Access Key/), credentials.secretAccessKey)
      await user.selectOptions(screen.getByLabelText(/AWS Region/), credentials.region)

      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnCredentialsSubmit).toHaveBeenCalledWith(credentials)
      })
    })

    it('handles submission error', async () => {
      const user = userEvent.setup()
      mockOnCredentialsSubmit.mockRejectedValueOnce(new Error('Save failed'))

      render(<AWSCredentialsForm {...defaultProps} />)

      // Fill in valid credentials
      await user.type(screen.getByLabelText(/AWS Access Key ID/), 'AKIAIOSFODNN7EXAMPLE')
      await user.type(screen.getByLabelText(/AWS Secret Access Key/), 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')

      const submitButton = screen.getByRole('button', { name: /Save Credentials/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AWSCredentialsForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Security Features', () => {
    it('displays security notice', () => {
      render(<AWSCredentialsForm {...defaultProps} />)

      expect(screen.getByText('Security Notice')).toBeInTheDocument()
      expect(screen.getByText(/Your AWS credentials are encrypted and stored securely/)).toBeInTheDocument()
    })

    it('masks secret key by default', () => {
      render(<AWSCredentialsForm {...defaultProps} />)

      const secretKeyInput = screen.getByLabelText(/AWS Secret Access Key/)
      expect(secretKeyInput).toHaveAttribute('type', 'password')
    })
  })
})