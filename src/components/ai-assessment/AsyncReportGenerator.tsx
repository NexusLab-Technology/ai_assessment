'use client'

import React, { useState, useEffect } from 'react'
import { Assessment, AssessmentResponses, ReportGenerationRequest, AsyncReportGeneratorProps } from '@/types/assessment'

export default function AsyncReportGenerator({
  assessment,
  responses,
  onReportRequested,
  onReportCompleted
}: AsyncReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<ReportGenerationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Mock external API call for report generation
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          companyId: assessment.companyId,
          responses,
          assessmentType: assessment.type
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate report generation')
      }

      const data = await response.json()
      
      const newRequest: ReportGenerationRequest = {
        id: data.requestId,
        assessmentId: assessment.id,
        companyId: assessment.companyId,
        status: 'PENDING',
        requestedAt: new Date(),
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      }

      setCurrentRequest(newRequest)
      onReportRequested(data.requestId)

      // Start polling for status updates
      startStatusPolling(data.requestId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setIsGenerating(false)
    }
  }

  const startStatusPolling = (requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/reports/status/${requestId}`)
        
        if (!response || !response.ok) {
          throw new Error('Failed to check report status')
        }

        const data = await response.json()
        
        setCurrentRequest(prev => prev ? {
          ...prev,
          status: data.status,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
          errorMessage: data.errorMessage
        } : null)

        if (data.status === 'COMPLETED') {
          clearInterval(pollInterval)
          setIsGenerating(false)
          onReportCompleted({
            id: data.reportId,
            htmlContent: data.htmlContent
          })
        } else if (data.status === 'FAILED') {
          clearInterval(pollInterval)
          setIsGenerating(false)
          setError(data.errorMessage || 'Report generation failed')
        }
      } catch (err) {
        console.error('Error polling report status:', err)
        // Continue polling on error, don't clear interval
      }
    }, 3000) // Poll every 3 seconds

    // Clean up polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (currentRequest?.status === 'PENDING' || currentRequest?.status === 'PROCESSING') {
        setError('Report generation timed out. Please try again.')
        setIsGenerating(false)
      }
    }, 10 * 60 * 1000)

    // Store interval for cleanup
    return pollInterval
  }

  const handleRetry = () => {
    setCurrentRequest(null)
    setError(null)
    handleGenerateReport()
  }

  const getStatusDisplay = () => {
    if (!currentRequest) return null

    switch (currentRequest.status) {
      case 'PENDING':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Report Generation Queued</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Request ID: {currentRequest.id}
                </p>
                {currentRequest.estimatedCompletionTime && (
                  <p className="text-sm text-yellow-700">
                    Estimated completion: {currentRequest.estimatedCompletionTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 'PROCESSING':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Report Generation in Progress</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Request ID: {currentRequest.id}
                </p>
                <p className="text-sm text-blue-700">
                  AI is analyzing your assessment responses...
                </p>
              </div>
            </div>
          </div>
        )

      case 'COMPLETED':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-full h-4 w-4 bg-green-600 mr-3 flex items-center justify-center">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-800">Report Generated Successfully</h4>
                <p className="text-sm text-green-700 mt-1">
                  Completed at: {currentRequest.completedAt?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )

      case 'FAILED':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="rounded-full h-4 w-4 bg-red-600 mr-3 flex items-center justify-center">
                  <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M7.5 1.5L6.5.5 4 3 1.5.5.5 1.5 3 4 .5 6.5 1.5 7.5 4 5l2.5 2.5 1-1L5 4z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Report Generation Failed</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {currentRequest.errorMessage || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generate Assessment Report
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          Generate a comprehensive AI assessment report based on your responses. 
          The report will be created asynchronously and you'll be notified when it's ready.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="rounded-full h-4 w-4 bg-red-600 mr-3 flex items-center justify-center">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M7.5 1.5L6.5.5 4 3 1.5.5.5 1.5 3 4 .5 6.5 1.5 7.5 4 5l2.5 2.5 1-1L5 4z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {getStatusDisplay()}

        {!isGenerating && !currentRequest && (
          <button
            onClick={handleGenerateReport}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Generate Report
          </button>
        )}

        {isGenerating && !currentRequest && (
          <button
            disabled
            className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Initiating Report Generation...
          </button>
        )}
      </div>
    </div>
  )
}