import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { getDatabase } from '../../../../lib/mongodb'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-utils'
import { getDecryptedCredentials } from '../../aws/credentials/route'
import { ObjectId } from 'mongodb'

interface GenerateReportRequest {
  assessmentId: string
  companyId: string
}

interface AssessmentData {
  _id: string
  companyId: string
  name: string
  path: 'EXPLORATORY' | 'MIGRATION'
  responses: Record<string, any>
  currentStep: number
  totalSteps: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const { assessmentId, companyId }: GenerateReportRequest = await request.json()

    // Validate required fields
    if (!assessmentId || !companyId) {
      return createErrorResponse('Assessment ID and Company ID are required', 400)
    }

    // Get AWS credentials for the company
    const awsCredentials = await getDecryptedCredentials(companyId)
    if (!awsCredentials) {
      return createErrorResponse('AWS credentials not configured for this company', 400)
    }

    // Get assessment data
    const db = await getDatabase()
    const assessmentsCollection = db.collection<AssessmentData>('assessments')
    
    const assessment = await assessmentsCollection.findOne({ 
      _id: new ObjectId(assessmentId),
      companyId 
    })

    if (!assessment) {
      return createErrorResponse('Assessment not found', 404)
    }

    if (assessment.status !== 'COMPLETED') {
      return createErrorResponse('Assessment must be completed before generating report', 400)
    }

    // Get company data
    const companiesCollection = db.collection('companies')
    const company = await companiesCollection.findOne({ id: companyId })

    if (!company) {
      return createErrorResponse('Company not found', 404)
    }

    // Create Bedrock client
    const bedrockClient = new BedrockRuntimeClient({
      region: awsCredentials.region,
      credentials: {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey
      }
    })

    // Generate report content using Claude
    const reportPrompt = createReportPrompt(assessment, company)
    
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: reportPrompt
          }
        ]
      })
    })

    const response = await bedrockClient.send(command)
    
    if (!response.body) {
      return createErrorResponse('Failed to generate report content', 500)
    }

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const reportContent = responseBody.content[0].text

    // Format as HTML report
    const htmlReport = formatAsHtmlReport(reportContent, assessment, company)

    // Store report in database
    const reportsCollection = db.collection('reports')
    const reportDoc = {
      assessmentId,
      companyId,
      companyName: company.name,
      assessmentName: assessment.name,
      assessmentPath: assessment.path,
      htmlContent: htmlReport,
      generatedAt: new Date(),
      generatedBy: 'aws-bedrock-claude-3-sonnet'
    }

    const result = await reportsCollection.insertOne(reportDoc)

    return createSuccessResponse({
      reportId: result.insertedId,
      message: 'Report generated successfully',
      htmlContent: htmlReport
    })

  } catch (error: any) {
    console.error('Report generation error:', error)

    // Handle specific AWS errors
    if (error.name === 'UnauthorizedOperation' || error.name === 'InvalidUserID.NotFound') {
      return createErrorResponse('Invalid AWS credentials or insufficient permissions', 401)
    }

    if (error.name === 'AccessDenied') {
      return createErrorResponse('Access denied. Please check your AWS permissions for Bedrock service', 403)
    }

    if (error.name === 'ModelNotReadyException') {
      return createErrorResponse('Bedrock model is not available in the selected region', 400)
    }

    if (error.name === 'ThrottlingException') {
      return createErrorResponse('Request throttled. Please try again later', 429)
    }

    const errorMessage = error.message || 'Unknown error occurred while generating report'
    return createErrorResponse(errorMessage, 500)
  }
}

function createReportPrompt(assessment: AssessmentData, company: any): string {
  const pathDescription = assessment.path === 'EXPLORATORY' 
    ? 'Cloud Exploration Assessment' 
    : 'Cloud Migration Assessment'

  return `
You are an expert cloud consultant generating a comprehensive assessment report. Please create a detailed, professional report based on the following assessment data:

**Company Information:**
- Company Name: ${company.name}
- Assessment Type: ${pathDescription}
- Assessment Name: ${assessment.name}
- Completion Date: ${assessment.updatedAt.toISOString().split('T')[0]}

**Assessment Responses:**
${JSON.stringify(assessment.responses, null, 2)}

**Instructions:**
1. Create a comprehensive report that analyzes the assessment responses
2. Provide specific recommendations based on the company's current state and goals
3. Include risk assessments and mitigation strategies
4. Structure the report with clear sections and actionable insights
5. Use professional language suitable for executive presentation
6. Focus on practical, implementable recommendations
7. Include estimated timelines and resource requirements where appropriate

**Report Structure:**
- Executive Summary
- Current State Analysis
- Recommendations
- Risk Assessment
- Implementation Roadmap
- Next Steps

Please generate a detailed, professional report in markdown format that provides valuable insights and actionable recommendations for ${company.name}.
`
}

function formatAsHtmlReport(content: string, assessment: AssessmentData, company: any): string {
  const currentDate = new Date().toLocaleDateString()
  const pathDescription = assessment.path === 'EXPLORATORY' 
    ? 'Cloud Exploration Assessment' 
    : 'Cloud Migration Assessment'

  // Convert markdown to basic HTML (simplified conversion)
  let htmlContent = content
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')

  // Wrap paragraphs
  htmlContent = '<p>' + htmlContent + '</p>'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pathDescription} Report - ${company.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .report-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            color: #2563eb;
            font-size: 2.5em;
            font-weight: bold;
            margin: 0;
        }
        .assessment-type {
            color: #6b7280;
            font-size: 1.2em;
            margin: 5px 0;
        }
        .report-date {
            color: #9ca3af;
            font-size: 0.9em;
        }
        h1 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        h2 {
            color: #374151;
            margin-top: 25px;
        }
        h3 {
            color: #4b5563;
            margin-top: 20px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        strong {
            color: #1f2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1 class="company-name">${company.name}</h1>
            <div class="assessment-type">${pathDescription}</div>
            <div class="report-date">Generated on ${currentDate}</div>
        </div>
        
        <div class="content">
            ${htmlContent}
        </div>
        
        <div class="footer">
            <p>This report was generated using AI-powered analysis based on your assessment responses.</p>
            <p>Report ID: ${assessment._id} | Generated: ${currentDate}</p>
        </div>
    </div>
</body>
</html>
`
}