/**
 * RAPID Structure Validator
 * Task 19.1: Implement RAPID structure validation
 * 
 * Features:
 * - Validate RAPID questionnaire data integrity
 * - Add validation for category-based responses
 * - Implement completion validation based on RAPID requirements
 * - Add error handling for invalid RAPID data
 * - Requirements: 4.5, 14.7
 */

import { 
  RAPIDQuestionnaireStructure, 
  RAPIDCategory, 
  RAPIDQuestion, 
  AssessmentResponses,
  AssessmentType,
  CategoryCompletionStatus
} from '../../types/rapid-questionnaire';

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  category?: string;
  question?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completionStatus: {
    overallCompletion: number;
    categoryCompletions: Record<string, number>;
    requiredQuestionsAnswered: number;
    totalRequiredQuestions: number;
  };
}

export class RAPIDStructureValidator {
  private questionnaire: RAPIDQuestionnaireStructure | null = null;

  constructor(questionnaire?: RAPIDQuestionnaireStructure) {
    if (questionnaire) {
      this.questionnaire = questionnaire;
    }
  }

  /**
   * Set the questionnaire structure for validation
   */
  setQuestionnaire(questionnaire: RAPIDQuestionnaireStructure): void {
    this.questionnaire = questionnaire;
  }

  /**
   * Validate RAPID questionnaire structure integrity
   */
  validateQuestionnaireStructure(questionnaire?: RAPIDQuestionnaireStructure): ValidationResult {
    const structure = questionnaire || this.questionnaire;
    
    if (!structure) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_QUESTIONNAIRE',
          message: 'No questionnaire structure provided for validation',
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
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate basic structure
    this.validateBasicStructure(structure, errors, warnings);

    // Validate categories
    this.validateCategories(structure.categories, errors, warnings);

    // Validate questions
    this.validateQuestions(structure.categories, errors, warnings);

    // Calculate completion status (for structure validation, all should be 0)
    const completionStatus = {
      overallCompletion: 0,
      categoryCompletions: {},
      requiredQuestionsAnswered: 0,
      totalRequiredQuestions: this.getTotalRequiredQuestions(structure.categories)
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionStatus
    };
  }

  /**
   * Validate category-based responses
   */
  validateResponses(
    responses: AssessmentResponses, 
    questionnaire?: RAPIDQuestionnaireStructure
  ): ValidationResult {
    const structure = questionnaire || this.questionnaire;
    
    if (!structure) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_QUESTIONNAIRE',
          message: 'No questionnaire structure provided for response validation',
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
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate responses against structure
    this.validateResponseStructure(responses, structure.categories, errors, warnings);

    // Validate required questions
    this.validateRequiredQuestions(responses, structure.categories, errors, warnings);

    // Validate response formats
    this.validateResponseFormats(responses, structure.categories, errors, warnings);

    // Calculate completion status
    const completionStatus = this.calculateCompletionStatus(responses, structure.categories);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionStatus
    };
  }

  /**
   * Validate completion based on RAPID requirements
   */
  validateCompletion(
    responses: AssessmentResponses,
    questionnaire?: RAPIDQuestionnaireStructure
  ): ValidationResult {
    const structure = questionnaire || this.questionnaire;
    
    if (!structure) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_QUESTIONNAIRE',
          message: 'No questionnaire structure provided for completion validation',
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
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate all required questions are answered
    this.validateAllRequiredQuestionsAnswered(responses, structure.categories, errors, warnings);

    // Validate category completion requirements
    this.validateCategoryCompletionRequirements(responses, structure.categories, errors, warnings);

    // Calculate completion status
    const completionStatus = this.calculateCompletionStatus(responses, structure.categories);

    // Check overall completion threshold
    if (completionStatus.overallCompletion < 100) {
      warnings.push({
        code: 'INCOMPLETE_ASSESSMENT',
        message: `Assessment is ${completionStatus.overallCompletion.toFixed(1)}% complete. All required questions must be answered for submission.`,
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0 && completionStatus.overallCompletion === 100,
      errors,
      warnings,
      completionStatus
    };
  }

  /**
   * Validate basic questionnaire structure
   */
  private validateBasicStructure(
    structure: RAPIDQuestionnaireStructure, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Check required fields
    if (!structure.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Questionnaire version is required',
        field: 'version',
        severity: 'error'
      });
    }

    if (!structure.type || !['EXPLORATORY', 'MIGRATION'].includes(structure.type)) {
      errors.push({
        code: 'INVALID_TYPE',
        message: 'Questionnaire type must be either EXPLORATORY or MIGRATION',
        field: 'type',
        severity: 'error'
      });
    }

    if (!structure.categories || !Array.isArray(structure.categories)) {
      errors.push({
        code: 'MISSING_CATEGORIES',
        message: 'Categories array is required',
        field: 'categories',
        severity: 'error'
      });
      return;
    }

    if (structure.categories.length === 0) {
      errors.push({
        code: 'EMPTY_CATEGORIES',
        message: 'At least one category is required',
        field: 'categories',
        severity: 'error'
      });
    }

    // Validate expected category count based on type
    const expectedCategoryCount = structure.type === 'EXPLORATORY' ? 5 : 6;
    if (structure.categories.length !== expectedCategoryCount) {
      warnings.push({
        code: 'UNEXPECTED_CATEGORY_COUNT',
        message: `Expected ${expectedCategoryCount} categories for ${structure.type} assessment, found ${structure.categories.length}`,
        field: 'categories',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate categories structure
   */
  private validateCategories(
    categories: RAPIDCategory[], 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    const categoryIds = new Set<string>();

    categories.forEach((category, index) => {
      const categoryContext = `categories[${index}]`;

      // Check required fields
      if (!category.id) {
        errors.push({
          code: 'MISSING_CATEGORY_ID',
          message: 'Category ID is required',
          field: `${categoryContext}.id`,
          category: category.id,
          severity: 'error'
        });
      } else {
        // Check for duplicate IDs
        if (categoryIds.has(category.id)) {
          errors.push({
            code: 'DUPLICATE_CATEGORY_ID',
            message: `Duplicate category ID: ${category.id}`,
            field: `${categoryContext}.id`,
            category: category.id,
            severity: 'error'
          });
        }
        categoryIds.add(category.id);
      }

      if (!category.title) {
        errors.push({
          code: 'MISSING_CATEGORY_TITLE',
          message: 'Category title is required',
          field: `${categoryContext}.title`,
          category: category.id,
          severity: 'error'
        });
      }

      if (!category.subcategories || !Array.isArray(category.subcategories)) {
        errors.push({
          code: 'MISSING_SUBCATEGORIES',
          message: 'Subcategories array is required',
          field: `${categoryContext}.subcategories`,
          category: category.id,
          severity: 'error'
        });
      } else if (category.subcategories.length === 0) {
        warnings.push({
          code: 'EMPTY_SUBCATEGORIES',
          message: 'Category has no subcategories',
          field: `${categoryContext}.subcategories`,
          category: category.id,
          severity: 'warning'
        });
      }

      // Validate totalQuestions matches actual count
      if (category.subcategories) {
        const actualQuestionCount = category.subcategories.reduce(
          (sum, sub) => sum + (sub.questions?.length || 0), 0
        );
        
        if (category.totalQuestions !== actualQuestionCount) {
          errors.push({
            code: 'QUESTION_COUNT_MISMATCH',
            message: `Category totalQuestions (${category.totalQuestions}) doesn't match actual count (${actualQuestionCount})`,
            field: `${categoryContext}.totalQuestions`,
            category: category.id,
            severity: 'error'
          });
        }
      }
    });
  }

  /**
   * Validate questions structure
   */
  private validateQuestions(
    categories: RAPIDCategory[], 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    const questionIds = new Set<string>();
    const questionNumbers = new Set<string>();

    categories.forEach(category => {
      category.subcategories?.forEach(subcategory => {
        subcategory.questions?.forEach((question, qIndex) => {
          const questionContext = `${category.id}.${subcategory.id}.questions[${qIndex}]`;

          // Check required fields
          if (!question.id) {
            errors.push({
              code: 'MISSING_QUESTION_ID',
              message: 'Question ID is required',
              field: `${questionContext}.id`,
              category: category.id,
              severity: 'error'
            });
          } else {
            // Check for duplicate IDs
            if (questionIds.has(question.id)) {
              errors.push({
                code: 'DUPLICATE_QUESTION_ID',
                message: `Duplicate question ID: ${question.id}`,
                field: `${questionContext}.id`,
                category: category.id,
                question: question.id,
                severity: 'error'
              });
            }
            questionIds.add(question.id);
          }

          if (!question.number) {
            errors.push({
              code: 'MISSING_QUESTION_NUMBER',
              message: 'Question number is required',
              field: `${questionContext}.number`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          } else {
            // Check for duplicate numbers
            if (questionNumbers.has(question.number)) {
              errors.push({
                code: 'DUPLICATE_QUESTION_NUMBER',
                message: `Duplicate question number: ${question.number}`,
                field: `${questionContext}.number`,
                category: category.id,
                question: question.id,
                severity: 'error'
              });
            }
            questionNumbers.add(question.number);
          }

          if (!question.text) {
            errors.push({
              code: 'MISSING_QUESTION_TEXT',
              message: 'Question text is required',
              field: `${questionContext}.text`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          }

          if (!question.type || !['text', 'textarea', 'select', 'radio', 'checkbox', 'number'].includes(question.type)) {
            errors.push({
              code: 'INVALID_QUESTION_TYPE',
              message: `Invalid question type: ${question.type}`,
              field: `${questionContext}.type`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          }

          // Validate options for select/radio/checkbox questions
          if (['select', 'radio', 'checkbox'].includes(question.type) && (!question.options || question.options.length === 0)) {
            errors.push({
              code: 'MISSING_OPTIONS',
              message: `Question type ${question.type} requires options`,
              field: `${questionContext}.options`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          }

          // Validate category and subcategory references
          if (question.category !== category.id) {
            errors.push({
              code: 'CATEGORY_REFERENCE_MISMATCH',
              message: `Question category reference (${question.category}) doesn't match parent category (${category.id})`,
              field: `${questionContext}.category`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          }

          if (question.subcategory !== subcategory.id) {
            errors.push({
              code: 'SUBCATEGORY_REFERENCE_MISMATCH',
              message: `Question subcategory reference (${question.subcategory}) doesn't match parent subcategory (${subcategory.id})`,
              field: `${questionContext}.subcategory`,
              category: category.id,
              question: question.id,
              severity: 'error'
            });
          }
        });
      });
    });
  }

  /**
   * Validate response structure against questionnaire
   */
  private validateResponseStructure(
    responses: AssessmentResponses,
    categories: RAPIDCategory[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Check for responses to non-existent categories
    Object.keys(responses).forEach(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        warnings.push({
          code: 'UNKNOWN_CATEGORY_RESPONSE',
          message: `Response found for unknown category: ${categoryId}`,
          category: categoryId,
          severity: 'warning'
        });
        return;
      }

      const categoryResponses = responses[categoryId];
      if (typeof categoryResponses !== 'object' || categoryResponses === null) {
        errors.push({
          code: 'INVALID_CATEGORY_RESPONSE_FORMAT',
          message: `Category responses must be an object, got ${typeof categoryResponses}`,
          category: categoryId,
          severity: 'error'
        });
        return;
      }

      // Check for responses to non-existent questions
      Object.keys(categoryResponses).forEach(questionId => {
        const questionExists = category.subcategories?.some(sub => 
          sub.questions?.some(q => q.id === questionId)
        );

        if (!questionExists) {
          warnings.push({
            code: 'UNKNOWN_QUESTION_RESPONSE',
            message: `Response found for unknown question: ${questionId}`,
            category: categoryId,
            question: questionId,
            severity: 'warning'
          });
        }
      });
    });
  }

  /**
   * Validate required questions are answered
   */
  private validateRequiredQuestions(
    responses: AssessmentResponses,
    categories: RAPIDCategory[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    categories.forEach(category => {
      const categoryResponses = responses[category.id] || {};

      category.subcategories?.forEach(subcategory => {
        subcategory.questions?.forEach(question => {
          if (question.required) {
            const response = categoryResponses[question.id];
            
            if (response === undefined || response === null || response === '') {
              warnings.push({
                code: 'MISSING_REQUIRED_RESPONSE',
                message: `Required question not answered: ${question.number} - ${question.text}`,
                category: category.id,
                question: question.id,
                severity: 'warning'
              });
            }
          }
        });
      });
    });
  }

  /**
   * Validate response formats
   */
  private validateResponseFormats(
    responses: AssessmentResponses,
    categories: RAPIDCategory[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    categories.forEach(category => {
      const categoryResponses = responses[category.id] || {};

      category.subcategories?.forEach(subcategory => {
        subcategory.questions?.forEach(question => {
          const response = categoryResponses[question.id];
          
          if (response !== undefined && response !== null && response !== '') {
            // Validate response format based on question type
            switch (question.type) {
              case 'number':
                if (isNaN(Number(response))) {
                  errors.push({
                    code: 'INVALID_NUMBER_FORMAT',
                    message: `Invalid number format for question ${question.number}`,
                    category: category.id,
                    question: question.id,
                    severity: 'error'
                  });
                }
                break;

              case 'select':
              case 'radio':
                if (question.options && !question.options.includes(String(response))) {
                  errors.push({
                    code: 'INVALID_OPTION_VALUE',
                    message: `Invalid option value "${response}" for question ${question.number}`,
                    category: category.id,
                    question: question.id,
                    severity: 'error'
                  });
                }
                break;

              case 'checkbox':
                if (Array.isArray(response)) {
                  response.forEach((value: string) => {
                    if (question.options && !question.options.includes(value)) {
                      errors.push({
                        code: 'INVALID_CHECKBOX_VALUE',
                        message: `Invalid checkbox value "${value}" for question ${question.number}`,
                        category: category.id,
                        question: question.id,
                        severity: 'error'
                      });
                    }
                  });
                } else if (question.options && !question.options.includes(String(response))) {
                  errors.push({
                    code: 'INVALID_CHECKBOX_FORMAT',
                    message: `Checkbox response should be array or valid option for question ${question.number}`,
                    category: category.id,
                    question: question.id,
                    severity: 'error'
                  });
                }
                break;
            }
          }
        });
      });
    });
  }

  /**
   * Validate all required questions are answered for completion
   */
  private validateAllRequiredQuestionsAnswered(
    responses: AssessmentResponses,
    categories: RAPIDCategory[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const missingRequired: string[] = [];

    categories.forEach(category => {
      const categoryResponses = responses[category.id] || {};

      category.subcategories?.forEach(subcategory => {
        subcategory.questions?.forEach(question => {
          if (question.required) {
            const response = categoryResponses[question.id];
            
            if (response === undefined || response === null || response === '') {
              missingRequired.push(`${question.number} - ${question.text}`);
            }
          }
        });
      });
    });

    if (missingRequired.length > 0) {
      errors.push({
        code: 'INCOMPLETE_REQUIRED_QUESTIONS',
        message: `${missingRequired.length} required questions not answered: ${missingRequired.slice(0, 3).join(', ')}${missingRequired.length > 3 ? '...' : ''}`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate category completion requirements
   */
  private validateCategoryCompletionRequirements(
    responses: AssessmentResponses,
    categories: RAPIDCategory[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    categories.forEach(category => {
      const categoryResponses = responses[category.id] || {};
      const requiredQuestions = this.getRequiredQuestionsForCategory(category);
      const answeredRequired = requiredQuestions.filter(q => {
        const response = categoryResponses[q.id];
        return response !== undefined && response !== null && response !== '';
      });

      const completionPercentage = requiredQuestions.length > 0 ? 
        (answeredRequired.length / requiredQuestions.length) * 100 : 100;

      if (completionPercentage < 100) {
        warnings.push({
          code: 'INCOMPLETE_CATEGORY',
          message: `Category "${category.title}" is ${completionPercentage.toFixed(1)}% complete (${answeredRequired.length}/${requiredQuestions.length} required questions answered)`,
          category: category.id,
          severity: 'warning'
        });
      }
    });
  }

  /**
   * Calculate completion status
   */
  private calculateCompletionStatus(
    responses: AssessmentResponses,
    categories: RAPIDCategory[]
  ): ValidationResult['completionStatus'] {
    const categoryCompletions: Record<string, number> = {};
    let totalRequiredAnswered = 0;
    let totalRequired = 0;

    categories.forEach(category => {
      const categoryResponses = responses[category.id] || {};
      const requiredQuestions = this.getRequiredQuestionsForCategory(category);
      const answeredRequired = requiredQuestions.filter(q => {
        const response = categoryResponses[q.id];
        return response !== undefined && response !== null && response !== '';
      });

      const categoryCompletion = requiredQuestions.length > 0 ? 
        (answeredRequired.length / requiredQuestions.length) * 100 : 100;

      categoryCompletions[category.id] = categoryCompletion;
      totalRequiredAnswered += answeredRequired.length;
      totalRequired += requiredQuestions.length;
    });

    const overallCompletion = totalRequired > 0 ? (totalRequiredAnswered / totalRequired) * 100 : 100;

    return {
      overallCompletion,
      categoryCompletions,
      requiredQuestionsAnswered: totalRequiredAnswered,
      totalRequiredQuestions: totalRequired
    };
  }

  /**
   * Get required questions for a category
   */
  private getRequiredQuestionsForCategory(category: RAPIDCategory): RAPIDQuestion[] {
    const requiredQuestions: RAPIDQuestion[] = [];

    category.subcategories?.forEach(subcategory => {
      subcategory.questions?.forEach(question => {
        if (question.required) {
          requiredQuestions.push(question);
        }
      });
    });

    return requiredQuestions;
  }

  /**
   * Get total required questions count
   */
  private getTotalRequiredQuestions(categories: RAPIDCategory[]): number {
    return categories.reduce((total, category) => {
      return total + this.getRequiredQuestionsForCategory(category).length;
    }, 0);
  }

  /**
   * Validate invalid RAPID data and provide error handling
   */
  validateInvalidData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Check if data is null or undefined
      if (data === null || data === undefined) {
        errors.push({
          code: 'NULL_DATA',
          message: 'RAPID data is null or undefined',
          severity: 'error'
        });
        
        return {
          isValid: false,
          errors,
          warnings,
          completionStatus: {
            overallCompletion: 0,
            categoryCompletions: {},
            requiredQuestionsAnswered: 0,
            totalRequiredQuestions: 0
          }
        };
      }

      // Check if data is an object
      if (typeof data !== 'object') {
        errors.push({
          code: 'INVALID_DATA_TYPE',
          message: `RAPID data must be an object, got ${typeof data}`,
          severity: 'error'
        });
        
        return {
          isValid: false,
          errors,
          warnings,
          completionStatus: {
            overallCompletion: 0,
            categoryCompletions: {},
            requiredQuestionsAnswered: 0,
            totalRequiredQuestions: 0
          }
        };
      }

      // Try to validate as questionnaire structure
      return this.validateQuestionnaireStructure(data as RAPIDQuestionnaireStructure);

    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        completionStatus: {
          overallCompletion: 0,
          categoryCompletions: {},
          requiredQuestionsAnswered: 0,
          totalRequiredQuestions: 0
        }
      };
    }
  }
}

// Export singleton instance
export const rapidStructureValidator = new RAPIDStructureValidator();

// Export utility functions
export const validateRAPIDStructure = (questionnaire: RAPIDQuestionnaireStructure): ValidationResult => {
  return rapidStructureValidator.validateQuestionnaireStructure(questionnaire);
};

export const validateRAPIDResponses = (
  responses: AssessmentResponses, 
  questionnaire: RAPIDQuestionnaireStructure
): ValidationResult => {
  return rapidStructureValidator.validateResponses(responses, questionnaire);
};

export const validateRAPIDCompletion = (
  responses: AssessmentResponses, 
  questionnaire: RAPIDQuestionnaireStructure
): ValidationResult => {
  return rapidStructureValidator.validateCompletion(responses, questionnaire);
};