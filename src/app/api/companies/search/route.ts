import { NextRequest } from 'next/server'
import { CompanyModel } from '../../../../lib/models/Company'
import { 
  createSuccessResponse, 
  handleApiError
} from '../../../../lib/api-utils'

/**
 * GET /api/companies/search?q=query
 * Search companies by name or description
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    const companies = await CompanyModel.search(query.trim())
    
    return createSuccessResponse({
      companies,
      total: companies.length,
      query: query.trim()
    })
  } catch (error) {
    return handleApiError(error)
  }
}