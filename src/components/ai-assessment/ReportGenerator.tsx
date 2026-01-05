'use client'

import React, { useState } from 'react'
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import { Assessment, Company } from '../../types/assessment'
import { getErrorMessage, logError } from '../../utils/error-handling'

interface ReportGeneratorProps {
  assessment: Assessment
  company: Company
  onReportGenerated?: (reportId: string) => void
  className?: string
}

interface GenerationStatus {
  status: 'idle' | 'generating' | 'success' | 'error'
  reportId?: string
  error?: string
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  assessment,
  company,
  onReportGenerated,
  className = ''
}) => {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ status: 'idle' })

  const canGenerateReport = assessment.status === 'COMPLETED'

  const handleGenerateReport = async () => {
    if (!canGenerateReport) return

    try {
      setGenerationStatus({ status: 'generating' })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          companyId: company.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGenerationStatus({ 
          status: 'success', 
          reportId: data.data.reportId 
        })
        
        if (onReportGenerated) {
          onReportGenerated(data.data.reportId)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setGenerationStatus({ 
        status: 'error', 
        error: errorMessage 
      })
      logError(error, 'handleGenerateReport')
    }
  }

  const handleViewReport = () => {
    if (generationStatus.reportId) {
      // Open report in new tab
      window.open(`/api/reports/${generationStatus.reportId}`, '_blank')
    }
  }

  const resetStatus = () => {
    setGenerationStatus({ status: 'idle' })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">
          AI-Powered Report Generation
        </h3>
      </div>

      <div className="space-y-4">
        {/* Status Display */}
        {generationStatus.status === 'idle' && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Generate a comprehensive assessment report using AI analysis of your responses.
              The report will include recommendations, risk assessments, and implementation roadmaps.
            </p>
            
            {!canGenerateReport && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-700">
                    Complete the assessment to generate a report
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={!canGenerateReport}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        )}

        {generationStatus.status === 'generating' && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Generating your AI-powered report..." />
            <p className="mt-4 text-sm text-gray-500">
              This may take a few moments while we analyze your assessment responses
            </p>
          </div>
        )}

        {generationStatus.status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center mb-3">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <h4 className="text-sm font-medium text-green-800">
                Report Generated Successfully!
              </h4>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Your comprehensive assessment report has been generated and is ready for review.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleViewReport}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View Report
              </button>
              <button
                onClick={resetStatus}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}

        {generationStatus.status === 'error' && (
          <div>
            <ErrorMessage
              title="Report Generation Failed"
              message={generationStatus.error || 'Unknown error occurred'}
              onDismiss={resetStatus}
              className="mb-4"
            />
            <button
              onClick={handleGenerateReport}
              disabled={!canGenerateReport}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">About AI Report Generation</p>
            <p className="mt-1">
              Reports are generated using AWS Bedrock with Claude 3 Sonnet, providing detailed analysis,
              recommendations, and implementation roadmaps based on your assessment responses.
              Each report is tailored to your company's specific needs and goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportGenerator