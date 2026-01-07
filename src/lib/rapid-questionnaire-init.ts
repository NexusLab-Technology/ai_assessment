/**
 * RAPID Questionnaire Database Initialization
 * Task 17.1: Initialize MongoDB with RAPID questionnaire data
 */

import { RAPIDQuestionnaireService } from './services/rapid-questionnaire-service';
import { exploratoryRAPIDQuestionnaire, migrationRAPIDQuestionnaire } from '@/data/rapid-questionnaire-complete';

export interface InitializationResult {
  success: boolean;
  message: string;
  details: {
    exploratory: { success: boolean; id?: string; error?: string };
    migration: { success: boolean; id?: string; error?: string };
  };
}

/**
 * Initialize RAPID questionnaires in MongoDB
 * This function ensures that the latest RAPID questionnaire data is available in the database
 */
export async function initializeRAPIDQuestionnaires(): Promise<InitializationResult> {
  console.log('🚀 Initializing RAPID questionnaires in MongoDB...');

  try {
    // Initialize Exploratory questionnaire
    console.log('📝 Storing Exploratory RAPID questionnaire...');
    const exploratoryResult = await RAPIDQuestionnaireService.storeQuestionnaire(exploratoryRAPIDQuestionnaire);
    
    if (exploratoryResult.success) {
      console.log(`✅ Exploratory questionnaire stored with ID: ${exploratoryResult.id}`);
    } else {
      console.error(`❌ Failed to store Exploratory questionnaire: ${exploratoryResult.error}`);
    }

    // Initialize Migration questionnaire
    console.log('📝 Storing Migration RAPID questionnaire...');
    const migrationResult = await RAPIDQuestionnaireService.storeQuestionnaire(migrationRAPIDQuestionnaire);
    
    if (migrationResult.success) {
      console.log(`✅ Migration questionnaire stored with ID: ${migrationResult.id}`);
    } else {
      console.error(`❌ Failed to store Migration questionnaire: ${migrationResult.error}`);
    }

    const overallSuccess = exploratoryResult.success && migrationResult.success;
    const message = overallSuccess 
      ? '✅ All RAPID questionnaires initialized successfully'
      : '⚠️ Some RAPID questionnaires failed to initialize';

    return {
      success: overallSuccess,
      message,
      details: {
        exploratory: exploratoryResult,
        migration: migrationResult
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to initialize RAPID questionnaires:', errorMessage);
    
    return {
      success: false,
      message: `Failed to initialize RAPID questionnaires: ${errorMessage}`,
      details: {
        exploratory: { success: false, error: errorMessage },
        migration: { success: false, error: errorMessage }
      }
    };
  }
}

/**
 * Check if RAPID questionnaires are available in the database
 */
export async function checkRAPIDQuestionnairesAvailability(): Promise<{
  exploratory: boolean;
  migration: boolean;
  versions: Array<{
    version: string;
    assessmentType: string;
    totalQuestions: number;
    isActive: boolean;
  }>;
}> {
  try {
    console.log('🔍 Checking RAPID questionnaires availability...');

    const [exploratoryQuestionnaire, migrationQuestionnaire, versions] = await Promise.all([
      RAPIDQuestionnaireService.getActiveQuestionnaire('EXPLORATORY'),
      RAPIDQuestionnaireService.getActiveQuestionnaire('MIGRATION'),
      RAPIDQuestionnaireService.listVersions()
    ]);

    const result = {
      exploratory: !!exploratoryQuestionnaire,
      migration: !!migrationQuestionnaire,
      versions
    };

    console.log('📊 RAPID questionnaires availability:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to check RAPID questionnaires availability:', error);
    return {
      exploratory: false,
      migration: false,
      versions: []
    };
  }
}

/**
 * Auto-initialize RAPID questionnaires if they don't exist
 */
export async function autoInitializeRAPIDQuestionnaires(): Promise<InitializationResult> {
  console.log('🔄 Auto-initializing RAPID questionnaires...');

  try {
    // Check current availability
    const availability = await checkRAPIDQuestionnairesAvailability();
    
    // If both questionnaires are available, no need to initialize
    if (availability.exploratory && availability.migration) {
      console.log('✅ RAPID questionnaires already available in database');
      return {
        success: true,
        message: 'RAPID questionnaires already available',
        details: {
          exploratory: { success: true },
          migration: { success: true }
        }
      };
    }

    // Initialize missing questionnaires
    console.log('📝 Some RAPID questionnaires missing, initializing...');
    return await initializeRAPIDQuestionnaires();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Auto-initialization failed:', errorMessage);
    
    return {
      success: false,
      message: `Auto-initialization failed: ${errorMessage}`,
      details: {
        exploratory: { success: false, error: errorMessage },
        migration: { success: false, error: errorMessage }
      }
    };
  }
}

/**
 * Validate RAPID questionnaire data integrity
 */
export async function validateRAPIDQuestionnaireIntegrity(): Promise<{
  valid: boolean;
  issues: string[];
  summary: {
    exploratory: { categories: number; questions: number; valid: boolean };
    migration: { categories: number; questions: number; valid: boolean };
  };
}> {
  console.log('🔍 Validating RAPID questionnaire data integrity...');

  const issues: string[] = [];
  let exploratoryValid = false;
  let migrationValid = false;
  let exploratoryStats = { categories: 0, questions: 0, valid: false };
  let migrationStats = { categories: 0, questions: 0, valid: false };

  try {
    // Validate Exploratory questionnaire
    const exploratoryQuestionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire('EXPLORATORY');
    if (exploratoryQuestionnaire) {
      exploratoryStats = {
        categories: exploratoryQuestionnaire.categories.length,
        questions: exploratoryQuestionnaire.totalQuestions,
        valid: true
      };
      exploratoryValid = true;

      // Validate structure
      if (exploratoryQuestionnaire.categories.length === 0) {
        issues.push('Exploratory questionnaire has no categories');
        exploratoryValid = false;
      }

      if (exploratoryQuestionnaire.totalQuestions === 0) {
        issues.push('Exploratory questionnaire has no questions');
        exploratoryValid = false;
      }
    } else {
      issues.push('Exploratory questionnaire not found in database');
    }

    // Validate Migration questionnaire
    const migrationQuestionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire('MIGRATION');
    if (migrationQuestionnaire) {
      migrationStats = {
        categories: migrationQuestionnaire.categories.length,
        questions: migrationQuestionnaire.totalQuestions,
        valid: true
      };
      migrationValid = true;

      // Validate structure
      if (migrationQuestionnaire.categories.length === 0) {
        issues.push('Migration questionnaire has no categories');
        migrationValid = false;
      }

      if (migrationQuestionnaire.totalQuestions === 0) {
        issues.push('Migration questionnaire has no questions');
        migrationValid = false;
      }
    } else {
      issues.push('Migration questionnaire not found in database');
    }

    const overallValid = exploratoryValid && migrationValid && issues.length === 0;

    console.log(`📊 Validation result: ${overallValid ? '✅ Valid' : '❌ Invalid'}`);
    if (issues.length > 0) {
      console.log('⚠️ Issues found:', issues);
    }

    return {
      valid: overallValid,
      issues,
      summary: {
        exploratory: { ...exploratoryStats, valid: exploratoryValid },
        migration: { ...migrationStats, valid: migrationValid }
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    issues.push(`Validation error: ${errorMessage}`);
    
    return {
      valid: false,
      issues,
      summary: {
        exploratory: exploratoryStats,
        migration: migrationStats
      }
    };
  }
}