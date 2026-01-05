/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportGenerator from '../../components/ai-assessment/ReportGenerator'
import { Assessment, Company } from '../../types/assessment'

// Mock fetch
global.fetch = jest.fn()

describe('ReportGenerator Component', () => {
  const mockCompany: Company = {
    id: 'company-1',
    name: 'Test Company',
    industry: 'Technology',
    size: 'MEDIUM',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockCompletedAssessment: Assessment = {
    id: 'assessment-1',
    companyId: 'company-1',
    name: 'Test Assessment',
    type: 'EXPLORATORY',
    status: 'COMPLETED',
    currentStep: 7,
    totalSteps: 7,
    responses: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date()
  }

  const mockInProgressAssessment: Assessment = {
    ...mockCompletedAssessment,
    status: 'IN_PROGRESS',
    currentStep: 3,
    completedAt: undefined
  }

  const mockOnReportGenerated = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    it('renders the report generator with completed assessment', () => {
      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      expect(screen.getByText('AI-Powered Report Generation')).toBeInTheDocument()
      expect(screen.getByText(/Generate a comprehensive assessment report/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate Report/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate Report/ })).not.toBeDisabled()
    })

    it('shows warning for incomplete assessment', () => {
      render(
        <ReportGenerator
          assessment={mockInProgressAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      expect(screen.getByText('Complete the assessment to generate a report')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate Report/ })).toBeDisabled()
    })

    it('displays information about AI report generation', () => {
      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      expect(screen.getByText('About AI Report Generation')).toBeInTheDocument()
      expect(screen.getByText(/Reports are generated using AWS Bedrock/)).toBeInTheDocument()
    })
  })

  describe('Report Generation', () => {
    it('generates report successfully', async () => {
      const user = userEvent.setup()
      const mockReportId = 'report-123'
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      ;(global.fetch as jest.Mock).mockReturnValueOnce(mockPromise)

      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      await user.click(generateButton)

      // Should show loading state immediately
      await waitFor(() => {
        expect(screen.getByText('Generating your AI-powered report...')).toBeInTheDocument()
      })

      // Now resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: { reportId: mockReportId }
        })
      })

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Report Generated Successfully!')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /View Report/ })).toBeInTheDocument()
      expect(mockOnReportGenerated).toHaveBeenCalledWith(mockReportId)

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: mockCompletedAssessment.id,
          companyId: mockCompany.id
        })
      })
    })

    it('handles report generation error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'AWS credentials not configured'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: errorMessage
        })
      })

      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      await user.click(generateButton)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Report Generation Failed')).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      expect(mockOnReportGenerated).not.toHaveBeenCalled()
    })

    it('handles network error', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      await user.click(generateButton)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Report Generation Failed')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      expect(mockOnReportGenerated).not.toHaveBeenCalled()
    })

    it('does not generate report for incomplete assessment', async () => {
      const user = userEvent.setup()

      render(
        <ReportGenerator
          assessment={mockInProgressAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      expect(generateButton).toBeDisabled()

      // Try to click (should not work)
      await user.click(generateButton)

      expect(global.fetch).not.toHaveBeenCalled()
      expect(mockOnReportGenerated).not.toHaveBeenCalled()
    })
  })

  describe('Success State Actions', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      const mockReportId = 'report-123'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { reportId: mockReportId }
        })
      })

      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      await user.click(generateButton)

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Report Generated Successfully!')).toBeInTheDocument()
      })
    })

    it('opens report in new tab when view report is clicked', async () => {
      const user = userEvent.setup()
      const mockOpen = jest.fn()
      Object.defineProperty(window, 'open', { value: mockOpen })

      const viewReportButton = screen.getByRole('button', { name: /View Report/ })
      await user.click(viewReportButton)

      expect(mockOpen).toHaveBeenCalledWith('/api/reports/report-123', '_blank')
    })

    it('resets to idle state when generate another is clicked', async () => {
      const user = userEvent.setup()

      const generateAnotherButton = screen.getByRole('button', { name: /Generate Another/ })
      await user.click(generateAnotherButton)

      // Should return to initial state
      expect(screen.getByRole('button', { name: /Generate Report/ })).toBeInTheDocument()
      expect(screen.queryByText('Report Generated Successfully!')).not.toBeInTheDocument()
    })
  })

  describe('Error State Actions', () => {
    it('allows retry after error', async () => {
      const user = userEvent.setup()
      
      // First call fails
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' })
      })

      render(
        <ReportGenerator
          assessment={mockCompletedAssessment}
          company={mockCompany}
          onReportGenerated={mockOnReportGenerated}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate Report/ })
      await user.click(generateButton)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Report Generation Failed')).toBeInTheDocument()
      })

      // Create a controlled promise for the retry
      let resolveRetryPromise: (value: any) => void
      const retryPromise = new Promise((resolve) => {
        resolveRetryPromise = resolve
      })
      
      ;(global.fetch as jest.Mock).mockReturnValueOnce(retryPromise)

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/ })
      await user.click(tryAgainButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Generating your AI-powered report...')).toBeInTheDocument()
      })

      // Resolve the retry promise
      resolveRetryPromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: { reportId: 'report-456' }
        })
      })

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Report Generated Successfully!')).toBeInTheDocument()
      })

      expect(mockOnReportGenerated).toHaveBeenCalledWith('report-456')
    })
  })
})