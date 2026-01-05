'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PencilIcon, 
  TrashIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { CompanyCardProps } from '@/types/company'
import Tooltip from './Tooltip'

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onEdit,
  onDelete,
  onViewAssessments
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleEditClick = () => {
    onEdit(company)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(company.id)
    setShowDeleteConfirm(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const handleViewAssessments = () => {
    onViewAssessments(company.id)
  }

  const handleStartNewAssessment = () => {
    // Navigate to AI Assessment page with pre-selected company
    router.push(`/ai-assessment?companyId=${company.id}`)
  }

  const handleGoToAIAssessment = () => {
    // Navigate to AI Assessment page with pre-selected company
    router.push(`/ai-assessment?companyId=${company.id}`)
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter or Space to edit company
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleEditClick()
    }
    
    // Handle Delete key to delete company
    if (event.key === 'Delete') {
      event.preventDefault()
      handleDeleteClick()
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  return (
    <>
      <div 
        ref={cardRef}
        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 group cursor-pointer"
        tabIndex={0}
        onKeyDown={handleCardKeyDown}
        onClick={handleEditClick}
        role="button"
        aria-label={`Company: ${company.name}. ${company.assessmentCount} assessments. Press Enter to edit, Delete key to delete.`}
      >
        {/* Card Header */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {company.name}
                </h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Created {formatDate(company.createdAt)}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Tooltip content="Edit company details" position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditClick()
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transform hover:scale-105"
                  aria-label={`Edit ${company.name}`}
                  tabIndex={-1}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              
              <Tooltip content="Delete company" position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteClick()
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transform hover:scale-105"
                  aria-label={`Delete ${company.name}`}
                  tabIndex={-1}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {company.description}
              </p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              <span>
                {company.assessmentCount} {company.assessmentCount === 1 ? 'assessment' : 'assessments'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {company.assessmentCount > 0 && (
                <Tooltip content={`View all ${company.assessmentCount} assessments for ${company.name}`} position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGoToAIAssessment()
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium px-3 py-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    aria-label={`View assessments for ${company.name}`}
                    tabIndex={-1}
                  >
                    View assessments →
                  </button>
                </Tooltip>
              )}
              
              <Tooltip content={`Start new assessment for ${company.name}`} position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartNewAssessment()
                  }}
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-800 hover:bg-green-50 font-medium px-3 py-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  aria-label={`Start new assessment for ${company.name}`}
                  tabIndex={-1}
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  New Assessment
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Company
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{company.name}"?
                      </p>
                      {company.assessmentCount > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This company has {company.assessmentCount} associated {company.assessmentCount === 1 ? 'assessment' : 'assessments'}. 
                            Deleting this company will also permanently delete all associated assessments.
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Delete Company
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CompanyCard