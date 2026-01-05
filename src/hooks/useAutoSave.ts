import { useEffect, useRef, useCallback } from 'react'
import { AssessmentResponses } from '../types/assessment'

interface UseAutoSaveOptions {
  assessmentId: string
  responses: AssessmentResponses
  currentStep: number
  onSave: (responses: AssessmentResponses, currentStep: number) => Promise<void>
  interval?: number // Auto-save interval in milliseconds (default: 30 seconds)
  enabled?: boolean
}

export function useAutoSave({
  assessmentId,
  responses,
  currentStep,
  onSave,
  interval = 30000, // 30 seconds
  enabled = true
}: UseAutoSaveOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  // Create a stable reference to the save function
  const saveData = useCallback(async () => {
    if (isSavingRef.current) return

    const currentData = JSON.stringify({ responses, currentStep })
    
    // Only save if data has changed
    if (currentData === lastSavedRef.current) return

    try {
      isSavingRef.current = true
      await onSave(responses, currentStep)
      lastSavedRef.current = currentData
    } catch (error) {
      console.error('Auto-save failed:', error)
      // Could implement retry logic here
    } finally {
      isSavingRef.current = false
    }
  }, [responses, currentStep, onSave])

  // Manual save function for immediate saves (e.g., on navigation)
  const saveNow = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    await saveData()
    
    // Restart the interval after manual save
    if (enabled) {
      intervalRef.current = setInterval(saveData, interval)
    }
  }, [saveData, interval, enabled])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !assessmentId) return

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(saveData, interval)

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [assessmentId, saveData, interval, enabled])

  // Save immediately when assessment changes
  useEffect(() => {
    if (assessmentId && enabled) {
      // Reset last saved reference when assessment changes
      lastSavedRef.current = ''
    }
  }, [assessmentId, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    saveNow,
    isSaving: isSavingRef.current
  }
}