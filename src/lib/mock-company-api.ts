import { Company, CompanyFormData, CreateCompanyResponse, UpdateCompanyResponse, DeleteCompanyResponse, GetCompaniesResponse, SearchCompaniesResponse } from '@/types/company'
import { generateCompanyId } from '@/utils/company-validation'
import mockCompaniesData from '@/data/mock-companies.json'

const STORAGE_KEY = 'company-settings-data'

// Initialize localStorage with mock data if empty
const initializeStorage = (): Company[] => {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.map((company: any) => ({
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt)
      }))
    } catch (error) {
      console.error('Error parsing stored companies:', error)
    }
  }
  
  // Initialize with mock data
  const companies = mockCompaniesData.map(company => ({
    ...company,
    createdAt: new Date(company.createdAt),
    updatedAt: new Date(company.updatedAt)
  }))
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
  return companies
}

const saveToStorage = (companies: Company[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
}

const getStoredCompanies = (): Company[] => {
  return initializeStorage()
}

// Simulate API delay
const delay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockCompanyAPI = {
  // Get all companies
  async getCompanies(): Promise<GetCompaniesResponse> {
    await delay()
    const companies = getStoredCompanies()
    
    // Sort by creation date (newest first)
    companies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return {
      companies,
      total: companies.length
    }
  },

  // Create new company
  async createCompany(data: CompanyFormData): Promise<CreateCompanyResponse> {
    await delay()
    const companies = getStoredCompanies()
    
    // Check for duplicate names
    const existingCompany = companies.find(
      company => company.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    )
    
    if (existingCompany) {
      throw new Error('A company with this name already exists')
    }
    
    const newCompany: Company = {
      id: generateCompanyId(),
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      assessmentCount: 0
    }
    
    companies.push(newCompany)
    saveToStorage(companies)
    
    return {
      company: newCompany,
      message: 'Company created successfully'
    }
  },

  // Update existing company
  async updateCompany(id: string, data: CompanyFormData): Promise<UpdateCompanyResponse> {
    await delay()
    const companies = getStoredCompanies()
    
    const companyIndex = companies.findIndex(company => company.id === id)
    if (companyIndex === -1) {
      throw new Error('Company not found')
    }
    
    // Check for duplicate names (excluding current company)
    const existingCompany = companies.find(
      company => company.id !== id && company.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    )
    
    if (existingCompany) {
      throw new Error('A company with this name already exists')
    }
    
    const updatedCompany: Company = {
      ...companies[companyIndex],
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      updatedAt: new Date()
    }
    
    companies[companyIndex] = updatedCompany
    saveToStorage(companies)
    
    return {
      company: updatedCompany,
      message: 'Company updated successfully'
    }
  },

  // Delete company
  async deleteCompany(id: string): Promise<DeleteCompanyResponse> {
    await delay()
    const companies = getStoredCompanies()
    
    const companyIndex = companies.findIndex(company => company.id === id)
    if (companyIndex === -1) {
      throw new Error('Company not found')
    }
    
    const company = companies[companyIndex]
    const deletedAssessments = company.assessmentCount
    
    companies.splice(companyIndex, 1)
    saveToStorage(companies)
    
    return {
      message: 'Company deleted successfully',
      deletedAssessments
    }
  },

  // Search companies
  async searchCompanies(query: string): Promise<SearchCompaniesResponse> {
    await delay(200) // Shorter delay for search
    const companies = getStoredCompanies()
    
    if (!query.trim()) {
      return {
        companies: companies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        total: companies.length,
        query: ''
      }
    }
    
    const searchTerm = query.toLowerCase().trim()
    const filteredCompanies = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm) ||
      (company.description && company.description.toLowerCase().includes(searchTerm))
    )
    
    // Sort by relevance (name matches first, then description matches)
    filteredCompanies.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(searchTerm)
      const bNameMatch = b.name.toLowerCase().includes(searchTerm)
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // If both match or both don't match, sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return {
      companies: filteredCompanies,
      total: filteredCompanies.length,
      query: query.trim()
    }
  },

  // Get single company
  async getCompany(id: string): Promise<Company> {
    await delay()
    const companies = getStoredCompanies()
    
    const company = companies.find(company => company.id === id)
    if (!company) {
      throw new Error('Company not found')
    }
    
    return company
  },

  // Update assessment count for a company (for integration testing)
  async updateAssessmentCount(companyId: string, count: number): Promise<void> {
    await delay()
    const companies = getStoredCompanies()
    
    const companyIndex = companies.findIndex(company => company.id === companyId)
    if (companyIndex !== -1) {
      companies[companyIndex].assessmentCount = Math.max(0, count)
      saveToStorage(companies)
    }
  },

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  // Reset to mock data (for testing)
  async resetToMockData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      initializeStorage()
    }
  }
}