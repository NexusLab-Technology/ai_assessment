import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AssessmentContainer from '../../components/ai-assessment/AssessmentContainer'
import { Company } from '../../types/assessment'

// Mock the API client
jest.mock('../../lib/mock-api-client', () => ({
  mockAssessmentApi: {
    getAll: jest.fn().mockResolvedValue([
      {
        id: 'assessment-1',
        name: 'Test Assessment',
        companyId: 'company-1',
        type: 'EXPLORATORY',
        status: 'DRAFT',
        currentStep: 1,
        totalSteps: 7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]),
    create: jest.fn().mockResolvedValue({
      id: 'new-assessment',
      name: 'New Assessment',
      companyId: 'company-1',
      type: 'EXPLORATORY',
      status: 'DRAFT',
      currentStep: 1,
      totalSteps: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}))

const mockCompany: Company = {
  id: 'company-1',
  name: 'Test Company',
  description: 'A test company',
  createdAt: new Date('2024-01-01'),
  assessmentCount: 1
}

describe('AssessmentContainer Company Locking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calls onCompanySelectorDisabled when assessment starts', async () => {
    const mockOnCompanySelectorDisabled = jest.fn()
    
    render(
      <AssessmentContainer 
        selectedCompany={mockCompany} 
        onCompanySelectorDisabled={mockOnCompanySelectorDisabled}
      />
    )
    
    // Wait for assessments to load
    await waitFor(() => {
      expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    })

    // Initially, company selector should not be disabled
    expect(mockOnCompanySelectorDisabled).toHaveBeenCalledWith(false)

    // Start creating a new assessment
    const newAssessmentButton = screen.getByText('New Assessment')
    fireEvent.click(newAssessmentButton)

    // Should show the wizard with the input field
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)).toBeInTheDocument()
    })
    
    // Should still not be disabled in wizard mode
    expect(mockOnCompanySelectorDisabled).toHaveBeenCalledWith(false)
  })

  it('shows dashboard when no company is selected', () => {
    render(<AssessmentContainer selectedCompany={null} />)
    
    expect(screen.getByText('No company selected')).toBeInTheDocument()
    expect(screen.getByText('Please select a company to view and manage assessments.')).toBeInTheDocument()
  })

  it('loads assessments when company is provided', async () => {
    render(<AssessmentContainer selectedCompany={mockCompany} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    })

    expect(screen.getByText('Assessments for Test Company')).toBeInTheDocument()
    expect(screen.getByText('1 assessment found')).toBeInTheDocument()
  })
})