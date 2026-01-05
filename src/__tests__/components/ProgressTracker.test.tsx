import React from 'react'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import ProgressTracker from '../../components/ai-assessment/ProgressTracker'
import { QuestionSection } from '../../types/assessment'

// Mock data generators
const questionSectionArb = fc.record({
  id: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
  description: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
  stepNumber: fc.integer({ min: 1, max: 20 }),
  questions: fc.constant([]) // Simplified for progress tracking tests
})

const sectionsArb = fc.array(questionSectionArb, { minLength: 1, maxLength: 5 })
  .map(sections => sections.map((section, index) => ({
    ...section,
    stepNumber: index + 1 // Ensure sequential step numbers
  })))

describe('ProgressTracker Component', () => {
  describe('Unit Tests', () => {
    const mockSections: QuestionSection[] = [
      {
        id: 'step1',
        title: 'Step 1',
        description: 'First step',
        stepNumber: 1,
        questions: []
      },
      {
        id: 'step2',
        title: 'Step 2', 
        description: 'Second step',
        stepNumber: 2,
        questions: []
      },
      {
        id: 'step3',
        title: 'Step 3',
        description: 'Third step', 
        stepNumber: 3,
        questions: []
      }
    ]

    it('renders progress tracker with correct step count', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={2}
          completedSteps={[1]}
        />
      )

      expect(screen.getByText('Assessment Progress')).toBeInTheDocument()
      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument()
    })

    it('displays correct progress percentage', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={2}
          completedSteps={[1]}
        />
      )

      expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('shows current step as active', () => {
      const { container } = render(
        <ProgressTracker
          sections={mockSections}
          currentStep={2}
          completedSteps={[1]}
        />
      )

      // Current step should be highlighted - check for the blue background class
      const activeStepDiv = container.querySelector('.bg-blue-50.border.border-blue-200')
      expect(activeStepDiv).toBeInTheDocument()
      
      // Also verify the step number 2 is in the active state
      const stepNumberElement = activeStepDiv?.querySelector('.bg-blue-600.text-white')
      expect(stepNumberElement).toBeInTheDocument()
      expect(stepNumberElement?.textContent).toBe('2')
    })

    it('marks completed steps with checkmarks', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={3}
          completedSteps={[1, 2]}
        />
      )

      // Should have checkmark icons for completed steps
      const checkIcons = document.querySelectorAll('svg')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    it('displays summary statistics correctly', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={3}
          completedSteps={[1, 2]}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument() // Completed count
      expect(screen.getByText('1')).toBeInTheDocument() // Remaining count
    })

    it('handles empty completed steps', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={1}
          completedSteps={[]}
        />
      )

      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles all steps completed', () => {
      render(
        <ProgressTracker
          sections={mockSections}
          currentStep={3}
          completedSteps={[1, 2, 3]}
        />
      )

      expect(screen.getByText('3 of 3 completed')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Property 6: Progress indicator accuracy
     * Validates: Requirements 4.1
     * 
     * The progress tracker must accurately reflect the completion state:
     * - Progress percentage should match completed steps ratio
     * - Step counts should be consistent
     * - Current step should be properly highlighted
     * - Completed steps should be marked appropriately
     */
    it('Property 6: Progress indicator accuracy', () => {
      fc.assert(
        fc.property(
          sectionsArb,
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.integer({ min: 1, max: 5 }), { maxLength: 5 }),
          (sections, currentStep, completedSteps) => {
            // Ensure current step is within valid range
            const validCurrentStep = Math.min(currentStep, sections.length)
            
            // Ensure completed steps are within valid range and unique
            const validCompletedSteps = [...new Set(completedSteps)]
              .filter(step => step >= 1 && step <= sections.length)
              .sort((a, b) => a - b)

            const { container, unmount } = render(
              <ProgressTracker
                sections={sections}
                currentStep={validCurrentStep}
                completedSteps={validCompletedSteps}
              />
            )

            try {
              // Property 1: Progress percentage accuracy
              const expectedPercentage = Math.min(100, Math.round((validCompletedSteps.length / sections.length) * 100))
              const hasPercentage = container.textContent?.includes(`${expectedPercentage}%`)
              expect(hasPercentage).toBe(true)

              // Property 2: Step count accuracy
              const hasStepCount = container.textContent?.includes(`${validCompletedSteps.length} of ${sections.length} completed`)
              expect(hasStepCount).toBe(true)

              // Property 3: Progress should never exceed 100%
              expect(expectedPercentage).toBeGreaterThanOrEqual(0)
              expect(expectedPercentage).toBeLessThanOrEqual(100)

              // Property 4: Completed steps are subset of total steps
              validCompletedSteps.forEach(step => {
                expect(step).toBeGreaterThanOrEqual(1)
                expect(step).toBeLessThanOrEqual(sections.length)
              })

              // Property 5: Assessment Progress header should always be present
              expect(container.textContent).toContain('Assessment Progress')

              return true
            } finally {
              unmount()
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    /**
     * Property: Progress percentage monotonicity
     * Validates that progress percentage increases monotonically with completed steps
     */
    it('Property: Progress percentage monotonicity', () => {
      fc.assert(
        fc.property(
          sectionsArb.filter(sections => sections.length <= 3),
          fc.integer({ min: 1, max: 3 }),
          (sections, currentStep) => {
            const validCurrentStep = Math.min(currentStep, sections.length)
            let previousPercentage = -1
            
            // Test with different numbers of completed steps
            for (let completedCount = 0; completedCount <= sections.length; completedCount++) {
              const completedSteps = Array.from({ length: completedCount }, (_, i) => i + 1)
              
              const { container, unmount } = render(
                <ProgressTracker
                  sections={sections}
                  currentStep={validCurrentStep}
                  completedSteps={completedSteps}
                />
              )

              const expectedPercentage = Math.round((completedCount / sections.length) * 100)
              const hasPercentage = container.textContent?.includes(`${expectedPercentage}%`)
              expect(hasPercentage).toBe(true)
              
              // Verify monotonicity
              expect(expectedPercentage).toBeGreaterThanOrEqual(previousPercentage)
              previousPercentage = expectedPercentage

              unmount()
            }

            return true
          }
        ),
        { numRuns: 10 }
      )
    })

    /**
     * Property: Component stability with edge cases
     * Validates that the component handles edge cases gracefully
     */
    it('Property: Component stability with edge cases', () => {
      fc.assert(
        fc.property(
          sectionsArb.filter(sections => sections.length <= 3),
          fc.integer({ min: 1, max: 3 }),
          fc.array(fc.integer({ min: 1, max: 10 }), { maxLength: 10 }),
          (sections, currentStep, completedSteps) => {
            const validCurrentStep = Math.min(currentStep, sections.length)
            const validCompletedSteps = [...new Set(completedSteps)]
              .filter(step => step >= 1 && step <= sections.length)

            const { container, unmount } = render(
              <ProgressTracker
                sections={sections}
                currentStep={validCurrentStep}
                completedSteps={validCompletedSteps}
              />
            )

            try {
              // Property: Component should always render without crashing
              expect(container).toBeInTheDocument()

              // Property: Progress should be within valid bounds
              const percentageMatch = container.textContent?.match(/(\d+)%/)
              if (percentageMatch) {
                const percentage = parseInt(percentageMatch[1])
                expect(percentage).toBeGreaterThanOrEqual(0)
                expect(percentage).toBeLessThanOrEqual(100)
              }

              // Property: Step counts should be non-negative
              const stepCountMatch = container.textContent?.match(/(\d+) of (\d+) completed/)
              if (stepCountMatch) {
                const completed = parseInt(stepCountMatch[1])
                const total = parseInt(stepCountMatch[2])
                expect(completed).toBeGreaterThanOrEqual(0)
                expect(total).toBeGreaterThan(0)
                expect(completed).toBeLessThanOrEqual(total)
              }

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
    it('handles single step assessment', () => {
      const singleSection: QuestionSection[] = [{
        id: 'only-step',
        title: 'Only Step',
        description: 'The only step',
        stepNumber: 1,
        questions: []
      }]

      render(
        <ProgressTracker
          sections={singleSection}
          currentStep={1}
          completedSteps={[]}
        />
      )

      expect(screen.getByText('0 of 1 completed')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles completed steps out of order', () => {
      const sections: QuestionSection[] = [
        { id: 'step1', title: 'Step 1', description: 'First', stepNumber: 1, questions: [] },
        { id: 'step2', title: 'Step 2', description: 'Second', stepNumber: 2, questions: [] },
        { id: 'step3', title: 'Step 3', description: 'Third', stepNumber: 3, questions: [] }
      ]

      render(
        <ProgressTracker
          sections={sections}
          currentStep={2}
          completedSteps={[3, 1]} // Out of order
        />
      )

      expect(screen.getByText('2 of 3 completed')).toBeInTheDocument()
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('handles duplicate completed steps', () => {
      const sections: QuestionSection[] = [
        { id: 'step1', title: 'Step 1', description: 'First', stepNumber: 1, questions: [] },
        { id: 'step2', title: 'Step 2', description: 'Second', stepNumber: 2, questions: [] }
      ]

      render(
        <ProgressTracker
          sections={sections}
          currentStep={2}
          completedSteps={[1, 1, 1]} // Duplicates
        />
      )

      // Should handle duplicates gracefully by deduplicating
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('handles invalid completed steps', () => {
      const sections: QuestionSection[] = [
        { id: 'step1', title: 'Step 1', description: 'First', stepNumber: 1, questions: [] },
        { id: 'step2', title: 'Step 2', description: 'Second', stepNumber: 2, questions: [] }
      ]

      render(
        <ProgressTracker
          sections={sections}
          currentStep={1}
          completedSteps={[0, 5, -1]} // Invalid steps
        />
      )

      // Should filter out invalid steps
      expect(screen.getByText('0 of 2 completed')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})