import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/models/assessment'
import { ReportModel } from '../../../lib/models/Report'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  getUserId,
  parseRequestBody,
  validateRequiredFields
} from '../../../lib/api-utils'

/**
 * GET /api/reports
 * Get all reports for the authenticated user, optionally filtered by company
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    const reports = await ReportModel.findAll(userId, companyId || undefined)
    
    return createSuccessResponse({
      reports,
      total: reports.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/reports
 * Generate a new report for an assessment
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await parseRequestBody(request)
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['assessmentId'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      )
    }
    
    // Verify assessment exists and belongs to user
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    const assessment = await assessmentsCollection.findOne({
      _id: new ObjectId(body.assessmentId),
      userId
    })
    
    if (!assessment) {
      return createErrorResponse('Assessment not found', 404)
    }
    
    // Only allow report generation for completed assessments
    if (assessment.status !== 'COMPLETED') {
      return createErrorResponse('Reports can only be generated for completed assessments', 400)
    }
    
    // Check if report already exists for this assessment
    const existingReport = await ReportModel.findByAssessmentId(body.assessmentId, userId)
    if (existingReport) {
      return createErrorResponse('Report already exists for this assessment', 409)
    }
    
    // For now, generate a mock HTML report
    // In Phase 3, this will be replaced with AWS Bedrock integration
    const mockHtmlContent = generateMockReport(assessment)
    
    // Create report
    const report = await ReportModel.create({
      assessmentId: body.assessmentId,
      companyId: assessment.companyId.toString(),
      htmlContent: mockHtmlContent,
      metadata: {
        assessmentType: assessment.type,
        companyName: 'Mock Company', // Will be populated from actual company data
        generationDuration: 1500, // Mock duration in ms
        bedrockModel: 'mock-model-v1'
      },
      userId
    })
    
    return createSuccessResponse(report, 'Report generated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Generate mock HTML report content
 * This will be replaced with AWS Bedrock integration in Phase 3
 */
function generateMockReport(assessment: any): string {
  const currentDate = new Date().toLocaleDateString()
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assessment Report - ${assessment.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-left: 4px solid #007bff; padding-left: 15px; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .recommendation { background: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
        .risk-high { color: #dc3545; font-weight: bold; }
        .risk-medium { color: #ffc107; font-weight: bold; }
        .risk-low { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AI Assessment Report</h1>
        <div class="metadata">
          <p><strong>Assessment Name:</strong> ${assessment.name}</p>
          <p><strong>Assessment Type:</strong> ${assessment.type}</p>
          <p><strong>Generated:</strong> ${currentDate}</p>
          <p><strong>Status:</strong> ${assessment.status}</p>
        </div>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <p>This ${assessment.type.toLowerCase()} assessment has been completed and analyzed using AI-powered evaluation techniques. The assessment covered ${assessment.totalSteps} key areas of evaluation.</p>
        
        <div class="recommendation">
          <h3>Key Recommendations</h3>
          <ul>
            <li>Implement recommended security measures based on current infrastructure</li>
            <li>Consider cloud migration strategies for improved scalability</li>
            <li>Establish monitoring and alerting systems for better operational visibility</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>Risk Assessment</h2>
        <p><span class="risk-high">High Risk:</span> Legacy system dependencies requiring immediate attention</p>
        <p><span class="risk-medium">Medium Risk:</span> Scalability concerns for future growth</p>
        <p><span class="risk-low">Low Risk:</span> Current security posture is adequate for immediate needs</p>
      </div>

      <div class="section">
        <h2>Technical Analysis</h2>
        <p>Based on the responses provided during the assessment, the following technical considerations have been identified:</p>
        <ul>
          <li>Current architecture supports immediate business needs</li>
          <li>Infrastructure modernization opportunities exist</li>
          <li>Performance optimization potential identified</li>
        </ul>
      </div>

      <div class="section">
        <h2>Next Steps</h2>
        <ol>
          <li>Review and prioritize recommendations based on business impact</li>
          <li>Develop implementation timeline for critical improvements</li>
          <li>Establish success metrics and monitoring procedures</li>
          <li>Schedule follow-up assessment in 6 months</li>
        </ol>
      </div>

      <div class="section">
        <h2>Appendix</h2>
        <p><em>This report was generated using AI analysis of assessment responses. For detailed technical specifications and implementation guidance, please consult with your technical team.</em></p>
      </div>
    </body>
    </html>
  `
}