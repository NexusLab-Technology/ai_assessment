/**
 * Validation Hook
 * Task 19.1: Implement RAPID structure validation
 * 
 * Features:
 * - Real-time validation for React components
 * - Validation state management
 * - Error handling and recovery
 * - Performance optimization with debouncing
 * - Requirements: 4.5, 14.7
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure 
} from '../types/rapid-questionnaire';
import { ValidationResult } from '../lib/validation/rapid-structure-validator';

export interface ValidationState {
  isValidating: boolean;
  lastValidation: ValidationResult | null;
  validationErrors: string[];
  validationWarnings: string[];
  isValid: boolean;
  completionPercentage: number;
  categoryCompletions: Record<string, number>;
}

export interface UseValidationOptions {
  enableRealTime?: boolean;
  debounceMs?: number;
  validateOnMount?: boolean;
  autoValidateOnChange?: boolean;
}

export interface UseValidationReturn {
  validationState: ValidationState;
  validateAssessment: (assessment: Assessment, questionnaire: RAPIDQuestionnaireStructure) => Promise<ValidationResult>;
  validateResponses: (responses: AssessmentResponses, questionnaire: RAPIDQuestionnaireStructure) => Promise<ValidationResult>;
  validateCategory: (categoryId: string, categoryResponses: Record<string, any>, questionnaire: RAPIDQuestionnaireStructure) => Promise<ValidationResult>;
  validateCompletion: (assessment: Assessment, questionnaire: RAPIDQuestionnaireStructure) => Promise<ValidationResult>;
  clearValidation: () => void;
  isValidationPending: boolean;
}

export const useValidation = (
  assessmentId?: string,
  options: UseValidationOptions = {}
): UseValidationReturn => {
  const {
    enableRealTime = true,
    debounceMs = 1000,
    validateOnMount = false,
    autoValidateOnChange = true
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    lastValidation: null,
    validationErrors: [],
    validationWarnings: [],
    isValid: true,
    completionPercentage: 0,
    categoryCompletions: {}
  });

  const [isValidationPending, setIsValidationPending] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update validation state from result
  const updateValidationState = useCallback((result: ValidationResult) => {
    setValidationState(prev => ({
      ...prev,
      isValidating: false,
      lastValidation: result,
      validationErrors: result.errors.map(e => e.message),
      validationWarnings: result.warnings.map(w => w.message),
      isValid: result.isValid,
      completionPercentage: result.completionStatus.overallCompletion,
      categoryCompletions: result.completionStatus.categoryCompletions
    }));
    setIsValidationPending(false);
  }, []);

  // Handle validation error
  const handleValidationError = useCallback((error: Error) => {
    setValidationState(prev => ({
      ...prev,
      isValidating: false,
      validationErrors: [`Validation failed: ${error.message}`],
      validationWarnings: [],
      isValid: false,
      completionPercentage: 0,
      categoryCompletions: {}
    }));
    setIsValidationPending(false);
  }, []);

  // Debounced validation function
  const debouncedValidate = useCallback((
    validationFn: () => Promise<ValidationResult>
  ) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set validation pending
    setIsValidationPending(true);

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setValidationState(prev => ({ ...prev, isValidating: true }));
        
        const result = await validationFn();
        updateValidationState(result);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleValidationError(error);
        }
      }
    }, debounceMs);
  }, [debounceMs, updateValidationState, handleValidationError]);

  // Validate assessment
  const validateAssessment = useCallback(async (
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> => {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for validation');
    }

    const response = await fetch(`/api/assessments/${assessmentId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validationType: 'responses',
        responses: assessment.responses,
        realTime: enableRealTime
      }),
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.validation;
  }, [assessmentId, enableRealTime]);

  // Validate responses
  const validateResponses = useCallback(async (
    responses: AssessmentResponses,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> => {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for validation');
    }

    const response = await fetch(`/api/assessments/${assessmentId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validationType: 'responses',
        responses,
        realTime: enableRealTime
      }),
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Response validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.validation;
  }, [assessmentId, enableRealTime]);

  // Validate category
  const validateCategory = useCallback(async (
    categoryId: string,
    categoryResponses: Record<string, any>,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> => {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for validation');
    }

    const response = await fetch(`/api/assessments/${assessmentId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validationType: 'category',
        categoryId,
        responses: categoryResponses,
        realTime: enableRealTime
      }),
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Category validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.validation;
  }, [assessmentId, enableRealTime]);

  // Validate completion
  const validateCompletion = useCallback(async (
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> => {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for validation');
    }

    const response = await fetch(`/api/assessments/${assessmentId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validationType: 'completion',
        responses: assessment.responses
      }),
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Completion validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.validation;
  }, [assessmentId]);

  // Clear validation state
  const clearValidation = useCallback(() => {
    // Cancel pending validation
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setValidationState({
      isValidating: false,
      lastValidation: null,
      validationErrors: [],
      validationWarnings: [],
      isValid: true,
      completionPercentage: 0,
      categoryCompletions: {}
    });
    setIsValidationPending(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    validationState,
    validateAssessment: enableRealTime && autoValidateOnChange ? 
      (assessment: Assessment, questionnaire: RAPIDQuestionnaireStructure) => {
        return new Promise((resolve, reject) => {
          debouncedValidate(async () => {
            const result = await validateAssessment(assessment, questionnaire);
            resolve(result);
            return result;
          });
        });
      } : validateAssessment,
    validateResponses: enableRealTime && autoValidateOnChange ? 
      (responses: AssessmentResponses, questionnaire: RAPIDQuestionnaireStructure) => {
        return new Promise((resolve, reject) => {
          debouncedValidate(async () => {
            const result = await validateResponses(responses, questionnaire);
            resolve(result);
            return result;
          });
        });
      } : validateResponses,
    validateCategory: enableRealTime && autoValidateOnChange ? 
      (categoryId: string, categoryResponses: Record<string, any>, questionnaire: RAPIDQuestionnaireStructure) => {
        return new Promise((resolve, reject) => {
          debouncedValidate(async () => {
            const result = await validateCategory(categoryId, categoryResponses, questionnaire);
            resolve(result);
            return result;
          });
        });
      } : validateCategory,
    validateCompletion,
    clearValidation,
    isValidationPending
  };
};

// Utility hook for validation summary
export const useValidationSummary = (assessmentId?: string) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!assessmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessments/${assessmentId}/validate`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch validation summary: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data.validation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
};