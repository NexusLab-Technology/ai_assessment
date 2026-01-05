'use client'

import React, { useState } from 'react'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Assessment, Company, AssessmentDashboardProps } from '../../types/assessment'

const AssessmentDashboard: React.FC<AssessmentDashboardProps> = ({
  company,
  assessments,
  onCreateAssessment,
  onSelectAssessment,
  onViewAssessment,
  onDeleteAssessment,
  isLoading = false,
  isDeletingAssessment = null
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

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

  const getStatusText = (status: Assessment['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'COMPLETED':
        return 'Completed'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (assessment: Assessment) => {
    if (assessment.totalSteps === 0) return 0
    return Math.round((assessment.currentStep / assessment.totalSteps) * 100)
  }

  const getActionIcon = (status: Assessment['status']) => {
    return status === 'COMPLETED' ? EyeIcon : PencilIcon
  }

  const getActionTitle = (status: Assessment['status']) => {
    return status === 'COMPLETED' ? 'View Assessment' : 'Edit Assessment'
  }

  const handleAssessmentAction = (assessment: Assessment) => {
    if (assessment.status === 'COMPLETED') {
      onViewAssessment?.(assessment.id)
    } else {
      onSelectAssessment(assessment)
    }
  }

  const handleDeleteClick = (assessmentId: string) => {
    setShowDeleteConfirm(assessmentId)
  }

  const handleConfirmDelete = (assessmentId: string) => {
    onDeleteAssessment(assessmentId)
    setShowDeleteConfirm(null)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first assessment for {company?.name || 'your company'}.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onCreateAssessment}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Assessments for {company?.name || 'Company'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateAssessment}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Assessment
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading assessments...</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(assessment.status)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {assessment.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {getStatusText(assessment.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {assessment.type === 'EXPLORATORY' ? 'Exploratory' : 'Migration'}
                      </span>
                    </div>
                  </div>
                </div>

                {assessment.status === 'IN_PROGRESS' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{getProgressPercentage(assessment)}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(assessment)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Step {assessment.currentStep} of {assessment.totalSteps}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Created {new Date(assessment.createdAt).toLocaleDateString()}</span>
                  <span>Updated {new Date(assessment.updatedAt).toLocaleDateString()}</span>
                  {assessment.completedAt && (
                    <span>Completed {new Date(assessment.completedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleAssessmentAction(assessment)}
                  className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title={getActionTitle(assessment.status)}
                >
                  {React.createElement(getActionIcon(assessment.status), { className: "h-4 w-4" })}
                </button>

                {assessment.status === 'DRAFT' && (
                  <button
                    onClick={() => handleDeleteClick(assessment.id)}
                    disabled={isDeletingAssessment === assessment.id}
                    className={`inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isDeletingAssessment === assessment.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Delete Draft"
                  >
                    {isDeletingAssessment === assessment.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm === assessment.id && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                  <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <TrashIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Delete Assessment
                          </h3>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to delete "{assessment.name}"? This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(assessment.id)}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

export default AssessmentDashboard