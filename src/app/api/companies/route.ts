import { NextRequest } from 'next/server'
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
 * GET /api/companies
 * Get all companies for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const companies = await CompanyModel.findAll(userId)
    
    return createSuccessResponse({
      companies,
      total: companies.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await parseRequestBody(request)
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['name'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }
    
    // Validate name length
    if (body.name.length > 100) {
      return createErrorResponse('Company name must be 100 characters or less', 400)
    }
    
    // Create company
    const company = await CompanyModel.create({
      name: body.name.trim(),
      description: body.description?.trim(),
      userId
    })
    
    return createSuccessResponse(company, 'Company created successfully')
  } catch (error) {
    return handleApiError(error)
  }
}