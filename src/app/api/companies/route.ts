/**
 * Companies API Route
 * GET /api/companies - List companies
 * POST /api/companies - Create new company
 */

import { NextRequest, NextResponse } from 'next/server'
import { CompanyModel } from '@/lib/models/Company'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError,
  validateRequiredFields,
  parseRequestBody
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    // List companies from database
    const companies = await CompanyModel.findAll()
    
    return createSuccessResponse({
      companies,
      total: companies.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
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
    if (body.name && body.name.length > 100) {
      return createErrorResponse(
        'Company name must be 100 characters or less',
        400
      )
    }

    // Create company in database
    const company = await CompanyModel.create({
      name: body.name.trim(),
      description: body.description?.trim()
    })

    return createSuccessResponse(
      company,
      'Company created successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
