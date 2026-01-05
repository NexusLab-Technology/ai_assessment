'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Company, CompanyDashboardProps, CompanyFormData } from '@/types/company'
import { CompanyError } from '@/utils/company-error-handling'
import CompanyCard from '@/components/company-settings/CompanyCard'
import CompanySearch from '@/components/company-settings/CompanySearch'
import CompanyForm from '@/components/company-settings/CompanyForm'
import LoadingSpinner from '../ai-assessment/LoadingSpinner'
import Tooltip from './Tooltip'

interface ExtendedCompanyDashboardProps extends CompanyDashboardProps {
  currentFormData?: CompanyFormData | null
  editingCompany?: Company
  onFormSubmit?: (formData: CompanyFormData) => void
  onFormCancel?: () => void
  formLoading?: boolean
  // Enhanced error handling props
  companyError?: CompanyError
  onRetry?: () => void
  onDismissError?: () => void
  retryCount?: number
}
import ErrorMessage from '../ai-assessment/ErrorMessage'

const CompanyDashboard: React.FC<ExtendedCompanyDashboardProps> = ({
  companies,
  loading,
  error,
  onCreateCompany,
  onEditCompany,
  onDeleteCompany,
  onSearchCompanies,
  currentFormData,
  editingCompany,
  onFormSubmit,
  onFormCancel,
  formLoading = false,
  // Enhanced error handling props
  companyError,
  onRetry,
  onDismissError,
  retryCount = 0
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(companies)
  
  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  // Show form when currentFormData is provided
  useEffect(() => {
    setShowCreateForm(!!currentFormData)
  }, [currentFormData])

  // Focus management for modal
  useEffect(() => {
    if (showCreateForm) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Focus the modal after a brief delay to ensure it's rendered
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          if (firstFocusable) {
            firstFocusable.focus()
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    } else {
      // Return focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [showCreateForm])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateForm) {
        handleFormCancel()
      }
    }

    if (showCreateForm) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showCreateForm])

  // Update filtered companies when companies or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(query) ||
        (company.description && company.description.toLowerCase().includes(query))
      )
      setFilteredCompanies(filtered)
    }
  }, [companies, searchQuery])

  const handleCreateCompany = () => {
    onCreateCompany()
  }

  const handleEditCompany = (company: Company) => {
    onEditCompany(company)
  }

  const handleFormCancel = () => {
    setShowCreateForm(false)
    onFormCancel?.()
  }

  const handleFormSubmit = (formData: CompanyFormData) => {
    onFormSubmit?.(formData)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearchCompanies(query)
  }

  const handleViewAssessments = (companyId: string) => {
    // Navigate to AI Assessment with company pre-selected
    window.location.href = `/ai-assessment?company=${companyId}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || companyError) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {companyError ? 'Operation Failed' : 'Error'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{companyError?.message || error}</p>
                {retryCount > 0 && (
                  <p className="mt-1 text-xs">
                    Retry attempt: {retryCount}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  {companyError?.retryable && onRetry && (
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  )}
                  {onDismissError && (
                    <button
                      onClick={onDismissError}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Company Settings
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your companies and organizations for AI assessments
            </p>
          </div>
          <Tooltip content="Create a new company for AI assessments" position="bottom">
            <button
              ref={createButtonRef}
              onClick={handleCreateCompany}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              aria-label="Create new company"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Company
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <CompanySearch
          onSearch={handleSearch}
          placeholder="Search companies by name or description..."
          debounceMs={300}
        />
      </div>

      {/* Company Form Modal */}
      {showCreateForm && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={handleFormCancel}
              aria-hidden="true"
            />
            
            <div 
              ref={modalRef}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 id="modal-title" className="text-lg leading-6 font-medium text-gray-900">
                    {editingCompany ? 'Edit Company' : 'Create New Company'}
                  </h3>
                </div>
                <CompanyForm
                  company={editingCompany}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  loading={formLoading}
                  existingCompanies={companies}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-2 0H3m2-16h14a2 2 0 012 2v16M7 3v18M15 3v18" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? 'No companies found' : 'No companies yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No companies match "${searchQuery}". Try a different search term.`
              : 'Get started by creating your first company to organize your AI assessments.'
            }
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Tooltip content="Create your first company to get started" position="top">
                <button
                  onClick={handleCreateCompany}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                  aria-label="Create your first company"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Company
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className="mb-4 text-sm text-gray-600">
            {searchQuery ? (
              <>
                Found {filteredCompanies.length} of {companies.length} companies
                {searchQuery && (
                  <span className="ml-2">
                    matching "{searchQuery}"
                    <button
                      onClick={() => handleSearch('')}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear search
                    </button>
                  </span>
                )}
              </>
            ) : (
              `Showing ${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`
            )}
          </div>

          {/* Companies Grid */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="grid"
            aria-label="Companies list"
          >
            {filteredCompanies.map((company, index) => (
              <div
                key={company.id}
                role="gridcell"
                tabIndex={0}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleEditCompany(company)
                  }
                }}
                aria-label={`Company: ${company.name}. ${company.assessmentCount} assessments. Press Enter to edit.`}
              >
                <CompanyCard
                  company={company}
                  onEdit={handleEditCompany}
                  onDelete={onDeleteCompany}
                  onViewAssessments={handleViewAssessments}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CompanyDashboard