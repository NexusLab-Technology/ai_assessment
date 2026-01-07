/**
 * Integration Test: Category Navigation with Real Data (Simplified)
 * Task 15.2: Test end-to-end category navigation with real data
 * Requirements: 12.1, 12.4, 12.5
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedCategoryNavigationSidebar } from '@/components/ai-assessment/EnhancedCategoryNavigationSidebar'
import type { 
  RAPIDQuestionnaireStructure, 
  Assessment, 
  AssessmentType 
} from '@/types/rapid-questionnaire'

// Mock the error handler hook
jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    error: null,
    isLoading: false,
    executeWithErrorHandling: jest.fn((fn) => fn()),
    retry: jest.fn(),
    clearError: jest.fn()
  })
}))

describe('Category Navigation Integration Tests (Simplified)', () => {
  let mockQuestionnaire: RAPIDQuestionnaireStructure
  let mockAssessment: Assessment
  let mockOnCategoryChange: jest.Mock
  let mockOnSubcategoryChange: jest.Mock
  let mockOnStatusUpdate: jest.Mock

  beforeEach(() => {
    // Create simple mock questionnaire
    mockQuestionnaire = {
      version: '3.0',
      assessmentType: 'EXPLORATORY' as AssessmentType,
      totalQuestions: 6,
      categories: [
        {
          id: 'use-case-discovery',
          title: 'Use Case Discovery',
          description: 'Identify and prioritize AI use cases',
          subcategories: [
            {
              id: 'business-objectives',
              title: 'Business Objectives',
              questions: [
                {
                  id: 'q1',
                  number: '1',
                  text: 'What are your primary business objectives?',
                  type: 'textarea',
                  required: true,
                  category: 'use-case-discovery',
                  subcategory: 'business-objectives'
                },
                {
                  id: 'q2',
                  number: '2',
                  text: 'How do you measure success?',
                  type: 'text',
                  required: false,
                  category: 'use-case-discovery',
                  subcategory: 'business-objectives'
                }
              ],
              questionCount: 2
            }
          ],
          totalQuestions: 2,
          completionPercentage: 0,
          status: 'not_started'
        },
        {
          id: 'data-readiness',
          title: 'Data Readiness',
          description: 'Assess data quality and availability',
          subcategories: [
            {
              id: 'data-quality',
              title: 'Data Quality',
              questions: [
                {
                  id: 'q3',
                  number: '3',
                  text: 'How would you rate your data quality?',
                  type: 'radio',
                  required: true,
                  options: ['Excellent', 'Good', 'Fair', 'Poor'],
                  category: 'data-readiness',
                  subcategory: 'data-quality'
                }
              ],
              questionCount: 1
            }
          ],
          totalQuestions: 1,
          completionPercentage: 0,
          status: 'not_started'
        }
      ],
      lastUpdated: new Date()
    }

    // Create mock assessment with some responses
    mockAssessment = {
      id: 'test-assessment-123',
      name: 'Test Assessment',
      companyId: 'company-123',
      userId: 'user-123',
      type: 'EXPLORATORY',
      status: 'IN_PROGRESS',
      currentCategory: 'use-case-discovery',
      totalCategories: 2,
      responses: {
        'use-case-discovery': {
          'q1': 'Improve customer satisfaction and reduce costs'
          // q2 not answered yet
        }
        // data-readiness not started
      },
      categoryStatuses: {},
      rapidQuestionnaireVersion: '3.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Setup mocks
    mockOnCategoryChange = jest.fn()
    mockOnSubcategoryChange = jest.fn()
    mockOnStatusUpdate = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render categories with RAPID data structure', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onSubcategoryChange={mockOnSubcategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Verify categories are rendered
      expect(screen.getByText('Use Case Discovery')).toBeInTheDocument()
      expect(screen.getByText('Data Readiness')).toBeInTheDocument()

      // Verify descriptions
      expect(screen.getByText('Identify and prioritize AI use cases')).toBeInTheDocument()
      expect(screen.getByText('Assess data quality and availability')).toBeInTheDocument()
    })

    it('should handle category selection', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Data Readiness')).toBeInTheDocument()
      })

      // Click on Data Readiness category
      const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(dataReadinessButton)
      })

      // Verify category change callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
    })

    it('should display completion status', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      await waitFor(() => {
        // Use Case Discovery: 1/2 questions answered (50%)
        expect(screen.getByText('1/2 questions')).toBeInTheDocument()
        
        // Data Readiness: 0/1 questions answered (0%)
        expect(screen.getByText('0/1 questions')).toBeInTheDocument()
      })
    })

    it('should show subcategories when category is active', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            currentSubcategory="business-objectives"
            onCategoryChange={mockOnCategoryChange}
            onSubcategoryChange={mockOnSubcategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      await waitFor(() => {
        // Verify subcategories are shown for active category
        expect(screen.getByText('Business Objectives')).toBeInTheDocument()
        
        // Verify subcategory completion count
        expect(screen.getByText('1/2')).toBeInTheDocument() // Business Objectives: 1/2 answered
      })

      // Click on subcategory
      const subcategoryButton = screen.getByRole('button', { name: /Business Objectives/ })
      
      await act(async () => {
        fireEvent.click(subcategoryButton)
      })

      expect(mockOnSubcategoryChange).toHaveBeenCalledWith('business-objectives')
    })

    it('should show progress summary', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      await waitFor(() => {
        // Progress Summary section
        expect(screen.getByText('Progress Summary')).toBeInTheDocument()
        
        // Should show overall progress
        expect(screen.getByText('Overall Progress')).toBeInTheDocument()
      })
    })
  })

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 12.1: Category-based navigation', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Should display all categories
      expect(screen.getByText('Use Case Discovery')).toBeInTheDocument()
      expect(screen.getByText('Data Readiness')).toBeInTheDocument()

      // Should allow navigation between categories
      const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(dataReadinessButton)
      })

      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
    })

    it('should satisfy Requirement 12.4: Real-time completion status', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      await waitFor(() => {
        // Should show completion status for categories
        expect(screen.getByText('1/2 questions')).toBeInTheDocument() // Use Case Discovery
        expect(screen.getByText('0/1 questions')).toBeInTheDocument() // Data Readiness
      })
    })

    it('should satisfy Requirement 12.5: Response preservation during navigation', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Navigate to different category
      const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(dataReadinessButton)
      })

      // Should call status update to preserve current category state
      expect(mockOnStatusUpdate).toHaveBeenCalled()

      // Should call category change to navigate
      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
    })
  })

  describe('Mobile Responsive', () => {
    it('should handle mobile navigation correctly', async () => {
      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
            isMobile={true}
          />
        )
      })

      // Should show mobile toggle button
      expect(screen.getByLabelText('Open navigation')).toBeInTheDocument()
      
      // Click to open mobile navigation
      const toggleButton = screen.getByLabelText('Open navigation')
      
      await act(async () => {
        fireEvent.click(toggleButton)
      })

      // Should show mobile header
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByLabelText('Close navigation')).toBeInTheDocument()
    })
  })
})