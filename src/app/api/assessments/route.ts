import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { AssessmentDocument, COLLECTIONS } from '../../../lib/models/assessment'

// GET /api/assessments - Get assessments with optional company filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId') || 'default-user' // TODO: Get from auth
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    
    // Build query
    const query: any = { userId }
    if (companyId) {
      query.companyId = new ObjectId(companyId)
    }
    
    // Get assessments sorted by updatedAt descending
    const assessments = await assessmentsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()
    
    // Transform ObjectIds to strings for JSON serialization
    const transformedAssessments = assessments.map(assessment => ({
      ...assessment,
      _id: assessment._id?.toString(),
      companyId: assessment.companyId?.toString(),
      id: assessment._id?.toString() // Add id field for frontend compatibility
    }))
    
    return NextResponse.json({
      success: true,
      assessments: transformedAssessments
    })
    
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/assessments - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, companyId, type } = body
    
    // Validate required fields
    if (!name || !companyId || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, companyId, type'
        },
        { status: 400 }
      )
    }
    
    // Validate type
    if (!['EXPLORATORY', 'MIGRATION'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assessment type. Must be EXPLORATORY or MIGRATION'
        },
        { status: 400 }
      )
    }
    
    const userId = 'default-user' // TODO: Get from auth
    const now = new Date()
    
    // Determine total steps based on type
    const totalSteps = type === 'EXPLORATORY' ? 7 : 8
    
    // Create assessment document
    const assessmentDoc: AssessmentDocument = {
      name,
      companyId: new ObjectId(companyId),
      userId,
      type,
      status: 'DRAFT',
      currentStep: 1,
      totalSteps,
      responses: {},
      stepStatuses: {},
      createdAt: now,
      updatedAt: now
    }
    
    // Initialize step statuses
    for (let i = 1; i <= totalSteps; i++) {
      assessmentDoc.stepStatuses[i] = {
        status: 'not_started',
        lastModified: now,
        requiredFieldsCount: 0,
        filledFieldsCount: 0
      }
    }
    
    const assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
    const result = await assessmentsCollection.insertOne(assessmentDoc)
    
    // Return created assessment
    const createdAssessment = {
      ...assessmentDoc,
      _id: result.insertedId.toString(),
      companyId: companyId,
      id: result.insertedId.toString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    
    return NextResponse.json({
      success: true,
      assessment: createdAssessment
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}