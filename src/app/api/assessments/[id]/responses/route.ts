/**
 * Assessment Responses API Route
 * PUT /api/assessments/[id]/responses - Update category-based responses
 * GET /api/assessments/[id]/responses - Get assessment responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssessmentService } from '@/lib/services/assessment-service'
import { CategoryCompletionStatus } from '@/types/rapid-questionnaire'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    return NextResponse.json({
      success: true,
      data: {
        responses: assessment.responses,
        categoryStatuses: assessment.categoryStatuses,
        currentCategory: assessment.currentCategory,
        currentSubcategory: assessment.currentSubcategory,
        status: assessment.status
      }
    })

  } catch (error) {
    console.error('Error getting assessment responses:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const { 
      categoryId, 
      responses, 
      categoryStatus,
      currentCategory,
      currentSubcategory 
    } = body

    // Validate required fields
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Update category responses if provided
    if (responses) {
      const responseResult = await AssessmentService.updateCategoryResponses(id, categoryId, responses)
      
      if (!responseResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: responseResult.error || 'Failed to update responses'
          },
          { status: 500 }
        )
      }
    }

    // Update category status if provided
    if (categoryStatus) {
      const statusResult = await AssessmentService.updateCategoryStatus(id, categoryId, categoryStatus)
      
      if (!statusResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: statusResult.error || 'Failed to update category status'
          },
          { status: 500 }
        )
      }
    }

    // Update current category if provided
    if (currentCategory) {
      const categoryResult = await AssessmentService.updateCurrentCategory(
        id, 
        currentCategory, 
        currentSubcategory
      )
      
      if (!categoryResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: categoryResult.error || 'Failed to update current category'
          },
          { status: 500 }
        )
      }
    }

    // Get updated assessment data
    const updatedAssessment = await AssessmentService.getAssessment(id)
    
    return NextResponse.json({
      success: true,
      data: {
        responses: updatedAssessment?.responses || {},
        categoryStatuses: updatedAssessment?.categoryStatuses || {},
        currentCategory: updatedAssessment?.currentCategory,
        currentSubcategory: updatedAssessment?.currentSubcategory,
        message: 'Assessment updated successfully'
      }
    })

  } catch (error) {
    console.error('Error updating assessment responses:', error)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const { action } = body

    if (action === 'complete') {
      const result = await AssessmentService.completeAssessment(id)
      
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false,
            error: result.error || 'Failed to complete assessment'
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Assessment completed successfully'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: complete' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in assessment action:', error)
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