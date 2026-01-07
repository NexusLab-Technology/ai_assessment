/**
 * React Hook for Enhanced Auto-Save Functionality
 * Provides auto-save capabilities with category-based response management
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { AutoSaveService, createAutoSaveService } from '@/lib/services/auto-save-service'
import { AssessmentResponses } from '@/types/rapid-questionnaire'

interface UseAutoSaveOptions {
  assessmentId: string
  intervalMs?: number
  maxRetries?: number
  retryDelayMs?: number
  enabled?: boolean
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'retrying'
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

interface UseAutoSaveReturn {
  // Status
  status: AutoSaveStatus
  
  // Actions
  updateCategoryResponses: (categoryId: string, responses: { [questionId: string]: any }) => void
  saveNow: () => Promise<{ success: boolean; error?: string }>
  saveOnNavigation: (categoryId: string, responses: { [questionId: string]: any }) => Promise<{ success: boolean; error?: string }>
  
  // Utility
  getCategoryCompletionStatus: (categoryId: string, totalQuestions: number) => {
    status: 'not_started' | 'partial' | 'completed'
    completionPercentage: number
    answeredQuestions: number
  }
  
  // Control
  start: () => void
  stop: () => void
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    assessmentId,
    intervalMs = 30000,
    maxRetries = 3,
    retryDelayMs = 1000,
    enabled = true
  } = options

  const serviceRef = useRef<AutoSaveService | null>(null)
  const [status, setStatus] = useState<AutoSaveStatus>({
    status: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  })

  // Initialize auto-save service
  useEffect(() => {
    if (!assessmentId) return

    serviceRef.current = createAutoSaveService(assessmentId, {
      intervalMs,
      maxRetries,
      retryDelayMs
    })

    // Subscribe to status changes
    const unsubscribe = serviceRef.current.onStatusChange((newStatus, error) => {
      const serviceStatus = serviceRef.current?.getStatus()
      if (serviceStatus) {
        setStatus({
          status: newStatus,
          lastSaved: serviceStatus.lastSaved,
          hasUnsavedChanges: serviceStatus.hasUnsavedChanges,
          error: error || serviceStatus.error
        })
      }
    })

    // Start auto-save if enabled
    if (enabled) {
      serviceRef.current.start()
    }

    return () => {
      unsubscribe()
      serviceRef.current?.destroy()
      serviceRef.current = null
    }
  }, [assessmentId, intervalMs, maxRetries, retryDelayMs, enabled])

  // Update category responses
  const updateCategoryResponses = useCallback((categoryId: string, responses: { [questionId: string]: any }) => {
    serviceRef.current?.updateCategoryResponses(categoryId, responses)
  }, [])

  // Save now
  const saveNow = useCallback(async () => {
    if (!serviceRef.current) {
      return { success: false, error: 'Auto-save service not initialized' }
    }
    return await serviceRef.current.saveNow()
  }, [])

  // Save on navigation
  const saveOnNavigation = useCallback(async (categoryId: string, responses: { [questionId: string]: any }) => {
    if (!serviceRef.current) {
      return { success: false, error: 'Auto-save service not initialized' }
    }
    return await serviceRef.current.saveOnNavigation(categoryId, responses)
  }, [])

  // Get category completion status
  const getCategoryCompletionStatus = useCallback((categoryId: string, totalQuestions: number) => {
    if (!serviceRef.current) {
      return {
        status: 'not_started' as const,
        completionPercentage: 0,
        answeredQuestions: 0
      }
    }
    return serviceRef.current.getCategoryCompletionStatus(categoryId, totalQuestions)
  }, [])

  // Start auto-save
  const start = useCallback(() => {
    serviceRef.current?.start()
  }, [])

  // Stop auto-save
  const stop = useCallback(() => {
    serviceRef.current?.stop()
  }, [])

  return {
    status,
    updateCategoryResponses,
    saveNow,
    saveOnNavigation,
    getCategoryCompletionStatus,
    start,
    stop
  }
}

/**
 * Hook for auto-save status display
 */
export function useAutoSaveStatus(autoSaveStatus: AutoSaveStatus) {
  const getStatusDisplay = useCallback(() => {
    switch (autoSaveStatus.status) {
      case 'saving':
        return {
          text: 'Saving...',
          color: 'text-blue-600',
          icon: '💾'
        }
      case 'saved':
        return {
          text: autoSaveStatus.lastSaved 
            ? `Saved at ${autoSaveStatus.lastSaved.toLocaleTimeString()}`
            : 'Saved',
          color: 'text-green-600',
          icon: '✅'
        }
      case 'error':
        return {
          text: autoSaveStatus.error || 'Save failed',
          color: 'text-red-600',
          icon: '❌'
        }
      case 'retrying':
        return {
          text: 'Retrying...',
          color: 'text-yellow-600',
          icon: '🔄'
        }
      default:
        return autoSaveStatus.hasUnsavedChanges
          ? {
              text: 'Unsaved changes',
              color: 'text-gray-600',
              icon: '📝'
            }
          : {
              text: 'All changes saved',
              color: 'text-gray-500',
              icon: '💾'
            }
    }
  }, [autoSaveStatus])

  return {
    display: getStatusDisplay(),
    hasUnsavedChanges: autoSaveStatus.hasUnsavedChanges,
    isError: autoSaveStatus.status === 'error',
    isSaving: autoSaveStatus.status === 'saving' || autoSaveStatus.status === 'retrying'
  }
}