/**
 * Assessment Container Component
 * Refactored to use container logic for better code organization (Rule 2 compliance)
 * 
 * This component handles UI rendering only. Business logic is in containers/ai-assessment/AssessmentContainerLogic.tsx
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Company } from '../../types/assessment'
import AssessmentDashboard from './AssessmentDashboard'
import AssessmentViewer from './AssessmentViewer'
import AssessmentWizard from './AssessmentWizard'
import { DatabaseIntegratedAssessmentWizard } from './DatabaseIntegratedAssessmentWizard'
import ReportGenerator from './ReportGenerator'
import { ErrorBoundary } from './ErrorBoundary'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { useAssessmentContainerLogic } from '../../containers/ai-assessment/AssessmentContainerLogic'

interface AssessmentContainerProps {
  selectedCompany: Company | null
  onCompanySelectorDisabled?: (disabled: boolean) => void
}

type ViewMode = 'dashboard' | 'wizard' | 'questionnaire' | 'report' | 'viewer'

export default function AssessmentContainer({ selectedCompany, onCompanySelectorDisabled }: AssessmentContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')

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
    setViewerAssessmentId,
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

  if (viewMode === 'wizard') {
    return (
      <ErrorBoundary
        onError={(error) => {
          console.error('AssessmentWizard error:', error)
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
          
          <AssessmentWizard
            onAssessmentCreate={async (name, type) => {
              await handleAssessmentCreated(name, type)
              setViewMode('questionnaire')
            }}
            onCancel={handleBackToDashboard}
            isLoading={isCreatingAssessment}
          />
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
            assessment={currentAssessment}
            assessmentType={currentAssessment.type || 'EXPLORATORY'}
            responses={currentAssessment.responses || {}}
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
