'use client'

import React, { useState, useEffect } from 'react'
import { ReportGenerationRequest, ReportStatusTrackerProps } from '../../../types/assessment'

export default function ReportStatusTracker({
  requests,
  onRefreshStatus,
  onViewReport,
  onRetryGeneration
}: ReportStatusTrackerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 10 seconds if there are pending/processing requests
  useEffect(() => {
    if (!autoRefresh) return

    const hasPendingRequests = requests.some(
      req => req.status === 'PENDING' || req.status === 'PROCESSING'
    )

    if (!hasPendingRequests) return

    const interval = setInterval(() => {
      handleRefresh()
    }, 10000)

    return () => clearInterval(interval)
  }, [requests, autoRefresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefreshStatus()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status: ReportGenerationRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        )
      case 'PROCESSING':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )
      case 'COMPLETED':
        return (
          <div className="rounded-full h-4 w-4 bg-green-600 flex items-center justify-center">
            <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
            </svg>
          </div>
        )
      case 'FAILED':
        return (
          <div className="rounded-full h-4 w-4 bg-red-600 flex items-center justify-center">
            <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M7.5 1.5L6.5.5 4 3 1.5.5.5 1.5 3 4 .5 6.5 1.5 7.5 4 5l2.5 2.5 1-1L5 4z"/>
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStatusColor = (status: ReportGenerationRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date()
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) {
      return `${duration}s`
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`
    } else {
      const hours = Math.floor(duration / 3600)
      const minutes = Math.floor((duration % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Report Generation History
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No report generation requests yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Report Generation History
        </h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isRefreshing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                Refreshing...
              </div>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className={`border rounded-lg p-4 ${getStatusColor(request.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(request.status)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      Request {request.id.slice(-8)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Requested: {request.requestedAt.toLocaleString()}
                  </div>
                  {request.completedAt && (
                    <div className="text-xs text-gray-600">
                      Completed: {request.completedAt.toLocaleString()} 
                      ({formatDuration(request.requestedAt, request.completedAt)})
                    </div>
                  )}
                  {(request.status === 'PENDING' || request.status === 'PROCESSING') && (
                    <div className="text-xs text-gray-600">
                      Duration: {formatDuration(request.requestedAt)}
                    </div>
                  )}
                  {request.errorMessage && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {request.errorMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {request.status === 'COMPLETED' && (
                  <button
                    onClick={() => onViewReport(request.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    View Report
                  </button>
                )}
                {request.status === 'FAILED' && (
                  <button
                    onClick={() => onRetryGeneration(request.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {requests.some(req => req.status === 'PENDING' || req.status === 'PROCESSING') && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-sm text-blue-700">
              {autoRefresh ? 'Auto-refreshing status every 10 seconds...' : 'Some requests are still processing'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}