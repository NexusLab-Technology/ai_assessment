import { NextRequest } from 'next/server'
import { CompanyModel } from '../../../../lib/models/Company'
import { 
  createSuccessResponse, 
  handleApiError, 
  getUserId
} from '../../../../lib/api-utils'

/**
 * GET /api/companies/search?q=query
 * Search companies by name or description
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    const companies = await CompanyModel.search(query.trim(), userId)
    
    // Get assessment counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => ({
        ...company,
        assessmentCount: await CompanyModel.getAssessmentCount(company.id, userId)
      }))
    )
    
    return createSuccessResponse({
      companies: companiesWithCounts,
      total: companiesWithCounts.length,
      query: query.trim()
    })
  } catch (error) {
    return handleApiError(error)
  }
}