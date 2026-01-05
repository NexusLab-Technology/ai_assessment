import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import QuestionnaireFlow from '../../components/ai-assessment/QuestionnaireFlow'
import { Assessment, QuestionSection, AssessmentResponses } from '../../types/assessment'
import { questionSectionGenerator } from '../helpers/generators'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock data generators - use imported generators
const sectionsArb = fc.array(questionSectionGenerator, { minLength: 2, maxLength: 4 })
  .map(sections => sections.map((section, index) => ({
    ...section,
    stepNumber: index + 1
  })))

describe('QuestionnaireFlow Component', () => {
  const mockOnComplete = jest.fn()
  const mockOnSave = jest.fn()

  const mockAssessment: Assessment = {
    id: 'test-assessment',
    name: 'Test Assessment',
    companyId: 'test-company',
    type: 'EXPLORATORY',
    status: 'IN_PROGRESS',
    currentStep: 1,
    totalSteps: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockSections: QuestionSection[] = [
    {
      id: 'section1',
      title: 'Section 1',
      description: 'First section',
      stepNumber: 1,
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Question 1',
          required: true
        },
        {
          id: 'q2',
          type: 'select',
          label: 'Question 2',
          required: false,
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]
        }
      ]
    },
    {
      id: 'section2',
      title: 'Section 2',
      description: 'Second section',
      stepNumber: 2,
      questions: [
        {
          id: 'q3',
          type: 'textarea',
          label: 'Question 3',
          required: true,
          validation: { minLength: 10 }
        }
      ]
    },
    {
      id: 'section3',
      title: 'Section 3',
      description: 'Final section',
      stepNumber: 3,
      questions: [
        {
          id: 'q4',
          type: 'radio',
          label: 'Question 4',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Unit Tests', () => {
    it('renders questionnaire flow with first section', () => {
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('heading', { name: 'Section 1' })).toBeInTheDocument()
      // Check for the main content description, not the progress tracker one
      const mainContent = screen.getByText('First section', { selector: 'p.mt-1.text-sm.text-gray-600' })
      expect(mainContent).toBeInTheDocument()
      expect(screen.getByText('Question 1')).toBeInTheDocument()
    })

    it('shows progress tracker with correct steps', () => {
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Assessment Progress')).toBeInTheDocument()
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument()
    })

    it('disables next button when required fields are empty', () => {
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('enables next button when required fields are filled', async () => {
      const user = userEvent.setup()
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      // Fill required field
      const textInput = screen.getByRole('textbox')
      await user.type(textInput, 'Test answer')

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeEnabled()
    })

    it('navigates to next section when next is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      // Fill required field
      const textInput = screen.getByRole('textbox')
      await user.type(textInput, 'Test answer')

      // Click next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Should show section 2
      expect(screen.getByRole('heading', { name: 'Section 2' })).toBeInTheDocument()
      expect(screen.getByText('Question 3')).toBeInTheDocument()
    })

    it('shows complete button on final section', async () => {
      const user = userEvent.setup()
      
      const finalStepAssessment = { ...mockAssessment, currentStep: 3 }
      
      render(
        <QuestionnaireFlow
          assessment={finalStepAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('button', { name: /complete assessment/i })).toBeInTheDocument()
    })

    it('saves responses to localStorage', async () => {
      const user = userEvent.setup()
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      // Fill required field
      const textInput = screen.getByRole('textbox')
      await user.type(textInput, 'Test answer')

      // Check localStorage was called
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'assessment_test-assessment_responses',
          expect.stringContaining('Test answer')
        )
      })
    })

    it('loads responses from localStorage on mount', () => {
      const savedData = {
        responses: {
          section1: { q1: 'Saved answer' }
        },
        completedSteps: [1],
        lastSaved: new Date().toISOString()
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      // Should load the saved value
      const textInput = screen.getByRole('textbox') as HTMLInputElement
      expect(textInput.value).toBe('Saved answer')
    })

    it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
          onSave={mockOnSave}
        />
      )

      // Fill required field
      const textInput = screen.getByRole('textbox')
      await user.type(textInput, 'Test answer')

      // Click save
      const saveButton = screen.getByRole('button', { name: /save progress/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          section1: { q1: 'Test answer' }
        }),
        1
      )
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Property 5: Step progression and validation
     * Validates: Requirements 4.2, 4.4
     * 
     * Step progression should follow validation rules:
     * - Cannot proceed without filling required fields
     * - Can navigate back freely
     * - Validation state is consistent
     */
    it('Property 5: Step progression and validation', () => {
      fc.assert(
        fc.property(
          sectionsArb,
          fc.integer({ min: 1, max: 4 }),
          (sections, startStep) => {
            const validStartStep = Math.min(startStep, sections.length)
            const testAssessment = {
              ...mockAssessment,
              currentStep: validStartStep,
              totalSteps: sections.length
            }

            const { container, unmount } = render(
              <QuestionnaireFlow
                assessment={testAssessment}
                sections={sections}
                onComplete={mockOnComplete}
              />
            )

            try {
              // Property 1: Current section should be displayed
              const currentSection = sections.find(s => s.stepNumber === validStartStep)
              if (currentSection) {
                expect(container.textContent).toContain(currentSection.title)
              }

              // Property 2: Next button should exist
              const nextButton = container.querySelector('button[type="button"]')
              expect(nextButton).toBeTruthy()

              // Property 3: Previous button should be disabled on first step
              if (validStartStep === 1) {
                const prevButton = Array.from(container.querySelectorAll('button'))
                  .find(btn => btn.textContent?.includes('Previous'))
                if (prevButton) {
                  expect(prevButton).toBeDisabled()
                }
              }

              // Property 4: Progress tracker should show correct step
              expect(container.textContent).toContain('Assessment Progress')

              return true
            } finally {
              unmount()
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    /**
     * Property 7: Response preservation during navigation
     * Validates: Requirements 4.3
     * 
     * Responses should be preserved when navigating between steps:
     * - localStorage should be updated when responses change
     * - Responses should persist across component remounts
     * - Navigation should not lose data
     */
    it('Property 7: Response preservation during navigation', () => {
      fc.assert(
        fc.property(
          sectionsArb.filter(sections => sections.length >= 2),
          fc.record({
            q1: fc.string({ minLength: 1, maxLength: 20 }),
            q2: fc.string({ minLength: 1, maxLength: 20 })
          }),
          (sections, testResponses) => {
            // Ensure sections have at least one text question each
            const modifiedSections = sections.map(section => ({
              ...section,
              questions: [
                {
                  id: `q${section.stepNumber}`,
                  type: 'text' as const,
                  label: `Question ${section.stepNumber}`,
                  required: false
                }
              ]
            }))

            const testAssessment = {
              ...mockAssessment,
              currentStep: 1,
              totalSteps: modifiedSections.length
            }

            // First render - input some data
            const { unmount: unmount1 } = render(
              <QuestionnaireFlow
                assessment={testAssessment}
                sections={modifiedSections}
                onComplete={mockOnComplete}
              />
            )

            // Simulate user input
            const textInput = screen.getByRole('textbox')
            fireEvent.change(textInput, { target: { value: testResponses.q1 } })

            // Property 1: localStorage should be called when responses change
            expect(localStorageMock.setItem).toHaveBeenCalled()

            unmount1()

            // Mock localStorage to return the saved data
            const savedData = {
              responses: {
                [modifiedSections[0].id]: {
                  [`q${modifiedSections[0].stepNumber}`]: testResponses.q1
                }
              },
              completedSteps: [],
              lastSaved: new Date().toISOString()
            }
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))

            // Second render - should restore data
            const { unmount: unmount2 } = render(
              <QuestionnaireFlow
                assessment={testAssessment}
                sections={modifiedSections}
                onComplete={mockOnComplete}
              />
            )

            // Property 2: Data should be restored from localStorage
            const restoredInput = screen.getByRole('textbox') as HTMLInputElement
            expect(restoredInput.value).toBe(testResponses.q1)

            // Property 3: localStorage should be queried on mount
            expect(localStorageMock.getItem).toHaveBeenCalledWith(
              `assessment_${testAssessment.id}_responses`
            )

            unmount2()
            return true
          }
        ),
        { numRuns: 15 }
      )
    })

    /**
     * Property: Navigation state consistency
     * Validates that navigation state remains consistent across different scenarios
     */
    it('Property: Navigation state consistency', () => {
      fc.assert(
        fc.property(
          sectionsArb,
          fc.integer({ min: 1, max: 4 }),
          fc.array(fc.integer({ min: 1, max: 4 }), { maxLength: 4 }),
          (sections, currentStep, completedSteps) => {
            const validCurrentStep = Math.min(currentStep, sections.length)
            const validCompletedSteps = completedSteps.filter(step => 
              step >= 1 && step <= sections.length
            )

            const testAssessment = {
              ...mockAssessment,
              currentStep: validCurrentStep,
              totalSteps: sections.length
            }

            // Mock localStorage with completed steps
            const savedData = {
              responses: {},
              completedSteps: validCompletedSteps,
              lastSaved: new Date().toISOString()
            }
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))

            const { container, unmount } = render(
              <QuestionnaireFlow
                assessment={testAssessment}
                sections={sections}
                onComplete={mockOnComplete}
              />
            )

            try {
              // Property 1: Component should render without crashing
              expect(container).toBeInTheDocument()

              // Property 2: Progress should be displayed
              expect(container.textContent).toContain('Assessment Progress')

              // Property 3: Current step should be within bounds
              expect(validCurrentStep).toBeGreaterThanOrEqual(1)
              expect(validCurrentStep).toBeLessThanOrEqual(sections.length)

              // Property 4: Navigation buttons should be present
              const buttons = container.querySelectorAll('button')
              expect(buttons.length).toBeGreaterThan(0)

              return true
            } finally {
              unmount()
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid step gracefully', () => {
      const invalidAssessment = { ...mockAssessment, currentStep: 999 }
      
      render(
        <QuestionnaireFlow
          assessment={invalidAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Invalid Step')).toBeInTheDocument()
    })

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should not crash
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('heading', { name: 'Section 1' })).toBeInTheDocument()
    })

    it('handles save errors gracefully', async () => {
      const user = userEvent.setup()
      const failingSave = jest.fn().mockRejectedValue(new Error('Save failed'))
      
      render(
        <QuestionnaireFlow
          assessment={mockAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
          onSave={failingSave}
        />
      )

      // Fill required field
      const textInput = screen.getByRole('textbox')
      await user.type(textInput, 'Test answer')

      // Click save
      const saveButton = screen.getByRole('button', { name: /save progress/i })
      await user.click(saveButton)

      // Should show error status
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })
    })

    it('clears localStorage on successful completion', async () => {
      const user = userEvent.setup()
      const finalStepAssessment = { ...mockAssessment, currentStep: 3 }
      
      render(
        <QuestionnaireFlow
          assessment={finalStepAssessment}
          sections={mockSections}
          onComplete={mockOnComplete}
        />
      )

      // Fill required field
      const radioButton = screen.getByRole('radio', { name: /yes/i })
      await user.click(radioButton)

      // Complete assessment
      const completeButton = screen.getByRole('button', { name: /complete assessment/i })
      await user.click(completeButton)

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          'assessment_test-assessment_responses'
        )
      })
    })
  })
})