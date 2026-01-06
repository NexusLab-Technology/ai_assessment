import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, checkDatabaseHealth } from '@/lib/db-init'

export async function GET(request: NextRequest) {
  try {
    // Check database health first
    const health = await checkDatabaseHealth()
    
    return NextResponse.json({
      success: true,
      health
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    const result = await initializeDatabase()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Database initialization failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}