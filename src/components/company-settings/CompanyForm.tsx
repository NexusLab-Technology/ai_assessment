'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CompanyFormProps, CompanyFormData, FormErrors, Company } from '@/types/company'
import { 
  validateCompanyFormWithDuplicateCheck, 
  hasValidationErrors,
  getValidationSummary,
  getFieldValidationState,
  getCharacterCount,
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_DESCRIPTION_MAX_LENGTH
} from '@/utils/company-validation'
import LoadingSpinner from '../ai-assessment/LoadingSpinner'

interface EnhancedCompanyFormProps extends CompanyFormProps {
  existingCompanies?: Company[]
}

const CompanyForm: React.FC<EnhancedCompanyFormProps> = ({
  company,
  onSubmit,
  onCancel,
  loading,
  errors: externalErrors,
  existingCompanies = []
}) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name || '',
    description: company?.description || ''
  })
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  // Update form data when company prop changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        description: company.description || ''
      })
    }
  }, [company])

  // Validate form data in real-time with duplicate checking
  useEffect(() => {
    const errors = validateCompanyFormWithDuplicateCheck(
      formData, 
      existingCompanies, 
      company?.id
    )
    setValidationErrors(errors)
  }, [formData, existingCompanies, company?.id])

  // Character count for name field
  const nameCharCount = useMemo(() => 
    getCharacterCount(formData.name, COMPANY_NAME_MAX_LENGTH), 
    [formData.name]
  )

  // Character count for description field
  const descriptionCharCount = useMemo(() => 
    getCharacterCount(formData.description || '', COMPANY_DESCRIPTION_MAX_LENGTH), 
    [formData.description]
  )

  const handleInputChange = (field: keyof CompanyFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Mark field as touched when user starts typing
    if (!touched[field]) {
      setTouched(prev => ({
        ...prev,
        [field]: true
      }))
    }
  }

  const handleInputBlur = (field: keyof CompanyFormData) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    // Handle Escape key to cancel form
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
    
    // Handle Ctrl+Enter or Cmd+Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (isFormValid && !loading) {
        handleSubmit(event as any)
      }
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      name: true,
      description: true
    })

    // Check for validation errors
    const errors = validateCompanyFormWithDuplicateCheck(
      formData, 
      existingCompanies, 
      company?.id
    )
    
    if (hasValidationErrors(errors)) {
      setValidationErrors(errors)
      return
    }

    // Submit the form
    onSubmit(formData)
  }

  const getFieldError = (field: keyof CompanyFormData): string | undefined => {
    // Show external errors first, then validation errors if field is touched
    return externalErrors?.[field] || (touched[field] ? validationErrors[field] : undefined)
  }

  const getFieldState = (field: keyof CompanyFormData) => {
    return getFieldValidationState(
      formData[field] || '',
      getFieldError(field),
      touched[field]
    )
  }

  const isFormValid = !hasValidationErrors(validationErrors) && !hasValidationErrors(externalErrors || {})
  const validationSummary = getValidationSummary({ ...validationErrors, ...externalErrors })

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6" role="form" aria-labelledby="form-title">
      {/* Form Title - Hidden but accessible */}
      <h2 id="form-title" className="sr-only">
        {company ? `Edit company: ${company.name}` : 'Create new company'}
      </h2>
      {/* General Error */}
      {externalErrors?.general && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-700">
                {externalErrors.general}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Name */}
      <div>
        <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <input
            id="company-name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleInputChange('name')}
            onBlur={handleInputBlur('name')}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-all duration-200 ${
              getFieldState('name') === 'invalid'
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : getFieldState('name') === 'valid'
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter company name"
            disabled={loading}
            aria-describedby={`name-help ${getFieldError('name') ? 'name-error' : ''}`}
            aria-invalid={getFieldState('name') === 'invalid'}
            autoComplete="organization"
          />
          
          {/* Validation icon */}
          {getFieldState('name') !== 'neutral' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {getFieldState('name') === 'valid' ? (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
        
        {/* Error message */}
        {getFieldError('name') && (
          <p className="mt-2 text-sm text-red-600" id="name-error">
            {getFieldError('name')}
          </p>
        )}
        
        {/* Character count and help text */}
        <div className="mt-1 flex justify-between items-center">
          <p id="name-help" className="text-xs text-gray-500">
            2-100 characters. Letters, numbers, spaces, and common business symbols allowed.
          </p>
          <p className={`text-xs ${
            nameCharCount.isOverLimit ? 'text-red-600' : 
            nameCharCount.isNearLimit ? 'text-yellow-600' : 'text-gray-500'
          }`} aria-live="polite">
            {nameCharCount.current}/{nameCharCount.max}
          </p>
        </div>
      </div>

      {/* Company Description */}
      <div>
        <label htmlFor="company-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1 relative">
          <textarea
            id="company-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange('description')}
            onBlur={handleInputBlur('description')}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-all duration-200 resize-none ${
              getFieldState('description') === 'invalid'
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : getFieldState('description') === 'valid'
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Optional description of the company"
            disabled={loading}
            aria-describedby={`description-help ${getFieldError('description') ? 'description-error' : ''}`}
            aria-invalid={getFieldState('description') === 'invalid'}
          />
        </div>
        
        {/* Error message */}
        {getFieldError('description') && (
          <p className="mt-2 text-sm text-red-600" id="description-error">
            {getFieldError('description')}
          </p>
        )}
        
        {/* Character count and help text */}
        <div className="mt-1 flex justify-between items-center">
          <p id="description-help" className="text-xs text-gray-500">
            Optional. Provide additional context about the company.
          </p>
          <p className={`text-xs ${
            descriptionCharCount.isOverLimit ? 'text-red-600' : 
            descriptionCharCount.isNearLimit ? 'text-yellow-600' : 'text-gray-500'
          }`} aria-live="polite">
            {descriptionCharCount.current}/{descriptionCharCount.max}
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Cancel form and close dialog"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label={company ? `Update company: ${company.name}` : 'Create new company'}
          aria-describedby="submit-help"
        >
          {loading && <LoadingSpinner size="sm" className="mr-2" />}
          {company ? 'Update Company' : 'Create Company'}
        </button>
      </div>
      
      {/* Submit help text */}
      <div id="submit-help" className="sr-only">
        Press Ctrl+Enter or Cmd+Enter to submit the form quickly. Press Escape to cancel.
      </div>

      {/* Form Status */}
      {validationSummary && Object.keys(touched).length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-yellow-700">
                {validationSummary}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default CompanyForm