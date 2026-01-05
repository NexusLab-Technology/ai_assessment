import { NextRequest } from 'next/server'
import { AssessmentModel } from '../../../lib/models/Assessment'
import { CompanyModel } from '../../../lib/models/Company'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  getUserId,
  parseRequestBody,
  validateRequiredFields
} from '../../../lib/api-utils'

/**
 * GET /api/assessments
 * Get all assessments for the authenticated user, optionally filtered by company
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    const assessments = await AssessmentModel.findAll(userId, companyId || undefined)
    
    return createSuccessResponse({
      assessments,
      total: assessments.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/assessments
 * Create a new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await parseRequestBody(request)
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'companyId', 'type'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }
    
    // Validate assessment type
    if (!['EXPLORATORY', 'MIGRATION'].includes(body.type)) {
      return createErrorResponse('Assessment type must be EXPLORATORY or MIGRATION', 400)
    }
    
    // Validate name length
    if (body.name.length > 100) {
      return createErrorResponse('Assessment name must be 100 characters or less', 400)
    }
    
    // Verify company exists and belongs to user
    const company = await CompanyModel.findById(body.companyId, userId)
    if (!company) {
      return createErrorResponse('Company not found', 404)
    }
    
    // Create assessment
    const assessment = await AssessmentModel.create({
      name: body.name.trim(),
      companyId: body.companyId,
      type: body.type,
      userId
    })
    
    return createSuccessResponse(assessment, 'Assessment created successfully')
  } catch (error) {
    return handleApiError(error)
  }
}