'use client'

import React from 'react'
import { 
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Assessment } from '../../types/assessment'
import { organizeBySessions, formatResponseForDisplay } from '../../utils/session-data-utils'
import { useAssessmentViewer } from '../../hooks/useAssessmentViewer'

interface AssessmentViewerProps {
  assessmentId: string
  onClose: () => void
  onEdit?: () => void
}

const AssessmentViewer: React.FC<AssessmentViewerProps> = ({
  assessmentId,
  onClose,
  onEdit
}) => {
  const { assessment, responses, sections, isLoading, error, refetch } = useAssessmentViewer(assessmentId)

  const getStatusIcon = (status: Assessment['status']) => {
    switch (status) {
      case 'DRAFT':
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
      case 'IN_PROGRESS':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const formatResponse = (question: any, response: any) => {
    if (response === null || response === undefined || response === '') {
      return <span className="text-gray-400 italic">No response</span>
    }

    const formattedText = formatResponseForDisplay(question, response)
    
    if (formattedText === 'No response') {
      return <span className="text-gray-400 italic">{formattedText}</span>
    }

    if (question.type === 'textarea') {
      return (
        <div className="whitespace-pre-wrap break-words">
          {formattedText}
        </div>
      )
    }

    return formattedText
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500 text-center">Loading assessment data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !assessment || !responses || !sections) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Failed to Load Assessment
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {error || 'Unable to load assessment data. Please try again.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={refetch}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Organize sessions
  const sessions = organizeBySessions(responses, sections, assessment)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-start justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(assessment.status)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {assessment.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {assessment.type === 'EXPLORATORY' ? 'Exploratory Assessment' : 'Migration Assessment'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onEdit && assessment.status !== 'COMPLETED' && (
                  <button
                    onClick={onEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Assessment metadata */}
            <div className="mt-4 flex items-center space-x-6 text-xs text-gray-500">
              <span>Created {new Date(assessment.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(assessment.updatedAt).toLocaleDateString()}</span>
              {assessment.completedAt && (
                <span>Completed {new Date(assessment.completedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This assessment doesn't have any recorded responses yet.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-8">
                {sessions.map((session, sessionIndex) => (
                  <div key={session.sessionId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Session header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.stepTitle}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            Session {sessionIndex + 1}
                          </div>
                          {session.progress && (
                            <div className="text-sm text-gray-600">
                              {session.progress.completed}/{session.progress.total} answered ({session.progress.percentage}%)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Completed: {session.timestamp.toLocaleString()}
                      </div>
                      {session.stepDescription && (
                        <div className="mt-2 text-sm text-gray-600">
                          {session.stepDescription}
                        </div>
                      )}
                    </div>

                    {/* Session content */}
                    <div className="p-4 space-y-4">
                      {session.questions.map((question) => {
                        const response = session.responses[question.id]
                        return (
                          <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                  {question.label}
                                  {question.required && <span className="text-red-500 ml-1">*</span>}
                                </h4>
                                {question.description && (
                                  <p className="text-xs text-gray-600 mb-2">{question.description}</p>
                                )}
                                <div className="text-sm text-gray-800">
                                  {formatResponse(question, response)}
                                </div>
                              </div>
                              <div className="ml-4 text-xs text-gray-400">
                                {question.type}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentViewer