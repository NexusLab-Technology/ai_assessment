// Utility functions for AI Assessment module

import { Assessment, Company, QuestionSection } from '../types/assessment'

/**
 * Get total steps for assessment type
 */
export const getTotalSteps = (type: 'EXPLORATORY' | 'MIGRATION'): number => {
  return type === 'EXPLORATORY' ? 7 : 8
}

/**
 * Calculate progress percentage
 */
export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return Math.round((currentStep / totalSteps) * 100)
}

/**
 * Get status badge color
 */
export const getStatusColor = (status: Assessment['status']): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Generate unique ID
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate assessment name
 */
export const validateAssessmentName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Assessment name is required'
  }
  if (name.trim().length < 3) {
    return 'Assessment name must be at least 3 characters'
  }
  if (name.trim().length > 100) {
    return 'Assessment name must be less than 100 characters'
  }
  return null
}

/**
 * Check if assessment can be deleted
 */
export const canDeleteAssessment = (assessment: Assessment): boolean => {
  return assessment.status === 'DRAFT'
}

/**
 * Get next step number
 */
export const getNextStep = (currentStep: number, totalSteps: number): number | null => {
  return currentStep < totalSteps ? currentStep + 1 : null
}

/**
 * Get previous step number
 */
export const getPreviousStep = (currentStep: number): number | null => {
  return currentStep > 1 ? currentStep - 1 : null
}

/**
 * Check if step is final step
 */
export const isFinalStep = (currentStep: number, totalSteps: number): boolean => {
  return currentStep === totalSteps
}

/**
 * Filter assessments by company
 */
export const filterAssessmentsByCompany = (
  assessments: Assessment[],
  companyId: string
): Assessment[] => {
  return assessments.filter(assessment => assessment.companyId === companyId)
}

/**
 * Sort assessments by date (newest first)
 */
export const sortAssessmentsByDate = (assessments: Assessment[]): Assessment[] => {
  return [...assessments].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/**
 * Get assessment type display name
 */
export const getAssessmentTypeDisplayName = (type: 'EXPLORATORY' | 'MIGRATION'): string => {
  return type === 'EXPLORATORY' ? 'New AI Development' : 'Migrate Existing AI'
}

/**
 * Validate question response
 */
export const validateQuestionResponse = (
  question: any,
  response: any
): string | null => {
  if (question.required && (!response || response === '')) {
    return `${question.label} is required`
  }

  if (question.validation) {
    const { minLength, maxLength, min, max, pattern } = question.validation

    if (typeof response === 'string') {
      if (minLength && response.length < minLength) {
        return `${question.label} must be at least ${minLength} characters`
      }
      if (maxLength && response.length > maxLength) {
        return `${question.label} must be less than ${maxLength} characters`
      }
      if (pattern && !new RegExp(pattern).test(response)) {
        return `${question.label} format is invalid`
      }
    }

    if (typeof response === 'number') {
      if (min !== undefined && response < min) {
        return `${question.label} must be at least ${min}`
      }
      if (max !== undefined && response > max) {
        return `${question.label} must be at most ${max}`
      }
    }
  }

  return null
}

/**
 * Check if all required questions in a section are answered
 */
export const isStepComplete = (
  section: QuestionSection,
  responses: { [questionId: string]: any }
): boolean => {
  return section.questions.every(question => {
    if (!question.required) return true
    const response = responses[question.id]
    return response !== undefined && response !== null && response !== ''
  })
}