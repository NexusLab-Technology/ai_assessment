import { NextRequest } from 'next/server'
import { CompanyModel } from '../../../../lib/models/Company'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  getUserId,
  parseRequestBody,
  validateRequiredFields,
  isValidObjectId
} from '../../../../lib/api-utils'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/companies/[id]
 * Get a specific company by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const userId = getUserId(request)
    
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid company ID format', 400)
    }
    
    const company = await CompanyModel.findById(id, userId)
    
    if (!company) {
      return createErrorResponse('Company not found', 404)
    }
    
    // Get assessment count
    const assessmentCount = await CompanyModel.getAssessmentCount(id, userId)
    
    return createSuccessResponse({
      ...company,
      assessmentCount
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/companies/[id]
 * Update a specific company
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const userId = getUserId(request)
    const body = await parseRequestBody(request)
    
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid company ID format', 400)
    }
    
    // Validate at least one field is provided
    if (!body.name && !body.description) {
      return createErrorResponse('At least one field (name or description) must be provided', 400)
    }
    
    // Validate name if provided
    if (body.name && body.name.length > 100) {
      return createErrorResponse('Company name must be 100 characters or less', 400)
    }
    
    const updateData: any = {}
    if (body.name) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim()
    
    const company = await CompanyModel.update(id, userId, updateData)
    
    if (!company) {
      return createErrorResponse('Company not found', 404)
    }
    
    return createSuccessResponse(company, 'Company updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a specific company
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const userId = getUserId(request)
    
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid company ID format', 400)
    }
    
    // Check if company has assessments
    const assessmentCount = await CompanyModel.getAssessmentCount(id, userId)
    if (assessmentCount > 0) {
      return createErrorResponse(
        'Cannot delete company with existing assessments. Please delete all assessments first.',
        400
      )
    }
    
    const deleted = await CompanyModel.delete(id, userId)
    
    if (!deleted) {
      return createErrorResponse('Company not found', 404)
    }
    
    return createSuccessResponse(null, 'Company deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}