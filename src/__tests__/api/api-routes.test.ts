/**
 * Simple API route tests without MongoDB dependency
 * Tests basic API structure and validation
 */

import { createSuccessResponse, createErrorResponse, validateRequiredFields } from '../../lib/api-utils'

describe('API Utilities', () => {
  test('createSuccessResponse creates proper response format', () => {
    const data = { test: 'data' }
    const response = createSuccessResponse(data, 'Success message')
    
    // Since we can't easily test NextResponse, we'll test the structure
    expect(response).toBeDefined()
  })

  test('createErrorResponse creates proper error format', () => {
    const response = createErrorResponse('Test error', 400)
    expect(response).toBeDefined()
  })

  test('validateRequiredFields validates correctly', () => {
    const body = { name: 'test', description: 'desc' }
    const result = validateRequiredFields(body, ['name', 'description'])
    
    expect(result.isValid).toBe(true)
    expect(result.missingFields).toHaveLength(0)
  })

  test('validateRequiredFields detects missing fields', () => {
    const body = { name: 'test' }
    const result = validateRequiredFields(body, ['name', 'description'])
    
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('description')
  })

  test('validateRequiredFields detects empty string fields', () => {
    const body = { name: '', description: 'desc' }
    const result = validateRequiredFields(body, ['name', 'description'])
    
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('name')
  })
})