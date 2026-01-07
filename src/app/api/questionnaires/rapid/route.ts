/**
 * RAPID Questionnaires API Route
 * GET /api/questionnaires/rapid - Get RAPID questionnaire data
 */

import { NextRequest, NextResponse } from 'next/server'
import { RAPIDQuestionnaireService } from '@/lib/services/rapid-questionnaire-service'
import { AssessmentType } from '@/types/rapid-questionnaire'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as AssessmentType
    const version = searchParams.get('version')

    // Validate assessment type
    if (type && !['EXPLORATORY', 'MIGRATION'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid assessment type. Must be EXPLORATORY or MIGRATION' },
        { status: 400 }
      )
    }

    // If version is specified, get specific version
    if (version && type) {
      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion(version, type)
      
      if (!questionnaire) {
        return NextResponse.json(
          { error: `RAPID questionnaire not found: ${version} (${type})` },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: questionnaire
      })
    }

    // If type is specified, get active questionnaire for that type
    if (type) {
      const questionnaire = await RAPIDQuestionnaireService.getActiveQuestionnaire(type)
      
      if (!questionnaire) {
        return NextResponse.json(
          { error: `No active RAPID questionnaire found for type: ${type}` },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: questionnaire
      })
    }

    // If no parameters, list all available versions
    const versions = await RAPIDQuestionnaireService.listVersions()
    
    return NextResponse.json({
      success: true,
      data: {
        versions,
        total: versions.length
      }
    })

  } catch (error) {
    console.error('Error in RAPID questionnaires API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionnaire } = body

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire data is required' },
        { status: 400 }
      )
    }

    // Validate questionnaire structure
    if (!questionnaire.version || !questionnaire.assessmentType || !questionnaire.categories) {
      return NextResponse.json(
        { error: 'Invalid questionnaire structure. Missing required fields: version, assessmentType, categories' },
        { status: 400 }
      )
    }

    const result = await RAPIDQuestionnaireService.storeQuestionnaire(questionnaire)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to store questionnaire'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        message: 'Questionnaire stored successfully'
      }
    })

  } catch (error) {
    console.error('Error storing RAPID questionnaire:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}