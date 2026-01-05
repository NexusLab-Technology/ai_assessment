/**
 * Mock API client for testing without database connection
 * Uses localStorage to simulate database operations
 */

import { 
  Company, 
  Assessment, 
  AssessmentReport, 
  AssessmentResponses,
  CreateCompanyRequest,
  CreateAssessmentRequest
} from '../types/assessment'

// Mock data storage keys
const STORAGE_KEYS = {
  companies: 'mock_companies',
  assessments: 'mock_assessments',
  reports: 'mock_reports'
}

// Helper functions for localStorage
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Initialize with some mock data
function initializeMockData() {
  const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
  if (companies.length === 0) {
    const mockCompanies: Company[] = [
      {
        id: 'company-1',
        name: 'Acme Corporation',
        description: 'A leading technology company',
        createdAt: new Date('2024-01-15'),
        assessmentCount: 2
      },
      {
        id: 'company-2',
        name: 'TechStart Inc',
        description: 'Innovative startup focused on AI solutions',
        createdAt: new Date('2024-02-01'),
        assessmentCount: 1
      }
    ]
    saveToStorage(STORAGE_KEYS.companies, mockCompanies)

    const mockAssessments: Assessment[] = [
      {
        id: 'assessment-1',
        name: 'Cloud Migration Assessment',
        companyId: 'company-1',
        type: 'MIGRATION',
        status: 'COMPLETED',
        currentStep: 8,
        totalSteps: 8,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
        completedAt: new Date('2024-01-25')
      },
      {
        id: 'assessment-2',
        name: 'AI Readiness Assessment',
        companyId: 'company-1',
        type: 'EXPLORATORY',
        status: 'IN_PROGRESS',
        currentStep: 3,
        totalSteps: 7,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: 'assessment-3',
        name: 'Digital Transformation Assessment',
        companyId: 'company-2',
        type: 'EXPLORATORY',
        status: 'DRAFT',
        currentStep: 1,
        totalSteps: 7,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
      }
    ]
    saveToStorage(STORAGE_KEYS.assessments, mockAssessments)
  }
}

// Simulate API delay
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock Company API
export const mockCompanyApi = {
  async getAll(): Promise<Company[]> {
    await delay(300)
    initializeMockData()
    const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
    
    // Update assessment counts
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    return companies.map(company => ({
      ...company,
      assessmentCount: assessments.filter(a => a.companyId === company.id).length
    }))
  },

  async getById(id: string): Promise<Company> {
    await delay(200)
    const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
    const company = companies.find(c => c.id === id)
    if (!company) {
      throw new Error('Company not found')
    }
    return company
  },

  async create(company: CreateCompanyRequest): Promise<Company> {
    await delay(400)
    const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
    const newCompany: Company = {
      id: generateId(),
      name: company.name,
      description: company.description,
      createdAt: new Date(),
      assessmentCount: 0
    }
    companies.push(newCompany)
    saveToStorage(STORAGE_KEYS.companies, companies)
    return newCompany
  },

  async update(id: string, updates: Partial<CreateCompanyRequest>): Promise<Company> {
    await delay(300)
    const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
    const index = companies.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('Company not found')
    }
    companies[index] = { ...companies[index], ...updates }
    saveToStorage(STORAGE_KEYS.companies, companies)
    return companies[index]
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const companies = getFromStorage<Company>(STORAGE_KEYS.companies)
    const filtered = companies.filter(c => c.id !== id)
    saveToStorage(STORAGE_KEYS.companies, filtered)
  }
}

// Mock Assessment API
export const mockAssessmentApi = {
  async getAll(companyId?: string): Promise<Assessment[]> {
    await delay(400)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    return companyId 
      ? assessments.filter(a => a.companyId === companyId)
      : assessments
  },

  async getById(id: string): Promise<Assessment> {
    await delay(200)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const assessment = assessments.find(a => a.id === id)
    if (!assessment) {
      throw new Error('Assessment not found')
    }
    return assessment
  },

  async create(assessment: CreateAssessmentRequest): Promise<Assessment> {
    await delay(500)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const newAssessment: Assessment = {
      id: generateId(),
      name: assessment.name,
      companyId: assessment.companyId,
      type: assessment.type,
      status: 'DRAFT',
      currentStep: 1,
      totalSteps: assessment.type === 'EXPLORATORY' ? 7 : 8,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    assessments.push(newAssessment)
    saveToStorage(STORAGE_KEYS.assessments, assessments)
    return newAssessment
  },

  async update(id: string, updates: {
    name?: string
    status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
    currentStep?: number
    responses?: AssessmentResponses
  }): Promise<Assessment> {
    await delay(300)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const index = assessments.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error('Assessment not found')
    }
    
    const updatedAssessment = {
      ...assessments[index],
      ...updates,
      updatedAt: new Date(),
      ...(updates.status === 'COMPLETED' ? { completedAt: new Date() } : {})
    }
    
    assessments[index] = updatedAssessment
    saveToStorage(STORAGE_KEYS.assessments, assessments)
    return updatedAssessment
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const filtered = assessments.filter(a => a.id !== id)
    saveToStorage(STORAGE_KEYS.assessments, filtered)
  },

  async saveResponses(id: string, stepId: string, responses: { [questionId: string]: any }, currentStep: number): Promise<Assessment> {
    await delay(200)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const index = assessments.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error('Assessment not found')
    }

    // Get existing responses or create new object
    const existingResponses = (assessments[index] as any).responses || {}
    const updatedResponses = {
      ...existingResponses,
      [stepId]: responses
    }

    const updatedAssessment = {
      ...assessments[index],
      currentStep,
      status: 'IN_PROGRESS' as const,
      updatedAt: new Date(),
      responses: updatedResponses
    }

    assessments[index] = updatedAssessment
    saveToStorage(STORAGE_KEYS.assessments, assessments)
    return updatedAssessment
  },

  async getResponses(id: string): Promise<{
    assessmentId: string
    responses: AssessmentResponses
    currentStep: number
    totalSteps: number
    status: string
  }> {
    await delay(200)
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const assessment = assessments.find(a => a.id === id)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    return {
      assessmentId: id,
      responses: (assessment as any).responses || {},
      currentStep: assessment.currentStep,
      totalSteps: assessment.totalSteps,
      status: assessment.status
    }
  }
}

// Mock Report API
export const mockReportApi = {
  async getAll(companyId?: string): Promise<AssessmentReport[]> {
    await delay(300)
    const reports = getFromStorage<AssessmentReport>(STORAGE_KEYS.reports)
    return companyId 
      ? reports.filter(r => r.companyId === companyId)
      : reports
  },

  async getById(id: string): Promise<AssessmentReport> {
    await delay(200)
    const reports = getFromStorage<AssessmentReport>(STORAGE_KEYS.reports)
    const report = reports.find(r => r.id === id)
    if (!report) {
      throw new Error('Report not found')
    }
    return report
  },

  async generate(assessmentId: string): Promise<AssessmentReport> {
    await delay(2000) // Simulate longer generation time
    const assessments = getFromStorage<Assessment>(STORAGE_KEYS.assessments)
    const assessment = assessments.find(a => a.id === assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    const reports = getFromStorage<AssessmentReport>(STORAGE_KEYS.reports)
    const newReport: AssessmentReport = {
      id: generateId(),
      assessmentId,
      companyId: assessment.companyId,
      htmlContent: `<h1>Mock Report for ${assessment.name}</h1><p>This is a mock report generated for testing purposes.</p>`,
      generatedAt: new Date(),
      metadata: {
        assessmentType: assessment.type,
        companyName: 'Mock Company',
        generationDuration: 2000,
        bedrockModel: 'mock-model-v1'
      }
    }

    reports.push(newReport)
    saveToStorage(STORAGE_KEYS.reports, reports)
    return newReport
  },

  async update(id: string, updates: {
    htmlContent?: string
    metadata?: any
  }): Promise<AssessmentReport> {
    await delay(300)
    const reports = getFromStorage<AssessmentReport>(STORAGE_KEYS.reports)
    const index = reports.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Report not found')
    }
    
    reports[index] = { ...reports[index], ...updates, generatedAt: new Date() }
    saveToStorage(STORAGE_KEYS.reports, reports)
    return reports[index]
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const reports = getFromStorage<AssessmentReport>(STORAGE_KEYS.reports)
    const filtered = reports.filter(r => r.id !== id)
    saveToStorage(STORAGE_KEYS.reports, filtered)
  }
}

// Initialize mock data on module load
if (typeof window !== 'undefined') {
  initializeMockData()
}