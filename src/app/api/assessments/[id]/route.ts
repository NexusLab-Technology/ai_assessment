import { NextRequest } from 'next/server'
import { AssessmentModel } from '../../../../lib/models/Assessment'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  getUserId,
  parseRequestBody,
  validateRequiredFields,
  isValidObjectId
} from '../../../../lib/api-utils'

/**
 * GET /api/assessments/[id]
 * Get a specific assessment by ID
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
    
    return createSuccessResponse(assessment)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/assessments/[id]
 * Update an assessment
 */
export async function PUT(
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
    
    // Check if assessment exists
    const existingAssessment = await AssessmentModel.findById(id, userId)
    if (!existingAssessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Validate fields if provided
    const updateData: any = {}
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return createErrorResponse('Assessment name must be a non-empty string', 400)
      }
      if (body.name.length > 100) {
        return createErrorResponse('Assessment name must be 100 characters or less', 400)
      }
      updateData.name = body.name.trim()
    }
    
    if (body.status !== undefined) {
      if (!['DRAFT', 'IN_PROGRESS', 'COMPLETED'].includes(body.status)) {
        return createErrorResponse('Invalid status. Must be DRAFT, IN_PROGRESS, or COMPLETED', 400)
      }
      updateData.status = body.status
    }
    
    if (body.currentStep !== undefined) {
      if (typeof body.currentStep !== 'number' || body.currentStep < 1) {
        return createErrorResponse('Current step must be a positive number', 400)
      }
      if (body.currentStep > existingAssessment.totalSteps) {
        return createErrorResponse(`Current step cannot exceed total steps (${existingAssessment.totalSteps})`, 400)
      }
      updateData.currentStep = body.currentStep
    }
    
    if (body.responses !== undefined) {
      if (typeof body.responses !== 'object') {
        return createErrorResponse('Responses must be an object', 400)
      }
      updateData.responses = body.responses
    }
    
    // Update assessment
    const updatedAssessment = await AssessmentModel.update(id, userId, updateData)
    
    if (!updatedAssessment) {
      return createErrorResponse('Failed to update assessment', 500)
    }
    
    return createSuccessResponse(updatedAssessment, 'Assessment updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/assessments/[id]
 * Delete an assessment
 */
export async function DELETE(
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
    
    // Check if assessment exists
    const existingAssessment = await AssessmentModel.findById(id, userId)
    if (!existingAssessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Only allow deletion of DRAFT assessments
    if (existingAssessment.status !== 'DRAFT') {
      return createErrorResponse('Only draft assessments can be deleted', 400)
    }
    
    const deleted = await AssessmentModel.delete(id, userId)
    
    if (!deleted) {
      return createErrorResponse('Failed to delete assessment', 500)
    }
    
    return createSuccessResponse(null, 'Assessment deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}