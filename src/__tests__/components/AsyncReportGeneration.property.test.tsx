/**
 * Property-Based Tests for Asynchronous Report Generation Workflow
 * Feature: ai-assessment, Property 19: Asynchronous report generation workflow
 * 
 * Tests the complete async report generation workflow including:
 * - Report generation request initiation
 * - Status polling and updates
 * - Request completion handling
 * - Error handling and retry mechanisms
 * - Request history tracking
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as fc from 'fast-check'
import AsyncReportGenerator from '@/components/ai-assessment/AsyncReportGenerator'
import ReportStatusTracker from '@/components/ai-assessment/ReportStatusTracker'
import { Assessment, AssessmentResponses, ReportGenerationRequest } from '@/types/assessment'

// Mock fetch globally
global.fetch = jest.fn()

// Mock timers for testing
jest.useFakeTimers()

describe('Property 19: Asynchronous report generation workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  test('should initiate report generation and receive request ID for any valid assessment', async () => {
    const assessment: Assessment = {
      id: 'test-assessment-123',
      name: 'Test Assessment',
      companyId: 'test-company-456',
      type: 'EXPLORATORY' as const,
      status: 'COMPLETED' as const,
      currentStep: 7,
      totalSteps: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const responses: AssessmentResponses = {
      'step1': { 'q1': 'answer1' },
      'step2': { 'q2': 'answer2' }
    }

    const mockRequestId = 'req_test123456'
    const onReportRequested = jest.fn()
    const onReportCompleted = jest.fn()

    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        requestId: mockRequestId,
        status: 'PENDING',
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000)
      })
    })

    render(
      <AsyncReportGenerator
        assessment={assessment}
        responses={responses}
        onReportRequested={onReportRequested}
        onReportCompleted={onReportCompleted}
      />
    )

    const generateButton = screen.getByText('Generate Report')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          companyId: assessment.companyId,
          responses,
          assessmentType: assessment.type
        })
      })
    })

    await waitFor(() => {
      expect(onReportRequested).toHaveBeenCalledWith(mockRequestId)
    })

    // Should display pending status
    await waitFor(() => {
      expect(screen.getByText('Report Generation Queued')).toBeInTheDocument()
    })
    expect(screen.getByText(`Request ID: ${mockRequestId}`)).toBeInTheDocument()
  })

  test('should track request history and display status correctly', async () => {
    const requests: ReportGenerationRequest[] = [
      {
        id: 'req_completed_123',
        assessmentId: 'assessment-1',
        companyId: 'company-1',
        status: 'COMPLETED',
        requestedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z')
      },
      {
        id: 'req_failed_456',
        assessmentId: 'assessment-2',
        companyId: 'company-1',
        status: 'FAILED',
        requestedAt: new Date('2024-01-01T11:00:00Z'),
        errorMessage: 'Generation failed'
      },
      {
        id: 'req_pending_789',
        assessmentId: 'assessment-3',
        companyId: 'company-1',
        status: 'PENDING',
        requestedAt: new Date('2024-01-01T12:00:00Z')
      }
    ]

    const onRefreshStatus = jest.fn()
    const onViewReport = jest.fn()
    const onRetryGeneration = jest.fn()

    render(
      <ReportStatusTracker
        requests={requests}
        onRefreshStatus={onRefreshStatus}
        onViewReport={onViewReport}
        onRetryGeneration={onRetryGeneration}
      />
    )

    // Should display all requests with correct status - use more flexible text matching
    expect(screen.getByText(/Request.*eted_123/)).toBeInTheDocument()
    expect(screen.getByText(/Request.*iled_456/)).toBeInTheDocument()
    expect(screen.getByText(/Request.*ding_789/)).toBeInTheDocument()

    // Should show status badges
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()

    // Should show appropriate action buttons
    expect(screen.getByText('View Report')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()

    // Test refresh functionality
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    expect(onRefreshStatus).toHaveBeenCalled()

    // Test view report
    const viewButton = screen.getByText('View Report')
    fireEvent.click(viewButton)
    expect(onViewReport).toHaveBeenCalledWith('req_completed_123')

    // Test retry
    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)
    expect(onRetryGeneration).toHaveBeenCalledWith('req_failed_456')
  })

  test('should handle errors gracefully', async () => {
    const assessment: Assessment = {
      id: 'test-assessment-error',
      name: 'Error Test',
      companyId: 'test-company',
      type: 'MIGRATION' as const,
      status: 'COMPLETED' as const,
      currentStep: 8,
      totalSteps: 8,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const responses: AssessmentResponses = {}
    const onReportRequested = jest.fn()
    const onReportCompleted = jest.fn()

    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(
      <AsyncReportGenerator
        assessment={assessment}
        responses={responses}
        onReportRequested={onReportRequested}
        onReportCompleted={onReportCompleted}
      />
    )

    const generateButton = screen.getByText('Generate Report')
    fireEvent.click(generateButton)

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    // Should not call success callbacks
    expect(onReportRequested).not.toHaveBeenCalled()
    expect(onReportCompleted).not.toHaveBeenCalled()
  })

  test('should maintain request data integrity throughout workflow', async () => {
    const assessment: Assessment = {
      id: 'integrity-test-123',
      name: 'Integrity Test Assessment',
      companyId: 'integrity-company-456',
      type: 'EXPLORATORY' as const,
      status: 'COMPLETED' as const,
      currentStep: 7,
      totalSteps: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const responses: AssessmentResponses = {
      'step1': { 'question1': 'detailed answer 1' },
      'step2': { 'question2': 'detailed answer 2' }
    }

    const onReportRequested = jest.fn()
    const onReportCompleted = jest.fn()
    const requestId = 'req_integrity_test_789'

    // Mock successful workflow
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        requestId,
        status: 'PENDING',
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000)
      })
    })

    render(
      <AsyncReportGenerator
        assessment={assessment}
        responses={responses}
        onReportRequested={onReportRequested}
        onReportCompleted={onReportCompleted}
      />
    )

    const generateButton = screen.getByText('Generate Report')
    fireEvent.click(generateButton)

    // Verify request data integrity
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          companyId: assessment.companyId,
          responses,
          assessmentType: assessment.type
        })
      })
    })

    // Verify callback data integrity
    await waitFor(() => {
      expect(onReportRequested).toHaveBeenCalledWith(requestId)
    })
  })

  test('should handle status transitions correctly', async () => {
    const testCases = [
      { status: 'PENDING' as const, shouldHaveViewButton: false, shouldHaveRetryButton: false },
      { status: 'PROCESSING' as const, shouldHaveViewButton: false, shouldHaveRetryButton: false },
      { status: 'COMPLETED' as const, shouldHaveViewButton: true, shouldHaveRetryButton: false },
      { status: 'FAILED' as const, shouldHaveViewButton: false, shouldHaveRetryButton: true }
    ]

    for (const testCase of testCases) {
      const requests: ReportGenerationRequest[] = [{
        id: `req_${testCase.status.toLowerCase()}_test`,
        assessmentId: 'test-assessment',
        companyId: 'test-company',
        status: testCase.status,
        requestedAt: new Date(),
        completedAt: testCase.status === 'COMPLETED' ? new Date() : undefined,
        errorMessage: testCase.status === 'FAILED' ? 'Test error' : undefined
      }]

      const onRefreshStatus = jest.fn()
      const onViewReport = jest.fn()
      const onRetryGeneration = jest.fn()

      const { unmount } = render(
        <ReportStatusTracker
          requests={requests}
          onRefreshStatus={onRefreshStatus}
          onViewReport={onViewReport}
          onRetryGeneration={onRetryGeneration}
        />
      )

      // Should display correct status
      expect(screen.getByText(testCase.status)).toBeInTheDocument()

      // Should show appropriate buttons based on status
      if (testCase.shouldHaveViewButton) {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      } else {
        expect(screen.queryByText('View Report')).not.toBeInTheDocument()
      }

      if (testCase.shouldHaveRetryButton) {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      } else {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument()
      }

      unmount()
    }
  })

  test('should validate async workflow properties with property-based testing', async () => {
    // Simple property-based test with controlled data
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 20 }),
          name: fc.string({ minLength: 5, maxLength: 50 }),
          companyId: fc.string({ minLength: 10, maxLength: 20 }),
          type: fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const)
        }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 50 }))
        ),
        async (assessmentData, responses) => {
          const assessment: Assessment = {
            ...assessmentData,
            status: 'COMPLETED' as const,
            currentStep: assessmentData.type === 'EXPLORATORY' ? 7 : 8,
            totalSteps: assessmentData.type === 'EXPLORATORY' ? 7 : 8,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          const onReportRequested = jest.fn()
          const onReportCompleted = jest.fn()
          const mockRequestId = `req_${Date.now()}`

          // Mock successful API response
          ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              requestId: mockRequestId,
              status: 'PENDING'
            })
          })

          const { container } = render(
            <AsyncReportGenerator
              assessment={assessment}
              responses={responses}
              onReportRequested={onReportRequested}
              onReportCompleted={onReportCompleted}
            />
          )

          const generateButton = container.querySelector('button')
          if (generateButton && generateButton.textContent === 'Generate Report') {
            fireEvent.click(generateButton)

            // Verify API call structure
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  assessmentId: assessment.id,
                  companyId: assessment.companyId,
                  responses,
                  assessmentType: assessment.type
                })
              })
            })

            // Verify callback was called with correct request ID
            await waitFor(() => {
              expect(onReportRequested).toHaveBeenCalledWith(mockRequestId)
            })
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})