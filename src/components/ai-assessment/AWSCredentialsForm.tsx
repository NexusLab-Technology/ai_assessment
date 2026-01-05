'use client'

import React, { useState } from 'react'
import { 
  KeyIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import FormValidationError from './FormValidationError'

export interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

interface AWSCredentialsFormProps {
  onCredentialsSubmit: (credentials: AWSCredentials) => Promise<void>
  onCancel?: () => void
  initialCredentials?: Partial<AWSCredentials>
  isLoading?: boolean
  error?: string
}

const AWSCredentialsForm: React.FC<AWSCredentialsFormProps> = ({
  onCredentialsSubmit,
  onCancel,
  initialCredentials = {},
  isLoading = false,
  error
}) => {
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: initialCredentials.accessKeyId || '',
    secretAccessKey: initialCredentials.secretAccessKey || '',
    region: initialCredentials.region || 'us-east-1'
  })
  
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const validateCredentials = (): boolean => {
    const errors: Record<string, string> = {}

    if (!credentials.accessKeyId.trim()) {
      errors.accessKeyId = 'AWS Access Key ID is required'
    } else if (!/^AKIA[0-9A-Z]{16}$/.test(credentials.accessKeyId)) {
      errors.accessKeyId = 'Invalid AWS Access Key ID format'
    }

    if (!credentials.secretAccessKey.trim()) {
      errors.secretAccessKey = 'AWS Secret Access Key is required'
    } else if (credentials.secretAccessKey.length < 40) {
      errors.secretAccessKey = 'AWS Secret Access Key must be at least 40 characters'
    }

    if (!credentials.region.trim()) {
      errors.region = 'AWS Region is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof AWSCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Reset connection status when credentials change
    if (connectionStatus !== 'idle') {
      setConnectionStatus('idle')
    }
  }

  const handleTestConnection = async () => {
    if (!validateCredentials()) {
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      // Test AWS Bedrock connectivity
      const response = await fetch('/api/aws/test-bedrock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        setConnectionStatus('success')
      } else {
        const errorData = await response.json()
        setConnectionStatus('error')
        setValidationErrors({ general: errorData.error || 'Failed to connect to AWS Bedrock' })
      }
    } catch (error) {
      setConnectionStatus('error')
      setValidationErrors({ general: 'Network error while testing connection' })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCredentials()) {
      return
    }

    try {
      await onCredentialsSubmit(credentials)
    } catch (error) {
      setValidationErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save credentials' 
      })
    }
  }

  const awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <KeyIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">
              AWS Bedrock Configuration
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Configure your AWS credentials to enable AI-powered report generation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* General Error */}
          {(error || validationErrors.general) && (
            <FormValidationError 
              error={error || validationErrors.general}
              className="mb-4"
            />
          )}

          {/* AWS Access Key ID */}
          <div>
            <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700">
              AWS Access Key ID *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="accessKeyId"
                value={credentials.accessKeyId}
                onChange={(e) => handleInputChange('accessKeyId', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  validationErrors.accessKeyId 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                disabled={isLoading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your AWS Access Key ID (starts with AKIA)
            </p>
            {validationErrors.accessKeyId && (
              <FormValidationError error={validationErrors.accessKeyId} />
            )}
          </div>

          {/* AWS Secret Access Key */}
          <div>
            <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700">
              AWS Secret Access Key *
            </label>
            <div className="mt-1 relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                id="secretAccessKey"
                value={credentials.secretAccessKey}
                onChange={(e) => handleInputChange('secretAccessKey', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 ${
                  validationErrors.secretAccessKey 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showSecretKey ? (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your AWS Secret Access Key (keep this secure)
            </p>
            {validationErrors.secretAccessKey && (
              <FormValidationError error={validationErrors.secretAccessKey} />
            )}
          </div>

          {/* AWS Region */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              AWS Region *
            </label>
            <div className="mt-1">
              <select
                id="region"
                value={credentials.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  validationErrors.region 
                    ? 'border-red-300 text-red-900' 
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                {awsRegions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              AWS region where Bedrock service is available
            </p>
            {validationErrors.region && (
              <FormValidationError error={validationErrors.region} />
            )}
          </div>

          {/* Connection Test */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Connection Test</h3>
                <p className="text-xs text-gray-500">
                  Test your credentials before saving
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {connectionStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Connected</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Failed</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || isLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-1" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || isTestingConnection}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Notice */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Security Notice</p>
            <p className="mt-1">
              Your AWS credentials are encrypted and stored securely. Never share your credentials 
              with unauthorized users. Consider using IAM roles with minimal required permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AWSCredentialsForm