import { CompanyFormData, FormErrors, Company } from '@/types/company'

// Validation constants
export const COMPANY_NAME_MIN_LENGTH = 2
export const COMPANY_NAME_MAX_LENGTH = 100
export const COMPANY_DESCRIPTION_MAX_LENGTH = 500
export const COMPANY_NAME_PATTERN = /^[a-zA-Z0-9\s\-_&.()]+$/

// Enhanced validation functions
export const validateCompanyName = (name: string): string | undefined => {
  if (!name || name.trim().length === 0) {
    return 'Company name is required'
  }
  
  const trimmedName = name.trim()
  
  if (trimmedName.length < COMPANY_NAME_MIN_LENGTH) {
    return `Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`
  }
  
  if (trimmedName.length > COMPANY_NAME_MAX_LENGTH) {
    return `Company name must not exceed ${COMPANY_NAME_MAX_LENGTH} characters`
  }
  
  if (!COMPANY_NAME_PATTERN.test(trimmedName)) {
    return 'Company name contains invalid characters. Only letters, numbers, spaces, and common business symbols are allowed'
  }
  
  return undefined
}

export const validateCompanyDescription = (description?: string): string | undefined => {
  if (!description) {
    return undefined // Description is optional
  }
  
  if (description.trim().length === 0) {
    return undefined // Empty description is allowed
  }
  
  if (description.length > COMPANY_DESCRIPTION_MAX_LENGTH) {
    return `Description must not exceed ${COMPANY_DESCRIPTION_MAX_LENGTH} characters`
  }
  
  return undefined
}

export const validateCompanyForm = (formData: CompanyFormData): FormErrors => {
  const errors: FormErrors = {}
  
  const nameError = validateCompanyName(formData.name)
  if (nameError) {
    errors.name = nameError
  }
  
  const descriptionError = validateCompanyDescription(formData.description)
  if (descriptionError) {
    errors.description = descriptionError
  }
  
  return errors
}

export const validateCompanyFormWithDuplicateCheck = (
  formData: CompanyFormData,
  existingCompanies: Company[],
  excludeId?: string
): FormErrors => {
  const errors = validateCompanyForm(formData)
  
  // Check for duplicate names
  if (!errors.name && formData.name.trim()) {
    const isDuplicate = checkDuplicateCompanyName(
      formData.name,
      existingCompanies,
      excludeId
    )
    
    if (isDuplicate) {
      errors.name = 'A company with this name already exists'
    }
  }
  
  return errors
}

export const hasValidationErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0
}

export const checkDuplicateCompanyName = (
  name: string, 
  existingCompanies: Company[], 
  excludeId?: string
): boolean => {
  const trimmedName = name.trim().toLowerCase()
  return existingCompanies.some(company => 
    company.id !== excludeId && company.name.toLowerCase() === trimmedName
  )
}

// Enhanced validation with detailed feedback
export const getValidationSummary = (errors: FormErrors): string | undefined => {
  const errorCount = Object.keys(errors).length
  
  if (errorCount === 0) {
    return undefined
  }
  
  if (errorCount === 1) {
    return 'Please fix the error above'
  }
  
  return `Please fix ${errorCount} errors above`
}

// Real-time validation helpers
export const isValidCompanyName = (name: string): boolean => {
  return validateCompanyName(name) === undefined
}

export const isValidCompanyDescription = (description?: string): boolean => {
  return validateCompanyDescription(description) === undefined
}

// Generate unique ID for mock data
export const generateCompanyId = (): string => {
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Validation state helpers
export const getFieldValidationState = (
  fieldValue: string,
  fieldError?: string,
  touched?: boolean
): 'valid' | 'invalid' | 'neutral' => {
  if (!touched) return 'neutral'
  if (fieldError) return 'invalid'
  if (fieldValue.trim().length > 0) return 'valid'
  return 'neutral'
}

// Character count helpers
export const getCharacterCount = (text: string, maxLength: number) => {
  const length = text.length
  const remaining = maxLength - length
  const percentage = (length / maxLength) * 100
  
  return {
    current: length,
    max: maxLength,
    remaining,
    percentage,
    isNearLimit: percentage > 80,
    isOverLimit: percentage > 100
  }
}