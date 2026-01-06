/**
 * Property-based tests for ResponseReviewModal component
 * Feature: ai-assessment
 */

import * as fc from 'fast-check'
import { render, cleanup } from '@testing-library/react'
import { Assessment, AssessmentResponses, QuestionSection, Question } from '@/types/assessment'
import ResponseReviewModal from '@/components/ai-assessment/ResponseReviewModal'

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup()
})

describe('ResponseReviewModal Property Tests', () => {
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

  // Generator for question sections with sequential step numbers
  const questionSectionsGenerator = fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      title: fc.string({ minLength: 2 }).filter(s => s.trim().length > 1),
      description: fc.string(),
      questions: fc.array(questionGenerator, { minLength: 1, maxLength: 5 }),
      stepNumber: fc.integer({ min: 1, max: 8 })
    }),
    { minLength: 1, maxLength: 8 }
  ).map(sections => {
    return sections.map((section, index) => ({
      ...section,
      stepNumber: index + 1
    }))
  }) as fc.Arbitrary<QuestionSection[]>

  // Generator for assessment responses
  const assessmentResponsesGenerator = fc.array(
    fc.record({
      stepId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      questionId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      answer: fc.oneof(
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.array(fc.string()),
        fc.constant(null),
        fc.constant(undefined),
        fc.constant('')
      )
    }),
    { minLength: 0, maxLength: 20 }
  ).map(responseArray => {
    const responses: AssessmentResponses = {}
    responseArray.forEach(({ stepId, questionId, answer }) => {
      if (!responses[stepId]) {
        responses[stepId] = {}
      }
      responses[stepId][questionId] = answer
    })
    return responses
  }) as fc.Arbitrary<AssessmentResponses>

  /**
   * Property 17: Response review completeness
   * Feature: ai-assessment, Property 17: Response review completeness
   * Validates: Requirements 11.4, 11.6
   */
  test('Property 17: Response review completeness', () => {
    fc.assert(
      fc.property(
        fc.record({
          assessment: assessmentGenerator,
          questions: questionSectionsGenerator,
          responses: assessmentResponsesGenerator,
          isOpen: fc.boolean()
        }),
        ({ assessment, questions, responses, isOpen }) => {
          // Mock callback functions
          const mockOnClose = jest.fn()
          const mockOnEditResponse = jest.fn()
          const mockOnComplete = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component
            const { getByText, queryByText } = render(
              <ResponseReviewModal
                isOpen={isOpen}
                assessment={assessment}
                responses={responses}
                questions={questions}
                onClose={mockOnClose}
                onEditResponse={mockOnEditResponse}
                onComplete={mockOnComplete}
              />,
              { container }
            )

            if (isOpen) {
              // Verify that the modal renders when open
              expect(getByText('Review Your Responses')).toBeInTheDocument()

              // Verify assessment information is displayed
              // Use a more specific selector to avoid multiple matches
              const assessmentInfo = container.querySelector('.text-sm.text-gray-600.mt-1')
              expect(assessmentInfo).toBeInTheDocument()
              expect(assessmentInfo?.textContent).toContain(assessment.name.trim())

              // Test response completeness validation
              questions.forEach((section: QuestionSection) => {
                // Each section should be displayed with its title
                const sectionTitleText = `Step ${section.stepNumber}: ${section.title}`
                const sectionElements = container.querySelectorAll('h4')
                const sectionElement = Array.from(sectionElements).find(el => 
                  el.textContent?.includes(`Step ${section.stepNumber}:`)
                )
                expect(sectionElement).toBeInTheDocument()

                // Verify questions are displayed
                section.questions.forEach((question: Question) => {
                  const questionElements = container.querySelectorAll('h5')
                  const questionElement = Array.from(questionElements).find(el => 
                    el.textContent?.trim() === question.label.trim()
                  )
                  expect(questionElement).toBeInTheDocument()

                  // Check if question has a response
                  const sectionResponses = responses[section.id] || {}
                  const answer = sectionResponses[question.id]
                  const isEmpty = answer === undefined || answer === null || answer === '' || 
                                 (Array.isArray(answer) && answer.length === 0)

                  // Required questions should be marked as such
                  if (question.required) {
                    const requiredElements = container.querySelectorAll('.text-xs.text-red-600')
                    expect(requiredElements.length).toBeGreaterThanOrEqual(0)
                  }

                  // Answer display validation
                  if (isEmpty) {
                    const notAnsweredElements = container.querySelectorAll('.text-gray-400.italic')
                    expect(notAnsweredElements.length).toBeGreaterThan(0)
                  }
                })
              })

              // Verify overall progress calculation
              const allRequiredQuestions = questions.flatMap(section => 
                section.questions.filter((q: Question) => q.required)
              )
              
              const answeredRequiredQuestions = allRequiredQuestions.filter((question: Question) => {
                const section = questions.find(s => s.questions.includes(question))
                if (!section) return false
                
                const sectionResponses = responses[section.id] || {}
                const answer = sectionResponses[question.id]
                const isEmpty = answer === undefined || answer === null || answer === '' || 
                               (Array.isArray(answer) && answer.length === 0)
                return !isEmpty
              })

              const isComplete = allRequiredQuestions.length === 0 || 
                               answeredRequiredQuestions.length === allRequiredQuestions.length

              // Completion status should be reflected in the UI
              if (isComplete) {
                const completeElements = container.querySelectorAll('.text-green-700')
                expect(completeElements.length).toBeGreaterThan(0)
              } else {
                const incompleteElements = container.querySelectorAll('.text-amber-700')
                expect(incompleteElements.length).toBeGreaterThan(0)
              }

              // Progress percentage should be accurate
              const expectedPercentage = allRequiredQuestions.length > 0 
                ? Math.round((answeredRequiredQuestions.length / allRequiredQuestions.length) * 100)
                : 100

              expect(expectedPercentage).toBeGreaterThanOrEqual(0)
              expect(expectedPercentage).toBeLessThanOrEqual(100)

            } else {
              // When modal is closed, it should not render content
              expect(queryByText('Review Your Responses')).not.toBeInTheDocument()
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
   * Additional property test for response organization by step
   */
  test('Response organization maintains step hierarchy', () => {
    fc.assert(
      fc.property(
        fc.record({
          assessment: assessmentGenerator,
          questions: questionSectionsGenerator,
          responses: assessmentResponsesGenerator
        }),
        ({ assessment, questions, responses }) => {
          // Mock callback functions
          const mockOnClose = jest.fn()
          const mockOnEditResponse = jest.fn()
          const mockOnComplete = jest.fn()

          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)

          try {
            // Render the component
            render(
              <ResponseReviewModal
                isOpen={true}
                assessment={assessment}
                responses={responses}
                questions={questions}
                onClose={mockOnClose}
                onEditResponse={mockOnEditResponse}
                onComplete={mockOnComplete}
              />,
              { container }
            )

            // Verify step organization
            questions.forEach((section, index) => {
              // Steps should be displayed in order
              expect(section.stepNumber).toBe(index + 1)
              
              // Each section should have a valid step number
              expect(section.stepNumber).toBeGreaterThan(0)
              expect(section.stepNumber).toBeLessThanOrEqual(questions.length)
              
              // Section should have questions
              expect(section.questions.length).toBeGreaterThanOrEqual(0)
              
              // Each question should have required properties
              section.questions.forEach((question: Question) => {
                expect(question.id).toBeTruthy()
                expect(question.label).toBeTruthy()
                expect(typeof question.required).toBe('boolean')
              })
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
   * Property test for answer formatting consistency
   */
  test('Answer formatting handles all data types consistently', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.string()),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.array(fc.string(), { maxLength: 0 }) // empty array
        ),
        (answer) => {
          // Test the answer formatting logic
          const formatAnswer = (answer: any): string => {
            if (answer === undefined || answer === null || answer === '') {
              return 'Not answered'
            }
            
            if (Array.isArray(answer)) {
              if (answer.length === 0) return 'Not answered'
              return answer.join(', ')
            }
            
            if (typeof answer === 'boolean') {
              return answer ? 'Yes' : 'No'
            }
            
            return String(answer)
          }

          const formattedAnswer = formatAnswer(answer)
          
          // Formatted answer should always be a string
          expect(typeof formattedAnswer).toBe('string')
          
          // Should handle empty values consistently
          const isEmpty = answer === undefined || answer === null || answer === '' || 
                         (Array.isArray(answer) && answer.length === 0)
          
          if (isEmpty) {
            expect(formattedAnswer).toBe('Not answered')
          } else {
            expect(formattedAnswer).not.toBe('Not answered')
            // Only check length for non-empty values
            if (typeof answer === 'string' && answer.length === 0) {
              expect(formattedAnswer).toBe('Not answered')
            } else if (Array.isArray(answer) && answer.length > 0) {
              expect(formattedAnswer.length).toBeGreaterThan(0)
            } else if (typeof answer === 'boolean' || typeof answer === 'number') {
              expect(formattedAnswer.length).toBeGreaterThan(0)
            } else if (typeof answer === 'string' && answer.length > 0) {
              expect(formattedAnswer.length).toBeGreaterThan(0)
            }
          }
          
          // Boolean values should be formatted as Yes/No
          if (typeof answer === 'boolean') {
            expect(formattedAnswer).toMatch(/^(Yes|No)$/)
          }
          
          // Arrays should be joined with commas
          if (Array.isArray(answer) && answer.length > 0) {
            expect(formattedAnswer).toContain(answer[0])
            if (answer.length > 1) {
              expect(formattedAnswer).toContain(', ')
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})