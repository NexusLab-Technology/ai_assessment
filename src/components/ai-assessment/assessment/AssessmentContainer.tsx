/**
 * Assessment Container Component
 * Refactored to use container logic for better code organization (Rule 2 compliance)
 * 
 * This component handles UI rendering only. Business logic is in containers/ai-assessment/AssessmentContainerLogic.tsx
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Company } from '../../../types/assessment'
import AssessmentDashboard from './AssessmentDashboard'
import AssessmentViewer from './AssessmentViewer'
import { DatabaseIntegratedAssessmentWizard } from '../wizards/DatabaseIntegratedAssessmentWizard'
import ReportGenerator from '../reports/ReportGenerator'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorMessage } from '../common/ErrorMessage'
import { useAssessmentContainerLogic } from '../../../containers/ai-assessment/AssessmentContainerLogic'

interface AssessmentContainerProps {
  selectedCompany: Company | null
  onCompanySelectorDisabled?: (disabled: boolean) => void
}

type ViewMode = 'dashboard' | 'wizard' | 'questionnaire' | 'report' | 'viewer'

export default function AssessmentContainer({ selectedCompany, onCompanySelectorDisabled }: AssessmentContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [viewerAssessmentId, setViewerAssessmentId] = useState<string | null>(null)
  // Form state for creating new assessment (must be outside conditional to follow React Hooks rules)
  const [assessmentName, setAssessmentName] = useState('')
  const [assessmentType, setAssessmentType] = useState<'EXPLORATORY' | 'MIGRATION'>('EXPLORATORY')

  // Use container logic for all business operations
  const {
    assessments,
    currentAssessment,
    isLoadingAssessments,
    isCreatingAssessment,
    isDeletingAssessment,
    isCompletingAssessment,
    assessmentsError,
    createAssessmentError,
    deleteAssessmentError,
    completeAssessmentError,
    setCurrentAssessment,
    setViewerAssessmentId: setViewerAssessmentIdLogic,
    loadAssessments,
    handleCreateAssessment: handleCreateAssessmentLogic,
    handleAssessmentCreated,
    handleSelectAssessment: handleSelectAssessmentLogic,
    handleViewAssessment: handleViewAssessmentLogic,
    handleDeleteAssessment,
    handleSaveResponses,
    handleCompleteAssessment
  } = useAssessmentContainerLogic(selectedCompany)

  // Track if assessment is in progress to disable company selector
  const isAssessmentInProgress = viewMode === 'questionnaire' && currentAssessment && currentAssessment.status !== 'COMPLETED'

  // Notify parent about company selector state
  useEffect(() => {
    if (onCompanySelectorDisabled) {
      onCompanySelectorDisabled(!!isAssessmentInProgress)
    }
  }, [isAssessmentInProgress, onCompanySelectorDisabled])

  // Load assessments when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadAssessments()
    }
  }, [selectedCompany, loadAssessments])

  // UI handlers that update view mode
  const handleCreateAssessment = () => {
    handleCreateAssessmentLogic()
    setViewMode('wizard')
  }

  const handleSelectAssessment = (assessment: any) => {
    handleSelectAssessmentLogic(assessment)
    
    // If assessment is completed, show report view, otherwise show questionnaire
    if (assessment.status === 'COMPLETED') {
      setViewMode('report')
    } else {
      setViewMode('questionnaire')
    }
  }

  const handleViewAssessment = (assessmentId: string) => {
    handleViewAssessmentLogic(assessmentId)
    setViewerAssessmentId(assessmentId)
    setViewerAssessmentIdLogic(assessmentId)
    setViewMode('viewer')
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setCurrentAssessment(null)
    setViewerAssessmentId(null)
  }

  const handleReportGenerated = (reportId: string) => {
    console.log('Report generated with ID:', reportId)
    // Could add notification or redirect to report view
  }

  const handleRetryLoadAssessments = () => {
    if (selectedCompany) {
      loadAssessments()
    }
  }

  if (!selectedCompany) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a company to view and manage assessments.
        </p>
      </div>
    )
  }

  // Reset form when switching to wizard mode
  useEffect(() => {
    if (viewMode === 'wizard') {
      setAssessmentName('')
      setAssessmentType('EXPLORATORY')
    }
  }, [viewMode])

  if (viewMode === 'wizard') {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!assessmentName.trim()) {
        return
      }
      await handleAssessmentCreated(assessmentName.trim(), assessmentType)
      setViewMode('questionnaire')
    }

    return (
      <ErrorBoundary
        onError={(error) => {
          console.error('Assessment creation error:', error)
        }}
      >
        <div className="w-full max-w-none p-4 sm:p-6">
          {createAssessmentError && (
            <ErrorMessage
              title="Failed to Create Assessment"
              message={createAssessmentError}
              onDismiss={() => {}}
              className="mb-6"
            />
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Assessment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="assessment-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Name
                </label>
                <input
                  id="assessment-name"
                  type="text"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  placeholder="Enter assessment name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isCreatingAssessment}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="EXPLORATORY"
                      checked={assessmentType === 'EXPLORATORY'}
                      onChange={(e) => setAssessmentType(e.target.value as 'EXPLORATORY' | 'MIGRATION')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isCreatingAssessment}
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">Exploratory Assessment</span>
                      <span className="block text-gray-500">For new AI development projects</span>
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assessment-type"
                      value="MIGRATION"
                      checked={assessmentType === 'MIGRATION'}
                      onChange={(e) => setAssessmentType(e.target.value as 'EXPLORATORY' | 'MIGRATION')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isCreatingAssessment}
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">Migration Assessment</span>
                      <span className="block text-gray-500">For existing AI systems migration</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isCreatingAssessment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assessmentName.trim() || isCreatingAssessment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingAssessment ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  if (viewMode === 'questionnaire' && currentAssessment) {
    return (
      <ErrorBoundary
        onError={(error) => {
          console.error('AssessmentWizard error:', error)
        }}
      >
        <div className="w-full max-w-none">
          <div className="mb-6 px-4 sm:px-6 pt-4">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              disabled={isCompletingAssessment}
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {completeAssessmentError && (
            <div className="px-4 sm:px-6">
              <ErrorMessage
                title="Failed to Complete Assessment"
                message={completeAssessmentError}
                onDismiss={() => {}}
                className="mb-6"
              />
            </div>
          )}

          {isCompletingAssessment && (
            <div className="mb-6 px-4 sm:px-6">
              <LoadingSpinner 
                size="sm" 
                text="Completing assessment..." 
                className="text-center py-4"
              />
            </div>
          )}
          
          {/* Use the DatabaseIntegratedAssessmentWizard for RAPID integration */}
          <DatabaseIntegratedAssessmentWizard
            assessment={currentAssessment as any}
            assessmentType={currentAssessment.type || 'EXPLORATORY'}
            responses={{}}
            onResponseChange={async (categoryId, responses) => {
              // This is handled by the wizard's internal state
            }}
            onComplete={async (responses) => {
              await handleCompleteAssessment(responses)
              setViewMode('dashboard')
            }}
            onError={(error) => {
              console.error('Assessment error:', error)
            }}
            enableAutoInit={true}
          />
        </div>
      </ErrorBoundary>
    )
  }

  if (viewMode === 'viewer' && viewerAssessmentId) {
    return (
      <AssessmentViewer
        assessmentId={viewerAssessmentId}
        onClose={handleBackToDashboard}
        onEdit={() => {
          // Find the assessment and switch to edit mode
          const assessment = assessments.find(a => a.id === viewerAssessmentId)
          if (assessment) {
            setCurrentAssessment(assessment)
            setViewMode('questionnaire')
            setViewerAssessmentId(null)
          }
        }}
      />
    )
  }

  if (viewMode === 'report' && currentAssessment && selectedCompany) {
    return (
      <ErrorBoundary
        onError={(error) => {
          console.error('ReportGenerator error:', error)
        }}
      >
        <div className="w-full max-w-none p-4 sm:p-6">
          <div className="mb-6">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{currentAssessment.name}</h2>
            <p className="text-sm text-gray-500">
              {currentAssessment.type === 'EXPLORATORY' ? 'Cloud Exploration Assessment' : 'Cloud Migration Assessment'} 
              • Completed {new Date(currentAssessment.updatedAt).toLocaleDateString()}
            </p>
          </div>
          
          <ReportGenerator
            assessment={currentAssessment}
            company={selectedCompany}
            onReportGenerated={handleReportGenerated}
          />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('AssessmentDashboard error:', error)
      }}
    >
      <div className="w-full max-w-none">
        {/* Error Messages */}
        {assessmentsError && (
          <ErrorMessage
            title="Failed to Load Assessments"
            message={assessmentsError}
            onRetry={handleRetryLoadAssessments}
            onDismiss={() => {}}
            className="mb-6"
          />
        )}

        {deleteAssessmentError && (
          <ErrorMessage
            title="Failed to Delete Assessment"
            message={deleteAssessmentError}
            onDismiss={() => {}}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {isLoadingAssessments && (
          <LoadingSpinner 
            size="lg" 
            text="Loading assessments..." 
            className="min-h-[200px]"
          />
        )}

        {/* Dashboard */}
        {!isLoadingAssessments && (
          <div className="p-4 sm:p-6">
            <AssessmentDashboard
              company={selectedCompany}
              assessments={assessments}
              onCreateAssessment={handleCreateAssessment}
              onSelectAssessment={handleSelectAssessment}
              onViewAssessment={handleViewAssessment}
              onDeleteAssessment={handleDeleteAssessment}
              isLoading={false}
              isDeletingAssessment={isDeletingAssessment}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
