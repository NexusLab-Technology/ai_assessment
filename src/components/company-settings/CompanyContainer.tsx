'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Company, CompanyFormData } from '@/types/company'
import { companyAPIClient } from '@/lib/company-api-client'
import { 
  handleApiError, 
  CompanyError, 
  companyRetryManager, 
  logCompanyError,
  isRetryableError 
} from '@/utils/company-error-handling'
import CompanyDashboard from './CompanyDashboard'
import CompanyErrorBoundary from './CompanyErrorBoundary'

const CompanyContainer: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<CompanyError | undefined>()
  const [formLoading, setFormLoading] = useState(false)
  const [currentFormData, setCurrentFormData] = useState<CompanyFormData | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>()
  const [retryCount, setRetryCount] = useState(0)

  // Load companies with retry mechanism
  const loadCompanies = useCallback(async (isRetry: boolean = false) => {
    try {
      setLoading(true)
      setError(undefined)
      
      const response = await companyRetryManager.executeWithRetry(
        'loadCompanies',
        () => companyAPIClient.getCompanies(),
        (attempt, error) => {
          console.log(`Retrying loadCompanies (attempt ${attempt}):`, error.message)
          setRetryCount(attempt)
        }
      )
      
      setCompanies(response.companies)
      setRetryCount(0)
    } catch (err) {
      const companyError = handleApiError(err)
      logCompanyError(companyError, 'loadCompanies')
      setError(companyError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Handle form submission with enhanced error handling
  const handleFormSubmit = useCallback(async (formData: CompanyFormData) => {
    try {
      setFormLoading(true)
      setError(undefined)
      
      const operation = editingCompany
        ? () => companyAPIClient.updateCompany(editingCompany.id, formData)
        : () => companyAPIClient.createCompany(formData)
      
      const operationKey = editingCompany ? `updateCompany-${editingCompany.id}` : 'createCompany'
      
      const response = await companyRetryManager.executeWithRetry(
        operationKey,
        operation,
        (attempt, error) => {
          console.log(`Retrying ${operationKey} (attempt ${attempt}):`, error.message)
        }
      )
      
      if (editingCompany) {
        // Update existing company
        console.log('Before update - companies:', companies.length)
        console.log('Updating company:', editingCompany.id, 'with response:', response.company)
        setCompanies(prev => {
          const updated = prev.map(c => 
            c.id === editingCompany.id ? response.company : c
          )
          console.log('After update - companies:', updated.length)
          return updated
        })
      } else {
        // Add new company
        setCompanies(prev => [response.company, ...prev])
      }
      
      // Reset form state
      setCurrentFormData(null)
      setEditingCompany(undefined)
      
      // Show success message (you could add a toast notification here)
      console.log(response.message)
    } catch (err) {
      const companyError = handleApiError(err)
      logCompanyError(companyError, editingCompany ? 'updateCompany' : 'createCompany')
      setError(companyError)
    } finally {
      setFormLoading(false)
    }
  }, [editingCompany])

  // Handle company creation initiation
  const handleCreateCompany = useCallback(() => {
    setEditingCompany(undefined)
    setCurrentFormData({ name: '', description: '' })
    setError(undefined) // Clear any previous errors
  }, [])

  // Handle company editing initiation
  const handleEditCompany = useCallback((company: Company) => {
    setEditingCompany(company)
    setCurrentFormData({
      name: company.name,
      description: company.description || ''
    })
    setError(undefined) // Clear any previous errors
  }, [])

  // Handle company deletion with enhanced error handling
  const handleDeleteCompany = useCallback(async (companyId: string) => {
    try {
      setLoading(true)
      setError(undefined)
      
      const response = await companyRetryManager.executeWithRetry(
        `deleteCompany-${companyId}`,
        () => companyAPIClient.deleteCompany(companyId),
        (attempt, error) => {
          console.log(`Retrying deleteCompany (attempt ${attempt}):`, error.message)
        }
      )
      
      // Remove the company from the list
      setCompanies(prev => prev.filter(c => c.id !== companyId))
      
      // Show success message
      console.log(response.message)
      if (response.deletedAssessments > 0) {
        console.log(`Also deleted ${response.deletedAssessments} associated assessments`)
      }
    } catch (err) {
      const companyError = handleApiError(err)
      logCompanyError(companyError, 'deleteCompany')
      setError(companyError)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle company search with error handling
  const handleSearchCompanies = useCallback(async (query: string) => {
    try {
      setError(undefined)
      
      const response = await companyRetryManager.executeWithRetry(
        'searchCompanies',
        () => companyAPIClient.searchCompanies(query),
        (attempt, error) => {
          console.log(`Retrying searchCompanies (attempt ${attempt}):`, error.message)
        }
      )
      
      setCompanies(response.companies)
    } catch (err) {
      const companyError = handleApiError(err)
      logCompanyError(companyError, 'searchCompanies')
      setError(companyError)
    }
  }, [])

  // Handle error retry
  const handleRetry = useCallback(() => {
    if (error && isRetryableError(error)) {
      // Determine what operation to retry based on current state
      if (currentFormData) {
        handleFormSubmit(currentFormData)
      } else {
        loadCompanies(true)
      }
    }
  }, [error, currentFormData, handleFormSubmit, loadCompanies])

  // Handle error dismissal
  const handleDismissError = useCallback(() => {
    setError(undefined)
  }, [])

  return (
    <CompanyErrorBoundary>
      <CompanyDashboard
        companies={companies}
        loading={loading || formLoading}
        error={error?.message}
        onCreateCompany={handleCreateCompany}
        onEditCompany={handleEditCompany}
        onDeleteCompany={handleDeleteCompany}
        onSearchCompanies={handleSearchCompanies}
        // Additional props for form handling
        currentFormData={currentFormData}
        editingCompany={editingCompany}
        onFormSubmit={handleFormSubmit}
        onFormCancel={() => {
          setCurrentFormData(null)
          setEditingCompany(undefined)
          setError(undefined)
        }}
        formLoading={formLoading}
        // Enhanced error handling props
        companyError={error}
        onRetry={handleRetry}
        onDismissError={handleDismissError}
        retryCount={retryCount}
      />
    </CompanyErrorBoundary>
  )
}

export default CompanyContainer