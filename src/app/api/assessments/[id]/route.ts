/**
 * Individual Assessment API Route
 * GET /api/assessments/[id] - Get assessment by ID
 * PUT /api/assessments/[id] - Update assessment
 * DELETE /api/assessments/[id] - Delete assessment
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssessmentService } from '@/lib/services/assessment-service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const assessment = await AssessmentService.getAssessment(id)
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Get assessment statistics
    const statistics = await AssessmentService.getAssessmentStatistics(id)

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        statistics
      }
    })

  } catch (error) {
    console.error('Error getting assessment:', error)
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const { currentCategory, currentSubcategory } = body

    // Update current category if provided
    if (currentCategory) {
      const result = await AssessmentService.updateCurrentCategory(
        id, 
        currentCategory, 
        currentSubcategory
      )
      
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false,
            error: result.error || 'Failed to update assessment'
          },
          { status: 500 }
        )
      }
    }

    // Get updated assessment
    const assessment = await AssessmentService.getAssessment(id)
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        message: 'Assessment updated successfully'
      }
    })

  } catch (error) {
    console.error('Error updating assessment:', error)
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const result = await AssessmentService.deleteAssessment(id)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to delete assessment'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Assessment deleted successfully'
      }
    })

  } catch (error) {
    console.error('Error deleting assessment:', error)
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