'use client'

import React, { useState, useEffect } from 'react'
import { Assessment, Company, AssessmentResponses, QuestionSection } from '../../types/assessment'
import { assessmentApi } from '../../lib/api-client'
import { getErrorMessage, logError } from '../../utils/error-handling'
import AssessmentDashboard from './AssessmentDashboard'
import AssessmentWizard from './AssessmentWizard'
import QuestionnaireFlow from './QuestionnaireFlow'
import ReportGenerator from './ReportGenerator'
import ErrorBoundary from './ErrorBoundary'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import mockQuestionnaireData from '../../data/mock-questionnaire.json'

interface AssessmentContainerProps {
  selectedCompany: Company | null
  onCompanySelectorDisabled?: (disabled: boolean) => void
}

type ViewMode = 'dashboard' | 'wizard' | 'questionnaire' | 'report'

export default function AssessmentContainer({ selectedCompany, onCompanySelectorDisabled }: AssessmentContainerProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  
  // Loading states
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false)
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false)
  const [isDeletingAssessment, setIsDeletingAssessment] = useState<string | null>(null)
  const [isCompletingAssessment, setIsCompletingAssessment] = useState(false)
  
  // Error states
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null)
  const [createAssessmentError, setCreateAssessmentError] = useState<string | null>(null)
  const [deleteAssessmentError, setDeleteAssessmentError] = useState<string | null>(null)
  const [completeAssessmentError, setCompleteAssessmentError] = useState<string | null>(null)

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
    } else {
      setAssessments([])
      setAssessmentsError(null)
    }
  }, [selectedCompany])

  const loadAssessments = async () => {
    if (!selectedCompany) return

    try {
      setIsLoadingAssessments(true)
      setAssessmentsError(null)
      
      const data = await assessmentApi.getAll(selectedCompany.id)
      setAssessments(data)
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setAssessmentsError(errorMessage)
      logError(error, 'loadAssessments')
    } finally {
      setIsLoadingAssessments(false)
    }
  }

  const handleCreateAssessment = () => {
    setViewMode('wizard')
    setCreateAssessmentError(null)
  }

  const handleAssessmentCreated = async (name: string, type: 'EXPLORATORY' | 'MIGRATION') => {
    if (!selectedCompany) return

    try {
      setIsCreatingAssessment(true)
      setCreateAssessmentError(null)
      
      const newAssessment = await assessmentApi.create({
        name,
        companyId: selectedCompany.id,
        type
      })
      
      setCurrentAssessment(newAssessment)
      setViewMode('questionnaire')
      await loadAssessments() // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setCreateAssessmentError(errorMessage)
      logError(error, 'handleAssessmentCreated')
    } finally {
      setIsCreatingAssessment(false)
    }
  }

  const handleSelectAssessment = (assessment: Assessment) => {
    setCurrentAssessment(assessment)
    
    // If assessment is completed, show report view, otherwise show questionnaire
    if (assessment.status === 'COMPLETED') {
      setViewMode('report')
    } else {
      setViewMode('questionnaire')
    }
    
    setCompleteAssessmentError(null)
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      setIsDeletingAssessment(assessmentId)
      setDeleteAssessmentError(null)
      
      await assessmentApi.delete(assessmentId)
      await loadAssessments() // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setDeleteAssessmentError(errorMessage)
      logError(error, 'handleDeleteAssessment')
    } finally {
      setIsDeletingAssessment(null)
    }
  }

  const handleSaveResponses = async (responses: AssessmentResponses, currentStep: number) => {
    if (!currentAssessment) return

    try {
      // Get the appropriate questionnaire sections based on assessment type
      const sections = currentAssessment.type === 'EXPLORATORY' 
        ? mockQuestionnaireData.exploratory as QuestionSection[]
        : mockQuestionnaireData.migration as QuestionSection[]
      
      // Find the current section based on step
      const currentSection = sections.find(s => s.stepNumber === currentStep)
      if (!currentSection) return

      await assessmentApi.saveResponses(
        currentAssessment.id,
        currentSection.id,
        responses[currentSection.id] || {},
        currentStep
      )
    } catch (error) {
      logError(error, 'handleSaveResponses')
      throw error // Re-throw to let the component handle the error
    }
  }

  const handleCompleteAssessment = async (responses: AssessmentResponses) => {
    if (!currentAssessment) return

    try {
      setIsCompletingAssessment(true)
      setCompleteAssessmentError(null)
      
      // Update assessment status to completed
      await assessmentApi.update(currentAssessment.id, {
        status: 'COMPLETED',
        responses
      })

      // Return to dashboard
      setViewMode('dashboard')
      setCurrentAssessment(null)
      await loadAssessments() // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setCompleteAssessmentError(errorMessage)
      logError(error, 'handleCompleteAssessment')
    } finally {
      setIsCompletingAssessment(false)
    }
  }

  const handleReportGenerated = (reportId: string) => {
    console.log('Report generated with ID:', reportId)
    // Could add notification or redirect to report view
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setCurrentAssessment(null)
    setCreateAssessmentError(null)
    setCompleteAssessmentError(null)
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
          logError(error, 'AssessmentWizard')
          setCreateAssessmentError('An unexpected error occurred while creating the assessment.')
        }}
      >
        <div className="w-full max-w-none p-4 sm:p-6">
          {createAssessmentError && (
            <ErrorMessage
              title="Failed to Create Assessment"
              message={createAssessmentError}
              onDismiss={() => setCreateAssessmentError(null)}
              className="mb-6"
            />
          )}
          
          <AssessmentWizard
            onAssessmentCreate={handleAssessmentCreated}
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
          logError(error, 'QuestionnaireFlow')
          setCompleteAssessmentError('An unexpected error occurred during the assessment.')
        }}
      >
        <div className="w-full max-w-none p-4 sm:p-6">
          <div className="mb-6">
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
            <ErrorMessage
              title="Failed to Complete Assessment"
              message={completeAssessmentError}
              onDismiss={() => setCompleteAssessmentError(null)}
              className="mb-6"
            />
          )}

          {isCompletingAssessment && (
            <div className="mb-6">
              <LoadingSpinner 
                size="sm" 
                text="Completing assessment..." 
                className="text-center py-4"
              />
            </div>
          )}
          
          <QuestionnaireFlow
            assessment={currentAssessment}
            sections={currentAssessment.type === 'EXPLORATORY' 
              ? mockQuestionnaireData.exploratory as QuestionSection[]
              : mockQuestionnaireData.migration as QuestionSection[]}
            onComplete={handleCompleteAssessment}
            onSave={handleSaveResponses}
          />
        </div>
      </ErrorBoundary>
    )
  }

  if (viewMode === 'report' && currentAssessment && selectedCompany) {
    return (
      <ErrorBoundary
        onError={(error) => {
          logError(error, 'ReportGenerator')
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
        logError(error, 'AssessmentDashboard')
        setAssessmentsError('An unexpected error occurred while loading the dashboard.')
      }}
    >
      <div className="w-full max-w-none">
        {/* Error Messages */}
        {assessmentsError && (
          <ErrorMessage
            title="Failed to Load Assessments"
            message={assessmentsError}
            onRetry={handleRetryLoadAssessments}
            onDismiss={() => setAssessmentsError(null)}
            className="mb-6"
          />
        )}

        {deleteAssessmentError && (
          <ErrorMessage
            title="Failed to Delete Assessment"
            message={deleteAssessmentError}
            onDismiss={() => setDeleteAssessmentError(null)}
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