/**
 * Integration tests for Assessment Status UI feature
 * Feature: assessment-status-ui, Task 9.1
 * Tests complete workflows from assessment list to edit/view modes
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AssessmentContainer from '../../components/ai-assessment/AssessmentContainer'
import { assessmentApi } from '../../lib/api-client'
import { Assessment } from '@/types/assessment'

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  assessmentApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getResponses: jest.fn(),
    getQuestionnaireSections: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    saveResponses: jest.fn()
  }
}))

const mockAssessmentApi = assessmentApi as jest.Mocked<typeof assessmentApi>

// Mock the useAssessmentViewer hook
jest.mock('../../hooks/useAssessmentViewer', () => ({
  useAssessmentViewer: jest.fn(() => ({
    assessment: {
      id: 'test-assessment-1',
      name: 'Test Assessment',
      type: 'EXPLORATORY',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 3,
      totalSteps: 3,
      completedAt: new Date().toISOString()
    },
    responses: {
      'step-1': { 'q1': 'answer1' },
      'step-2': { 'q2': 'answer2' }
    },
    sections: [
      {
        id: 'step-1',
        title: 'Step 1',
        description: 'First step',
        stepNumber: 1,
        questions: [
          {
            id: 'q1',
            type: 'text',
            label: 'Question 1',
            required: true
          }
        ]
      }
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn()
  }))
}))

describe('Assessment Status UI Integration Tests', () => {
  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    industry: 'Technology',
    size: 'MEDIUM',
    createdAt: new Date(),
    updatedAt: new Date(),
    assessmentCount: 3
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display different icons for different assessment statuses', async () => {
    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-1',
        name: 'Draft Assessment',
        type: 'EXPLORATORY' as const,
        status: 'DRAFT' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 1,
        totalSteps: 5
      },
      {
        id: 'assessment-2',
        name: 'In Progress Assessment',
        type: 'MIGRATION' as const,
        status: 'IN_PROGRESS' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 3,
        totalSteps: 5
      },
      {
        id: 'assessment-3',
        name: 'Completed Assessment',
        type: 'EXPLORATORY' as const,
        status: 'COMPLETED' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 5,
        totalSteps: 5,
        completedAt: new Date()
      }
    ]

    mockAssessmentApi.getAll.mockResolvedValue(mockAssessments)

    render(<AssessmentContainer selectedCompany={mockCompany} />)

    await waitFor(() => {
      expect(screen.getByText('Draft Assessment')).toBeInTheDocument()
      expect(screen.getByText('In Progress Assessment')).toBeInTheDocument()
      expect(screen.getByText('Completed Assessment')).toBeInTheDocument()
    })

    // Verify different status indicators are present
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should show edit icon for incomplete assessments and view icon for completed ones', async () => {
    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-incomplete',
        name: 'Incomplete Assessment',
        type: 'EXPLORATORY' as const,
        status: 'IN_PROGRESS' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 2,
        totalSteps: 5
      },
      {
        id: 'assessment-complete',
        name: 'Complete Assessment',
        type: 'MIGRATION' as const,
        status: 'COMPLETED' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 5,
        totalSteps: 5,
        completedAt: new Date()
      }
    ]

    mockAssessmentApi.getAll.mockResolvedValue(mockAssessments)

    render(<AssessmentContainer selectedCompany={mockCompany} />)

    await waitFor(() => {
      expect(screen.getByText('Incomplete Assessment')).toBeInTheDocument()
      expect(screen.getByText('Complete Assessment')).toBeInTheDocument()
    })

    // Find action buttons by their title attributes
    const editButton = screen.getByTitle('Edit Assessment')
    const viewButton = screen.getByTitle('View Assessment')

    expect(editButton).toBeInTheDocument()
    expect(viewButton).toBeInTheDocument()
  })

  it('should open AssessmentViewer when clicking view button on completed assessment', async () => {
    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-complete',
        name: 'Complete Assessment',
        type: 'EXPLORATORY' as const,
        status: 'COMPLETED' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 3,
        totalSteps: 3,
        completedAt: new Date()
      }
    ]

    mockAssessmentApi.getAll.mockResolvedValue(mockAssessments)

    render(<AssessmentContainer selectedCompany={mockCompany} />)

    await waitFor(() => {
      expect(screen.getByText('Complete Assessment')).toBeInTheDocument()
    })

    // Click the view button
    const viewButton = screen.getByTitle('View Assessment')
    fireEvent.click(viewButton)

    // Should show the AssessmentViewer modal
    await waitFor(() => {
      expect(screen.getByText('Test Assessment')).toBeInTheDocument() // From mocked hook
      expect(screen.getByText('Exploratory Assessment')).toBeInTheDocument()
    })
  })

  it('should handle assessment viewer errors gracefully', async () => {
    // Mock the hook to return an error state
    const mockUseAssessmentViewer = require('../../hooks/useAssessmentViewer').useAssessmentViewer
    mockUseAssessmentViewer.mockReturnValue({
      assessment: null,
      responses: null,
      sections: null,
      isLoading: false,
      error: 'Assessment not found',
      refetch: jest.fn()
    })

    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-complete',
        name: 'Complete Assessment',
        type: 'EXPLORATORY' as const,
        status: 'COMPLETED' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 3,
        totalSteps: 3,
        completedAt: new Date()
      }
    ]

    mockAssessmentApi.getAll.mockResolvedValue(mockAssessments)

    render(<AssessmentContainer selectedCompany={mockCompany} />)

    await waitFor(() => {
      expect(screen.getByText('Complete Assessment')).toBeInTheDocument()
    })

    // Click the view button
    const viewButton = screen.getByTitle('View Assessment')
    fireEvent.click(viewButton)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Failed to Load Assessment')).toBeInTheDocument()
      expect(screen.getByText('Assessment not found')).toBeInTheDocument()
    })
  })

  it('should show loading state while fetching assessment data', async () => {
    // Mock the hook to return loading state
    const mockUseAssessmentViewer = require('../../hooks/useAssessmentViewer').useAssessmentViewer
    mockUseAssessmentViewer.mockReturnValue({
      assessment: null,
      responses: null,
      sections: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    })

    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-complete',
        name: 'Complete Assessment',
        type: 'EXPLORATORY' as const,
        status: 'COMPLETED' as const,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: 3,
        totalSteps: 3,
        completedAt: new Date()
      }
    ]

    mockAssessmentApi.getAll.mockResolvedValue(mockAssessments)

    render(<AssessmentContainer selectedCompany={mockCompany} />)

    await waitFor(() => {
      expect(screen.getByText('Complete Assessment')).toBeInTheDocument()
    })

    // Click the view button
    const viewButton = screen.getByTitle('View Assessment')
    fireEvent.click(viewButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading assessment data...')).toBeInTheDocument()
    })
  })
})