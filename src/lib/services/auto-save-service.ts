/**
 * Enhanced Auto-Save Service for Category-Based Assessments
 * Handles automatic saving with retry logic and network error handling
 */

import { AssessmentResponses } from '@/types/rapid-questionnaire'

interface AutoSaveConfig {
  assessmentId: string
  intervalMs: number
  maxRetries: number
  retryDelayMs: number
}

interface AutoSaveState {
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  isSaving: boolean
  error: string | null
  retryCount: number
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'retrying'

export class AutoSaveService {
  private config: AutoSaveConfig
  private state: AutoSaveState
  private intervalId: NodeJS.Timeout | null = null
  private pendingResponses: AssessmentResponses = {}
  private statusCallbacks: ((status: AutoSaveStatus, error?: string) => void)[] = []

  constructor(config: AutoSaveConfig) {
    this.config = config
    this.state = {
      lastSaved: null,
      hasUnsavedChanges: false,
      isSaving: false,
      error: null,
      retryCount: 0
    }
  }

  /**
   * Start auto-save with specified interval
   */
  start(): void {
    if (this.intervalId) {
      this.stop()
    }

    this.intervalId = setInterval(() => {
      if (this.state.hasUnsavedChanges && !this.state.isSaving) {
        this.saveNow()
      }
    }, this.config.intervalMs)

    console.log(`Auto-save started with ${this.config.intervalMs}ms interval`)
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Auto-save stopped')
    }
  }

  /**
   * Update responses for a category
   */
  updateCategoryResponses(categoryId: string, responses: { [questionId: string]: any }): void {
    this.pendingResponses[categoryId] = responses
    this.state.hasUnsavedChanges = true
    this.notifyStatusChange('idle')
  }

  /**
   * Save immediately (e.g., on category navigation)
   */
  async saveNow(): Promise<{ success: boolean; error?: string }> {
    if (this.state.isSaving || !this.state.hasUnsavedChanges) {
      return { success: true }
    }

    this.state.isSaving = true
    this.state.error = null
    this.notifyStatusChange('saving')

    try {
      const result = await this.performSave()
      
      if (result.success) {
        this.state.lastSaved = new Date()
        this.state.hasUnsavedChanges = false
        this.state.retryCount = 0
        this.notifyStatusChange('saved')
        
        // Clear saved responses
        this.pendingResponses = {}
        
        return { success: true }
      } else {
        throw new Error(result.error || 'Save failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.state.error = errorMessage
      
      if (this.state.retryCount < this.config.maxRetries) {
        this.state.retryCount++
        this.notifyStatusChange('retrying')
        
        // Retry after delay
        setTimeout(() => {
          this.saveNow()
        }, this.config.retryDelayMs * Math.pow(2, this.state.retryCount - 1)) // Exponential backoff
        
        return { success: false, error: `Retrying... (${this.state.retryCount}/${this.config.maxRetries})` }
      } else {
        this.notifyStatusChange('error', errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      this.state.isSaving = false
    }
  }

  /**
   * Save on category navigation (immediate save)
   */
  async saveOnNavigation(categoryId: string, responses: { [questionId: string]: any }): Promise<{ success: boolean; error?: string }> {
    // Update the specific category
    this.updateCategoryResponses(categoryId, responses)
    
    // Save immediately
    return await this.saveNow()
  }

  /**
   * Get current auto-save status
   */
  getStatus(): {
    status: AutoSaveStatus
    lastSaved: Date | null
    hasUnsavedChanges: boolean
    error: string | null
  } {
    let status: AutoSaveStatus = 'idle'
    
    if (this.state.isSaving) {
      status = 'saving'
    } else if (this.state.retryCount > 0 && this.state.retryCount < this.config.maxRetries) {
      status = 'retrying'
    } else if (this.state.error) {
      status = 'error'
    } else if (this.state.lastSaved && !this.state.hasUnsavedChanges) {
      status = 'saved'
    }

    return {
      status,
      lastSaved: this.state.lastSaved,
      hasUnsavedChanges: this.state.hasUnsavedChanges,
      error: this.state.error
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: AutoSaveStatus, error?: string) => void): () => void {
    this.statusCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get category completion status
   */
  getCategoryCompletionStatus(categoryId: string, totalQuestions: number): {
    status: 'not_started' | 'partial' | 'completed'
    completionPercentage: number
    answeredQuestions: number
  } {
    const categoryResponses = this.pendingResponses[categoryId] || {}
    const answeredQuestions = Object.keys(categoryResponses).filter(
      questionId => {
        const answer = categoryResponses[questionId]
        return answer !== null && answer !== undefined && answer !== ''
      }
    ).length

    const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

    let status: 'not_started' | 'partial' | 'completed' = 'not_started'
    if (answeredQuestions === totalQuestions) {
      status = 'completed'
    } else if (answeredQuestions > 0) {
      status = 'partial'
    }

    return {
      status,
      completionPercentage,
      answeredQuestions
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop()
    this.statusCallbacks = []
    this.pendingResponses = {}
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(): Promise<{ success: boolean; error?: string }> {
    try {
      // Save each category's responses
      for (const [categoryId, responses] of Object.entries(this.pendingResponses)) {
        const response = await fetch(`/api/assessments/${this.config.assessmentId}/responses`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            categoryId,
            responses
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Auto-save error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Notify status change to subscribers
   */
  private notifyStatusChange(status: AutoSaveStatus, error?: string): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status, error)
      } catch (err) {
        console.error('Error in auto-save status callback:', err)
      }
    })
  }
}

/**
 * Create auto-save service instance
 */
export function createAutoSaveService(assessmentId: string, options?: Partial<AutoSaveConfig>): AutoSaveService {
  const config: AutoSaveConfig = {
    assessmentId,
    intervalMs: options?.intervalMs || 30000, // 30 seconds
    maxRetries: options?.maxRetries || 3,
    retryDelayMs: options?.retryDelayMs || 1000, // 1 second base delay
    ...options
  }

  return new AutoSaveService(config)
}