/**
 * Mock Assessments API Route for Demo
 * GET /api/assessments - List assessments
 * POST /api/assessments - Create new assessment
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock assessments data for demo
const mockAssessments: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    // Filter by company if provided
    const filteredAssessments = companyId 
      ? mockAssessments.filter(a => a.companyId === companyId)
      : mockAssessments
    
    return NextResponse.json({
      success: true,
      data: {
        assessments: filteredAssessments,
        total: filteredAssessments.length
      }
    })

  } catch (error) {
    console.error('Error listing assessments:', error)
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
    const { name, companyId, type } = body

    // Validate required fields
    if (!name || !companyId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, companyId, type' },
        { status: 400 }
      )
    }

    // Validate assessment type
    if (!['EXPLORATORY', 'MIGRATION'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid assessment type. Must be EXPLORATORY or MIGRATION' },
        { status: 400 }
      )
    }

    const newAssessment = {
      id: `demo-assessment-${Date.now()}`,
      name,
      companyId,
      type,
      status: 'DRAFT',
      currentStep: 1,
      responses: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockAssessments.push(newAssessment)
    
    return NextResponse.json({
      success: true,
      data: {
        assessment: newAssessment,
        message: 'Assessment created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating assessment:', error)
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