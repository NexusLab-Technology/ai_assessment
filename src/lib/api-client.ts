/**
 * API client functions for assessment operations
 * Replaces localStorage with actual API calls
 */

import { 
  Company, 
  Assessment, 
  AssessmentReport, 
  AssessmentResponses,
  CreateCompanyRequest,
  CreateAssessmentRequest,
  SaveResponsesRequest,
  GetCompaniesResponse,
  GetAssessmentsResponse,
  GetReportResponse
} from '../types/assessment'

const API_BASE = '/api'

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    let errorData: any = {}
    
    try {
      errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage
    }
    
    const error = new Error(errorMessage) as ApiError
    error.status = response.status
    error.name = 'ApiError'
    throw error
  }
  
  const data = await response.json()
  return data.data || data
}

// Company API functions
export const companyApi = {
  async getAll(): Promise<Company[]> {
    const response = await fetch(`${API_BASE}/companies`)
    const data: GetCompaniesResponse = await handleResponse(response)
    return data.companies
  },

  async getById(id: string): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies/${id}`)
    return handleResponse(response)
  },

  async create(company: CreateCompanyRequest): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    })
    return handleResponse(response)
  },

  async update(id: string, company: Partial<CreateCompanyRequest>): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    })
    return handleResponse(response)
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'DELETE'
    })
    await handleResponse(response)
  }
}

// Assessment API functions
export const assessmentApi = {
  async getAll(companyId?: string): Promise<Assessment[]> {
    const url = companyId 
      ? `${API_BASE}/assessments?companyId=${companyId}`
      : `${API_BASE}/assessments`
    
    const response = await fetch(url)
    const data: GetAssessmentsResponse = await handleResponse(response)
    return data.assessments
  },

  async getById(id: string): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}`)
    return handleResponse(response)
  },

  async create(assessment: CreateAssessmentRequest): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment)
    })
    return handleResponse(response)
  },

  async update(id: string, updates: {
    name?: string
    status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
    currentStep?: number
    responses?: AssessmentResponses
  }): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return handleResponse(response)
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/assessments/${id}`, {
      method: 'DELETE'
    })
    await handleResponse(response)
  },

  async saveResponses(id: string, stepId: string, responses: { [questionId: string]: any }, currentStep: number): Promise<Assessment> {
    const requestData: SaveResponsesRequest = {
      stepId,
      responses,
      currentStep
    }

    const response = await fetch(`${API_BASE}/assessments/${id}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })
    return handleResponse(response)
  },

  async getResponses(id: string): Promise<{
    assessmentId: string
    responses: AssessmentResponses
    currentStep: number
    totalSteps: number
    status: string
  }> {
    const response = await fetch(`${API_BASE}/assessments/${id}/responses`)
    return handleResponse(response)
  }
}

// Report API functions
export const reportApi = {
  async getAll(companyId?: string): Promise<AssessmentReport[]> {
    const url = companyId 
      ? `${API_BASE}/reports?companyId=${companyId}`
      : `${API_BASE}/reports`
    
    const response = await fetch(url)
    const data = await handleResponse<{ reports: AssessmentReport[] }>(response)
    return data.reports
  },

  async getById(id: string): Promise<AssessmentReport> {
    const response = await fetch(`${API_BASE}/reports/${id}`)
    const data: GetReportResponse = await handleResponse(response)
    return data.report
  },

  async generate(assessmentId: string): Promise<AssessmentReport> {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId })
    })
    return handleResponse(response)
  },

  async update(id: string, updates: {
    htmlContent?: string
    metadata?: any
  }): Promise<AssessmentReport> {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return handleResponse(response)
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE'
    })
    await handleResponse(response)
  }
}

// Error handling utilities
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// Retry utility for network errors
export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i === maxRetries) break
      
      // Only retry on network errors, not on 4xx client errors
      if (error instanceof ApiError && error.status && error.status < 500) {
        break
      }
      
      // Also retry on network/connection errors
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
      if (!errorMessage.includes('network') && 
          !errorMessage.includes('fetch') && 
          !errorMessage.includes('timeout') &&
          !(error instanceof ApiError && (!error.status || error.status >= 500))) {
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError!
}