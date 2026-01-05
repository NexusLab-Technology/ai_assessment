import { NextRequest } from 'next/server'
import { AssessmentModel } from '../../../../../lib/models/Assessment'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  getUserId,
  parseRequestBody,
  validateRequiredFields,
  isValidObjectId
} from '../../../../../lib/api-utils'

/**
 * POST /api/assessments/[id]/responses
 * Save responses for a specific step in an assessment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request)
    const { id } = params
    const body = await parseRequestBody(request)
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid assessment ID format', 400)
    }
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['stepId', 'responses', 'currentStep'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }
    
    // Validate field types
    if (typeof body.stepId !== 'string' || body.stepId.trim().length === 0) {
      return createErrorResponse('stepId must be a non-empty string', 400)
    }
    
    if (typeof body.responses !== 'object' || body.responses === null) {
      return createErrorResponse('responses must be an object', 400)
    }
    
    if (typeof body.currentStep !== 'number' || body.currentStep < 1) {
      return createErrorResponse('currentStep must be a positive number', 400)
    }
    
    // Check if assessment exists
    const existingAssessment = await AssessmentModel.findById(id, userId)
    if (!existingAssessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Validate current step doesn't exceed total steps
    if (body.currentStep > existingAssessment.totalSteps) {
      return createErrorResponse(
        `Current step cannot exceed total steps (${existingAssessment.totalSteps})`, 
        400
      )
    }
    
    // Don't allow saving responses for completed assessments
    if (existingAssessment.status === 'COMPLETED') {
      return createErrorResponse('Cannot save responses for completed assessments', 400)
    }
    
    // Save responses
    const updatedAssessment = await AssessmentModel.saveResponses(
      id,
      userId,
      body.stepId.trim(),
      body.responses,
      body.currentStep
    )
    
    if (!updatedAssessment) {
      return createErrorResponse('Failed to save responses', 500)
    }
    
    return createSuccessResponse(updatedAssessment, 'Responses saved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/assessments/[id]/responses
 * Get all responses for an assessment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request)
    const { id } = params
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid assessment ID format', 400)
    }
    
    const assessment = await AssessmentModel.findById(id, userId)
    
    if (!assessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Get the full assessment document to access responses
    const collection = await AssessmentModel.getCollection()
    const document = await collection.findOne({ 
      _id: new (require('mongodb').ObjectId)(id), 
      userId 
    })
    
    if (!document) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    return createSuccessResponse({
      assessmentId: id,
      responses: document.responses || {},
      currentStep: document.currentStep,
      totalSteps: document.totalSteps,
      status: document.status
    })
  } catch (error) {
    return handleApiError(error)
  }
}