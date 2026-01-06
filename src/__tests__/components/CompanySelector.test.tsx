/**
 * Property-based tests for CompanySelector component
 * Feature: ai-assessment, Property 2: Company-based assessment filtering
 * Validates: Requirements 2.2
 */

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import CompanySelector from '../../components/ai-assessment/CompanySelector'
import { Company } from '../../types/assessment'
import { companyGenerator } from '../helpers/generators'

describe('CompanySelector Component', () => {
  const mockOnCompanySelect = jest.fn()
  const mockOnCreateNew = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Property 2: Company-based assessment filtering', () => {
    it('should display "Create Company" when no companies exist', () => {
      render(
        <CompanySelector
          companies={[]}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      expect(screen.getByText('No companies found')).toBeInTheDocument()
      expect(screen.getByText('Create Company')).toBeInTheDocument()
      
      // Should call onCreateNew when button is clicked
      fireEvent.click(screen.getByText('Create Company'))
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1)
    })

    it('should display company dropdown when companies exist', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company 1',
          description: 'Test Description 1',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 5
        },
        {
          id: 'company-2',
          name: 'Test Company 2',
          createdAt: new Date('2024-01-02'),
          assessmentCount: 3
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      expect(screen.getByText('Select Company')).toBeInTheDocument()
      expect(screen.getByText('Select a company...')).toBeInTheDocument()
    })

    it('should handle company selection correctly', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company 1',
          description: 'Test Description 1',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 5
        },
        {
          id: 'company-2',
          name: 'Test Company 2',
          createdAt: new Date('2024-01-02'),
          assessmentCount: 3
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('Select a company...'))

      // Should show all companies
      expect(screen.getByText('Test Company 1')).toBeInTheDocument()
      expect(screen.getByText('Test Company 2')).toBeInTheDocument()
      expect(screen.getByText('5 assessments')).toBeInTheDocument()
      expect(screen.getByText('3 assessments')).toBeInTheDocument()

      // Select a company
      fireEvent.click(screen.getByText('Test Company 1'))
      expect(mockOnCompanySelect).toHaveBeenCalledWith(companies[0])
    })

    it('should display selected company information', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Selected Company',
          description: 'Selected Description',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 7
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={companies[0]}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      // Should show selected company name in dropdown button
      expect(screen.getAllByText('Selected Company')).toHaveLength(2)
      
      // Should show company details in the info section
      expect(screen.getByText('Selected Description')).toBeInTheDocument()
      expect(screen.getByText('7 assessments')).toBeInTheDocument()
      expect(screen.getByText('Created 1/1/2024')).toBeInTheDocument()
    })

    it('should handle "Create New Company" option in dropdown', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 2
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('Select a company...'))

      // Should show "Create New Company" option
      expect(screen.getByText('Create New Company')).toBeInTheDocument()

      // Click create new company
      fireEvent.click(screen.getByText('Create New Company'))
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1)
    })

    it('should close dropdown when clicking outside', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 1
        }
      ]

      const { container } = render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('Select a company...'))
      expect(screen.getByText('Test Company')).toBeInTheDocument()

      // Click outside (on the overlay)
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()
      fireEvent.click(overlay!)

      // Dropdown should be closed (company name should not be visible in dropdown)
      expect(screen.queryByText('Test Company')).not.toBeInTheDocument()
    })
  })

  describe('Property-Based Tests', () => {
    it('should maintain consistent state across different company lists', () => {
      fc.assert(fc.property(
        fc.array(companyGenerator, { minLength: 0, maxLength: 10 }),
        (companies: Company[]) => {
          cleanup()
          
          render(
            <CompanySelector
              companies={companies}
              selectedCompany={null}
              onCompanySelect={mockOnCompanySelect}
              onCreateNew={mockOnCreateNew}
            />
          )

          // Property: Empty companies should show create company UI
          if (companies.length === 0) {
            expect(screen.getByText('No companies found')).toBeInTheDocument()
            expect(screen.getByText('Create Company')).toBeInTheDocument()
          } else {
            // Property: Non-empty companies should show selector UI
            expect(screen.getByText('Select Company')).toBeInTheDocument()
            expect(screen.getByText('Select a company...')).toBeInTheDocument()
          }

          return true
        }
      ), { numRuns: 20 })
    })

    it('should handle company selection consistently', () => {
      fc.assert(fc.property(
        fc.array(companyGenerator, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        (companies: Company[], selectedIndex: number) => {
          cleanup()
          jest.clearAllMocks()

          const selectedCompany = selectedIndex < companies.length ? companies[selectedIndex] : null

          render(
            <CompanySelector
              companies={companies}
              selectedCompany={selectedCompany}
              onCompanySelect={mockOnCompanySelect}
              onCreateNew={mockOnCreateNew}
            />
          )

          // Property: Selected company should be displayed in button
          if (selectedCompany) {
            expect(screen.getAllByText(selectedCompany.name)).toHaveLength(2)
          } else {
            expect(screen.getByText('Select a company...')).toBeInTheDocument()
          }

          return true
        }
      ), { numRuns: 20 })
    })

    it('should display assessment counts correctly', () => {
      fc.assert(fc.property(
        companyGenerator,
        (company: Company) => {
          cleanup()

          render(
            <CompanySelector
              companies={[company]}
              selectedCompany={company}
              onCompanySelect={mockOnCompanySelect}
              onCreateNew={mockOnCreateNew}
            />
          )

          // Property: Assessment count should be displayed correctly
          const expectedText = company.assessmentCount === 1 
            ? '1 assessment' 
            : `${company.assessmentCount} assessments`
          
          expect(screen.getByText(expectedText)).toBeInTheDocument()

          return true
        }
      ), { numRuns: 30 })
    })
  })

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 1
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      const button = screen.getByRole('button', { name: /select a company/i })
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
      expect(button).toHaveAttribute('aria-expanded', 'false')

      // Open dropdown
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('should support keyboard navigation', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 1
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      const button = screen.getByRole('button', { name: /select a company/i })
      expect(button).toBeInTheDocument()
      
      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Edge Cases', () => {
    it('should handle companies without descriptions', () => {
      const companies: Company[] = [
        {
          id: 'company-1',
          name: 'Company Without Description',
          createdAt: new Date('2024-01-01'),
          assessmentCount: 0
        }
      ]

      render(
        <CompanySelector
          companies={companies}
          selectedCompany={null}
          onCompanySelect={mockOnCompanySelect}
          onCreateNew={mockOnCreateNew}
        />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('Select a company...'))

      // Should show company name without description
      expect(screen.getByText('Company Without Description')).toBeInTheDocument()
      expect(screen.getByText('0 assessments')).toBeInTheDocument()
    })

    it('should handle singular vs plural assessment counts', () => {
      const companiesData = [
        { assessmentCount: 0, expected: '0 assessments' },
        { assessmentCount: 1, expected: '1 assessment' },
        { assessmentCount: 2, expected: '2 assessments' },
        { assessmentCount: 10, expected: '10 assessments' }
      ]

      companiesData.forEach(({ assessmentCount, expected }) => {
        cleanup()
        
        const companies: Company[] = [
          {
            id: 'company-1',
            name: 'Test Company',
            createdAt: new Date('2024-01-01'),
            assessmentCount
          }
        ]

        render(
          <CompanySelector
            companies={companies}
            selectedCompany={companies[0]}
            onCompanySelect={mockOnCompanySelect}
            onCreateNew={mockOnCreateNew}
          />
        )

        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  })
})