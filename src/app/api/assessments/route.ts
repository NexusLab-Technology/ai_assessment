/**
 * Assessments API Route
 * GET /api/assessments - List assessments
 * POST /api/assessments - Create new assessment
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssessmentService } from '@/lib/services/assessment-service'
import { RAPIDQuestionnaireService } from '@/lib/services/rapid-questionnaire-service'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError,
  validateRequiredFields,
  parseRequestBody,
  isValidObjectId
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    // List assessments from database
    const assessments = await AssessmentService.listAssessments(
      companyId || undefined
    )
    
    return createSuccessResponse({
      assessments,
      total: assessments.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request)
    const { name, companyId, type } = body

    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'companyId', 'type'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }

    // Validate assessment type
    if (!['EXPLORATORY', 'MIGRATION'].includes(type)) {
      return createErrorResponse(
        'Invalid assessment type. Must be EXPLORATORY or MIGRATION',
        400
      )
    }

    // Validate companyId is a valid ObjectId format
    if (!isValidObjectId(companyId)) {
      return createErrorResponse(
        `Invalid company ID format. Company ID must be a valid MongoDB ObjectId (24 hex characters). Received: ${companyId}. Please use a company from the database, not a mock company.`,
        400
      )
    }

    // Get active RAPID questionnaire version for this assessment type
    const questionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire(type)
    
    if (!questionnaire) {
      return createErrorResponse(
        `No active RAPID questionnaire found for type: ${type}. Please initialize questionnaires first.`,
        404
      )
    }

    // Create assessment in database
    const result = await AssessmentService.createAssessment({
      name: name.trim(),
      companyId,
      type,
      rapidQuestionnaireVersion: questionnaire.version
    })

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Failed to create assessment',
        500
      )
    }

    // Get the created assessment to return
    const assessment = await AssessmentService.getAssessment(result.assessmentId!)
    
    if (!assessment) {
      return createErrorResponse(
        'Assessment created but could not be retrieved',
        500
      )
    }

    // Return assessment directly in data (client expects Assessment, not { assessment })
    return NextResponse.json({
      success: true,
      data: assessment,
      message: 'Assessment created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}