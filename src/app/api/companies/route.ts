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
  let body: any = null
  
  try {
    body = await parseRequestBody(request)
    
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
    try {
      const company = await CompanyModel.create({
        name: body.name.trim(),
        description: body.description?.trim()
      })

      return createSuccessResponse(
        company,
        'Company created successfully'
      )
    } catch (error: any) {
      // Handle specific errors with better messages
      if (error.message && error.message.includes('already exists')) {
        return createErrorResponse(
          error.message,
          409 // Conflict status code
        )
      }
      
      if (error.message && error.message.includes('cannot be empty')) {
        return createErrorResponse(
          error.message,
          400 // Bad request
        )
      }
      
      // Re-throw to be handled by outer catch
      throw error
    }
  } catch (error) {
    // Enhanced error handling with more context
    if (error instanceof Error) {
      // Check for MongoDB duplicate key error
      if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
        const companyName = body?.name?.trim() || 'Unknown'
        return createErrorResponse(
          `Company with name "${companyName}" already exists`,
          409
        )
      }
      
      // Return error with message
      return createErrorResponse(
        error.message || 'Failed to create company',
        500
      )
    }
    
    return handleApiError(error)
  }
}
