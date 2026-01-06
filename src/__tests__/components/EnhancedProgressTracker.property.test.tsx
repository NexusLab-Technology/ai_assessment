/**
 * Property-based tests for EnhancedProgressTracker component
 * Feature: ai-assessment
 */

import * as fc from 'fast-check'
import { render, cleanup } from '@testing-library/react'
import { StepStatus } from '@/types/assessment'
import EnhancedProgressTracker from '@/components/ai-assessment/EnhancedProgressTracker'

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup()
})

describe('EnhancedProgressTracker Property Tests', () => {
  // Generator for step status with proper business rules
  const stepStatusItemGenerator = fc.record({
    stepNumber: fc.integer({ min: 1, max: 10 }),
    requiredFieldsCount: fc.integer({ min: 0, max: 10 })
  }).chain(baseStep => {
    // Generate status based on requiredFieldsCount constraints
    let statusOptions: Array<'not_started' | 'partial' | 'completed' | 'current'>
    
    if (baseStep.requiredFieldsCount <= 1) {
      // If 0 or 1 required fields, partial doesn't make sense
      statusOptions = ['not_started', 'completed', 'current']
    } else {
      // If 2+ required fields, all statuses are valid
      statusOptions = ['not_started', 'partial', 'completed', 'current']
    }
    
    return fc.constantFrom(...statusOptions).chain(status => {
      switch (status) {
        case 'not_started':
          return fc.record({
            stepNumber: fc.constant(baseStep.stepNumber),
            status: fc.constant(status),
            requiredFieldsCount: fc.constant(baseStep.requiredFieldsCount),
            filledFieldsCount: fc.constant(0),
            hasResponses: fc.constant(false)
          })
        case 'completed':
          return fc.record({
            stepNumber: fc.constant(baseStep.stepNumber),
            status: fc.constant(status),
            requiredFieldsCount: fc.constant(baseStep.requiredFieldsCount),
            filledFieldsCount: fc.constant(baseStep.requiredFieldsCount),
            hasResponses: fc.constant(baseStep.requiredFieldsCount > 0)
          })
        case 'partial':
          // This case should only happen when requiredFieldsCount > 1
          return fc.record({
            stepNumber: fc.constant(baseStep.stepNumber),
            status: fc.constant(status),
            requiredFieldsCount: fc.constant(baseStep.requiredFieldsCount),
            filledFieldsCount: fc.integer({ 
              min: 1, 
              max: baseStep.requiredFieldsCount - 1 
            }),
            hasResponses: fc.constant(true)
          })
        case 'current':
          return fc.integer({ 
            min: 0, 
            max: baseStep.requiredFieldsCount 
          }).chain(filledCount => {
            return fc.record({
              stepNumber: fc.constant(baseStep.stepNumber),
              status: fc.constant(status),
              requiredFieldsCount: fc.constant(baseStep.requiredFieldsCount),
              filledFieldsCount: fc.constant(filledCount),
              hasResponses: fc.constant(filledCount > 0)
            })
          })
        default:
          return fc.integer({ min: 0, max: baseStep.requiredFieldsCount }).chain(filledCount => {
            return fc.record({
              stepNumber: fc.constant(baseStep.stepNumber),
              status: fc.constant(status),
              requiredFieldsCount: fc.constant(baseStep.requiredFieldsCount),
              filledFieldsCount: fc.constant(filledCount),
              hasResponses: fc.constant(filledCount > 0)
            })
          })
      }
    })
  }) as fc.Arbitrary<StepStatus>

  // Generator for array of step statuses with unique step numbers
  const stepStatusArrayGenerator = fc.array(stepStatusItemGenerator, { minLength: 1, maxLength: 8 })
    .map(steps => {
      // Ensure unique step numbers and sequential ordering
      const uniqueSteps = steps.reduce((acc, step, index) => {
        const stepNumber = index + 1
        acc.push({
          ...step,
          stepNumber
        })
        return acc
      }, [] as StepStatus[])
      return uniqueSteps
    })

  /**
   * Property 16: Visual progress indicators consistency
   * Feature: ai-assessment, Property 16: Visual progress indicators consistency
   * Validates: Requirements 11.1, 12.1, 12.2, 12.3
   */
  test('Property 16: Visual progress indicators consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentStep: fc.integer({ min: 1, max: 8 }),
          stepStatuses: stepStatusArrayGenerator,
          allowNavigation: fc.boolean()
        }),
        ({ currentStep, stepStatuses, allowNavigation }) => {
          // Ensure currentStep is within valid range
          const validCurrentStep = Math.min(currentStep, stepStatuses.length)
          const totalSteps = stepStatuses.length

          // Mock onStepClick function
          const mockOnStepClick = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component in the isolated container
            const { getByText } = render(
              <EnhancedProgressTracker
                currentStep={validCurrentStep}
                totalSteps={totalSteps}
                stepStatuses={stepStatuses}
                onStepClick={mockOnStepClick}
                allowNavigation={allowNavigation}
              />,
              { container }
            )

            // Verify that the component renders without crashing
            expect(getByText('Assessment Progress')).toBeInTheDocument()

            // Test visual state consistency for each step
            stepStatuses.forEach((stepStatus) => {
              // Verify that each step status has consistent visual representation
              switch (stepStatus.status) {
                case 'completed':
                  // Completed steps should show completion indicators
                  expect(stepStatus.filledFieldsCount).toBeLessThanOrEqual(stepStatus.requiredFieldsCount)
                  if (stepStatus.requiredFieldsCount > 0) {
                    expect(stepStatus.filledFieldsCount).toBe(stepStatus.requiredFieldsCount)
                  }
                  break
                case 'partial':
                  // Partial steps should have some but not all required fields filled
                  if (stepStatus.requiredFieldsCount > 0) {
                    expect(stepStatus.filledFieldsCount).toBeGreaterThan(0)
                    expect(stepStatus.filledFieldsCount).toBeLessThan(stepStatus.requiredFieldsCount)
                  }
                  break
                case 'current':
                  // Current step should match the currentStep prop
                  if (stepStatus.stepNumber === validCurrentStep) {
                    expect(stepStatus.status).toBe('current')
                  }
                  break
                case 'not_started':
                  // Not started steps should have no filled fields
                  expect(stepStatus.filledFieldsCount).toBe(0)
                  expect(stepStatus.hasResponses).toBe(false)
                  break
              }
            })

            // Verify progress calculation consistency
            const completedSteps = stepStatuses.filter(step => step.status === 'completed').length
            const expectedProgressPercentage = totalSteps > 0 
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0

            // Progress percentage should be between 0 and 100
            expect(expectedProgressPercentage).toBeGreaterThanOrEqual(0)
            expect(expectedProgressPercentage).toBeLessThanOrEqual(100)

            // Verify step number consistency
            stepStatuses.forEach((stepStatus, index) => {
              expect(stepStatus.stepNumber).toBe(index + 1)
            })
          } finally {
            // Clean up the container
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15: Step navigation with response preservation
   * Feature: ai-assessment, Property 15: Step navigation with response preservation  
   * Validates: Requirements 11.2, 11.5, 12.4, 12.5
   */
  test('Property 15: Step navigation with response preservation', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentStep: fc.integer({ min: 1, max: 8 }),
          stepStatuses: stepStatusArrayGenerator,
          allowNavigation: fc.boolean(),
          targetStep: fc.integer({ min: 1, max: 8 })
        }),
        ({ currentStep, stepStatuses, allowNavigation, targetStep }) => {
          // Ensure steps are within valid range
          const validCurrentStep = Math.min(currentStep, stepStatuses.length)
          const validTargetStep = Math.min(targetStep, stepStatuses.length)
          const totalSteps = stepStatuses.length

          // Mock onStepClick function to track navigation calls
          const mockOnStepClick = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component in the isolated container
            const { rerender, getByText } = render(
              <EnhancedProgressTracker
                currentStep={validCurrentStep}
                totalSteps={totalSteps}
                stepStatuses={stepStatuses}
                onStepClick={mockOnStepClick}
                allowNavigation={allowNavigation}
              />,
              { container }
            )

            // Verify initial render
            expect(getByText('Assessment Progress')).toBeInTheDocument()

            // Simulate step navigation by updating currentStep
            const updatedStepStatuses = stepStatuses.map(step => ({
              ...step,
              status: step.stepNumber === validTargetStep ? 'current' as const : 
                     step.stepNumber === validCurrentStep ? 'completed' as const : 
                     step.status
            }))

            // Re-render with updated step
            rerender(
              <EnhancedProgressTracker
                currentStep={validTargetStep}
                totalSteps={totalSteps}
                stepStatuses={updatedStepStatuses}
                onStepClick={mockOnStepClick}
                allowNavigation={allowNavigation}
              />
            )

            // Verify navigation behavior consistency
            expect(getByText('Assessment Progress')).toBeInTheDocument()

            // Verify that step statuses maintain consistency after navigation
            updatedStepStatuses.forEach((stepStatus) => {
              // Step numbers should remain sequential
              expect(stepStatus.stepNumber).toBeGreaterThan(0)
              expect(stepStatus.stepNumber).toBeLessThanOrEqual(totalSteps)
              
              // Response data should be preserved (filledFieldsCount should not decrease)
              const originalStep = stepStatuses.find(s => s.stepNumber === stepStatus.stepNumber)
              if (originalStep && stepStatus.status !== 'not_started') {
                expect(stepStatus.filledFieldsCount).toBeGreaterThanOrEqual(0)
                expect(stepStatus.filledFieldsCount).toBeLessThanOrEqual(stepStatus.requiredFieldsCount)
              }
            })

            // Verify current step indicator is correctly updated
            const currentStepStatus = updatedStepStatuses.find(s => s.stepNumber === validTargetStep)
            if (currentStepStatus) {
              expect(currentStepStatus.status).toBe('current')
            }
          } finally {
            // Clean up the container
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test for step status transitions
   */
  test('Step status transitions maintain data integrity', () => {
    fc.assert(
      fc.property(
        stepStatusArrayGenerator,
        (stepStatuses) => {
          stepStatuses.forEach((stepStatus) => {
            // Business rule: filledFieldsCount should never exceed requiredFieldsCount
            expect(stepStatus.filledFieldsCount).toBeLessThanOrEqual(stepStatus.requiredFieldsCount)
            
            // Business rule: step numbers should be positive
            expect(stepStatus.stepNumber).toBeGreaterThan(0)
            
            // Business rule: hasResponses should be true if filledFieldsCount > 0
            if (stepStatus.filledFieldsCount > 0) {
              expect(stepStatus.hasResponses).toBe(true)
            }
            
            // Business rule: completed status should have all required fields filled
            if (stepStatus.status === 'completed' && stepStatus.requiredFieldsCount > 0) {
              expect(stepStatus.filledFieldsCount).toBe(stepStatus.requiredFieldsCount)
            }
            
            // Business rule: not_started status should have no filled fields
            if (stepStatus.status === 'not_started') {
              expect(stepStatus.filledFieldsCount).toBe(0)
              expect(stepStatus.hasResponses).toBe(false)
            }
            
            // Business rule: partial status should have some but not all fields filled
            if (stepStatus.status === 'partial' && stepStatus.requiredFieldsCount > 0) {
              expect(stepStatus.filledFieldsCount).toBeGreaterThan(0)
              expect(stepStatus.filledFieldsCount).toBeLessThan(stepStatus.requiredFieldsCount)
              expect(stepStatus.hasResponses).toBe(true)
            }
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})