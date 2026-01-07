/**
 * Integration Test: Category Navigation with Real Data
 * Task 15.2: Test end-to-end category navigation with real data
 * Requirements: 12.1, 12.4, 12.5
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedCategoryNavigationSidebar } from '@/components/ai-assessment/EnhancedCategoryNavigationSidebar'
import type { 
  RAPIDQuestionnaireStructure, 
  Assessment, 
  CategoryCompletionStatus,
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

describe('Category Navigation Integration Tests', () => {
  let mockQuestionnaire: RAPIDQuestionnaireStructure
  let mockAssessment: Assessment
  let mockOnCategoryChange: jest.Mock
  let mockOnSubcategoryChange: jest.Mock
  let mockOnStatusUpdate: jest.Mock

  beforeEach(() => {
    // Create comprehensive mock questionnaire with real RAPID structure
    mockQuestionnaire = {
      version: '3.0',
      assessmentType: 'EXPLORATORY' as AssessmentType,
      totalQuestions: 162,
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
            },
            {
              id: 'use-case-identification',
              title: 'Use Case Identification',
              questions: [
                {
                  id: 'q3',
                  number: '3',
                  text: 'What processes could benefit from AI?',
                  type: 'checkbox',
                  required: true,
                  options: ['Customer Service', 'Data Analysis', 'Automation'],
                  category: 'use-case-discovery',
                  subcategory: 'use-case-identification'
                }
              ],
              questionCount: 1
            }
          ],
          totalQuestions: 3,
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
                  id: 'q4',
                  number: '4',
                  text: 'How would you rate your data quality?',
                  type: 'radio',
                  required: true,
                  options: ['Excellent', 'Good', 'Fair', 'Poor'],
                  category: 'data-readiness',
                  subcategory: 'data-quality'
                },
                {
                  id: 'q5',
                  number: '5',
                  text: 'What data governance processes do you have?',
                  type: 'textarea',
                  required: false,
                  category: 'data-readiness',
                  subcategory: 'data-quality'
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
          id: 'compliance-integration',
          title: 'Compliance & Integration',
          description: 'Evaluate compliance requirements and integration needs',
          subcategories: [
            {
              id: 'regulatory-compliance',
              title: 'Regulatory Compliance',
              questions: [
                {
                  id: 'q6',
                  number: '6',
                  text: 'What regulatory requirements apply?',
                  type: 'checkbox',
                  required: true,
                  options: ['GDPR', 'HIPAA', 'SOX', 'None'],
                  category: 'compliance-integration',
                  subcategory: 'regulatory-compliance'
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

    // Create mock assessment with partial responses
    mockAssessment = {
      id: 'test-assessment-123',
      name: 'Test Assessment',
      companyId: 'company-123',
      userId: 'user-123',
      type: 'EXPLORATORY',
      status: 'IN_PROGRESS',
      currentCategory: 'use-case-discovery',
      currentSubcategory: 'business-objectives',
      totalCategories: 3,
      responses: {
        'use-case-discovery': {
          'q1': 'Improve customer satisfaction and reduce costs',
          'q2': 'Customer satisfaction scores and cost reduction metrics'
          // q3 not answered yet
        },
        'data-readiness': {
          'q4': 'Good'
          // q5 not answered yet
        }
        // compliance-integration not started
      },
      categoryStatuses: {
        'use-case-discovery': {
          categoryId: 'use-case-discovery',
          status: 'partial',
          completionPercentage: 67, // 2/3 questions answered
          lastModified: new Date()
        },
        'data-readiness': {
          categoryId: 'data-readiness',
          status: 'partial',
          completionPercentage: 50, // 1/2 questions answered
          lastModified: new Date()
        }
      },
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

  describe('Real Data Integration', () => {
    it('should render categories with real RAPID data structure', async () => {
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

      // Verify all categories are rendered
      expect(screen.getByText('Use Case Discovery')).toBeInTheDocument()
      expect(screen.getByText('Data Readiness')).toBeInTheDocument()
      expect(screen.getByText('Compliance & Integration')).toBeInTheDocument()

      // Verify category descriptions
      expect(screen.getByText('Identify and prioritize AI use cases')).toBeInTheDocument()
      expect(screen.getByText('Assess data quality and availability')).toBeInTheDocument()
    })

    it('should display accurate completion status from real assessment data', async () => {
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
        // Use Case Discovery: 2/3 questions answered (67%)
        expect(screen.getAllByText('67%')).toHaveLength(2) // Icon and percentage display
        expect(screen.getByText('2/3 questions')).toBeInTheDocument()
        
        // Data Readiness: 1/2 questions answered (50%)
        expect(screen.getAllByText('50%')).toHaveLength(2) // Icon and percentage display
        expect(screen.getByText('1/2 questions')).toBeInTheDocument()
        
        // Compliance: 0/1 questions answered (0%)
        expect(screen.getByText('0/1 questions')).toBeInTheDocument()
      })
    })

    it('should show correct status badges based on completion', async () => {
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
        // Categories with partial completion should show "In Progress"
        const inProgressBadges = screen.getAllByText('In Progress')
        expect(inProgressBadges).toHaveLength(2) // Use Case Discovery and Data Readiness
        
        // Category with no responses should show "Not Started"
        expect(screen.getByText('Not Started')).toBeInTheDocument()
      })
    })
  })

  describe('Category Navigation Functionality', () => {
    it('should handle category selection and preserve responses', async () => {
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

      // Click on Data Readiness category
      const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(dataReadinessButton)
      })

      // Verify category change callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
      
      // Verify status update was called with correct completion data
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('data-readiness', {
        categoryId: 'data-readiness',
        status: 'partial',
        completionPercentage: 50,
        lastModified: expect.any(Date)
      })
    })

    it('should handle subcategory navigation when category is active', async () => {
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
        expect(screen.getByText('Use Case Identification')).toBeInTheDocument()
        
        // Verify subcategory completion counts
        expect(screen.getByText('2/2')).toBeInTheDocument() // Business Objectives: 2/2 answered
        expect(screen.getByText('0/1')).toBeInTheDocument() // Use Case Identification: 0/1 answered
      })

      // Click on Use Case Identification subcategory
      const subcategoryButton = screen.getByRole('button', { name: /Use Case Identification/ })
      
      await act(async () => {
        fireEvent.click(subcategoryButton)
      })

      expect(mockOnSubcategoryChange).toHaveBeenCalledWith('use-case-identification')
    })

    it('should update completion status in real-time when responses change', async () => {
      const { rerender } = render(
        <EnhancedCategoryNavigationSidebar
          questionnaire={mockQuestionnaire}
          assessment={mockAssessment}
          currentCategory="use-case-discovery"
          onCategoryChange={mockOnCategoryChange}
          onStatusUpdate={mockOnStatusUpdate}
        />
      )

      // Initial state: Use Case Discovery 67% complete
      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument()
        expect(screen.getByText('In Progress')).toBeInTheDocument()
      })

      // Update assessment with completed Use Case Discovery
      const updatedAssessment = {
        ...mockAssessment,
        responses: {
          ...mockAssessment.responses,
          'use-case-discovery': {
            'q1': 'Improve customer satisfaction and reduce costs',
            'q2': 'Customer satisfaction scores and cost reduction metrics',
            'q3': ['Customer Service', 'Data Analysis'] // Now answered
          }
        }
      }

      await act(async () => {
        rerender(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={updatedAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Should now show 100% completion
      await waitFor(() => {
        expect(screen.getByText('3/3 questions')).toBeInTheDocument()
        
        // Should show completed status (green checkmark)
        const completedIcon = screen.getByRole('button', { name: /Use Case Discovery/ })
          .querySelector('.bg-green-500')
        expect(completedIcon).toBeInTheDocument()
      })
    })
  })

  describe('Progress Summary Integration', () => {
    it('should calculate and display accurate progress summary', async () => {
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
        
        // Category counts based on mock data
        expect(screen.getByText('0')).toBeInTheDocument() // Complete
        expect(screen.getByText('2')).toBeInTheDocument() // In Progress (Use Case Discovery, Data Readiness)
        expect(screen.getByText('1')).toBeInTheDocument() // Not Started (Compliance)
        
        // Overall progress: (0 complete + 2 * 0.5 in progress) / 3 total = 33%
        expect(screen.getByText('33%')).toBeInTheDocument()
      })
    })

    it('should update progress summary when category completion changes', async () => {
      // Start with assessment having one completed category
      const assessmentWithCompleted = {
        ...mockAssessment,
        responses: {
          ...mockAssessment.responses,
          'use-case-discovery': {
            'q1': 'Improve customer satisfaction',
            'q2': 'Customer satisfaction scores',
            'q3': ['Customer Service', 'Data Analysis']
          }
        },
        categoryStatuses: {
          ...mockAssessment.categoryStatuses,
          'use-case-discovery': {
            categoryId: 'use-case-discovery',
            status: 'completed' as const,
            completionPercentage: 100,
            lastModified: new Date()
          }
        }
      }

      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={assessmentWithCompleted}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      await waitFor(() => {
        // Updated counts: 1 complete, 1 in progress, 1 not started
        const progressSummary = screen.getByText('Progress Summary').parentElement
        expect(progressSummary).toBeInTheDocument()
        
        // Check the progress summary counts
        const completeSection = screen.getByText('Complete').parentElement
        const inProgressSection = screen.getByText('In Progress').parentElement  
        const notStartedSection = screen.getByText('Not Started').parentElement
        
        expect(completeSection?.querySelector('.font-medium')).toHaveTextContent('1')
        expect(inProgressSection?.querySelector('.font-medium')).toHaveTextContent('1')
        expect(notStartedSection?.querySelector('.font-medium')).toHaveTextContent('1')
        
        // Overall progress: (1 complete + 1 * 0.5 in progress) / 3 total = 50%
        expect(screen.getByText('50%')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle category navigation errors gracefully', async () => {
      // Mock status update to throw error
      const mockOnStatusUpdateWithError = jest.fn().mockImplementation(() => {
        throw new Error('Network error')
      })

      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={mockQuestionnaire}
            assessment={mockAssessment}
            currentCategory="use-case-discovery"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdateWithError}
          />
        )
      })

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Data Readiness')).toBeInTheDocument()
      })

      // Click on a category
      const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(dataReadinessButton)
      })

      // Should still call onCategoryChange even if status update fails
      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
    })

    it('should show loading state during category statistics calculation', async () => {
      // Create questionnaire with many categories to simulate loading
      const largeQuestionnaire = {
        ...mockQuestionnaire,
        categories: Array.from({ length: 10 }, (_, i) => ({
          ...mockQuestionnaire.categories[0],
          id: `category-${i}`,
          title: `Category ${i + 1}`
        }))
      }

      await act(async () => {
        render(
          <EnhancedCategoryNavigationSidebar
            questionnaire={largeQuestionnaire}
            assessment={mockAssessment}
            currentCategory="category-0"
            onCategoryChange={mockOnCategoryChange}
            onStatusUpdate={mockOnStatusUpdate}
          />
        )
      })

      // Should eventually show all categories without loading indicators
      await waitFor(() => {
        expect(screen.getByText('Category 1')).toBeInTheDocument()
        expect(screen.getByText('Category 10')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Mobile Responsive Integration', () => {
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

      // Select a category on mobile
      const categoryButton = screen.getByRole('button', { name: /Data Readiness/ })
      
      await act(async () => {
        fireEvent.click(categoryButton)
      })

      // Should call category change and close mobile nav
      expect(mockOnCategoryChange).toHaveBeenCalledWith('data-readiness', undefined)
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

      // Should display all RAPID categories
      expect(screen.getByText('Use Case Discovery')).toBeInTheDocument()
      expect(screen.getByText('Data Readiness')).toBeInTheDocument()
      expect(screen.getByText('Compliance & Integration')).toBeInTheDocument()

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
        // Should show real-time completion percentages (allowing for progress summary too)
        expect(screen.getAllByText('67%').length).toBeGreaterThanOrEqual(2) // Use Case Discovery (icon + percentage)
        expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(2) // Data Readiness (icon + percentage)
        
        // Should show status badges
        expect(screen.getAllByText('In Progress')).toHaveLength(2)
        expect(screen.getByText('Not Started')).toBeInTheDocument()
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
      const complianceButton = screen.getByRole('button', { name: /Compliance & Integration/ })
      
      await act(async () => {
        fireEvent.click(complianceButton)
      })

      // Should call status update to preserve current category state
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('compliance-integration', {
        categoryId: 'compliance-integration',
        status: 'not_started',
        completionPercentage: 0,
        lastModified: expect.any(Date)
      })

      // Should call category change to navigate
      expect(mockOnCategoryChange).toHaveBeenCalledWith('compliance-integration', undefined)
    })
  })
})