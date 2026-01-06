import { useState, useEffect, useCallback, useRef } from 'react'
import { AssessmentResponses } from '../types/assessment'
import { assessmentApi, withRetry } from '../lib/api-client'

interface UseAutoSaveOptions {
  assessmentId: string
  autoSaveInterval?: number // in milliseconds, default 30 seconds
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

interface UseAutoSaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  saveNow: () => Promise<void>
  hasUnsavedChanges: boolean
}

/**
 * Custom hook for auto-saving assessment responses to the server
 * Replaces localStorage with API calls and provides retry logic
 */
export function useAutoSave(
  responses: AssessmentResponses,
  currentStep: number,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const {
    assessmentId,
    autoSaveInterval = 30000, // 30 seconds
    onSaveSuccess,
    onSaveError
  } = options

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const lastSavedResponses = useRef<AssessmentResponses>({})
  const lastSavedStep = useRef<number>(1)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Check if there are unsaved changes
  useEffect(() => {
    const responsesChanged = JSON.stringify(responses) !== JSON.stringify(lastSavedResponses.current)
    const stepChanged = currentStep !== lastSavedStep.current
    setHasUnsavedChanges(responsesChanged || stepChanged)
  }, [responses, currentStep])

  // Save function with retry logic and step status tracking
  const saveNow = useCallback(async () => {
    if (!hasUnsavedChanges) return

    setSaveStatus('saving')
    
    try {
      // Find the current step section to save
      const currentStepId = `step-${currentStep}`
      const currentStepResponses = responses[currentStepId] || {}

      // Calculate step completion status
      const stepStatus = calculateStepStatus(currentStepResponses)

      // Use retry logic for network resilience
      await withRetry(async () => {
        await assessmentApi.saveResponsesWithStatus(
          assessmentId,
          currentStepId,
          currentStepResponses,
          currentStep,
          stepStatus
        )
      }, 3, 1000)

      // Update tracking variables
      lastSavedResponses.current = { ...responses }
      lastSavedStep.current = currentStep
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      
      onSaveSuccess?.()
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
      
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      onSaveError?.(error as Error)
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [assessmentId, responses, currentStep, hasUnsavedChanges, onSaveSuccess, onSaveError])

  // Helper function to calculate step completion status
  const calculateStepStatus = useCallback((stepResponses: { [questionId: string]: any }) => {
    // This would need to be enhanced with actual question metadata
    // For now, we'll use a simple heuristic based on response presence
    const responseKeys = Object.keys(stepResponses)
    const filledResponses = responseKeys.filter(key => {
      const value = stepResponses[key]
      return value !== null && value !== undefined && value !== '' && 
             (!Array.isArray(value) || value.length > 0)
    })

    // Estimate required fields (this should come from question metadata)
    const estimatedRequiredFields = Math.max(1, Math.floor(responseKeys.length * 0.7))
    const requiredFieldsCount = responseKeys.length > 0 ? estimatedRequiredFields : 1
    const filledFieldsCount = filledResponses.length

    let status: 'not_started' | 'partial' | 'completed'
    if (filledFieldsCount === 0) {
      status = 'not_started'
    } else if (filledFieldsCount >= requiredFieldsCount) {
      status = 'completed'
    } else {
      status = 'partial'
    }

    return {
      status,
      requiredFieldsCount,
      filledFieldsCount
    }
  }, [])

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && saveStatus !== 'saving') {
        saveNow()
      }
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges, saveStatus, autoSaveInterval, saveNow])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        
        // Attempt to save synchronously (limited browser support)
        if (navigator.sendBeacon) {
          const currentStepId = `step-${currentStep}`
          const currentStepResponses = responses[currentStepId] || {}
          
          const data = JSON.stringify({
            stepId: currentStepId,
            responses: currentStepResponses,
            currentStep
          })
          
          navigator.sendBeacon(`/api/assessments/${assessmentId}/responses`, data)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, assessmentId, responses, currentStep])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    lastSaved,
    saveNow,
    hasUnsavedChanges
  }
}