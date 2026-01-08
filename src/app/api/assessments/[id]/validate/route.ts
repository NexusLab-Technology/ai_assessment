/**
 * Assessment Validation API Route
 * Task 19.1: Implement RAPID structure validation
 * 
 * Endpoints:
 * - GET /api/assessments/[id]/validate - Get validation summary
 * - POST /api/assessments/[id]/validate - Validate specific responses
 * - Requirements: 4.5, 14.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { AssessmentService } from '@/lib/services/assessment-service';
import { validationService } from '@/lib/services/validation-service';
import { RAPIDQuestionnaireService } from '@/lib/services/rapid-questionnaire-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    
    // Find the assessment
    const assessment = await AssessmentService.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get the questionnaire structure
    const questionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire(assessment.type);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire structure not found' },
        { status: 404 }
      );
    }

    // Get validation summary
    const validationSummary = await validationService.getValidationSummary(
      assessment,
      questionnaire
    );

    return NextResponse.json({
      assessmentId,
      validation: validationSummary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error validating assessment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();
    
    // Find the assessment
    const assessment = await AssessmentService.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get the questionnaire structure
    const questionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire(assessment.type);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire structure not found' },
        { status: 404 }
      );
    }

    // Handle different validation types
    const { validationType, categoryId, responses: newResponses, realTime } = body;

    let validationResult;

    switch (validationType) {
      case 'category':
        if (!categoryId) {
          return NextResponse.json(
            { error: 'Category ID required for category validation' },
            { status: 400 }
          );
        }
        
        const categoryResponses = newResponses || assessment.responses[categoryId] || {};
        validationResult = await validationService.validateCategoryResponses(
          categoryId,
          categoryResponses,
          questionnaire
        );
        break;

      case 'responses':
        // Update assessment with new responses if provided
        const updatedAssessment = newResponses ? 
          { ...assessment, responses: newResponses } : 
          assessment;
        
        validationResult = await validationService.validateAssessmentResponses(
          updatedAssessment,
          questionnaire,
          realTime || false
        );
        break;

      case 'completion':
        // Update assessment with new responses if provided
        const completionAssessment = newResponses ? 
          { ...assessment, responses: newResponses } : 
          assessment;
        
        validationResult = await validationService.validateAssessmentCompletion(
          completionAssessment,
          questionnaire
        );
        break;

      case 'questionnaire':
        validationResult = await validationService.validateQuestionnaire(questionnaire);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid validation type. Must be one of: category, responses, completion, questionnaire' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      assessmentId,
      validationType,
      categoryId: categoryId || null,
      validation: validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in validation request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process validation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();
    
    // Find the assessment
    const assessment = await AssessmentService.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get the questionnaire structure
    const questionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire(assessment.type);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire structure not found' },
        { status: 404 }
      );
    }

    const { responses: newResponses, validateBeforeSave = true } = body;

    if (!newResponses) {
      return NextResponse.json(
        { error: 'Responses are required' },
        { status: 400 }
      );
    }

    // Validate responses before saving if requested
    let validationResult = null;
    if (validateBeforeSave) {
      const updatedAssessment = { ...assessment, responses: newResponses };
      validationResult = await validationService.validateAssessmentResponses(
        updatedAssessment,
        questionnaire
      );

      // If validation fails with errors, don't save
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        return NextResponse.json({
          assessmentId,
          saved: false,
          validation: validationResult,
          message: 'Responses not saved due to validation errors',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Update assessment responses - update each category
    for (const [categoryId, categoryResponses] of Object.entries(newResponses)) {
      const updateResult = await AssessmentService.updateCategoryResponses(
        assessmentId,
        categoryId,
        categoryResponses as { [questionId: string]: any }
      );
      
      if (!updateResult.success) {
        return NextResponse.json(
          { error: updateResult.error || `Failed to update responses for category ${categoryId}` },
          { status: 500 }
        );
      }
    }

    // Get updated assessment
    const updatedAssessment = await AssessmentService.getAssessment(assessmentId);
    if (!updatedAssessment) {
      return NextResponse.json(
        { error: 'Assessment not found after update' },
        { status: 404 }
      );
    }

    // Get final validation summary
    const finalValidation = await validationService.getValidationSummary(
      updatedAssessment,
      questionnaire
    );

    return NextResponse.json({
      assessmentId,
      saved: true,
      validation: finalValidation,
      message: 'Responses saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving validated responses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save validated responses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    
    // Clear validation cache for this assessment
    validationService.clearAssessmentCache(assessmentId);

    return NextResponse.json({
      assessmentId,
      message: 'Validation cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing validation cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear validation cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}