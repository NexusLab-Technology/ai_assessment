import { NextRequest, NextResponse } from 'next/server'

// Mock companies data for demo
const mockCompanies = [
  {
    id: 'demo-company-1',
    name: 'Test Company',
    description: 'Demo company for testing AI Assessment',
    createdAt: new Date().toISOString(),
    assessmentCount: 0
  },
  {
    id: 'demo-company-2', 
    name: 'Sample Corp',
    description: 'Another demo company',
    createdAt: new Date().toISOString(),
    assessmentCount: 2
  }
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        companies: mockCompanies
      }
    })
  } catch (error) {
    console.error('Error in GET /api/companies:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch companies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newCompany = {
      id: `demo-company-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      assessmentCount: 0
    }
    
    mockCompanies.push(newCompany)
    
    return NextResponse.json({
      success: true,
      data: newCompany
    })
  } catch (error) {
    console.error('Error in POST /api/companies:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create company',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}