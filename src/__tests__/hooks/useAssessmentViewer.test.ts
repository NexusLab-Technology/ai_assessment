/**
 * Unit tests for useAssessmentViewer hook
 * Feature: assessment-status-ui, Task 4.1
 */

const { renderHook, waitFor } = require('@testing-library/react')
const { useAssessmentViewer } = require('../../hooks/useAssessmentViewer')

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  assessmentApi: {
    getById: jest.fn(),
    getResponses: jest.fn(),
    getQuestionnaireSections: jest.fn()
  }
}))

const { assessmentApi } = require('../../lib/api-client')
const mockAssessmentApi = assessmentApi

describe('useAssessmentViewer Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load assessment data successfully', async () => {
    const mockAssessment = {
      id: 'test-id',
      name: 'Test Assessment',
      type: 'EXPLORATORY',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 1,
      totalSteps: 3
    }

    const mockResponses = {
      assessmentId: 'test-id',
      responses: {
        'step-1': {
          'question-1': 'answer-1'
        }
      },
      currentStep: 1,
      totalSteps: 3,
      status: 'COMPLETED'
    }

    const mockSections = {
      type: 'exploratory',
      sections: [
        {
          id: 'step-1',
          title: 'Step 1',
          description: 'Test step',
          stepNumber: 1,
          questions: [
            {
              id: 'question-1',
              type: 'text',
              label: 'Test Question',
              required: true
            }
          ]
        }
      ]
    }

    mockAssessmentApi.getById.mockResolvedValue(mockAssessment)
    mockAssessmentApi.getResponses.mockResolvedValue(mockResponses)
    mockAssessmentApi.getQuestionnaireSections.mockResolvedValue(mockSections)

    const { result } = renderHook(() => useAssessmentViewer('test-id'))

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.assessment).toBe(null)
    expect(result.current.responses).toBe(null)
    expect(result.current.sections).toBe(null)
    expect(result.current.error).toBe(null)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Check loaded data
    expect(result.current.assessment).toEqual(mockAssessment)
    expect(result.current.responses).toEqual(mockResponses.responses)
    expect(result.current.sections).toEqual(mockSections.sections)
    expect(result.current.error).toBe(null)

    // Verify API calls
    expect(mockAssessmentApi.getById).toHaveBeenCalledWith('test-id')
    expect(mockAssessmentApi.getResponses).toHaveBeenCalledWith('test-id')
    expect(mockAssessmentApi.getQuestionnaireSections).toHaveBeenCalledWith('exploratory')
  })

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Assessment not found'
    mockAssessmentApi.getById.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useAssessmentViewer('invalid-id'))

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Check error state
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.assessment).toBe(null)
    expect(result.current.responses).toBe(null)
    expect(result.current.sections).toBe(null)
  })

  it('should handle missing assessment type', async () => {
    const mockAssessment = {
      id: 'test-id',
      name: 'Test Assessment',
      type: null, // Missing type
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 1,
      totalSteps: 3
    }

    const mockResponses = {
      assessmentId: 'test-id',
      responses: {},
      currentStep: 1,
      totalSteps: 3,
      status: 'COMPLETED'
    }

    mockAssessmentApi.getById.mockResolvedValue(mockAssessment)
    mockAssessmentApi.getResponses.mockResolvedValue(mockResponses)

    const { result } = renderHook(() => useAssessmentViewer('test-id'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should load assessment and responses but not sections
    expect(result.current.assessment).toEqual(mockAssessment)
    expect(result.current.responses).toEqual(mockResponses.responses)
    expect(result.current.sections).toBe(null)
    expect(result.current.error).toBe(null)

    // Should not call getQuestionnaireSections
    expect(mockAssessmentApi.getQuestionnaireSections).not.toHaveBeenCalled()
  })

  it('should support refetch functionality', async () => {
    const mockAssessment = {
      id: 'test-id',
      name: 'Test Assessment',
      type: 'MIGRATION',
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 2,
      totalSteps: 5
    }

    const mockResponses = {
      assessmentId: 'test-id',
      responses: {
        'step-1': { 'q1': 'a1' },
        'step-2': { 'q2': 'a2' }
      },
      currentStep: 2,
      totalSteps: 5,
      status: 'IN_PROGRESS'
    }

    const mockSections = {
      type: 'migration',
      sections: [
        {
          id: 'step-1',
          title: 'Migration Step 1',
          description: 'Test migration step',
          stepNumber: 1,
          questions: []
        }
      ]
    }

    mockAssessmentApi.getById.mockResolvedValue(mockAssessment)
    mockAssessmentApi.getResponses.mockResolvedValue(mockResponses)
    mockAssessmentApi.getQuestionnaireSections.mockResolvedValue(mockSections)

    const { result } = renderHook(() => useAssessmentViewer('test-id'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear mocks to test refetch
    jest.clearAllMocks()

    // Call refetch
    await result.current.refetch()

    // Verify refetch calls the APIs again
    expect(mockAssessmentApi.getById).toHaveBeenCalledWith('test-id')
    expect(mockAssessmentApi.getResponses).toHaveBeenCalledWith('test-id')
    expect(mockAssessmentApi.getQuestionnaireSections).toHaveBeenCalledWith('migration')
  })

  it('should handle partial API failures', async () => {
    const mockAssessment = {
      id: 'test-id',
      name: 'Test Assessment',
      type: 'EXPLORATORY',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 1,
      totalSteps: 3
    }

    const mockResponses = {
      assessmentId: 'test-id',
      responses: { 'step-1': { 'q1': 'a1' } },
      currentStep: 1,
      totalSteps: 3,
      status: 'COMPLETED'
    }

    // Assessment and responses succeed, but questionnaire sections fail
    mockAssessmentApi.getById.mockResolvedValue(mockAssessment)
    mockAssessmentApi.getResponses.mockResolvedValue(mockResponses)
    mockAssessmentApi.getQuestionnaireSections.mockRejectedValue(new Error('Questionnaire not found'))

    const { result } = renderHook(() => useAssessmentViewer('test-id'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should show error but keep successfully loaded data
    expect(result.current.error).toBe('Questionnaire not found')
    expect(result.current.assessment).toEqual(mockAssessment)
    expect(result.current.responses).toEqual(mockResponses.responses)
    expect(result.current.sections).toBe(null)
  })
})