import { useState, useEffect } from 'react'
import { Assessment, AssessmentResponses, QuestionSection } from '../types/assessment'
import { assessmentApi } from '../lib/api-client'

interface UseAssessmentViewerResult {
  assessment: Assessment | null
  responses: AssessmentResponses | null
  sections: QuestionSection[] | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAssessmentViewer(assessmentId: string): UseAssessmentViewerResult {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [responses, setResponses] = useState<AssessmentResponses | null>(null)
  const [sections, setSections] = useState<QuestionSection[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch assessment details and responses in parallel
      const [assessmentData, responsesData] = await Promise.all([
        assessmentApi.getById(assessmentId),
        assessmentApi.getResponses(assessmentId)
      ])

      setAssessment(assessmentData)
      setResponses(responsesData.responses)

      // Fetch questionnaire sections based on assessment type
      if (assessmentData.type) {
        const questionnaireData = await assessmentApi.getQuestionnaireSections(
          assessmentData.type.toLowerCase() as 'exploratory' | 'migration'
        )
        setSections(questionnaireData.sections)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assessment data'
      setError(errorMessage)
      console.error('Error fetching assessment data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (assessmentId) {
      fetchData()
    }
  }, [assessmentId])

  return {
    assessment,
    responses,
    sections,
    isLoading,
    error,
    refetch: fetchData
  }
}