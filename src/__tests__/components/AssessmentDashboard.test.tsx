/**
 * Property-based tests for AssessmentDashboard component
 * Feature: ai-assessment, Property 3: Assessment creation with company association
 * Validates: Requirements 2.4, 2.5, 3.5
 */

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import AssessmentDashboard from '../../components/ai-assessment/AssessmentDashboard'
import { Assessment, Company } from '../../types/assessment'
import { assessmentGenerator } from '../helpers/generators'

describe('AssessmentDashboard Component', () => {
  const mockOnCreateAssessment = jest.fn()
  const mockOnSelectAssessment = jest.fn()
  const mockOnDeleteAssessment = jest.fn()

  const mockCompany: Company = {
    id: 'company-1',
    name: 'Test Company',
    description: 'Test Description',
    createdAt: new Date('2024-01-01'),
    assessmentCount: 5
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Property 3: Assessment creation with company association', () => {
    it('should display "Create Assessment" when no assessments exist', () => {
      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={[]}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      expect(screen.getByText('No assessments')).toBeInTheDocument()
      expect(screen.getByText(`Get started by creating your first assessment for ${mockCompany.name}.`)).toBeInTheDocument()
      expect(screen.getByText('Create Assessment')).toBeInTheDocument()
      
      // Should call onCreateAssessment when button is clicked
      fireEvent.click(screen.getByText('Create Assessment'))
      expect(mockOnCreateAssessment).toHaveBeenCalledTimes(1)
    })

    it('should display assessments list when assessments exist', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Test Assessment 1',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'assessment-2',
          name: 'Test Assessment 2',
          companyId: mockCompany.id,
          type: 'MIGRATION',
          status: 'IN_PROGRESS',
          currentStep: 3,
          totalSteps: 8,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-03')
        }
      ]

      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      expect(screen.getByText(`Assessments for ${mockCompany.name}`)).toBeInTheDocument()
      expect(screen.getByText('2 assessments found')).toBeInTheDocument()
      expect(screen.getByText('Test Assessment 1')).toBeInTheDocument()
      expect(screen.getByText('Test Assessment 2')).toBeInTheDocument()
      expect(screen.getByText('New Assessment')).toBeInTheDocument()
    })

    it('should display correct status indicators', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Draft Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'assessment-2',
          name: 'In Progress Assessment',
          companyId: mockCompany.id,
          type: 'MIGRATION',
          status: 'IN_PROGRESS',
          currentStep: 3,
          totalSteps: 8,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-03')
        },
        {
          id: 'assessment-3',
          name: 'Completed Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'COMPLETED',
          currentStep: 7,
          totalSteps: 7,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
          completedAt: new Date('2024-01-04')
        }
      ]

      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getAllByText('Exploratory')).toHaveLength(2)
      expect(screen.getByText('Migration')).toBeInTheDocument()
    })

    it('should display progress bar for in-progress assessments', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'In Progress Assessment',
          companyId: mockCompany.id,
          type: 'MIGRATION',
          status: 'IN_PROGRESS',
          currentStep: 3,
          totalSteps: 8,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-03')
        }
      ]

      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('38%')).toBeInTheDocument() // 3/8 = 37.5% rounded to 38%
      expect(screen.getByText('Step 3 of 8')).toBeInTheDocument()
    })

    it('should handle assessment selection', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Test Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]

      const { container } = render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      // Find and click the edit button (pencil icon) for in-progress assessment
      const editButton = container.querySelector('button[title="Edit Assessment"]')
      expect(editButton).toBeInTheDocument()
      
      fireEvent.click(editButton!)
      expect(mockOnSelectAssessment).toHaveBeenCalledWith(assessments[0])
    })

    it('should handle draft assessment deletion', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Draft Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]

      const { container } = render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      // Find and click the delete button (trash icon)
      const deleteButton = container.querySelector('button[title="Delete Draft"]')
      expect(deleteButton).toBeInTheDocument()
      
      fireEvent.click(deleteButton!)

      // Should show confirmation modal
      expect(screen.getByText('Delete Assessment')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete "Draft Assessment"? This action cannot be undone.')).toBeInTheDocument()

      // Click confirm delete
      fireEvent.click(screen.getByText('Delete'))
      expect(mockOnDeleteAssessment).toHaveBeenCalledWith('assessment-1')
    })

    it('should not show delete button for non-draft assessments', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'In Progress Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'IN_PROGRESS',
          currentStep: 3,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        },
        {
          id: 'assessment-2',
          name: 'Completed Assessment',
          companyId: mockCompany.id,
          type: 'MIGRATION',
          status: 'COMPLETED',
          currentStep: 8,
          totalSteps: 8,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-03'),
          completedAt: new Date('2024-01-03')
        }
      ]

      const { container } = render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      // Should not have delete buttons for non-draft assessments
      const deleteButtons = container.querySelectorAll('button[title="Delete Draft"]')
      expect(deleteButtons).toHaveLength(0)
    })

    it('should handle delete confirmation cancellation', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Draft Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]

      const { container } = render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      // Click delete button
      const deleteButton = container.querySelector('button[title="Delete Draft"]')
      fireEvent.click(deleteButton!)

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'))

      // Modal should be closed
      expect(screen.queryByText('Delete Assessment')).not.toBeInTheDocument()
      expect(mockOnDeleteAssessment).not.toHaveBeenCalled()
    })
  })

  describe('Property-Based Tests', () => {
    it('should maintain consistent state across different assessment lists', () => {
      fc.assert(fc.property(
        fc.array(assessmentGenerator, { minLength: 0, maxLength: 5 }),
        (assessments: Assessment[]) => {
          cleanup()
          
          render(
            <AssessmentDashboard
              company={mockCompany}
              assessments={assessments}
              onCreateAssessment={mockOnCreateAssessment}
              onSelectAssessment={mockOnSelectAssessment}
              onDeleteAssessment={mockOnDeleteAssessment}
            />
          )

          // Property: Empty assessments should show create assessment UI
          if (assessments.length === 0) {
            expect(screen.getByText('No assessments')).toBeInTheDocument()
            expect(screen.getByText('Create Assessment')).toBeInTheDocument()
          } else {
            // Property: Non-empty assessments should show dashboard UI
            expect(screen.getByText(`Assessments for ${mockCompany.name}`)).toBeInTheDocument()
            const expectedText = assessments.length === 1 
              ? '1 assessment found' 
              : `${assessments.length} assessments found`
            expect(screen.getByText(expectedText)).toBeInTheDocument()
          }

          return true
        }
      ), { numRuns: 20 })
    })

    it('should display progress correctly for in-progress assessments', () => {
      fc.assert(fc.property(
        assessmentGenerator,
        (assessment: Assessment) => {
          cleanup()
          
          // Only test IN_PROGRESS assessments
          if (assessment.status !== 'IN_PROGRESS') {
            return true // Skip non-in-progress assessments
          }
          
          // Ensure currentStep doesn't exceed totalSteps
          const validAssessment = {
            ...assessment,
            currentStep: Math.min(assessment.currentStep, assessment.totalSteps)
          }

          render(
            <AssessmentDashboard
              company={mockCompany}
              assessments={[validAssessment]}
              onCreateAssessment={mockOnCreateAssessment}
              onSelectAssessment={mockOnSelectAssessment}
              onDeleteAssessment={mockOnDeleteAssessment}
            />
          )

          // Property: In-progress assessments should show progress information
          expect(screen.getByText('Progress')).toBeInTheDocument()
          
          const expectedPercentage = Math.round((validAssessment.currentStep / validAssessment.totalSteps) * 100)
          expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument()
          
          expect(screen.getByText(`Step ${validAssessment.currentStep} of ${validAssessment.totalSteps}`)).toBeInTheDocument()

          return true
        }
      ), { numRuns: 30 })
    })

    it('should handle assessment count display correctly', () => {
      fc.assert(fc.property(
        fc.array(assessmentGenerator, { minLength: 1, maxLength: 10 }),
        (assessments: Assessment[]) => {
          cleanup()
          
          render(
            <AssessmentDashboard
              company={mockCompany}
              assessments={assessments}
              onCreateAssessment={mockOnCreateAssessment}
              onSelectAssessment={mockOnSelectAssessment}
              onDeleteAssessment={mockOnDeleteAssessment}
            />
          )

          // Property: Assessment count should be displayed correctly
          const expectedText = assessments.length === 1 
            ? '1 assessment found' 
            : `${assessments.length} assessments found`
          
          expect(screen.getByText(expectedText)).toBeInTheDocument()

          return true
        }
      ), { numRuns: 20 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle assessments with zero total steps', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Zero Steps Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'IN_PROGRESS',
          currentStep: 0,
          totalSteps: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]

      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      // Should handle zero division gracefully
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('Step 0 of 0')).toBeInTheDocument()
    })

    it('should display completed date for completed assessments', () => {
      const completedDate = new Date('2024-01-05')
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Completed Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'COMPLETED',
          currentStep: 7,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-04'),
          completedAt: completedDate
        }
      ]

      render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      expect(screen.getByText(`Completed ${completedDate.toLocaleDateString()}`)).toBeInTheDocument()
    })

    it('should show correct button title for completed assessments', () => {
      const assessments: Assessment[] = [
        {
          id: 'assessment-1',
          name: 'Completed Assessment',
          companyId: mockCompany.id,
          type: 'EXPLORATORY',
          status: 'COMPLETED',
          currentStep: 7,
          totalSteps: 7,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-04'),
          completedAt: new Date('2024-01-04')
        }
      ]

      const { container } = render(
        <AssessmentDashboard
          company={mockCompany}
          assessments={assessments}
          onCreateAssessment={mockOnCreateAssessment}
          onSelectAssessment={mockOnSelectAssessment}
          onDeleteAssessment={mockOnDeleteAssessment}
        />
      )

      const viewButton = container.querySelector('button[title="View Assessment"]')
      expect(viewButton).toBeInTheDocument()
    })
  })
})