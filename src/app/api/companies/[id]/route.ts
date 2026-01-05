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
 * Delete a specific company and all associated assessments (cascade deletion)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const userId = getUserId(request)
    
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid company ID format', 400)
    }
    
    // Get assessment count for confirmation message
    const assessmentCount = await CompanyModel.getAssessmentCount(id, userId)
    
    // Import AssessmentModel for cascade deletion
    const { AssessmentModel } = await import('../../../../lib/models/Assessment')
    
    // Get all assessments for this company
    const assessments = await AssessmentModel.getByCompany(id, userId)
    
    // Delete all associated assessments first
    let deletedAssessments = 0
    for (const assessment of assessments) {
      const deleted = await AssessmentModel.delete(assessment.id, userId)
      if (deleted) {
        deletedAssessments++
      }
    }
    
    // Now delete the company
    const deleted = await CompanyModel.delete(id, userId)
    
    if (!deleted) {
      return createErrorResponse('Company not found', 404)
    }
    
    // Return success with cascade deletion details
    const message = assessmentCount > 0 
      ? `Company deleted successfully. ${deletedAssessments} associated assessments were also deleted.`
      : 'Company deleted successfully'
    
    return createSuccessResponse({
      deletedCompany: true,
      deletedAssessments: deletedAssessments,
      totalAssessments: assessmentCount
    }, message)
  } catch (error) {
    return handleApiError(error)
  }
}