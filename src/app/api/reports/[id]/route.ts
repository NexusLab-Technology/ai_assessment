import { NextRequest } from 'next/server'
import { ReportModel } from '../../../../lib/models/Report'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  parseRequestBody,
  isValidObjectId
} from '../../../../lib/api-utils'

/**
 * GET /api/reports/[id]
 * Get a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid report ID format', 400)
    }
    
    const report = await ReportModel.findById(id)
    
    if (!report) {
      return createErrorResponse('Report not found', 404)
    }
    
    return createSuccessResponse(report)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/reports/[id]
 * Update a report (regenerate with new content)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await parseRequestBody(request)
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid report ID format', 400)
    }
    
    // Check if report exists
    const existingReport = await ReportModel.findById(id)
    if (!existingReport) {
      return createErrorResponse('Report not found', 404)
    }
    
    // Validate fields if provided
    const updateData: any = {}
    
    if (body.htmlContent !== undefined) {
      if (typeof body.htmlContent !== 'string') {
        return createErrorResponse('HTML content must be a string', 400)
      }
      updateData.htmlContent = body.htmlContent
    }
    
    if (body.metadata !== undefined) {
      if (typeof body.metadata !== 'object') {
        return createErrorResponse('Metadata must be an object', 400)
      }
      updateData.metadata = body.metadata
    }
    
    // Update report
    const updatedReport = await ReportModel.update(id, updateData)
    
    if (!updatedReport) {
      return createErrorResponse('Failed to update report', 500)
    }
    
    return createSuccessResponse(updatedReport, 'Report updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid report ID format', 400)
    }
    
    // Check if report exists
    const existingReport = await ReportModel.findById(id)
    if (!existingReport) {
      return createErrorResponse('Report not found', 404)
    }
    
    const deleted = await ReportModel.delete(id)
    
    if (!deleted) {
      return createErrorResponse('Failed to delete report', 500)
    }
    
    return createSuccessResponse(null, 'Report deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}