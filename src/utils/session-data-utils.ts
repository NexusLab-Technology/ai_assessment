/**
 * Utility functions for organizing and displaying assessment session data
 */

import { Assessment, QuestionSection, AssessmentResponses, Question } from '../types/assessment'

export interface SessionData {
  sessionId: string
  timestamp: Date
  stepId: string
  stepTitle: string
  stepDescription: string
  responses: { [questionId: string]: any }
  questions: Question[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export interface SessionMetadata {
  sessionId: string
  timestamp: Date
  stepNumber: number
  duration?: number
  userAgent?: string
  ipAddress?: string
}

export interface DisplaySession {
  title: string
  subtitle: string
  timestamp: string
  questions: DisplayQuestion[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export interface DisplayQuestion {
  id: string
  label: string
  type: string
  response: any
  formattedResponse: string
  isRequired: boolean
  hasResponse: boolean
}

/**
 * Organizes assessment responses by session/step
 */
export function organizeBySessions(
  responses: AssessmentResponses,
  sections: QuestionSection[],
  assessment: Assessment
): SessionData[] {
  const sessionData: SessionData[] = []
  
  // Create a map of sections for quick lookup
  const sectionMap = new Map(sections.map(section => [section.id, section]))
  
  // Process each step's responses
  Object.keys(responses).forEach(stepId => {
    const section = sectionMap.get(stepId)
    if (!section) return
    
    const stepResponses = responses[stepId] || {}
    
    // Calculate progress for this session
    const answeredQuestions = section.questions.filter(q => {
      const response = stepResponses[q.id]
      return response !== null && response !== undefined && response !== ''
    }).length
    
    const sessionData_item: SessionData = {
      sessionId: stepId,
      timestamp: new Date(assessment.updatedAt), // Fallback to assessment update time
      stepId: stepId,
      stepTitle: section.title,
      stepDescription: section.description,
      responses: stepResponses,
      questions: section.questions,
      progress: {
        completed: answeredQuestions,
        total: section.questions.length,
        percentage: section.questions.length > 0 ? Math.round((answeredQuestions / section.questions.length) * 100) : 0
      }
    }
    
    sessionData.push(sessionData_item)
  })
  
  // Sort sessions chronologically by step number
  sessionData.sort((a, b) => {
    const sectionA = sections.find(s => s.id === a.stepId)
    const sectionB = sections.find(s => s.id === b.stepId)
    
    if (sectionA && sectionB) {
      return sectionA.stepNumber - sectionB.stepNumber
    }
    
    // Fallback to timestamp if step numbers are not available
    return a.timestamp.getTime() - b.timestamp.getTime()
  })
  
  return sessionData
}

/**
 * Formats session data for display
 */
export function formatSessionForDisplay(session: SessionData): DisplaySession {
  const displayQuestions: DisplayQuestion[] = session.questions.map(question => {
    const response = session.responses[question.id]
    const hasResponse = response !== null && response !== undefined && response !== ''
    
    return {
      id: question.id,
      label: question.label,
      type: question.type,
      response: response,
      formattedResponse: formatResponseForDisplay(question, response),
      isRequired: question.required,
      hasResponse: hasResponse
    }
  })
  
  return {
    title: session.stepTitle,
    subtitle: session.stepDescription,
    timestamp: session.timestamp.toLocaleString(),
    questions: displayQuestions,
    progress: session.progress
  }
}

/**
 * Formats individual response for display
 */
export function formatResponseForDisplay(question: Question, response: any): string {
  if (response === null || response === undefined || response === '') {
    return 'No response'
  }

  switch (question.type) {
    case 'multiselect':
    case 'checkbox':
      if (Array.isArray(response)) {
        return response.length > 0 ? response.join(', ') : 'None selected'
      }
      return String(response)
      
    case 'select':
    case 'radio':
      // Try to find the label for the selected value
      if (question.options) {
        const option = question.options.find(opt => opt.value === response)
        return option ? option.label : String(response)
      }
      return String(response)
      
    case 'textarea':
      return String(response)
      
    case 'number':
      return String(response)
      
    case 'checkbox':
      return response ? 'Yes' : 'No'
      
    default:
      return String(response)
  }
}

/**
 * Extracts session metadata from responses
 */
export function extractSessionMetadata(
  responses: AssessmentResponses,
  sections: QuestionSection[]
): SessionMetadata[] {
  const metadata: SessionMetadata[] = []
  
  Object.keys(responses).forEach(stepId => {
    const section = sections.find(s => s.id === stepId)
    if (section) {
      metadata.push({
        sessionId: stepId,
        timestamp: new Date(), // In a real implementation, this would come from stored metadata
        stepNumber: section.stepNumber,
        duration: undefined, // Would be calculated from actual session data
        userAgent: undefined, // Would come from stored metadata
        ipAddress: undefined // Would come from stored metadata
      })
    }
  })
  
  // Sort by step number
  metadata.sort((a, b) => a.stepNumber - b.stepNumber)
  
  return metadata
}

/**
 * Validates session data completeness
 */
export function validateSessionData(sessions: SessionData[]): {
  isValid: boolean
  missingData: string[]
  warnings: string[]
} {
  const missingData: string[] = []
  const warnings: string[] = []
  
  sessions.forEach((session, index) => {
    // Check required fields
    if (!session.sessionId) {
      missingData.push(`Session ${index + 1}: Missing session ID`)
    }
    
    if (!session.stepTitle) {
      missingData.push(`Session ${index + 1}: Missing step title`)
    }
    
    if (!session.timestamp) {
      missingData.push(`Session ${index + 1}: Missing timestamp`)
    }
    
    // Check for empty responses
    const hasAnyResponses = Object.keys(session.responses).some(questionId => {
      const response = session.responses[questionId]
      return response !== null && response !== undefined && response !== ''
    })
    
    if (!hasAnyResponses) {
      warnings.push(`Session ${index + 1}: No responses recorded`)
    }
    
    // Check for required questions without responses
    const unansweredRequired = session.questions.filter(q => {
      if (!q.required) return false
      const response = session.responses[q.id]
      return response === null || response === undefined || response === ''
    })
    
    if (unansweredRequired.length > 0) {
      warnings.push(`Session ${index + 1}: ${unansweredRequired.length} required questions unanswered`)
    }
  })
  
  return {
    isValid: missingData.length === 0,
    missingData,
    warnings
  }
}