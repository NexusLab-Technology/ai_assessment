import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { AssessmentDocument, COLLECTIONS } from '@/lib/models/assessment'

// GET /api/assessments/[id] - Get specific assessment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assessment ID'
        },
        { status: 400 }
      )
    }
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    const assessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id)
    })
    
    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }
    
    // Transform ObjectIds to strings
    const transformedAssessment = {
      ...assessment,
      _id: assessment._id?.toString(),
      companyId: assessment.companyId?.toString(),
      id: assessment._id?.toString()
    }
    
    return NextResponse.json({
      success: true,
      assessment: transformedAssessment
    })
    
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/assessments/[id] - Update assessment with step status tracking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assessment ID'
        },
        { status: 400 }
      )
    }
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    
    // Check if assessment exists
    const existingAssessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id)
    })
    
    if (!existingAssessment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }
    
    const now = new Date()
    const updateData: Partial<AssessmentDocument> = {
      updatedAt: now
    }
    
    // Handle different update types
    if (body.responses) {
      updateData.responses = body.responses
    }
    
    if (body.currentStep !== undefined) {
      updateData.currentStep = body.currentStep
    }
    
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'COMPLETED') {
        updateData.completedAt = now
      }
    }
    
    if (body.stepStatuses) {
      updateData.stepStatuses = body.stepStatuses
    }
    
    // Update step status if provided
    if (body.stepNumber && body.stepStatus) {
      const stepStatuses = existingAssessment.stepStatuses || {}
      stepStatuses[body.stepNumber] = {
        ...stepStatuses[body.stepNumber],
        status: body.stepStatus.status,
        lastModified: now,
        requiredFieldsCount: body.stepStatus.requiredFieldsCount || 0,
        filledFieldsCount: body.stepStatus.filledFieldsCount || 0
      }
      updateData.stepStatuses = stepStatuses
    }
    
    // Perform update
    const result = await assessmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }
    
    // Get updated assessment
    const updatedAssessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id)
    })
    
    const transformedAssessment = {
      ...updatedAssessment,
      _id: updatedAssessment?._id?.toString(),
      companyId: updatedAssessment?.companyId?.toString(),
      id: updatedAssessment?._id?.toString()
    }
    
    return NextResponse.json({
      success: true,
      assessment: transformedAssessment
    })
    
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assessment ID'
        },
        { status: 400 }
      )
    }
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    
    // Check if assessment exists and is deletable (only DRAFT status)
    const assessment = await assessmentsCollection.findOne({
      _id: new ObjectId(id)
    })
    
    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }
    
    if (assessment.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft assessments can be deleted'
        },
        { status: 400 }
      )
    }
    
    // Delete assessment
    const result = await assessmentsCollection.deleteOne({
      _id: new ObjectId(id)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete assessment'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}