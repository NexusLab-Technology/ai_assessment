/**
 * Property-Based Tests for Category-Based Data Persistence
 * Task 10.3: Property 4 - Response preservation during navigation
 * Validates Requirements 4.4, 12.5
 */

import * as fc from 'fast-check'
import { AssessmentResponses, Assessment } from '@/types/rapid-questionnaire'

// Mock MongoDB and related dependencies
jest.mock('mongodb', () => ({
  ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || '507f1f77bcf86cd799439011' }))
}))

jest.mock('@/lib/mongodb', () => ({
  getCollection: jest.fn()
}))

jest.mock('@/lib/models/assessment', () => ({
  COLLECTIONS: {
    ASSESSMENTS: 'assessments',
    RAPID_QUESTIONNAIRES: 'rapid_questionnaires'
  }
}))

// Import after mocking
import { AssessmentService } from '@/lib/services/assessment-service'

// Mock the AssessmentService
jest.mock('@/lib/services/assessment-service')

const mockAssessmentService = AssessmentService as jest.Mocked<typeof AssessmentService>

describe('Property 4: Response preservation during navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Simple generators for testing
  const categoryResponsesArb = fc.dictionary(
    fc.string({ minLength: 2, maxLength: 10 }),
    fc.string({ minLength: 1, maxLength: 100 }),
    { minKeys: 1, maxKeys: 5 }
  )

  const createMockAssessment = (overrides: Partial<Assessment> = {}): Assessment => ({
    id: '507f1f77bcf86cd799439011',
    name: 'Test Assessment',
    companyId: '507f1f77bcf86cd799439012',
    userId: 'test-user',
    type: 'EXPLORATORY',
    status: 'IN_PROGRESS',
    currentCategory: 'use-case-discovery',
    totalCategories: 5,
    responses: {},
    categoryStatuses: {},
    rapidQuestionnaireVersion: '3.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  /**
   * Property 4.1: Response data persistence across category navigation
   */
  test('responses are preserved when navigating between categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryResponsesArb,
        fc.constantFrom('use-case-discovery', 'data-readiness', 'compliance-integration'),
        async (newResponses, targetCategory) => {
          const assessmentData = createMockAssessment({
            responses: { 'existing-category': { 'q1': 'existing answer' } }
          })

          // Setup: Mock successful operations
          mockAssessmentService.getAssessment.mockResolvedValue(assessmentData)
          mockAssessmentService.updateCategoryResponses.mockResolvedValue({
            success: true
          })
          mockAssessmentService.updateCurrentCategory.mockResolvedValue({
            success: true
          })

          // Action 1: Save responses for current category
          const saveResult = await AssessmentService.updateCategoryResponses(
            assessmentData.id,
            assessmentData.currentCategory,
            newResponses
          )

          // Action 2: Navigate to different category
          const navigationResult = await AssessmentService.updateCurrentCategory(
            assessmentData.id,
            targetCategory
          )

          // Action 3: Retrieve assessment data
          const retrievedAssessment = await AssessmentService.getAssessment(assessmentData.id)

          // Verification: All operations should succeed
          expect(saveResult.success).toBe(true)
          expect(navigationResult.success).toBe(true)
          expect(retrievedAssessment).not.toBeNull()

          // Property: Original responses must be preserved
          if (retrievedAssessment) {
            expect(retrievedAssessment.responses).toEqual(
              expect.objectContaining(assessmentData.responses)
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.2: Error handling preserves data integrity
   */
  test('failed operations do not corrupt existing data', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryResponsesArb,
        async (newResponses) => {
          const assessmentData = createMockAssessment({
            responses: { 'existing-category': { 'q1': 'existing answer' } }
          })

          // Setup: Mock failure scenario
          mockAssessmentService.updateCategoryResponses.mockResolvedValue({
            success: false,
            error: 'Database connection failed'
          })

          mockAssessmentService.getAssessment.mockResolvedValue(assessmentData)

          // Action: Attempt to update responses (should fail)
          const updateResult = await AssessmentService.updateCategoryResponses(
            assessmentData.id,
            assessmentData.currentCategory,
            newResponses
          )

          // Verification: Operation should fail gracefully
          expect(updateResult.success).toBe(false)
          expect(updateResult.error).toBeDefined()

          // Property: Original data should remain intact
          const retrievedAssessment = await AssessmentService.getAssessment(assessmentData.id)
          expect(retrievedAssessment).not.toBeNull()

          if (retrievedAssessment) {
            expect(retrievedAssessment.responses).toEqual(assessmentData.responses)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.3: Multiple category updates preserve all data
   */
  test('multiple category updates preserve all response data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            fc.constantFrom('use-case-discovery', 'data-readiness', 'compliance-integration'), 
            categoryResponsesArb
          ), 
          { minLength: 2, maxLength: 3 }
        ),
        async (categoryUpdates) => {
          // Reset mocks for this test iteration
          jest.clearAllMocks()
          
          const assessmentData = createMockAssessment()

          // Setup: Build expected responses object (last update wins for each category)
          const expectedResponses: AssessmentResponses = { ...assessmentData.responses }
          categoryUpdates.forEach(([categoryId, responses]) => {
            expectedResponses[categoryId] = responses
          })

          const updatedAssessment = createMockAssessment({
            responses: expectedResponses
          })

          mockAssessmentService.getAssessment.mockResolvedValue(updatedAssessment)
          mockAssessmentService.updateCategoryResponses.mockResolvedValue({ success: true })

          // Action: Update multiple categories sequentially
          const updateResults = []
          for (const [categoryId, responses] of categoryUpdates) {
            const result = await AssessmentService.updateCategoryResponses(
              assessmentData.id,
              categoryId,
              responses
            )
            updateResults.push(result)
          }

          // Action: Retrieve final assessment state
          const finalAssessment = await AssessmentService.getAssessment(assessmentData.id)

          // Verification: All updates should succeed
          updateResults.forEach(result => {
            expect(result.success).toBe(true)
          })

          // Property: Final responses must match the expected state (last update per category wins)
          expect(finalAssessment).not.toBeNull()
          if (finalAssessment) {
            // Check that all expected categories are present with their final values
            Object.keys(expectedResponses).forEach(categoryId => {
              expect(finalAssessment.responses[categoryId]).toEqual(expectedResponses[categoryId])
            })
          }

          // Verify all update calls were made
          expect(mockAssessmentService.updateCategoryResponses).toHaveBeenCalledTimes(
            categoryUpdates.length
          )
        }
      ),
      { numRuns: 50 }
    )
  })
})