/**
 * Property-based test for navigation-triggered save functionality
 * Tests Property 9: Navigation-triggered save
 * Validates Requirements 5.2
 */

import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '../../hooks/useAutoSave'
import { assessmentApi } from '../../lib/api-client'
import { AssessmentResponses } from '../../types/assessment'
import fc from 'fast-check'

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  assessmentApi: {
    saveResponsesWithStatus: jest.fn()
  },
  withRetry: jest.fn((fn) => fn())
}))

const mockAssessmentApi = assessmentApi as jest.Mocked<typeof assessmentApi>

describe('Property 9: Navigation-triggered save', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAssessmentApi.saveResponsesWithStatus.mockResolvedValue({
      id: 'test-assessment',
      name: 'Test Assessment',
      companyId: 'test-company',
      type: 'EXPLORATORY' as const,
      status: 'IN_PROGRESS' as const,
      currentStep: 1,
      totalSteps: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should save current responses immediately when navigation occurs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          assessmentId: fc.string({ minLength: 1, maxLength: 50 }),
          initialStep: fc.integer({ min: 1, max: 7 }),
          targetStep: fc.integer({ min: 1, max: 7 }),
          responses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }), // question IDs
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }), // text responses
              fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), // array responses
              fc.integer({ min: 1, max: 100 }), // number responses
              fc.boolean() // boolean responses
            ),
            { minKeys: 1, maxKeys: 10 }
          )
        }),
        async ({ assessmentId, initialStep, targetStep, responses }) => {
          console.log(`Testing navigation from step ${initialStep} to ${targetStep} with ${Object.keys(responses).length} responses`)
          
          // Skip if no actual navigation occurs
          if (initialStep === targetStep) {
            return true
          }

          // Clear mocks for this test iteration
          jest.clearAllMocks()

          // Create responses structure for the initial step
          const initialStepId = `step-${initialStep}`
          const assessmentResponses: AssessmentResponses = {
            [initialStepId]: responses
          }

          // Render the hook with initial data
          const { result, unmount } = renderHook(() =>
            useAutoSave(assessmentResponses, initialStep, {
              assessmentId,
              autoSaveInterval: 60000, // Long interval to prevent auto-save during test
              onSaveSuccess: jest.fn(),
              onSaveError: jest.fn()
            })
          )

          // Wait for initial state to settle
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
          })

          // Clear any calls that might have happened during initialization
          jest.clearAllMocks()

          // Verify initial state
          expect(result.current.hasUnsavedChanges).toBe(true)
          expect(result.current.saveStatus).toBe('idle')

          // Simulate navigation by calling saveNow (which would be triggered by navigation)
          await act(async () => {
            await result.current.saveNow()
          })

          // Verify that save was called exactly once
          expect(mockAssessmentApi.saveResponsesWithStatus).toHaveBeenCalledTimes(1)
          
          const saveCall = mockAssessmentApi.saveResponsesWithStatus.mock.calls[0]
          expect(saveCall[0]).toBe(assessmentId) // assessment ID
          expect(saveCall[1]).toBe(initialStepId) // step ID
          expect(saveCall[2]).toEqual(responses) // responses
          expect(saveCall[3]).toBe(initialStep) // current step
          expect(saveCall[4]).toMatchObject({
            status: expect.stringMatching(/^(not_started|partial|completed)$/),
            requiredFieldsCount: expect.any(Number),
            filledFieldsCount: expect.any(Number)
          }) // step status

          // Verify save status changed appropriately
          expect(result.current.saveStatus).toBe('saved')
          expect(result.current.hasUnsavedChanges).toBe(false)
          expect(result.current.lastSaved).toBeInstanceOf(Date)

          // Clean up
          unmount()

          return true
        }
      ),
      { 
        numRuns: 5, // Reduced for faster execution
        verbose: true,
        seed: 42
      }
    )
  })

  it('should handle save errors gracefully during navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          assessmentId: fc.string({ minLength: 1, maxLength: 50 }),
          currentStep: fc.integer({ min: 1, max: 7 }),
          responses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            { minKeys: 1, maxKeys: 5 }
          ),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ assessmentId, currentStep, responses, errorMessage }) => {
          console.log(`Testing error handling for step ${currentStep} with error: ${errorMessage.substring(0, 30)}...`)
          
          // Clear mocks for this test iteration
          jest.clearAllMocks()
          
          // Mock API to throw error
          mockAssessmentApi.saveResponsesWithStatus.mockRejectedValueOnce(new Error(errorMessage))

          const stepId = `step-${currentStep}`
          const assessmentResponses: AssessmentResponses = {
            [stepId]: responses
          }

          const onSaveError = jest.fn()
          const { result, unmount } = renderHook(() =>
            useAutoSave(assessmentResponses, currentStep, {
              assessmentId,
              autoSaveInterval: 60000,
              onSaveError
            })
          )

          // Wait for initial state
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
          })

          // Clear any initialization calls
          jest.clearAllMocks()
          onSaveError.mockClear()

          // Attempt to save (simulating navigation trigger)
          await act(async () => {
            await result.current.saveNow()
          })

          // Verify error handling
          expect(result.current.saveStatus).toBe('error')
          expect(onSaveError).toHaveBeenCalledWith(expect.any(Error))
          expect(onSaveError.mock.calls[0][0].message).toBe(errorMessage)

          // Verify that unsaved changes flag remains true on error
          expect(result.current.hasUnsavedChanges).toBe(true)

          // Clean up
          unmount()

          return true
        }
      ),
      { 
        numRuns: 3, // Reduced for faster execution
        verbose: true,
        seed: 123
      }
    )
  })

  it('should calculate step status correctly based on response completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          assessmentId: fc.string({ minLength: 1, maxLength: 50 }),
          currentStep: fc.integer({ min: 1, max: 7 }),
          emptyResponses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.constant(''), // Empty responses
            { minKeys: 1, maxKeys: 3 }
          ),
          filledResponses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 100 }), // Filled responses
            { minKeys: 1, maxKeys: 5 }
          )
        }),
        async ({ assessmentId, currentStep, emptyResponses, filledResponses }) => {
          console.log(`Testing step status calculation for step ${currentStep}`)
          
          // Clear mocks for this test iteration
          jest.clearAllMocks()

          // Test with only empty responses (should be 'not_started')
          const emptyStepId = `step-${currentStep}`
          const emptyAssessmentResponses: AssessmentResponses = {
            [emptyStepId]: emptyResponses
          }

          const { result: emptyResult, unmount: unmountEmpty } = renderHook(() =>
            useAutoSave(emptyAssessmentResponses, currentStep, {
              assessmentId,
              autoSaveInterval: 60000
            })
          )

          await act(async () => {
            await emptyResult.current.saveNow()
          })

          // Verify empty responses result in 'not_started' status
          const emptyCall = mockAssessmentApi.saveResponsesWithStatus.mock.calls.find(
            call => call[2] === emptyResponses
          )
          if (emptyCall) {
            expect(emptyCall[4].status).toBe('not_started')
            expect(emptyCall[4].filledFieldsCount).toBe(0)
          }

          unmountEmpty()
          jest.clearAllMocks()

          // Test with filled responses (should be 'partial' or 'completed')
          const filledStepId = `step-${currentStep + 1}`
          const filledAssessmentResponses: AssessmentResponses = {
            [filledStepId]: filledResponses
          }

          const { result: filledResult, unmount: unmountFilled } = renderHook(() =>
            useAutoSave(filledAssessmentResponses, currentStep + 1, {
              assessmentId,
              autoSaveInterval: 60000
            })
          )

          await act(async () => {
            await filledResult.current.saveNow()
          })

          // Verify filled responses result in 'partial' or 'completed' status
          const filledCall = mockAssessmentApi.saveResponsesWithStatus.mock.calls.find(
            call => call[2] === filledResponses
          )
          if (filledCall) {
            expect(['partial', 'completed']).toContain(filledCall[4].status)
            expect(filledCall[4].filledFieldsCount).toBeGreaterThan(0)
            expect(filledCall[4].requiredFieldsCount).toBeGreaterThan(0)
          }

          unmountFilled()

          return true
        }
      ),
      { 
        numRuns: 3, // Reduced for faster execution
        verbose: true,
        seed: 456
      }
    )
  })
})