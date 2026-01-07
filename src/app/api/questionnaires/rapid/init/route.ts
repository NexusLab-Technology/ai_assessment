/**
 * RAPID Questionnaire Initialization API Route
 * POST /api/questionnaires/rapid/init - Initialize RAPID questionnaires in database
 * GET /api/questionnaires/rapid/init - Check initialization status
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  initializeRAPIDQuestionnaires, 
  checkRAPIDQuestionnairesAvailability,
  validateRAPIDQuestionnaireIntegrity,
  autoInitializeRAPIDQuestionnaires
} from '@/lib/rapid-questionnaire-init'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    switch (action) {
      case 'status':
        // Check availability status
        const availability = await checkRAPIDQuestionnairesAvailability()
        return NextResponse.json({
          success: true,
          data: {
            availability,
            initialized: availability.exploratory && availability.migration,
            message: availability.exploratory && availability.migration 
              ? 'RAPID questionnaires are available'
              : 'Some RAPID questionnaires are missing'
          }
        })

      case 'validate':
        // Validate data integrity
        const validation = await validateRAPIDQuestionnaireIntegrity()
        return NextResponse.json({
          success: true,
          data: {
            validation,
            message: validation.valid 
              ? 'RAPID questionnaires are valid'
              : `Validation failed: ${validation.issues.join(', ')}`
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, validate' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in RAPID questionnaire init status API:', error)
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
    const body = await request.json().catch(() => ({}))
    const { action = 'init', force = false } = body

    switch (action) {
      case 'init':
        // Initialize RAPID questionnaires
        const initResult = await initializeRAPIDQuestionnaires()
        
        return NextResponse.json({
          success: initResult.success,
          data: initResult,
          message: initResult.message
        }, {
          status: initResult.success ? 200 : 500
        })

      case 'auto-init':
        // Auto-initialize (only if missing)
        const autoInitResult = await autoInitializeRAPIDQuestionnaires()
        
        return NextResponse.json({
          success: autoInitResult.success,
          data: autoInitResult,
          message: autoInitResult.message
        }, {
          status: autoInitResult.success ? 200 : 500
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: init, auto-init' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in RAPID questionnaire init API:', error)
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