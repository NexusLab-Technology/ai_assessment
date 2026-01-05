/**
 * Unit tests for questionnaires API endpoint
 * Feature: assessment-status-ui, Task 4.1
 */

const { GET } = require('../../app/api/questionnaires/route')
const { NextRequest } = require('next/server')

// Mock the questionnaire data
jest.mock('../../data/mock-questionnaire.json', () => ({
  exploratory: [
    {
      id: 'test-section-1',
      title: 'Test Section 1',
      description: 'Test description',
      stepNumber: 1,
      questions: [
        {
          id: 'test-question-1',
          type: 'text',
          label: 'Test Question',
          required: true
        }
      ]
    }
  ],
  migration: [
    {
      id: 'test-section-2',
      title: 'Test Section 2',
      description: 'Test description',
      stepNumber: 1,
      questions: [
        {
          id: 'test-question-2',
          type: 'textarea',
          label: 'Test Question 2',
          required: false
        }
      ]
    }
  ]
}))

describe('Questionnaires API Tests', () => {
  describe('GET /api/questionnaires', () => {
    it('should return exploratory questionnaire sections', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires?type=exploratory')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Questionnaire sections retrieved successfully')
      expect(data.data.type).toBe('exploratory')
      expect(data.data.sections).toHaveLength(1)
      expect(data.data.sections[0].id).toBe('test-section-1')
      expect(data.data.sections[0].questions).toHaveLength(1)
    })

    it('should return migration questionnaire sections', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires?type=migration')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.type).toBe('migration')
      expect(data.data.sections).toHaveLength(1)
      expect(data.data.sections[0].id).toBe('test-section-2')
    })

    it('should return 400 error when type parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Assessment type is required')
    })

    it('should return 400 error for invalid assessment type', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires?type=invalid')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid assessment type. Must be "exploratory" or "migration"')
    })

    it('should handle empty query parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires?type=')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Assessment type is required')
    })
  })
})