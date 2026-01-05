import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import ReportViewer from '../../components/ai-assessment/ReportViewer'
import { AssessmentReport, Assessment, Company } from '../../types/assessment'
import { assessmentGenerator, companyGenerator } from '../helpers/generators'

// Mock window functions
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:test-url'),
  writable: true
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true
})

// Mock navigator functions
Object.defineProperty(navigator, 'share', {
  value: jest.fn(),
  writable: true,
  configurable: true
})

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn() },
  writable: true,
  configurable: true
})

describe('ReportViewer Component', () => {
  const mockOnBack = jest.fn()

  const mockCompany: Company = {
    id: 'test-company',
    name: 'Test Company',
    description: 'A test company',
    createdAt: new Date(),
    assessmentCount: 5
  }

  const mockAssessment: Assessment = {
    id: 'test-assessment',
    name: 'Test Assessment',
    companyId: 'test-company',
    type: 'EXPLORATORY',
    status: 'COMPLETED',
    currentStep: 7,
    totalSteps: 7,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    completedAt: new Date('2024-01-02')
  }

  const mockReport: AssessmentReport = {
    id: 'test-report',
    assessmentId: 'test-assessment',
    companyId: 'test-company',
    htmlContent: '<div><h1>Test Report</h1><p>This is a test report content.</p></div>',
    generatedAt: new Date('2024-01-02'),
    metadata: {
      assessmentType: 'EXPLORATORY',
      companyName: 'Test Company',
      generationDuration: 2500,
      bedrockModel: 'claude-3-sonnet'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unit Tests', () => {
    it('renders report viewer with header information', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('AI Assessment Report')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText(mockReport.generatedAt.toLocaleDateString())).toBeInTheDocument()
    })

    it('displays report content', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      // Should display the HTML content
      expect(screen.getByText('Test Report')).toBeInTheDocument()
      expect(screen.getByText('This is a test report content.')).toBeInTheDocument()
    })

    it('shows action buttons (Share, Print, Download)', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('displays report metadata', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      expect(screen.getByText('Exploratory Assessment')).toBeInTheDocument()
      expect(screen.getByText('2500ms')).toBeInTheDocument()
      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument()
    })

    it('calls onBack when back button is clicked', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
          onBack={mockOnBack}
        />
      )

      const backButton = screen.getByRole('button', { name: /back to dashboard/i })
      fireEvent.click(backButton)

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it('generates mock content when htmlContent is empty', () => {
      const emptyReport = { ...mockReport, htmlContent: '' }
      
      render(
        <ReportViewer
          report={emptyReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      // Should show generated mock content
      expect(screen.getByText('Executive Summary')).toBeInTheDocument()
      expect(screen.getByText('Strategic Recommendations')).toBeInTheDocument()
    })

    it('shows migration-specific content for migration assessments', () => {
      const migrationAssessment = { ...mockAssessment, type: 'MIGRATION' as const }
      const emptyReport = { ...mockReport, htmlContent: '' }
      
      render(
        <ReportViewer
          report={emptyReport}
          assessment={migrationAssessment}
          company={mockCompany}
        />
      )

      // Should show migration-specific content in mock report
      expect(screen.getByText('4. Migration Strategy')).toBeInTheDocument()
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Property 14: Report viewing functionality
     * Validates: Requirements 7.6
     * 
     * Report viewing should work consistently across different report data:
     * - All reports should display header information correctly
     * - Action buttons should always be present and functional
     * - Content should be rendered safely
     * - Metadata should be displayed accurately
     */
    it('Property 14: Report viewing functionality', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            assessmentId: fc.string({ minLength: 1, maxLength: 10 }),
            companyId: fc.string({ minLength: 1, maxLength: 10 }),
            htmlContent: fc.string({ minLength: 0, maxLength: 500 }),
            generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
            metadata: fc.record({
              assessmentType: fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const),
              companyName: fc.string({ minLength: 1, maxLength: 20 }),
              generationDuration: fc.integer({ min: 100, max: 10000 }),
              bedrockModel: fc.constantFrom('claude-3-sonnet', 'claude-3-haiku')
            })
          }),
          assessmentGenerator,
          companyGenerator,
          (report, assessment, company) => {
            // Ensure consistent IDs
            const consistentReport = {
              ...report,
              assessmentId: assessment.id,
              companyId: company.id,
              metadata: {
                ...report.metadata,
                companyName: company.name,
                assessmentType: assessment.type
              }
            }

            const { container, unmount } = render(
              <ReportViewer
                report={consistentReport}
                assessment={assessment}
                company={company}
              />
            )

            try {
              // Property 1: Header should display report title
              expect(container.textContent).toContain('AI Assessment Report')

              // Property 2: Company name should be displayed
              expect(container.textContent).toContain(company.name)

              // Property 3: Action buttons should be present
              const buttons = container.querySelectorAll('button')
              const buttonTexts = Array.from(buttons).map(btn => btn.textContent?.toLowerCase() || '')
              expect(buttonTexts.some(text => text.includes('share'))).toBe(true)
              expect(buttonTexts.some(text => text.includes('print'))).toBe(true)
              expect(buttonTexts.some(text => text.includes('download'))).toBe(true)

              // Property 4: Report content should be rendered
              if (consistentReport.htmlContent.trim()) {
                // HTML content should be present in the DOM
                const reportContent = container.querySelector('.report-content')
                expect(reportContent).toBeTruthy()
              }

              // Property 5: Metadata should be displayed
              expect(container.textContent).toContain(consistentReport.metadata.generationDuration.toString())
              expect(container.textContent).toContain(consistentReport.metadata.bedrockModel)

              // Property 6: Assessment type should be displayed correctly
              const expectedTypeLabel = assessment.type === 'EXPLORATORY' 
                ? 'Exploratory Assessment' 
                : 'Migration Assessment'
              expect(container.textContent).toContain(expectedTypeLabel)

              // Property 7: Pagination should be present
              expect(container.textContent).toContain('Page')

              // Property 8: Generation date should be displayed
              expect(container.textContent).toContain(consistentReport.generatedAt.toLocaleDateString())

              return true
            } finally {
              unmount()
            }
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles missing onBack prop gracefully', () => {
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      // Should not show back button when onBack is not provided
      expect(screen.queryByRole('button', { name: /back to dashboard/i })).not.toBeInTheDocument()
    })

    it('handles very long company names', () => {
      const longNameCompany = {
        ...mockCompany,
        name: 'A'.repeat(100)
      }
      
      render(
        <ReportViewer
          report={mockReport}
          assessment={mockAssessment}
          company={longNameCompany}
        />
      )

      // Should render without breaking layout
      expect(screen.getByText(longNameCompany.name)).toBeInTheDocument()
    })

    it('handles malformed HTML content gracefully', () => {
      const malformedReport = {
        ...mockReport,
        htmlContent: '<div><h1>Unclosed tag<p>Missing closing div'
      }
      
      render(
        <ReportViewer
          report={malformedReport}
          assessment={mockAssessment}
          company={mockCompany}
        />
      )

      // Should render without crashing
      expect(screen.getByText('AI Assessment Report')).toBeInTheDocument()
    })
  })
})