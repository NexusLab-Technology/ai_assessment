import { NextRequest, NextResponse } from 'next/server'

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

/**
 * Create an error API response
 */
export function createErrorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error
  }, { status })
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500)
  }
  
  return createErrorResponse('Internal server error', 500)
}

/**
 * Get user ID from request (placeholder for auth integration)
 * In a real app, this would extract user ID from JWT token or session
 */
export function getUserId(request: NextRequest): string {
  // For development, return a mock user ID
  // In production, this would validate JWT token and return actual user ID
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In real implementation, decode JWT token here
    return 'mock-user-id'
  }
  
  // For development without auth, return a default user ID
  return 'dev-user-id'
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any, 
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field)
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json()
    return body
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Extract pagination parameters from URL
 */
export function getPaginationParams(request: NextRequest): {
  page: number
  limit: number
  skip: number
} {
  const { searchParams } = new URL(request.url)
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<{
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }
}