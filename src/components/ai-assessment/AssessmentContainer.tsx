'use client'

import React, { useState, useEffect } from 'react'
import { Assessment, Company, AssessmentResponses, QuestionSection } from '../../types/assessment'
import { mockAssessmentApi, mockCompanyApi } from '../../lib/mock-api-client'
import AssessmentDashboard from './AssessmentDashboard'
import AssessmentWizard from './AssessmentWizard'
import QuestionnaireFlow from './QuestionnaireFlow'
import mockQuestionnaireData from '../../data/mock-questionnaire.json'

interface AssessmentContainerProps {
  selectedCompany: Company | null
  onCompanySelectorDisabled?: (disabled: boolean) => void
}

type ViewMode = 'dashboard' | 'wizard' | 'questionnaire'

export default function AssessmentContainer({ selectedCompany, onCompanySelectorDisabled }: AssessmentContainerProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    }
  }, [selectedCompany])

  const loadAssessments = async () => {
    if (!selectedCompany) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await mockAssessmentApi.getAll(selectedCompany.id)
      setAssessments(data)
    } catch (error) {
      console.error('Failed to load assessments:', error)
      setError('Failed to load assessments. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAssessment = () => {
    setViewMode('wizard')
  }

  const handleAssessmentCreated = async (name: string, type: 'EXPLORATORY' | 'MIGRATION') => {
    if (!selectedCompany) return

    try {
      setIsLoading(true)
      const newAssessment = await mockAssessmentApi.create({
        name,
        companyId: selectedCompany.id,
        type
      })
      
      setCurrentAssessment(newAssessment)
      setViewMode('questionnaire')
      await loadAssessments() // Refresh the list
    } catch (error) {
      console.error('Failed to create assessment:', error)
      setError('Failed to create assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAssessment = (assessment: Assessment) => {
    setCurrentAssessment(assessment)
    if (assessment.status === 'COMPLETED') {
      // For completed assessments, show results or redirect to report
      // For now, just show the questionnaire in read-only mode
      setViewMode('questionnaire')
    } else {
      setViewMode('questionnaire')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      setIsLoading(true)
      await mockAssessmentApi.delete(assessmentId)
      await loadAssessments() // Refresh the list
    } catch (error) {
      console.error('Failed to delete assessment:', error)
      setError('Failed to delete assessment. Please try again.')
    } finally {
      setIsLoading(false)
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

      await mockAssessmentApi.saveResponses(
        currentAssessment.id,
        currentSection.id,
        responses[currentSection.id] || {},
        currentStep
      )
    } catch (error) {
      console.error('Failed to save responses:', error)
      throw error // Re-throw to let the component handle the error
    }
  }

  const handleCompleteAssessment = async (responses: AssessmentResponses) => {
    if (!currentAssessment) return

    try {
      setIsLoading(true)
      
      // Update assessment status to completed
      await mockAssessmentApi.update(currentAssessment.id, {
        status: 'COMPLETED',
        responses
      })

      // Return to dashboard
      setViewMode('dashboard')
      setCurrentAssessment(null)
      await loadAssessments() // Refresh the list
    } catch (error) {
      console.error('Failed to complete assessment:', error)
      setError('Failed to complete assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setCurrentAssessment(null)
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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadAssessments()
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (viewMode === 'wizard') {
    return (
      <AssessmentWizard
        onAssessmentCreate={handleAssessmentCreated}
        onCancel={handleBackToDashboard}
        isLoading={isLoading}
      />
    )
  }

  if (viewMode === 'questionnaire' && currentAssessment) {
    return (
      <div>
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
        
        <QuestionnaireFlow
          assessment={currentAssessment}
          sections={currentAssessment.type === 'EXPLORATORY' 
            ? mockQuestionnaireData.exploratory as QuestionSection[]
            : mockQuestionnaireData.migration as QuestionSection[]}
          onComplete={handleCompleteAssessment}
          onSave={handleSaveResponses}
        />
      </div>
    )
  }

  return (
    <AssessmentDashboard
      company={selectedCompany}
      assessments={assessments}
      onCreateAssessment={handleCreateAssessment}
      onSelectAssessment={handleSelectAssessment}
      onDeleteAssessment={handleDeleteAssessment}
      isLoading={isLoading}
    />
  )
}