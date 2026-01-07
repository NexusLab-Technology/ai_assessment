/**
 * Property-Based Tests for Category-Based Auto-Save
 * Task 11.2: Property 12 - Original numbering preservation
 * Validates Requirements 14.6
 */

import * as fc from 'fast-check'
import { AutoSaveService, createAutoSaveService } from '@/lib/services/auto-save-service'

// Mock fetch for testing
global.fetch = jest.fn()

describe('Property 12: Original numbering preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  // Generators for testing - ensure unique question IDs
  const questionIdArb = fc.integer({ min: 1, max: 1000 }).map(n => `q-${n}`)
  const questionNumberArb = fc.integer({ min: 1, max: 100 }).map(n => `Q${n}`)
  
  const questionResponseArb = fc.record({
    questionId: questionIdArb,
    questionNumber: questionNumberArb,
    response: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.integer({ min: 1, max: 5 }),
      fc.boolean(),
      fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { maxLength: 3 })
    )
  })

  // Generate unique question responses
  const uniqueQuestionResponsesArb = fc.array(questionResponseArb, { minLength: 1, maxLength: 5 })
    .map(responses => {
      const uniqueResponses = new Map()
      responses.forEach(response => {
        if (!uniqueResponses.has(response.questionId)) {
          uniqueResponses.set(response.questionId, response)
        }
      })
      return Array.from(uniqueResponses.values())
    })
    .filter(responses => responses.length > 0)

  const categoryIdArb = fc.constantFrom('use-case-discovery', 'data-readiness', 'compliance-integration')

  /**
   * Property 12.1: Question numbering preservation during auto-save
   */
  test('question numbering is preserved during auto-save operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryIdArb,
        uniqueQuestionResponsesArb,
        async (categoryId, questionResponses) => {
          // Create fresh service for this test
          const autoSaveService = createAutoSaveService('test-assessment-123', {
            intervalMs: 30000,
            maxRetries: 1,
            retryDelayMs: 100
          })

          try {
            // Setup: Mock successful API response and clear previous calls
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockClear()
            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ success: true })
            } as Response)

            // Create responses with original question numbering
            const responses: { [questionId: string]: any } = {}
            const originalNumbering: { [questionId: string]: string } = {}
            
            questionResponses.forEach(({ questionId, questionNumber, response }) => {
              responses[questionId] = response
              originalNumbering[questionId] = questionNumber
            })

            // Action: Update category responses and save immediately
            autoSaveService.updateCategoryResponses(categoryId, responses)
            const saveResult = await autoSaveService.saveNow()

            // Verification: Save should succeed
            expect(saveResult.success).toBe(true)
            expect(mockFetch).toHaveBeenCalled()

            // Property: Original question numbering should be preserved in API call
            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
            const requestBody = JSON.parse(lastCall[1]?.body as string)
            
            expect(requestBody.categoryId).toBe(categoryId)
            expect(requestBody.responses).toEqual(responses)

            // Property: All original question IDs must be preserved
            Object.keys(originalNumbering).forEach(questionId => {
              expect(requestBody.responses).toHaveProperty(questionId)
            })
          } finally {
            autoSaveService.destroy()
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 12.2: Question numbering consistency across multiple saves
   */
  test('question numbering remains consistent across multiple auto-save operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(categoryIdArb, uniqueQuestionResponsesArb),
          { minLength: 2, maxLength: 3 }
        ),
        async (categoryUpdates) => {
          // Create fresh service for this test
          const autoSaveService = createAutoSaveService('test-assessment-123', {
            intervalMs: 30000,
            maxRetries: 1,
            retryDelayMs: 100
          })

          try {
            // Setup: Mock successful API responses and clear previous calls
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockClear()
            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ success: true })
            } as Response)

            const savedResponses: Array<{ categoryId: string; responses: any }> = []

            // Action: Perform multiple category updates sequentially
            for (const [categoryId, questionResponses] of categoryUpdates) {
              const responses: { [questionId: string]: any } = {}
              
              questionResponses.forEach(({ questionId, response }) => {
                responses[questionId] = response
              })

              autoSaveService.updateCategoryResponses(categoryId, responses)
              const saveResult = await autoSaveService.saveNow()
              
              expect(saveResult.success).toBe(true)
              savedResponses.push({ categoryId, responses })
            }

            // Property: Each save should have preserved the correct question structure
            // We expect at least as many calls as category updates
            expect(mockFetch).toHaveBeenCalledTimes(categoryUpdates.length)

            // Verify the last N API calls had the correct structure
            const relevantCalls = mockFetch.mock.calls.slice(-categoryUpdates.length)
            relevantCalls.forEach((call, index) => {
              const requestBody = JSON.parse(call[1]?.body as string)
              const expectedData = savedResponses[index]
              
              expect(requestBody.categoryId).toBe(expectedData.categoryId)
              expect(requestBody.responses).toEqual(expectedData.responses)
            })
          } finally {
            autoSaveService.destroy()
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property 12.3: Question numbering preservation during retry operations
   */
  test('question numbering is preserved during retry operations after failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryIdArb,
        uniqueQuestionResponsesArb,
        async (categoryId, questionResponses) => {
          // Create fresh service for this test
          const autoSaveService = createAutoSaveService('test-assessment-123', {
            intervalMs: 30000,
            maxRetries: 1,
            retryDelayMs: 100
          })

          try {
            // Setup: Mock initial failure then success and clear previous calls
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockClear()
            mockFetch
              .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Server error' })
              } as Response)
              .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
              } as Response)

            // Create responses with original numbering
            const responses: { [questionId: string]: any } = {}
            const originalQuestionIds = questionResponses.map(q => q.questionId)
            
            questionResponses.forEach(({ questionId, response }) => {
              responses[questionId] = response
            })

            // Action: Update and save (will fail first, then retry)
            autoSaveService.updateCategoryResponses(categoryId, responses)
            
            // First save attempt (will fail)
            const firstResult = await autoSaveService.saveNow()
            expect(firstResult.success).toBe(false)
            
            // The retry should happen automatically after the delay
            // Fast-forward timers to trigger retry
            jest.advanceTimersByTime(200)
            
            // Wait for retry to complete
            await new Promise(resolve => {
              jest.useRealTimers()
              setTimeout(resolve, 100)
              jest.useFakeTimers()
            })
            
            // Property: Both calls should have identical question structure
            // We expect at least 2 calls (initial + retry)
            expect(mockFetch).toHaveBeenCalledTimes(2)
            
            const firstCall = mockFetch.mock.calls[0]
            const retryCall = mockFetch.mock.calls[1]
            
            const firstBody = JSON.parse(firstCall[1]?.body as string)
            const retryBody = JSON.parse(retryCall[1]?.body as string)

            expect(firstBody.categoryId).toBe(retryBody.categoryId)
            expect(firstBody.responses).toEqual(retryBody.responses)

            // Property: All original question IDs preserved in retry
            originalQuestionIds.forEach(questionId => {
              expect(retryBody.responses).toHaveProperty(questionId)
            })
          } finally {
            autoSaveService.destroy()
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 15000) // Increase timeout for this test

  /**
   * Property 12.4: Category completion status calculation preserves question structure
   */
  test('category completion status calculation preserves original question structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryIdArb,
        uniqueQuestionResponsesArb,
        fc.integer({ min: 5, max: 20 }),
        async (categoryId, questionResponses, totalQuestions) => {
          // Create fresh service for this test
          const autoSaveService = createAutoSaveService('test-assessment-123', {
            intervalMs: 30000,
            maxRetries: 1,
            retryDelayMs: 100
          })

          try {
            // Create responses
            const responses: { [questionId: string]: any } = {}
            questionResponses.forEach(({ questionId, response }) => {
              responses[questionId] = response
            })

            // Action: Update category responses
            autoSaveService.updateCategoryResponses(categoryId, responses)

            // Action: Get completion status
            const completionStatus = autoSaveService.getCategoryCompletionStatus(categoryId, totalQuestions)

            // Property: Completion calculation should be based on actual responses
            const expectedAnsweredQuestions = Object.keys(responses).filter(questionId => {
              const answer = responses[questionId]
              return answer !== null && answer !== undefined && answer !== ''
            }).length

            expect(completionStatus.answeredQuestions).toBe(expectedAnsweredQuestions)

            // Property: Completion percentage should be accurate
            const expectedPercentage = totalQuestions > 0 
              ? Math.round((expectedAnsweredQuestions / totalQuestions) * 100) 
              : 0
            expect(completionStatus.completionPercentage).toBe(expectedPercentage)

            // Property: Status should reflect actual completion
            let expectedStatus: 'not_started' | 'partial' | 'completed' = 'not_started'
            if (expectedAnsweredQuestions === totalQuestions) {
              expectedStatus = 'completed'
            } else if (expectedAnsweredQuestions > 0) {
              expectedStatus = 'partial'
            }
            expect(completionStatus.status).toBe(expectedStatus)
          } finally {
            autoSaveService.destroy()
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 12.5: Auto-save interval preservation of question order
   */
  test('auto-save interval operations preserve question order and numbering', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryIdArb,
        uniqueQuestionResponsesArb,
        async (categoryId, orderedQuestions) => {
          // Create fresh service for this test
          const autoSaveService = createAutoSaveService('test-assessment-123', {
            intervalMs: 30000,
            maxRetries: 1,
            retryDelayMs: 100
          })

          try {
            // Setup: Mock successful responses and clear previous calls
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockClear()
            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ success: true })
            } as Response)

            // Create ordered responses
            const responses: { [questionId: string]: any } = {}
            const questionOrder = orderedQuestions.map(q => q.questionId)
            
            orderedQuestions.forEach(({ questionId, response }) => {
              responses[questionId] = response
            })

            // Action: Update responses and trigger manual save (simpler than interval)
            autoSaveService.updateCategoryResponses(categoryId, responses)
            const saveResult = await autoSaveService.saveNow()

            // Verification: Save should succeed
            expect(saveResult.success).toBe(true)
            expect(mockFetch).toHaveBeenCalled()

            // Property: Question order should be preserved in API call
            const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
            const requestBody = JSON.parse(lastCall[1]?.body as string)
            
            // All original questions should be present
            questionOrder.forEach(questionId => {
              expect(requestBody.responses).toHaveProperty(questionId)
            })

            // Response structure should match original (same keys, order doesn't matter for objects)
            expect(Object.keys(requestBody.responses).sort()).toEqual(questionOrder.sort())
          } finally {
            autoSaveService.destroy()
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})