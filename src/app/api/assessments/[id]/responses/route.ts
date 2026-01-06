import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../../../../lib/mongodb'
import { AssessmentDocument, COLLECTIONS } from '../../../../../lib/models/assessment'
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
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    
    // Check if assessment exists
    const existingAssessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id),
      userId
    })
    
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
    const now = new Date()
    const updateData: Partial<AssessmentDocument> = {
      [`responses.${body.stepId.trim()}`]: body.responses,
      currentStep: body.currentStep,
      updatedAt: now
    }
    
    // Update status to IN_PROGRESS if it's still DRAFT
    if (existingAssessment.status === 'DRAFT') {
      updateData.status = 'IN_PROGRESS'
    }
    
    const updateResult = await assessmentsCollection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    )
    
    if (updateResult.matchedCount === 0) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Get updated assessment
    const updatedAssessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id),
      userId
    })
    
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
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    const assessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id),
      userId
    })
    
    if (!assessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    return createSuccessResponse({
      assessmentId: id,
      responses: assessment.responses || {},
      currentStep: assessment.currentStep,
      totalSteps: assessment.totalSteps,
      status: assessment.status
    })
  } catch (error) {
    return handleApiError(error)
  }
}