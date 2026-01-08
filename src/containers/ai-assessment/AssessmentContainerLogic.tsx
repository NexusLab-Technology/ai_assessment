/**
 * Assessment Container - Business Logic
 * Extracted from AssessmentContainer.tsx for better code organization (Rule 2 compliance)
 * 
 * Handles:
 * - Assessment CRUD operations
 * - API calls
 * - Business logic (NO UI rendering)
 */

import { useState, useCallback } from 'react';
import { Assessment, Company, AssessmentResponses, QuestionSection } from '../../types/assessment';
import { assessmentApi } from '../../lib/api-client';
import { getErrorMessage, logError } from '../../utils/error-handling';
import mockQuestionnaireData from '../../data/mock-questionnaire.json';

export interface UseAssessmentContainerLogicReturn {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  isLoadingAssessments: boolean;
  isCreatingAssessment: boolean;
  isDeletingAssessment: string | null;
  isCompletingAssessment: boolean;
  assessmentsError: string | null;
  createAssessmentError: string | null;
  deleteAssessmentError: string | null;
  completeAssessmentError: string | null;
  setCurrentAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
  setViewerAssessmentId: React.Dispatch<React.SetStateAction<string | null>>;
  loadAssessments: () => Promise<void>;
  handleCreateAssessment: () => void;
  handleAssessmentCreated: (name: string, type: 'EXPLORATORY' | 'MIGRATION') => Promise<void>;
  handleSelectAssessment: (assessment: Assessment) => void;
  handleViewAssessment: (assessmentId: string) => void;
  handleDeleteAssessment: (assessmentId: string) => Promise<void>;
  handleSaveResponses: (responses: AssessmentResponses, currentStep: number) => Promise<void>;
  handleCompleteAssessment: (responses: AssessmentResponses) => Promise<void>;
  handleRetryLoadAssessments: () => void;
}

export function useAssessmentContainerLogic(
  selectedCompany: Company | null
): UseAssessmentContainerLogicReturn {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [viewerAssessmentId, setViewerAssessmentId] = useState<string | null>(null);
  
  // Loading states
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState<string | null>(null);
  const [isCompletingAssessment, setIsCompletingAssessment] = useState(false);
  
  // Error states
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  const [createAssessmentError, setCreateAssessmentError] = useState<string | null>(null);
  const [deleteAssessmentError, setDeleteAssessmentError] = useState<string | null>(null);
  const [completeAssessmentError, setCompleteAssessmentError] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setIsLoadingAssessments(true);
      setAssessmentsError(null);
      
      const data = await assessmentApi.getAll(selectedCompany.id);
      setAssessments(data);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setAssessmentsError(errorMessage);
      logError(error, 'loadAssessments');
    } finally {
      setIsLoadingAssessments(false);
    }
  }, [selectedCompany]);

  const handleCreateAssessment = useCallback(() => {
    setCreateAssessmentError(null);
  }, []);

  const handleAssessmentCreated = useCallback(async (name: string, type: 'EXPLORATORY' | 'MIGRATION') => {
    if (!selectedCompany) return;

    try {
      setIsCreatingAssessment(true);
      setCreateAssessmentError(null);
      
      // Clear any existing localStorage data for assessments
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('assessment_') && key.endsWith('_responses')
      );
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear localStorage key:', key, error);
        }
      });
      
      const newAssessment = await assessmentApi.create({
        name,
        companyId: selectedCompany.id,
        type
      });
      
      setCurrentAssessment(newAssessment);
      await loadAssessments(); // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setCreateAssessmentError(errorMessage);
      logError(error, 'handleAssessmentCreated');
    } finally {
      setIsCreatingAssessment(false);
    }
  }, [selectedCompany, loadAssessments]);

  const handleSelectAssessment = useCallback((assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setCompleteAssessmentError(null);
  }, []);

  const handleViewAssessment = useCallback((assessmentId: string) => {
    setViewerAssessmentId(assessmentId);
  }, []);

  const handleDeleteAssessment = useCallback(async (assessmentId: string) => {
    try {
      setIsDeletingAssessment(assessmentId);
      setDeleteAssessmentError(null);
      
      await assessmentApi.delete(assessmentId);
      await loadAssessments(); // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setDeleteAssessmentError(errorMessage);
      logError(error, 'handleDeleteAssessment');
    } finally {
      setIsDeletingAssessment(null);
    }
  }, [loadAssessments]);

  const handleSaveResponses = useCallback(async (responses: AssessmentResponses, currentStep: number) => {
    if (!currentAssessment) return;

    try {
      // Get the appropriate questionnaire sections based on assessment type
      const sections = currentAssessment.type === 'EXPLORATORY' 
        ? mockQuestionnaireData.exploratory as QuestionSection[]
        : mockQuestionnaireData.migration as QuestionSection[];
      
      // Find the current section based on step
      const currentSection = sections.find(s => s.stepNumber === currentStep);
      if (!currentSection) return;

      await assessmentApi.saveResponses(
        currentAssessment.id,
        currentSection.id,
        responses[currentSection.id] || {},
        currentStep
      );
    } catch (error) {
      logError(error, 'handleSaveResponses');
      throw error; // Re-throw to let the component handle the error
    }
  }, [currentAssessment]);

  const handleCompleteAssessment = useCallback(async (responses: AssessmentResponses) => {
    if (!currentAssessment) return;

    try {
      setIsCompletingAssessment(true);
      setCompleteAssessmentError(null);
      
      // Update assessment status to completed
      await assessmentApi.update(currentAssessment.id, {
        status: 'COMPLETED',
        responses
      });

      setCurrentAssessment(null);
      await loadAssessments(); // Refresh the list
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setCompleteAssessmentError(errorMessage);
      logError(error, 'handleCompleteAssessment');
    } finally {
      setIsCompletingAssessment(false);
    }
  }, [currentAssessment, loadAssessments]);

  const handleRetryLoadAssessments = useCallback(() => {
    if (selectedCompany) {
      loadAssessments();
    }
  }, [selectedCompany, loadAssessments]);

  return {
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
    handleCreateAssessment,
    handleAssessmentCreated,
    handleSelectAssessment,
    handleViewAssessment,
    handleDeleteAssessment,
    handleSaveResponses,
    handleCompleteAssessment,
    handleRetryLoadAssessments
  };
}
