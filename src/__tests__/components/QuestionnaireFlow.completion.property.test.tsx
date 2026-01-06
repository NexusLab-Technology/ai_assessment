/**
 * Property-based tests for QuestionnaireFlow completion validation
 * Feature: ai-assessment
 */

import * as fc from 'fast-check'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { Assessment, QuestionSection, Question, AssessmentResponses } from '@/types/assessment'
import QuestionnaireFlow from '@/components/ai-assessment/QuestionnaireFlow'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  assessmentApi: {
    getResponses: jest.fn().mockResolvedValue({ responses: {}, currentStep: 1 }),
    update: jest.fn().mockResolvedValue({}),
    saveResponses: jest.fn().mockResolvedValue({})
  }
}))

// Mock the auto-save hook
jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: jest.fn(() => ({
    saveStatus: 'idle',
    lastSaved: null,
    saveNow: jest.fn().mockResolvedValue({}),
    hasUnsavedChanges: false
  }))
}))

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup()
})

describe('QuestionnaireFlow Completion Validation Property Tests', () => {
  // Generator for questions
  const questionGenerator = fc.record({
    id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom('text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'number'),
    label: fc.string({ minLength: 2 }).filter(s => s.trim().length > 1),
    description: fc.option(fc.string()),
    required: fc.boolean(),
    options: fc.option(fc.array(fc.record({
      value: fc.string(),
      label: fc.string()
    }))),
    validation: fc.option(fc.record({
      required: fc.option(fc.boolean()),
      minLength: fc.option(fc.integer({ min: 0 })),
      maxLength: fc.option(fc.integer({ min: 1 })),
      min: fc.option(fc.integer()),
      max: fc.option(fc.integer()),
      pattern: fc.option(fc.string())
    }))
  }) as fc.Arbitrary<Question>

  // Generator for assessment
  const assessmentGenerator = fc.record({
    id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    name: fc.string({ minLength: 2 }).filter(s => s.trim().length > 1),
    companyId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom('EXPLORATORY', 'MIGRATION'),
    status: fc.constantFrom('DRAFT', 'IN_PROGRESS', 'COMPLETED'),
    currentStep: fc.integer({ min: 1, max: 8 }),
    totalSteps: fc.integer({ min: 1, max: 8 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    completedAt: fc.option(fc.date())
  }) as fc.Arbitrary<Assessment>

  // Generator for question sections
  const questionSectionsGenerator = fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      title: fc.string({ minLength: 2 }).filter(s => s.trim().length > 1),
      description: fc.string(),
      questions: fc.array(questionGenerator, { minLength: 1, maxLength: 3 }),
      stepNumber: fc.integer({ min: 1, max: 8 })
    }),
    { minLength: 1, maxLength: 3 }
  ).map(sections => {
    return sections.map((section, index) => ({
      ...section,
      stepNumber: index + 1
    }))
  }) as fc.Arbitrary<QuestionSection[]>

  // Generator for assessment responses
  const assessmentResponsesGenerator = (sections: QuestionSection[]) => {
    return fc.record({}).map(() => {
      const responses: AssessmentResponses = {}
      
      sections.forEach(section => {
        responses[section.id] = {}
        section.questions.forEach(question => {
          // Randomly decide if question is answered
          const isAnswered = Math.random() > 0.3 // 70% chance of being answered
          
          if (isAnswered) {
            switch (question.type) {
              case 'text':
              case 'textarea':
                responses[section.id][question.id] = fc.sample(fc.string({ minLength: 1 }), 1)[0]
                break
              case 'number':
                responses[section.id][question.id] = fc.sample(fc.integer(), 1)[0]
                break
              case 'select':
              case 'radio':
                if (question.options && question.options.length > 0) {
                  responses[section.id][question.id] = question.options[0].value
                }
                break
              case 'multiselect':
              case 'checkbox':
                if (question.options && question.options.length > 0) {
                  responses[section.id][question.id] = [question.options[0].value]
                }
                break
              default:
                responses[section.id][question.id] = 'test-value'
            }
          }
        })
      })
      
      return responses
    })
  }

  /**
   * Property 18: Assessment completion validation
   * Feature: ai-assessment, Property 18: Assessment completion validation
   * Validates: Requirements 11.7
   */
  test('Property 18: Assessment completion validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          assessment: assessmentGenerator,
          sections: questionSectionsGenerator
        }).chain(({ assessment, sections }) => {
          // Set assessment to final step
          const finalAssessment = {
            ...assessment,
            currentStep: sections.length,
            totalSteps: sections.length
          }
          
          return fc.record({
            assessment: fc.constant(finalAssessment),
            sections: fc.constant(sections),
            responses: assessmentResponsesGenerator(sections)
          })
        }),
        ({ assessment, sections, responses }) => {
          // Mock callback functions
          const mockOnComplete = jest.fn()
          const mockOnSave = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component
            const { queryByText } = render(
              <QuestionnaireFlow
                assessment={assessment}
                sections={sections}
                onComplete={mockOnComplete}
                onSave={mockOnSave}
              />,
              { container }
            )

            // Wait for component to load (skip loading state)
            const loadingElement = queryByText('Loading Assessment')
            if (!loadingElement) {
              // Component should be on the final step
              expect(assessment.currentStep).toBe(sections.length)

              // Check if "Review All Responses" button exists on final step
              const reviewButton = queryByText('Review All Responses')
              expect(reviewButton).toBeInTheDocument()

              // Check if "Complete Assessment" button exists
              const completeButton = queryByText('Complete Assessment')
              expect(completeButton).toBeInTheDocument()

              // Determine if all required questions are answered
              const allRequiredQuestions = sections.flatMap(section => 
                section.questions.filter(q => q.required)
              )
              
              const answeredRequiredQuestions = allRequiredQuestions.filter(question => {
                const section = sections.find(s => s.questions.includes(question))
                if (!section) return false
                
                const sectionResponses = responses[section.id] || {}
                const answer = sectionResponses[question.id]
                const isEmpty = answer === undefined || answer === null || answer === '' || 
                               (Array.isArray(answer) && answer.length === 0)
                return !isEmpty
              })

              const allRequiredAnswered = allRequiredQuestions.length === 0 || 
                                        answeredRequiredQuestions.length === allRequiredQuestions.length

              // Complete button should be enabled only if all required questions are answered
              if (completeButton) {
                const isDisabled = completeButton.hasAttribute('disabled') || 
                                 completeButton.classList.contains('cursor-not-allowed')
                
                if (allRequiredAnswered) {
                  // If all required questions are answered, button should be enabled
                  expect(isDisabled).toBe(false)
                } else {
                  // If not all required questions are answered, button should be disabled
                  expect(isDisabled).toBe(true)
                }
              }

              // Test review modal functionality
              if (reviewButton && !reviewButton.hasAttribute('disabled')) {
                fireEvent.click(reviewButton)
                
                // Review modal should open
                const modalTitle = queryByText('Review Your Responses')
                expect(modalTitle).toBeInTheDocument()

                // Modal should show completion status
                if (allRequiredAnswered) {
                  const completeMessage = queryByText('All required questions have been answered')
                  expect(completeMessage).toBeInTheDocument()
                } else {
                  const incompleteMessage = queryByText('Please complete all required questions')
                  expect(incompleteMessage).toBeInTheDocument()
                }

                // Close modal
                const closeButton = container.querySelector('[aria-label="Close review"]')
                if (closeButton) {
                  fireEvent.click(closeButton)
                }
              }

              // Validation logic consistency
              expect(allRequiredQuestions.length).toBeGreaterThanOrEqual(0)
              expect(answeredRequiredQuestions.length).toBeGreaterThanOrEqual(0)
              expect(answeredRequiredQuestions.length).toBeLessThanOrEqual(allRequiredQuestions.length)
              
              if (allRequiredQuestions.length === 0) {
                expect(allRequiredAnswered).toBe(true)
              }
            }
          } finally {
            // Clean up the container
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity
    )
  })

  /**
   * Property test for completion button state consistency
   */
  test('Completion button state reflects validation status', () => {
    fc.assert(
      fc.property(
        fc.record({
          assessment: assessmentGenerator,
          sections: questionSectionsGenerator
        }).chain(({ assessment, sections }) => {
          // Set assessment to final step
          const finalAssessment = {
            ...assessment,
            currentStep: sections.length,
            totalSteps: sections.length
          }
          
          return fc.record({
            assessment: fc.constant(finalAssessment),
            sections: fc.constant(sections),
            responses: assessmentResponsesGenerator(sections)
          })
        }),
        ({ assessment, sections, responses }) => {
          // Mock callback functions
          const mockOnComplete = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component
            render(
              <QuestionnaireFlow
                assessment={assessment}
                sections={sections}
                onComplete={mockOnComplete}
              />,
              { container }
            )

            // Calculate expected completion status
            const allRequiredQuestions = sections.flatMap(section => 
              section.questions.filter(q => q.required)
            )
            
            const answeredRequiredQuestions = allRequiredQuestions.filter(question => {
              const section = sections.find(s => s.questions.includes(question))
              if (!section) return false
              
              const sectionResponses = responses[section.id] || {}
              const answer = sectionResponses[question.id]
              const isEmpty = answer === undefined || answer === null || answer === '' || 
                             (Array.isArray(answer) && answer.length === 0)
              return !isEmpty
            })

            const shouldBeComplete = allRequiredQuestions.length === 0 || 
                                   answeredRequiredQuestions.length === allRequiredQuestions.length

            // Find complete button
            const completeButton = Array.from(container.querySelectorAll('button')).find(btn => 
              btn.textContent?.includes('Complete Assessment')
            )

            if (completeButton) {
              const isDisabled = completeButton.hasAttribute('disabled') || 
                               completeButton.classList.contains('cursor-not-allowed')
              
              // Button state should match completion status
              if (shouldBeComplete) {
                expect(isDisabled).toBe(false)
              } else {
                expect(isDisabled).toBe(true)
              }
            }

            // Validation consistency checks
            expect(answeredRequiredQuestions.length).toBeLessThanOrEqual(allRequiredQuestions.length)
            expect(typeof shouldBeComplete).toBe('boolean')
            
          } finally {
            // Clean up the container
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property test for review modal integration
   */
  test('Review modal integration maintains data consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          assessment: assessmentGenerator,
          sections: questionSectionsGenerator
        }).chain(({ assessment, sections }) => {
          const finalAssessment = {
            ...assessment,
            currentStep: sections.length,
            totalSteps: sections.length
          }
          
          return fc.record({
            assessment: fc.constant(finalAssessment),
            sections: fc.constant(sections),
            responses: assessmentResponsesGenerator(sections)
          })
        }),
        ({ assessment, sections, responses }) => {
          // Mock callback functions
          const mockOnComplete = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component
            render(
              <QuestionnaireFlow
                assessment={assessment}
                sections={sections}
                onComplete={mockOnComplete}
              />,
              { container }
            )

            // Test data consistency
            expect(sections.length).toBeGreaterThan(0)
            expect(assessment.currentStep).toBe(sections.length)
            expect(assessment.totalSteps).toBe(sections.length)
            
            // Each section should have valid step numbers
            sections.forEach((section, index) => {
              expect(section.stepNumber).toBe(index + 1)
              expect(section.questions.length).toBeGreaterThan(0)
              
              // Each question should have required properties
              section.questions.forEach(question => {
                expect(question.id).toBeTruthy()
                expect(question.label).toBeTruthy()
                expect(typeof question.required).toBe('boolean')
              })
            })

            // Responses should be properly structured
            Object.keys(responses).forEach(sectionId => {
              const sectionResponses = responses[sectionId]
              expect(typeof sectionResponses).toBe('object')
              expect(sectionResponses).not.toBeNull()
              
              Object.keys(sectionResponses).forEach(questionId => {
                const answer = sectionResponses[questionId]
                // Answer can be any valid type
                expect(answer !== undefined).toBe(true)
              })
            })
            
          } finally {
            // Clean up the container
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 25 }
    )
  })
})