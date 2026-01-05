'use client'

import React, { useState, useEffect } from 'react'
import { Company } from '../../types/assessment'
import { companyApi } from '../../lib/api-client'
import CompanySelector from '../../components/ai-assessment/CompanySelector'
import AssessmentContainer from '../../components/ai-assessment/AssessmentContainer'
import { ApplicationShell } from '../../components/ApplicationShell'
import { RouteGuard } from '../../components/RouteGuard'

export default function AIAssessmentPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompanySelectorDisabled, setIsCompanySelectorDisabled] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

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
    // For now, just redirect to company settings
    // In a real app, this would open a modal or navigate to company creation
    alert('Company creation would redirect to Company Settings module')
  }

  const handleCompanySelectorDisabled = (disabled: boolean) => {
    setIsCompanySelectorDisabled(disabled)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading AI Assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    )
  }

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="h-full flex flex-col">
          {/* Header with Company Selector */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
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
                <div className="min-w-64 relative">
                  <CompanySelector
                    companies={companies}
                    selectedCompany={selectedCompany}
                    onCompanySelect={setSelectedCompany}
                    onCreateNew={handleCreateCompany}
                    compact={true}
                    disabled={isCompanySelectorDisabled}
                  />
                  {isCompanySelectorDisabled && (
                    <div className="absolute -bottom-6 left-0 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      Cannot change company during assessment
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
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