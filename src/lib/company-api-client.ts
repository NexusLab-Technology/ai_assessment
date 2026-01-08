import { 
  Company, 
  CompanyFormData, 
  CreateCompanyResponse, 
  UpdateCompanyResponse, 
  DeleteCompanyResponse, 
  GetCompaniesResponse, 
  SearchCompaniesResponse 
} from '@/types/company'

const API_BASE_URL = '/api'

// Helper function for API requests
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}: ${response.statusText}`,
      message: `HTTP ${response.status}: ${response.statusText}`
    }))
    
    // Extract error message from API response
    const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
    
    // Create error with more context
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).statusText = response.statusText
    ;(error as any).responseData = errorData
    
    throw error
  }

  const data = await response.json()
  return data.data || data
}

export const companyAPIClient = {
  // Get all companies
  async getCompanies(): Promise<GetCompaniesResponse> {
    return apiRequest<GetCompaniesResponse>('/companies')
  },

  // Create new company
  async createCompany(data: CompanyFormData): Promise<CreateCompanyResponse> {
    return apiRequest<CreateCompanyResponse>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update existing company
  async updateCompany(id: string, data: CompanyFormData): Promise<UpdateCompanyResponse> {
    return apiRequest<UpdateCompanyResponse>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete company
  async deleteCompany(id: string): Promise<DeleteCompanyResponse> {
    return apiRequest<DeleteCompanyResponse>(`/companies/${id}`, {
      method: 'DELETE',
    })
  },

  // Search companies
  async searchCompanies(query: string): Promise<SearchCompaniesResponse> {
    const encodedQuery = encodeURIComponent(query)
    return apiRequest<SearchCompaniesResponse>(`/companies/search?q=${encodedQuery}`)
  },

  // Get single company
  async getCompany(id: string): Promise<Company> {
    return apiRequest<Company>(`/companies/${id}`)
  }
}