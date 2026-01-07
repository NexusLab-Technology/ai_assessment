'use client'

import React, { useState, useEffect } from 'react'
import { 
  CogIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import AWSCredentialsForm, { AWSCredentials } from './AWSCredentialsForm'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { Company } from '../../types/assessment'
import { getErrorMessage, logError } from '../../utils/error-handling'

interface AWSSettingsPageProps {
  selectedCompany: Company | null
  onBack?: () => void
}

interface CredentialsStatus {
  hasCredentials: boolean
  credentials?: {
    accessKeyId: string
    region: string
    lastUpdated: string
  }
}

const AWSSettingsPage: React.FC<AWSSettingsPageProps> = ({
  selectedCompany,
  onBack
}) => {
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (selectedCompany) {
      loadCredentialsStatus()
    }
  }, [selectedCompany])

  const loadCredentialsStatus = async () => {
    if (!selectedCompany) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/aws/credentials?companyId=${selectedCompany.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setCredentialsStatus(data.data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load credentials status')
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      logError(error, 'loadCredentialsStatus')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSubmit = async (credentials: AWSCredentials) => {
    if (!selectedCompany) return

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch('/api/aws/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          credentials
        })
      })

      if (response.ok) {
        setSuccessMessage('AWS credentials saved successfully!')
        setShowForm(false)
        await loadCredentialsStatus() // Refresh status
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save credentials')
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      logError(error, 'handleCredentialsSubmit')
      throw error // Re-throw to let form handle it
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCredentials = async () => {
    if (!selectedCompany || !credentialsStatus?.hasCredentials) return

    if (!confirm('Are you sure you want to delete the AWS credentials? This will disable report generation.')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/aws/credentials?companyId=${selectedCompany.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('AWS credentials deleted successfully')
        await loadCredentialsStatus() // Refresh status
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete credentials')
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      logError(error, 'handleDeleteCredentials')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedCompany) {
    return (
      <div className="text-center py-12">
        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a company to configure AWS settings.
        </p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div>
        {onBack && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Settings
            </button>
          </div>
        )}

        <AWSCredentialsForm
          onCredentialsSubmit={handleCredentialsSubmit}
          onCancel={() => setShowForm(false)}
          isLoading={isSaving}
          error={error || undefined}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AWS Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure AWS Bedrock integration for {selectedCompany.name}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage
          title="Configuration Error"
          message={error}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <LoadingSpinner 
          size="lg" 
          text="Loading AWS settings..." 
          className="min-h-[200px]"
        />
      )}

      {/* Settings Content */}
      {!isLoading && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              AWS Bedrock Configuration
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure your AWS credentials to enable AI-powered report generation
            </p>
          </div>

          <div className="px-6 py-4">
            {credentialsStatus?.hasCredentials ? (
              <div>
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-700">
                    AWS credentials configured
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Access Key ID
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {credentialsStatus.credentials?.accessKeyId}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Region
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {credentialsStatus.credentials?.region}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {credentialsStatus.credentials?.lastUpdated 
                          ? new Date(credentialsStatus.credentials.lastUpdated).toLocaleString()
                          : 'Unknown'
                        }
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Credentials
                  </button>
                  <button
                    onClick={handleDeleteCredentials}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Credentials
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-700">
                    AWS credentials not configured
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Configure your AWS credentials to enable AI-powered report generation using AWS Bedrock.
                  You'll need an AWS account with Bedrock access and appropriate permissions.
                </p>

                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Configure AWS Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">About AWS Bedrock Integration</p>
            <p className="mt-1">
              AWS Bedrock provides access to foundation models for generating AI-powered assessment reports. 
              Your credentials are encrypted and stored securely. Make sure your AWS account has the necessary 
              permissions to access Bedrock services in your selected region.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AWSSettingsPage