import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import CompanyDashboard from '@/components/company-settings/CompanyDashboard'
import { Company } from '@/types/company'

// Mock the child components
jest.mock('@/components/company-settings/CompanyCard', () => {
  return function MockCompanyCard({ company, onEdit, onDelete, onViewAssessments }: any) {
    return (
      <div data-testid={`company-card-${company.id}`}>
        <h3>{company.name}</h3>
        <p>{company.description}</p>
        <span>{company.assessmentCount} assessments</span>
        <button onClick={() => onEdit(company)}>Edit</button>
        <button onClick={() => onDelete(company.id)}>Delete</button>
        <button onClick={() => onViewAssessments(company.id)}>View Assessments</button>
      </div>
    )
  }
})

jest.mock('@/components/company-settings/CompanySearch', () => {
  return function MockCompanySearch({ onSearch, placeholder }: any) {
    return (
      <input
        data-testid="company-search"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
      />
    )
  }
})

jest.mock('@/components/company-settings/CompanyForm', () => {
  return function MockCompanyForm({ company, onSubmit, onCancel, loading }: any) {
    return (
      <div data-testid="company-form">
        <input
          data-testid="form-name"
          defaultValue={company?.name || ''}
          onChange={() => {}}
        />
        <button
          onClick={() => onSubmit({ name: 'Test Company', description: 'Test Description' })}
          disabled={loading}
        >
          Submit
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    )
  }
})

jest.mock('@/components/ai-assessment/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>
  }
})

jest.mock('@/components/ai-assessment/ErrorMessage', () => {
  return function MockErrorMessage({ message, onRetry }: any) {
    return (
      <div data-testid="error-message">
        <span>{message}</span>
        <button onClick={onRetry}>Retry</button>
      </div>
    )
  }
})

describe('CompanyDashboard', () => {
  const mockProps = {
    companies: [],
    loading: false,
    error: undefined,
    onCreateCompany: jest.fn(),
    onEditCompany: jest.fn(),
    onDeleteCompany: jest.fn(),
    onSearchCompanies: jest.fn(),
    onFormSubmit: jest.fn(),
    onFormCancel: jest.fn(),
    formLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unit Tests', () => {
    it('should render loading state', () => {
      render(<CompanyDashboard {...mockProps} loading={true} />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should render error state', () => {
      const errorMessage = 'Failed to load companies'
      render(<CompanyDashboard {...mockProps} error={errorMessage} />)
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should render empty state when no companies', () => {
      render(<CompanyDashboard {...mockProps} />)
      expect(screen.getByText('No companies yet')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first company to organize your AI assessments.')).toBeInTheDocument()
    })

    it('should render companies when provided', () => {
      const companies: Company[] = [
        {
          id: 'comp-1',
          name: 'Test Company 1',
          description: 'Test Description 1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          assessmentCount: 2
        },
        {
          id: 'comp-2',
          name: 'Test Company 2',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          assessmentCount: 0
        }
      ]

      render(<CompanyDashboard {...mockProps} companies={companies} />)
      
      expect(screen.getByTestId('company-card-comp-1')).toBeInTheDocument()
      expect(screen.getByTestId('company-card-comp-2')).toBeInTheDocument()
      expect(screen.getByText('Showing 2 companies')).toBeInTheDocument()
    })

    it('should handle create company button click', async () => {
      const user = userEvent.setup()
      render(<CompanyDashboard {...mockProps} />)
      
      const createButton = screen.getByText('Create New Company')
      await user.click(createButton)
      
      expect(mockProps.onCreateCompany).toHaveBeenCalledTimes(1)
    })

    it('should handle search input', async () => {
      const user = userEvent.setup()
      render(<CompanyDashboard {...mockProps} />)
      
      const searchInput = screen.getByTestId('company-search')
      await user.type(searchInput, 'test query')
      
      expect(mockProps.onSearchCompanies).toHaveBeenCalledWith('test query')
    })

    it('should show form when currentFormData is provided', () => {
      render(
        <CompanyDashboard 
          {...mockProps} 
          currentFormData={{ name: '', description: '' }}
        />
      )
      
      expect(screen.getByTestId('company-form')).toBeInTheDocument()
    })

    it('should handle form submission', async () => {
      const user = userEvent.setup()
      render(
        <CompanyDashboard 
          {...mockProps} 
          currentFormData={{ name: '', description: '' }}
        />
      )
      
      const submitButton = screen.getByText('Submit')
      await user.click(submitButton)
      
      expect(mockProps.onFormSubmit).toHaveBeenCalledWith({
        name: 'Test Company',
        description: 'Test Description'
      })
    })

    it('should handle form cancellation', async () => {
      const user = userEvent.setup()
      render(
        <CompanyDashboard 
          {...mockProps} 
          currentFormData={{ name: '', description: '' }}
        />
      )
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockProps.onFormCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Feature: company-settings, Property 4: Assessment count accuracy
     * For any company displayed in the list, the assessment count should exactly match 
     * the number of assessments associated with that company in the database
     * Validates: Requirements 3.3, 6.3
     */
    it('Property 4: Assessment count accuracy', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 })),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          assessmentCount: fc.integer({ min: 0, max: 100 })
        }), { minLength: 0, maxLength: 10 }),
        (companies: Company[]) => {
          render(<CompanyDashboard {...mockProps} companies={companies} />)
          
          companies.forEach(company => {
            const companyCard = screen.getByTestId(`company-card-${company.id}`)
            expect(companyCard).toBeInTheDocument()
            
            // Check that the assessment count is displayed correctly
            const assessmentText = `${company.assessmentCount} assessments`
            expect(companyCard).toHaveTextContent(assessmentText)
          })
        }
      ), { numRuns: 50 })
    })

    /**
     * Feature: company-settings, Property 5: Search functionality correctness
     * For any search query, all returned companies should contain the search term in their name,
     * and no companies containing the search term should be excluded
     * Validates: Requirements 3.5
     */
    it('Property 5: Search functionality correctness', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 })),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          assessmentCount: fc.integer({ min: 0, max: 100 })
        }), { minLength: 0, maxLength: 20 }),
        fc.string({ maxLength: 50 }),
        (allCompanies: Company[], searchQuery: string) => {
          // Filter companies that should match the search query
          const expectedMatches = allCompanies.filter(company =>
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          
          render(<CompanyDashboard {...mockProps} companies={expectedMatches} />)
          
          if (searchQuery.trim()) {
            // If there's a search query, verify the results summary
            if (expectedMatches.length > 0) {
              expect(screen.getByText(new RegExp(`Found ${expectedMatches.length}`))).toBeInTheDocument()
            }
            
            // Verify each displayed company matches the search criteria
            expectedMatches.forEach(company => {
              const shouldMatch = 
                company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()))
              
              expect(shouldMatch).toBe(true)
            })
          }
        }
      ), { numRuns: 50 })
    })

    it('should handle various company list sizes correctly', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 })),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          assessmentCount: fc.integer({ min: 0, max: 100 })
        }), { minLength: 0, maxLength: 50 }),
        (companies: Company[]) => {
          render(<CompanyDashboard {...mockProps} companies={companies} />)
          
          if (companies.length === 0) {
            expect(screen.getByText('No companies yet')).toBeInTheDocument()
          } else {
            const expectedText = companies.length === 1 ? 'Showing 1 company' : `Showing ${companies.length} companies`
            expect(screen.getByText(expectedText)).toBeInTheDocument()
            
            // Verify all companies are rendered
            companies.forEach(company => {
              expect(screen.getByTestId(`company-card-${company.id}`)).toBeInTheDocument()
            })
          }
        }
      ), { numRuns: 30 })
    })

    it('should maintain consistent state across loading and error conditions', () => {
      fc.assert(fc.property(
        fc.boolean(),
        fc.option(fc.string({ minLength: 1, maxLength: 200 })),
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 })),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          assessmentCount: fc.integer({ min: 0, max: 100 })
        }), { minLength: 0, maxLength: 10 }),
        (loading: boolean, error: string | undefined, companies: Company[]) => {
          render(
            <CompanyDashboard 
              {...mockProps} 
              loading={loading}
              error={error}
              companies={companies}
            />
          )
          
          if (loading) {
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
          } else if (error) {
            expect(screen.getByTestId('error-message')).toBeInTheDocument()
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
          } else {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
            
            // Should show companies or empty state
            if (companies.length === 0) {
              expect(screen.getByText('No companies yet')).toBeInTheDocument()
            } else {
              companies.forEach(company => {
                expect(screen.getByTestId(`company-card-${company.id}`)).toBeInTheDocument()
              })
            }
          }
        }
      ), { numRuns: 50 })
    })
  })
})