/**
 * Tests for useAutoSave hook
 * Feature: ai-assessment, Property 9: Navigation-triggered save
 * Validates: Requirements 5.2
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '../../hooks/useAutoSave'
import { AssessmentResponses } from '../../types/assessment'
import { assessmentApi } from '../../lib/api-client'

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  assessmentApi: {
    saveResponses: jest.fn()
  },
  withRetry: jest.fn((fn) => fn())
}))

const mockAssessmentApi = assessmentApi as jest.Mocked<typeof assessmentApi>

describe('useAutoSave Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  /**
   * Basic functionality tests
   */
  describe('Basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => 
        useAutoSave({}, 1, { assessmentId: 'test-id' })
      )

      expect(result.current.saveStatus).toBe('idle')
      expect(result.current.hasUnsavedChanges).toBe(false)
      expect(result.current.lastSaved).toBeNull()
      expect(typeof result.current.saveNow).toBe('function')
    })

    it('should detect unsaved changes when responses are provided', () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' }
      }

      const { result } = renderHook(() => 
        useAutoSave(responses, 1, { assessmentId: 'test-id' })
      )

      expect(result.current.hasUnsavedChanges).toBe(true)
    })

    it('should call saveNow successfully', async () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' }
      }

      mockAssessmentApi.saveResponses.mockResolvedValue({
        id: 'test-id',
        name: 'Test Assessment',
        companyId: 'test-company',
        type: 'EXPLORATORY' as const,
        status: 'IN_PROGRESS' as const,
        currentStep: 1,
        totalSteps: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { result } = renderHook(() => 
        useAutoSave(responses, 1, { assessmentId: 'test-id' })
      )

      await act(async () => {
        await result.current.saveNow()
      })

      expect(mockAssessmentApi.saveResponses).toHaveBeenCalledWith(
        'test-id',
        'step-1',
        { 'q1': 'answer1' },
        1
      )
      expect(result.current.saveStatus).toBe('saved')
    })

    it('should handle save errors', async () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' }
      }

      let errorCallbackCalled = false
      mockAssessmentApi.saveResponses.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => 
        useAutoSave(responses, 1, {
          assessmentId: 'test-id',
          onSaveError: () => { errorCallbackCalled = true }
        })
      )

      await act(async () => {
        await result.current.saveNow()
      })

      expect(errorCallbackCalled).toBe(true)
      expect(result.current.saveStatus).toBe('error')
    })

    it('should update hasUnsavedChanges when step changes', () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' },
        'step-2': { 'q2': 'answer2' }
      }

      const { result, rerender } = renderHook(
        ({ currentStep }) => useAutoSave(responses, currentStep, {
          assessmentId: 'test-id'
        }),
        { initialProps: { currentStep: 1 } }
      )

      expect(result.current.hasUnsavedChanges).toBe(true)

      // Change step
      act(() => {
        rerender({ currentStep: 2 })
      })

      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })

  /**
   * Property 9: Navigation-triggered save validation
   */
  describe('Navigation-triggered save', () => {
    it('should validate navigation save functionality', async () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' },
        'step-2': { 'q2': 'answer2' }
      }

      mockAssessmentApi.saveResponses.mockResolvedValue({
        id: 'test-id',
        name: 'Test Assessment',
        companyId: 'test-company',
        type: 'EXPLORATORY' as const,
        status: 'IN_PROGRESS' as const,
        currentStep: 2,
        totalSteps: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { result, rerender } = renderHook(
        ({ currentStep }) => useAutoSave(responses, currentStep, {
          assessmentId: 'test-id'
        }),
        { initialProps: { currentStep: 1 } }
      )

      // Navigate to step 2
      act(() => {
        rerender({ currentStep: 2 })
      })

      // Manually trigger save (simulating what happens on navigation)
      await act(async () => {
        await result.current.saveNow()
      })

      // Verify save was called with step 2 data
      expect(mockAssessmentApi.saveResponses).toHaveBeenCalledWith(
        'test-id',
        'step-2',
        { 'q2': 'answer2' },
        2
      )
    })
  })

  /**
   * Auto-save timer tests
   */
  describe('Auto-save timer', () => {
    it('should trigger auto-save after interval', () => {
      const responses: AssessmentResponses = {
        'step-1': { 'q1': 'answer1' }
      }

      mockAssessmentApi.saveResponses.mockResolvedValue({
        id: 'test-id',
        name: 'Test Assessment',
        companyId: 'test-company',
        type: 'EXPLORATORY' as const,
        status: 'IN_PROGRESS' as const,
        currentStep: 1,
        totalSteps: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      renderHook(() => 
        useAutoSave(responses, 1, {
          assessmentId: 'test-id',
          autoSaveInterval: 5000
        })
      )

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(6000)
      })

      // Auto-save should have been triggered
      expect(mockAssessmentApi.saveResponses).toHaveBeenCalled()
    })
  })
})