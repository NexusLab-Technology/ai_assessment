'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Company } from '../../types/assessment'
import { companyApi } from '../../lib/api-client'
import CompanySelector from '../../components/ai-assessment/assessment/CompanySelector'
import AssessmentContainer from '../../components/ai-assessment/assessment/AssessmentContainer'
import { ApplicationShell } from '../../components/ApplicationShell'
import { RouteGuard } from '../../components/RouteGuard'

function AIAssessmentPageContent() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Start with false to prevent flash
  const [error, setError] = useState<string | null>(null)
  const [isCompanySelectorDisabled, setIsCompanySelectorDisabled] = useState(false)
  const searchParams = useSearchParams()
  const hasLoadedRef = useRef(false) // Track if we've already loaded companies

  useEffect(() => {
    // Only load once on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadCompanies()
    }
  }, [])

  // Handle pre-selection from URL parameters
  useEffect(() => {
    const companyId = searchParams.get('companyId')
    if (companyId && companies.length > 0 && !selectedCompany) {
      const preSelectedCompany = companies.find(c => c.id === companyId)
      if (preSelectedCompany) {
        setSelectedCompany(preSelectedCompany)
      }
    }
  }, [companies, searchParams, selectedCompany])

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await companyApi.getAll()
      setCompanies(data)
      
      // Auto-select first company if available
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0])
      }
    } catch (error) {
      console.error('Failed to load companies:', error)
      setError('Failed to load companies. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = () => {
    // Navigate to company settings for company creation
    window.location.href = '/company-settings'
  }

  const handleCompanySelectorDisabled = (disabled: boolean) => {
    setIsCompanySelectorDisabled(disabled)
  }

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="h-full flex flex-col max-w-none">
          {/* Header with Company Selector */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assessment</h1>
                <p className="text-sm text-gray-600">
                  Create and manage AI-powered assessments
                </p>
              </div>
              
              {/* Compact Company Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Company:</label>
                <div className="min-w-64">
                  <CompanySelector
                    companies={companies}
                    selectedCompany={selectedCompany}
                    onCompanySelect={setSelectedCompany}
                    onCreateNew={handleCreateCompany}
                    compact={true}
                    disabled={isCompanySelectorDisabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area - Show loading only in content area */}
          <div className="flex-1 overflow-auto relative">
            {/* Loading overlay - only show in content area */}
            {isLoading && companies.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading AI Assessment...</p>
                </div>
              </div>
            )}

            {/* Error message - only show in content area */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-red-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
                  <p className="mt-1 text-sm text-gray-500">{error}</p>
                  <button
                    onClick={() => {
                      setError(null)
                      loadCompanies()
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Main content - always render, loading/error shown as overlay */}
            <AssessmentContainer 
              selectedCompany={selectedCompany} 
              onCompanySelectorDisabled={handleCompanySelectorDisabled}
            />
          </div>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}

export default function AIAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AIAssessmentPageContent />
    </Suspense>
  )
}