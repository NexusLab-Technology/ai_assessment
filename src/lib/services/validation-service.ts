/**
 * Validation Service
 * Task 19.1: Implement RAPID structure validation
 * 
 * Features:
 * - Integration with assessment system
 * - Real-time validation during assessment
 * - Validation caching for performance
 * - Error reporting and recovery
 * - Requirements: 4.5, 14.7
 */

import { 
  RAPIDQuestionnaireStructure, 
  AssessmentResponses,
  Assessment,
  CategoryCompletionStatus
} from '../../types/rapid-questionnaire';
import { 
  RAPIDStructureValidator, 
  ValidationResult, 
  ValidationError 
} from '../validation/rapid-structure-validator';

export interface ValidationServiceOptions {
  enableCaching?: boolean;
  cacheTimeout?: number; // in milliseconds
  enableRealTimeValidation?: boolean;
  validationThrottleMs?: number;
}

export interface ValidationCache {
  [key: string]: {
    result: ValidationResult;
    timestamp: number;
  };
}

export class ValidationService {
  private validator: RAPIDStructureValidator;
  private cache: ValidationCache = {};
  private options: Required<ValidationServiceOptions>;
  private validationTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: ValidationServiceOptions = {}) {
    this.validator = new RAPIDStructureValidator();
    this.options = {
      enableCaching: options.enableCaching ?? true,
      cacheTimeout: options.cacheTimeout ?? 5 * 60 * 1000, // 5 minutes
      enableRealTimeValidation: options.enableRealTimeValidation ?? true,
      validationThrottleMs: options.validationThrottleMs ?? 1000 // 1 second
    };
  }

  /**
   * Validate questionnaire structure with caching
   */
  async validateQuestionnaire(questionnaire: RAPIDQuestionnaireStructure): Promise<ValidationResult> {
    const cacheKey = `questionnaire_${questionnaire.version}_${questionnaire.type}`;
    
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Perform validation
      const result = this.validator.validateQuestionnaireStructure(questionnaire);
      
      // Cache result
      if (this.options.enableCaching) {
        this.setCachedResult(cacheKey, result);
      }

      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'VALIDATION_SERVICE_ERROR',
          message: `Validation service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };

      return errorResult;
    }
  }

  /**
   * Validate assessment responses with real-time support
   */
  async validateAssessmentResponses(
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure,
    realTime: boolean = false
  ): Promise<ValidationResult> {
    const cacheKey = `responses_${assessment.id}_${this.getResponsesHash(assessment.responses)}`;
    
    // For real-time validation, use throttling
    if (realTime && this.options.enableRealTimeValidation) {
      return this.validateWithThrottling(assessment, questionnaire, cacheKey);
    }

    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Set questionnaire for validator
      this.validator.setQuestionnaire(questionnaire);
      
      // Perform validation
      const result = this.validator.validateResponses(assessment.responses);
      
      // Cache result
      if (this.options.enableCaching) {
        this.setCachedResult(cacheKey, result);
      }

      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'RESPONSE_VALIDATION_ERROR',
          message: `Response validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };

      return errorResult;
    }
  }

  /**
   * Validate assessment completion
   */
  async validateAssessmentCompletion(
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> {
    const cacheKey = `completion_${assessment.id}_${this.getResponsesHash(assessment.responses)}`;
    
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Set questionnaire for validator
      this.validator.setQuestionnaire(questionnaire);
      
      // Perform completion validation
      const result = this.validator.validateCompletion(assessment.responses);
      
      // Cache result
      if (this.options.enableCaching) {
        this.setCachedResult(cacheKey, result);
      }

      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'COMPLETION_VALIDATION_ERROR',
          message: `Completion validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };

      return errorResult;
    }
  }

  /**
   * Validate category responses
   */
  async validateCategoryResponses(
    categoryId: string,
    categoryResponses: Record<string, any>,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<ValidationResult> {
    const responses: AssessmentResponses = {
      [categoryId]: categoryResponses
    };

    try {
      // Set questionnaire for validator
      this.validator.setQuestionnaire(questionnaire);
      
      // Perform validation
      const result = this.validator.validateResponses(responses);
      
      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'CATEGORY_VALIDATION_ERROR',
          message: `Category validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };

      return errorResult;
    }
  }

  /**
   * Get validation summary for assessment
   */
  async getValidationSummary(
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<{
    questionnaire: ValidationResult;
    responses: ValidationResult;
    completion: ValidationResult;
    overall: {
      isValid: boolean;
      errorCount: number;
      warningCount: number;
      completionPercentage: number;
    };
  }> {
    try {
      // Validate all aspects
      const [questionnaireResult, responsesResult, completionResult] = await Promise.all([
        this.validateQuestionnaire(questionnaire),
        this.validateAssessmentResponses(assessment, questionnaire),
        this.validateAssessmentCompletion(assessment, questionnaire)
      ]);

      // Calculate overall summary
      const totalErrors = questionnaireResult.errors.length + 
                         responsesResult.errors.length + 
                         completionResult.errors.length;
      
      const totalWarnings = questionnaireResult.warnings.length + 
                           responsesResult.warnings.length + 
                           completionResult.warnings.length;

      const overall = {
        isValid: questionnaireResult.isValid && responsesResult.isValid && completionResult.isValid,
        errorCount: totalErrors,
        warningCount: totalWarnings,
        completionPercentage: completionResult.completionStatus.overallCompletion
      };

      return {
        questionnaire: questionnaireResult,
        responses: responsesResult,
        completion: completionResult,
        overall
      };
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'SUMMARY_VALIDATION_ERROR',
          message: `Summary validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };

      return {
        questionnaire: errorResult,
        responses: errorResult,
        completion: errorResult,
        overall: {
          isValid: false,
          errorCount: 1,
          warningCount: 0,
          completionPercentage: 0
        }
      };
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Clear cache for specific assessment
   */
  clearAssessmentCache(assessmentId: string): void {
    Object.keys(this.cache).forEach(key => {
      if (key.includes(assessmentId)) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    cacheSize: number;
    cacheHitRate: number;
    activeThrottles: number;
  } {
    return {
      cacheSize: Object.keys(this.cache).length,
      cacheHitRate: 0, // Would need to track hits/misses for accurate calculation
      activeThrottles: this.validationTimeouts.size
    };
  }

  /**
   * Validate with throttling for real-time validation
   */
  private validateWithThrottling(
    assessment: Assessment,
    questionnaire: RAPIDQuestionnaireStructure,
    cacheKey: string
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      // Clear existing timeout for this assessment
      const existingTimeout = this.validationTimeouts.get(assessment.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          // Check cache first
          if (this.options.enableCaching) {
            const cached = this.getCachedResult(cacheKey);
            if (cached) {
              resolve(cached);
              return;
            }
          }

          // Set questionnaire for validator
          this.validator.setQuestionnaire(questionnaire);
          
          // Perform validation
          const result = this.validator.validateResponses(assessment.responses);
          
          // Cache result
          if (this.options.enableCaching) {
            this.setCachedResult(cacheKey, result);
          }

          resolve(result);
        } catch (error) {
          const errorResult: ValidationResult = {
            isValid: false,
            errors: [{
              code: 'THROTTLED_VALIDATION_ERROR',
              message: `Throttled validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              severity: 'error'
            }],
            warnings: [],
            completionStatus: {
              overallCompletion: 0,
              categoryCompletions: {},
              requiredQuestionsAnswered: 0,
              totalRequiredQuestions: 0
            }
          };

          resolve(errorResult);
        } finally {
          // Remove timeout from map
          this.validationTimeouts.delete(assessment.id);
        }
      }, this.options.validationThrottleMs);

      // Store timeout
      this.validationTimeouts.set(assessment.id, timeout);
    });
  }

  /**
   * Get cached validation result
   */
  private getCachedResult(cacheKey: string): ValidationResult | null {
    const cached = this.cache[cacheKey];
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > this.options.cacheTimeout) {
      delete this.cache[cacheKey];
      return null;
    }

    return cached.result;
  }

  /**
   * Set cached validation result
   */
  private setCachedResult(cacheKey: string, result: ValidationResult): void {
    this.cache[cacheKey] = {
      result,
      timestamp: Date.now()
    };

    // Clean up old cache entries periodically
    this.cleanupCache();
  }

  /**
   * Generate hash for responses to use in cache key
   */
  private getResponsesHash(responses: AssessmentResponses): string {
    try {
      const responseString = JSON.stringify(responses);
      // Simple hash function - in production, consider using a proper hash library
      let hash = 0;
      for (let i = 0; i < responseString.length; i++) {
        const char = responseString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    } catch {
      return 'invalid_hash';
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.options.cacheTimeout) {
        delete this.cache[key];
      }
    });
  }
}

// Export singleton instance
export const validationService = new ValidationService({
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableRealTimeValidation: true,
  validationThrottleMs: 1000 // 1 second
});

// Export utility functions
export const validateAssessment = async (
  assessment: Assessment,
  questionnaire: RAPIDQuestionnaireStructure
): Promise<ValidationResult> => {
  return validationService.validateAssessmentResponses(assessment, questionnaire);
};

export const validateAssessmentCompletion = async (
  assessment: Assessment,
  questionnaire: RAPIDQuestionnaireStructure
): Promise<ValidationResult> => {
  return validationService.validateAssessmentCompletion(assessment, questionnaire);
};

export const getAssessmentValidationSummary = async (
  assessment: Assessment,
  questionnaire: RAPIDQuestionnaireStructure
) => {
  return validationService.getValidationSummary(assessment, questionnaire);
};