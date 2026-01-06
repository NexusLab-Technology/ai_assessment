import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import CompanyForm from '@/components/company-settings/CompanyForm'
import { Company, CompanyFormData, FormErrors } from '@/types/company'
import { COMPANY_NAME_MIN_LENGTH, COMPANY_NAME_MAX_LENGTH, COMPANY_DESCRIPTION_MAX_LENGTH } from '@/utils/company-validation'

// Mock LoadingSpinner
jest.mock('@/components/ai-assessment/LoadingSpinner', () => {
  return function MockLoadingSpinner({ size, className }: any) {
    return <div data-testid="loading-spinner" className={className}>Loading {size}</div>
  }
})

describe('CompanyForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    loading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unit Tests', () => {
    it('should render form fields', () => {
      render(<CompanyForm {...defaultProps} />)
      
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByText('Create Company')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should pre-fill form when editing existing company', () => {
      const company: Company = {
        id: 'comp-1',
        name: 'Test Company',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        assessmentCount: 0
      }

      render(<CompanyForm {...defaultProps} company={company} />)
      
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Update Company')).toBeInTheDocument()
    })

    it('should show validation errors for invalid input', async () => {
      const user = userEvent.setup()
      render(<CompanyForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/company name/i)
      const submitButton = screen.getByText('Create Company')
      
      // Enter invalid name (too short)
      await user.type(nameInput, 'A')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(`Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show external errors when provided', () => {
      const errors: FormErrors = {
        name: 'Name already exists',
        general: 'Server error occurred'
      }

      render(<CompanyForm {...defaultProps} errors={errors} />)
      
      expect(screen.getByText('Name already exists')).toBeInTheDocument()
      expect(screen.getByText('Server error occurred')).toBeInTheDocument()
    })

    it('should disable form when loading', () => {
      render(<CompanyForm {...defaultProps} loading={true} />)
      
      const nameInput = screen.getByLabelText(/company name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const submitButton = screen.getByText('Create Company')
      const cancelButton = screen.getByText('Cancel')
      
      expect(nameInput).toBeDisabled()
      expect(descriptionInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      render(<CompanyForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/company name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const submitButton = screen.getByText('Create Company')
      
      await user.type(nameInput, 'Valid Company Name')
      await user.type(descriptionInput, 'Valid description')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Valid Company Name',
          description: 'Valid description'
        })
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<CompanyForm {...defaultProps} />)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should show real-time validation feedback', async () => {
      const user = userEvent.setup()
      render(<CompanyForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/company name/i)
      
      // Type invalid characters
      await user.type(nameInput, 'Invalid@Name')
      await user.tab() // Blur the input to trigger validation
      
      await waitFor(() => {
        expect(screen.getByText(/invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should validate description length', async () => {
      const user = userEvent.setup()
      render(<CompanyForm {...defaultProps} />)
      
      const descriptionInput = screen.getByLabelText(/description/i)
      const longDescription = 'A'.repeat(COMPANY_DESCRIPTION_MAX_LENGTH + 1)
      
      await user.type(descriptionInput, longDescription)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(`Description must not exceed ${COMPANY_DESCRIPTION_MAX_LENGTH} characters`)).toBeInTheDocument()
      })
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Feature: company-settings, Property 7: Form validation consistency
     * For any invalid company data submission, the form should prevent submission 
     * and display appropriate error messages for all invalid fields
     * Validates: Requirements 7.1, 7.2, 7.3
     */
    it('Property 7: Form validation consistency', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          name: fc.string(),
          description: fc.option(fc.string(), { nil: undefined })
        }),
        async (formData: CompanyFormData) => {
          const user = userEvent.setup()
          render(<CompanyForm {...defaultProps} />)
          
          const nameInput = screen.getByLabelText(/company name/i)
          const descriptionInput = screen.getByLabelText(/description/i)
          const submitButton = screen.getByText('Create Company')
          
          // Clear and fill form
          await user.clear(nameInput)
          await user.clear(descriptionInput)
          await user.type(nameInput, formData.name)
          if (formData.description) {
            await user.type(descriptionInput, formData.description)
          }
          
          // Try to submit
          await user.click(submitButton)
          
          // Check validation behavior
          const trimmedName = formData.name.trim()
          const hasNameError = 
            trimmedName.length === 0 ||
            trimmedName.length < COMPANY_NAME_MIN_LENGTH ||
            trimmedName.length > COMPANY_NAME_MAX_LENGTH ||
            !/^[a-zA-Z0-9\s\-_&.()]+$/.test(trimmedName)
          
          const hasDescriptionError = 
            formData.description && formData.description.length > COMPANY_DESCRIPTION_MAX_LENGTH
          
          const shouldHaveErrors = hasNameError || hasDescriptionError
          
          if (shouldHaveErrors) {
            // Form should not submit when there are validation errors
            expect(mockOnSubmit).not.toHaveBeenCalled()
            
            // Should show appropriate error messages
            if (hasNameError) {
              await waitFor(() => {
                const errorMessages = screen.getAllByText(/company name|invalid characters|characters/i)
                expect(errorMessages.length).toBeGreaterThan(0)
              })
            }
            
            if (hasDescriptionError) {
              await waitFor(() => {
                expect(screen.getByText(/description must not exceed/i)).toBeInTheDocument()
              })
            }
          } else {
            // Form should submit when valid
            await waitFor(() => {
              expect(mockOnSubmit).toHaveBeenCalledWith({
                name: trimmedName,
                description: formData.description || ''
              })
            })
          }
        }
      ), { numRuns: 50 })
    })

    /**
     * Feature: company-settings, Property 2: Company CRUD operations consistency
     * For any valid company creation, the form should submit the correct data
     * Validates: Requirements 2.5, 2.6, 2.7
     */
    it('Property 2: Company CRUD operations consistency - form submission', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: COMPANY_NAME_MIN_LENGTH, maxLength: COMPANY_NAME_MAX_LENGTH })
            .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
          description: fc.option(fc.string({ maxLength: COMPANY_DESCRIPTION_MAX_LENGTH }), { nil: undefined })
        }),
        async (validFormData: CompanyFormData) => {
          const user = userEvent.setup()
          render(<CompanyForm {...defaultProps} />)
          
          const nameInput = screen.getByLabelText(/company name/i)
          const descriptionInput = screen.getByLabelText(/description/i)
          const submitButton = screen.getByText('Create Company')
          
          // Fill form with valid data
          await user.clear(nameInput)
          await user.clear(descriptionInput)
          await user.type(nameInput, validFormData.name)
          if (validFormData.description) {
            await user.type(descriptionInput, validFormData.description)
          }
          
          // Submit form
          await user.click(submitButton)
          
          // Should submit with correct data
          await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
              name: validFormData.name.trim(),
              description: validFormData.description || ''
            })
          })
        }
      ), { numRuns: 30 })
    })

    it('should handle various input edge cases', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string(),
        fc.option(fc.string(), { nil: undefined }),
        fc.boolean(),
        fc.option(fc.record({
          name: fc.option(fc.string(), { nil: undefined }),
          description: fc.option(fc.string(), { nil: undefined }),
          general: fc.option(fc.string(), { nil: undefined })
        }), { nil: undefined }),
        async (_name: string, _description: string | undefined, loading: boolean, errors: FormErrors | undefined) => {
          render(
            <CompanyForm 
              {...defaultProps} 
              loading={loading}
              errors={errors}
            />
          )
          
          // Check loading state
          const nameInput = screen.getByLabelText(/company name/i)
          const submitButton = screen.getByText('Create Company')
          
          if (loading) {
            expect(nameInput).toBeDisabled()
            expect(submitButton).toBeDisabled()
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
          } else {
            expect(nameInput).not.toBeDisabled()
          }
          
          // Check error display
          if (errors?.name) {
            expect(screen.getByText(errors.name)).toBeInTheDocument()
          }
          if (errors?.description) {
            expect(screen.getByText(errors.description)).toBeInTheDocument()
          }
          if (errors?.general) {
            expect(screen.getByText(errors.general)).toBeInTheDocument()
          }
        }
      ), { numRuns: 30 })
    })
  })
})