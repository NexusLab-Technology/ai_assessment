import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIAssessmentPage from '../../app/ai-assessment/page'

// Mock the ApplicationShell and RouteGuard
jest.mock('../../components/ApplicationShell', () => ({
  ApplicationShell: ({ children }: { children: React.ReactNode }) => <div data-testid="application-shell">{children}</div>
}))

jest.mock('../../components/RouteGuard', () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <div data-testid="route-guard">{children}</div>
}))

// Mock the API client
jest.mock('../../lib/mock-api-client', () => ({
  mockCompanyApi: {
    getAll: jest.fn().mockResolvedValue([
      {
        id: 'company-1',
        name: 'Test Company',
        description: 'A test company',
        createdAt: new Date('2024-01-01'),
        assessmentCount: 1
      }
    ])
  },
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
    ])
  }
}))

describe('AIAssessmentPage Layout', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('renders with ApplicationShell and RouteGuard wrappers', async () => {
    render(<AIAssessmentPage />)
    
    // Wait for loading to complete first
    await waitFor(() => {
      expect(screen.queryByText('Loading AI Assessment...')).not.toBeInTheDocument()
    })

    // Check header elements
    expect(screen.getByText('AI Assessment')).toBeInTheDocument()
    expect(screen.getByText('Create and manage AI-powered assessments')).toBeInTheDocument()
    expect(screen.getByText('Company:')).toBeInTheDocument()
    
    // Check that company selector is present
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })
  })

  it('shows company selector in compact mode', async () => {
    render(<AIAssessmentPage />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    // Check that the company selector is in compact mode (button style)
    const companyButton = screen.getByRole('button', { name: /test company/i })
    expect(companyButton).toBeInTheDocument()
    expect(companyButton).toHaveClass('relative w-full bg-white border')
  })

  it('maintains proper layout structure with ApplicationShell', async () => {
    render(<AIAssessmentPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    // Check that main content area exists
    const mainContent = document.querySelector('.flex-1.overflow-hidden')
    expect(mainContent).toBeInTheDocument()
  })
})