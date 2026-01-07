/**
 * RAPIDQuestionnaireLoader Component
 * Loads and manages RAPID questionnaire structure
 */

import React, { useEffect, useState } from 'react';
import { 
  RAPIDQuestionnaireStructure, 
  AssessmentType 
} from '@/types/rapid-questionnaire';
import { getRAPIDQuestionnaire } from '@/data/rapid-questionnaire-complete';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface RAPIDQuestionnaireLoaderProps {
  assessmentType: AssessmentType;
  onQuestionsLoaded: (questions: RAPIDQuestionnaireStructure) => void;
  onError?: (error: string) => void;
}

export const RAPIDQuestionnaireLoader: React.FC<RAPIDQuestionnaireLoaderProps> = ({
  assessmentType,
  onQuestionsLoaded,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<RAPIDQuestionnaireStructure | null>(null);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay for realistic loading experience
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load questionnaire based on assessment type
        const loadedQuestionnaire = getRAPIDQuestionnaire(assessmentType);
        
        if (!loadedQuestionnaire) {
          throw new Error(`Failed to load questionnaire for type: ${assessmentType}`);
        }
        
        setQuestionnaire(loadedQuestionnaire);
        onQuestionsLoaded(loadedQuestionnaire);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load questionnaire';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaire();
  }, [assessmentType, onQuestionsLoaded, onError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading RAPID questionnaire...</p>
        <p className="text-sm text-gray-500">
          Preparing {assessmentType.toLowerCase()} assessment questions
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage 
          message={error}
          title="Failed to Load Questionnaire"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="p-8">
        <ErrorMessage 
          message="Questionnaire data is not available"
          title="No Questionnaire Found"
        />
      </div>
    );
  }

  // Render questionnaire summary
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900">
            RAPID Questionnaire Loaded
          </h3>
          <p className="text-blue-700 mt-1">
            {assessmentType === 'EXPLORATORY' ? 'New GenAI Development' : 'GenAI Migration to AWS'}
          </p>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Version:</span>
              <span className="ml-2 text-blue-600">{questionnaire.version}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Total Questions:</span>
              <span className="ml-2 text-blue-600">{questionnaire.totalQuestions}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Categories:</span>
              <span className="ml-2 text-blue-600">{questionnaire.categories.length}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Last Updated:</span>
              <span className="ml-2 text-blue-600">
                {questionnaire.lastUpdated 
                  ? new Date(questionnaire.lastUpdated).toLocaleDateString()
                  : 'Unknown'
                }
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Categories:</h4>
            <div className="space-y-1">
              {questionnaire.categories.map((category) => (
                <div key={category.id} className="flex justify-between text-sm">
                  <span className="text-blue-700">{category.title}</span>
                  <span className="text-blue-600">
                    {category.totalQuestions} questions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAPIDQuestionnaireLoader;