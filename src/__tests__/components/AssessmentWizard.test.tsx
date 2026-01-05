/**
 * Unit tests for AssessmentWizard component
 * Tests assessment initialization for Exploratory and Migration paths
 * Validates: Requirements 3.3, 3.4
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AssessmentWizard from '../../components/ai-assessment/AssessmentWizard'

describe('AssessmentWizard Component', () => {
  const mockOnAssessmentCreate = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Assessment Creation Wizard', () => {
    it('should render assessment name step initially', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Check for the main heading in the content area
      expect(screen.getByRole('heading', { name: 'Assessment Name' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should validate assessment name requirements', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      const nextButton = screen.getByText('Next')

      // Test empty name
      expect(nextButton).toBeDisabled()

      // Test short name
      fireEvent.change(nameInput, { target: { value: 'AB' } })
      fireEvent.blur(nameInput)
      expect(screen.getByText('Assessment name must be at least 3 characters')).toBeInTheDocument()
      expect(nextButton).toBeDisabled()

      // Test valid name
      fireEvent.change(nameInput, { target: { value: 'Valid Assessment Name' } })
      expect(nextButton).not.toBeDisabled()
    })

    it('should show character count for assessment name', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      
      expect(screen.getByText('0/100 characters')).toBeInTheDocument()
      
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      expect(screen.getByText('15/100 characters')).toBeInTheDocument()
    })

    it('should navigate to assessment type step', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Check for the main heading in the content area
      expect(screen.getByRole('heading', { name: 'Assessment Type' })).toBeInTheDocument()
      expect(screen.getByText('Exploratory Assessment')).toBeInTheDocument()
      expect(screen.getByText('Migration Assessment')).toBeInTheDocument()
    })

    it('should display correct information for Exploratory assessment', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to type selection
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText(/Includes 7 detailed sections/)).toBeInTheDocument()
      expect(screen.getByText('Duration: 2-3 hours • 7 sections')).toBeInTheDocument()
    })

    it('should display correct information for Migration assessment', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to type selection
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText(/specialized migration readiness/)).toBeInTheDocument()
      expect(screen.getByText('Duration: 3-4 hours • 8 sections')).toBeInTheDocument()
    })

    it('should allow selecting Exploratory assessment type', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to type selection
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      // Select Exploratory
      const exploratoryRadio = screen.getByDisplayValue('EXPLORATORY')
      fireEvent.click(exploratoryRadio)

      expect(exploratoryRadio).toBeChecked()
      expect(screen.getByText('Next')).not.toBeDisabled()
    })

    it('should allow selecting Migration assessment type', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to type selection
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      // Select Migration
      const migrationRadio = screen.getByDisplayValue('MIGRATION')
      fireEvent.click(migrationRadio)

      expect(migrationRadio).toBeChecked()
      expect(screen.getByText('Next')).not.toBeDisabled()
    })

    it('should navigate to confirmation step', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate through all steps
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      const exploratoryRadio = screen.getByDisplayValue('EXPLORATORY')
      fireEvent.click(exploratoryRadio)
      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText('Ready to Create')).toBeInTheDocument()
      expect(screen.getByText('Create Assessment')).toBeInTheDocument()
    })

    it('should display correct summary for Exploratory assessment', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to confirmation
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      fireEvent.click(screen.getByDisplayValue('EXPLORATORY'))
      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText('Test Assessment')).toBeInTheDocument()
      expect(screen.getByText('Exploratory Assessment')).toBeInTheDocument()
      expect(screen.getByText('7 sections')).toBeInTheDocument()
      expect(screen.getByText('2-3 hours')).toBeInTheDocument()
    })

    it('should display correct summary for Migration assessment', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to confirmation
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      fireEvent.click(screen.getByDisplayValue('MIGRATION'))
      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText('Test Assessment')).toBeInTheDocument()
      expect(screen.getByText('Migration Assessment')).toBeInTheDocument()
      expect(screen.getByText('8 sections')).toBeInTheDocument()
      expect(screen.getByText('3-4 hours')).toBeInTheDocument()
    })

    it('should call onAssessmentCreate when Create Assessment is clicked', async () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      // Complete the wizard
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      fireEvent.click(screen.getByText('Next'))

      fireEvent.click(screen.getByDisplayValue('EXPLORATORY'))
      fireEvent.click(screen.getByText('Next'))

      fireEvent.click(screen.getByText('Create Assessment'))

      await waitFor(() => {
        expect(mockOnAssessmentCreate).toHaveBeenCalledWith('Test Assessment', 'EXPLORATORY')
      })
    })

    it('should call onCancel when Cancel is clicked on first step', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
        />
      )

      fireEvent.click(screen.getByText('Cancel'))
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should show loading state when isLoading is true', () => {
      render(
        <AssessmentWizard
          onAssessmentCreate={mockOnAssessmentCreate}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      // Navigate to final step
      const nameInput = screen.getByPlaceholderText(/Q1 2024 Cloud Migration Assessment/)
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } })
      
      // Should be disabled due to loading
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
      
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toBeDisabled()
    })
  })
})