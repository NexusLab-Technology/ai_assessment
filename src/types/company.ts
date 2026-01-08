// Company Settings Module Types

export interface Company {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  assessmentCount: number
}

// MongoDB Document Interface (imported from assessment types for consistency)
export interface CompanyDocument {
  _id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CompanyFormData {
  name: string
  description?: string
}

export interface FormErrors {
  name?: string
  description?: string
  general?: string
}

export interface CompanyDashboardProps {
  companies?: Company[]
  loading: boolean
  error?: string
  onCreateCompany: () => void
  onEditCompany: (company: Company) => void
  onDeleteCompany: (companyId: string) => void
  onSearchCompanies: (query: string) => void
}

export interface CompanyFormProps {
  company?: Company // undefined for create, defined for edit
  onSubmit: (companyData: CompanyFormData) => void
  onCancel: () => void
  loading: boolean
  errors?: FormErrors
}

export interface CompanyCardProps {
  company: Company
  onEdit: (company: Company) => void
  onDelete: (companyId: string) => void
  onViewAssessments: (companyId: string) => void
}

export interface CompanySearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

// API Response Types
export interface GetCompaniesResponse {
  companies: Company[]
  total: number
}

export interface CreateCompanyRequest {
  name: string
  description?: string
}

export interface CreateCompanyResponse {
  company: Company
  message: string
}

export interface UpdateCompanyRequest {
  name: string
  description?: string
}

export interface UpdateCompanyResponse {
  company: Company
  message: string
}

export interface DeleteCompanyResponse {
  message: string
  deletedCompany: boolean
  deletedAssessments: number
  totalAssessments: number
}

export interface SearchCompaniesResponse {
  companies: Company[]
  total: number
  query: string
}

// Validation Types
export interface CompanyNameValidation {
  minLength: 2
  maxLength: 100
  required: true
  pattern: RegExp
  uniquePerUser: true
}

export interface CompanyDescriptionValidation {
  maxLength: 500
  required: false
  allowEmpty: true
}