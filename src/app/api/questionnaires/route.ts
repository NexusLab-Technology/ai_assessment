import { NextRequest } from 'next/server'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError 
} from '../../../lib/api-utils'
import questionnaireData from '../../../data/mock-questionnaire.json'

/**
 * GET /api/questionnaires
 * Get questionnaire sections by assessment type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (!type) {
      return createErrorResponse('Assessment type is required', 400)
    }
    
    if (type !== 'exploratory' && type !== 'migration') {
      return createErrorResponse('Invalid assessment type. Must be "exploratory" or "migration"', 400)
    }
    
    const sections = questionnaireData[type as keyof typeof questionnaireData]
    
    if (!sections) {
      return createErrorResponse('Questionnaire not found for the specified type', 404)
    }
    
    return createSuccessResponse({
      type,
      sections
    }, 'Questionnaire sections retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}