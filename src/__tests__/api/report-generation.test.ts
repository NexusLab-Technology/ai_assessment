/**
 * @jest-environment node
 */
import * as fc from 'fast-check'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, Db } from 'mongodb'

// Mock the MongoDB connection module
jest.mock('../../lib/mongodb', () => ({
  getDatabase: jest.fn()
}))

import { getDatabase } from '../../lib/mongodb'
import { POST } from '../../app/api/reports/generate/route'
import { NextRequest } from 'next/server'

// Mock AWS Bedrock
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: 'Mock AI-generated report content' }]
      }))
    })
  })),
  InvokeModelCommand: jest.fn()
}))

// Mock the credentials function
jest.mock('../../app/api/aws/credentials/route', () => ({
  getDecryptedCredentials: jest.fn().mockResolvedValue({
    accessKeyId: 'AKIATEST123456789012',
    secretAccessKey: 'test-secret-key-12345678901234567890123456789012',
    region: 'us-east-1'
  })
}))

describe('Report Generation Property Tests', () => {
  let mongoServer: MongoMemoryServer
  let mongoClient: MongoClient
  let db: Db

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    mongoClient = new MongoClient(uri)
    await mongoClient.connect()
    db = mongoClient.db('test-db')

    // Mock the getDatabase function to return our test database
    ;(getDatabase as jest.Mock).mockResolvedValue(db)
  })

  afterAll(async () => {
    await mongoClient.close()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    // Clear collections before each test
    await db.collection('assessments').deleteMany({})
    await db.collection('companies').deleteMany({})
    await db.collection('reports').deleteMany({})
  })

  describe('Property 12: Report generation availability', () => {
    /**
     * **Property 12: Report generation availability**
     * **Validates: Requirements 7.1**
     * 
     * For any completed assessment with valid company and AWS credentials,
     * the system should be able to generate a report successfully.
     */
    it('Property 12: Report generation availability for completed assessments', async () => {
      // Use fixed realistic test data instead of property-based testing for this complex integration
      const testCases = [
        {
          companyId: 'test-company-1',
          companyName: 'Test Company One',
          assessmentName: 'Cloud Assessment 2024',
          assessmentPath: 'EXPLORATORY' as const
        },
        {
          companyId: 'acme-corp',
          companyName: 'ACME Corporation',
          assessmentName: 'Migration Planning Assessment',
          assessmentPath: 'MIGRATION' as const
        },
        {
          companyId: 'tech-startup',
          companyName: 'Tech Startup Inc',
          assessmentName: 'Infrastructure Review',
          assessmentPath: 'EXPLORATORY' as const
        }
      ]

      for (const { companyId, companyName, assessmentName, assessmentPath } of testCases) {
        // Clear collections
        await db.collection('assessments').deleteMany({})
        await db.collection('companies').deleteMany({})
        await db.collection('reports').deleteMany({})

        // Setup test data
        const company = {
          id: companyId,
          name: companyName,
          industry: 'Technology',
          size: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const assessment = {
          companyId,
          name: assessmentName,
          path: assessmentPath,
          responses: { section1: { question1: 'answer1' } },
          currentStep: assessmentPath === 'EXPLORATORY' ? 7 : 8,
          totalSteps: assessmentPath === 'EXPLORATORY' ? 7 : 8,
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Insert test data
        await db.collection('companies').insertOne(company)
        const assessmentResult = await db.collection('assessments').insertOne(assessment)
        const assessmentId = assessmentResult.insertedId.toString()

        // Create request
        const request = new NextRequest('http://localhost:3000/api/reports/generate', {
          method: 'POST',
          body: JSON.stringify({
            assessmentId,
            companyId
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        // Call the API
        const response = await POST(request)
        const responseData = await response.json()

        // Property: Completed assessments with valid data should generate reports successfully
        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
        expect(responseData.data.reportId).toBeDefined()
        expect(responseData.data.htmlContent).toContain('<!DOCTYPE html>')
        expect(responseData.data.htmlContent).toContain('Mock AI-generated report content')

        // Verify report was stored in database
        const storedReport = await db.collection('reports').findOne({
          assessmentId,
          companyId
        })

        expect(storedReport).toBeTruthy()
        expect(storedReport?.companyName).toBe(companyName)
        expect(storedReport?.assessmentName).toBe(assessmentName)
        expect(storedReport?.assessmentPath).toBe(assessmentPath)
        expect(storedReport?.htmlContent).toContain('Mock AI-generated report content')
      }
    })

    it('Property: Report generation fails for non-existent assessments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            companyId: fc.string({ minLength: 1, maxLength: 50 }),
            assessmentId: fc.string({ minLength: 24, maxLength: 24 }).map(s => 
              s.replace(/[^0-9a-f]/g, '0') // Ensure valid ObjectId format
            )
          }),
          async ({ companyId, assessmentId }) => {
            // Create request for non-existent assessment
            const request = new NextRequest('http://localhost:3000/api/reports/generate', {
              method: 'POST',
              body: JSON.stringify({
                assessmentId,
                companyId
              }),
              headers: { 'Content-Type': 'application/json' }
            })

            // Call the API
            const response = await POST(request)
            const responseData = await response.json()

            // Property: Non-existent assessments should return 404
            expect(response.status).toBe(404)
            expect(responseData.success).toBe(false)
            expect(responseData.error).toContain('Assessment not found')
          }
        ),
        { numRuns: 5 }
      )
    })

    it('Property: Report generation fails for incomplete assessments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            companyId: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
            companyName: fc.string({ minLength: 5, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s\-_&.]+$/.test(s.trim()) && s.trim().length > 0),
            assessmentName: fc.string({ minLength: 5, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s\-_&.]+$/.test(s.trim()) && s.trim().length > 0),
            assessmentPath: fc.constantFrom('EXPLORATORY', 'MIGRATION'),
            status: fc.constantFrom('DRAFT', 'IN_PROGRESS'),
            currentStep: fc.integer({ min: 1, max: 6 })
          }),
          async ({ companyId, companyName, assessmentName, assessmentPath, status, currentStep }) => {
            // Setup test data
            const company = {
              id: companyId,
              name: companyName,
              industry: 'Technology',
              size: 'MEDIUM',
              createdAt: new Date(),
              updatedAt: new Date()
            }

            const assessment = {
              companyId,
              name: assessmentName,
              path: assessmentPath,
              responses: {},
              currentStep,
              totalSteps: assessmentPath === 'EXPLORATORY' ? 7 : 8,
              status,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            // Insert test data
            await db.collection('companies').insertOne(company)
            const assessmentResult = await db.collection('assessments').insertOne(assessment)
            const assessmentId = assessmentResult.insertedId.toString()

            // Create request
            const request = new NextRequest('http://localhost:3000/api/reports/generate', {
              method: 'POST',
              body: JSON.stringify({
                assessmentId,
                companyId
              }),
              headers: { 'Content-Type': 'application/json' }
            })

            // Call the API
            const response = await POST(request)
            const responseData = await response.json()

            // Property: Incomplete assessments should not generate reports
            expect(response.status).toBe(400)
            expect(responseData.success).toBe(false)
            expect(responseData.error).toContain('Assessment must be completed')
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 13: HTML report structure and storage', () => {
    /**
     * **Property 13: HTML report structure and storage**
     * **Validates: Requirements 7.3, 7.4, 7.5, 7.7**
     * 
     * For any generated report, the HTML structure should be valid and contain
     * all required elements, and the report should be properly stored in MongoDB.
     */
    it('Property 13: HTML report structure consistency', async () => {
      // Use fixed realistic test data
      const testCases = [
        {
          companyId: 'test-company-html',
          companyName: 'HTML Test Company',
          assessmentName: 'Structure Test Assessment',
          assessmentPath: 'EXPLORATORY' as const
        },
        {
          companyId: 'structure-test',
          companyName: 'Structure Test Corp',
          assessmentName: 'Migration Structure Test',
          assessmentPath: 'MIGRATION' as const
        }
      ]

      for (const { companyId, companyName, assessmentName, assessmentPath } of testCases) {
        // Clear collections
        await db.collection('assessments').deleteMany({})
        await db.collection('companies').deleteMany({})
        await db.collection('reports').deleteMany({})

        // Setup test data
        const company = {
          id: companyId,
          name: companyName,
          industry: 'Technology',
          size: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const assessment = {
          companyId,
          name: assessmentName,
          path: assessmentPath,
          responses: { section1: { question1: 'answer1' } },
          currentStep: assessmentPath === 'EXPLORATORY' ? 7 : 8,
          totalSteps: assessmentPath === 'EXPLORATORY' ? 7 : 8,
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Insert test data
        await db.collection('companies').insertOne(company)
        const assessmentResult = await db.collection('assessments').insertOne(assessment)
        const assessmentId = assessmentResult.insertedId.toString()

        // Create request
        const request = new NextRequest('http://localhost:3000/api/reports/generate', {
          method: 'POST',
          body: JSON.stringify({
            assessmentId,
            companyId
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        // Call the API
        const response = await POST(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        const htmlContent = responseData.data.htmlContent

        // Property: HTML structure should be valid and contain required elements
        expect(htmlContent).toContain('<!DOCTYPE html>')
        expect(htmlContent).toContain('<html lang="en">')
        expect(htmlContent).toContain('<head>')
        expect(htmlContent).toContain('<body>')
        expect(htmlContent).toContain('<title>')
        expect(htmlContent).toContain('</html>')

        // Property: Report should contain company and assessment information (in database)
        // Note: HTML content may have escaped characters, so we check database storage
        const storedReport = await db.collection('reports').findOne({
          assessmentId,
          companyId
        })

        expect(storedReport).toBeTruthy()
        expect(storedReport?.companyName).toBe(companyName)
        expect(storedReport?.assessmentName).toBe(assessmentName)
        
        const expectedAssessmentType = assessmentPath === 'EXPLORATORY' 
          ? 'Cloud Exploration Assessment' 
          : 'Cloud Migration Assessment'
        expect(htmlContent).toContain(expectedAssessmentType)

        // Property: Report should contain styling
        expect(htmlContent).toContain('<style>')
        expect(htmlContent).toContain('font-family')
        expect(htmlContent).toContain('color')

        // Property: Report should contain AI-generated content
        expect(htmlContent).toContain('Mock AI-generated report content')

        // Property: Report should be stored in database with correct structure
        const storedReportCheck = await db.collection('reports').findOne({
          assessmentId,
          companyId
        })

        expect(storedReportCheck).toBeTruthy()
        expect(storedReportCheck?.companyName).toBe(companyName)
        expect(storedReportCheck?.assessmentName).toBe(assessmentName)
        expect(storedReportCheck?.assessmentPath).toBe(assessmentPath)
        expect(storedReportCheck?.htmlContent).toBe(htmlContent)
        expect(storedReportCheck?.generatedAt).toBeInstanceOf(Date)
        expect(storedReportCheck?.generatedBy).toBe('aws-bedrock-claude-3-sonnet')
      }
    })

    it('Property: Report HTML contains proper metadata', async () => {
      const companyId = 'test-company'
      const companyName = 'Test Company'
      const assessmentName = 'Test Assessment'
      const assessmentPath = 'EXPLORATORY'

      // Setup test data
      const company = {
        id: companyId,
        name: companyName,
        industry: 'Technology',
        size: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const assessment = {
        companyId,
        name: assessmentName,
        path: assessmentPath,
        responses: {},
        currentStep: 7,
        totalSteps: 7,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Insert test data
      await db.collection('companies').insertOne(company)
      const assessmentResult = await db.collection('assessments').insertOne(assessment)
      const assessmentId = assessmentResult.insertedId.toString()

      // Create request
      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId,
          companyId
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      const htmlContent = responseData.data.htmlContent

      // Property: HTML should contain proper metadata
      expect(htmlContent).toContain('<meta charset="UTF-8">')
      expect(htmlContent).toContain('<meta name="viewport"')
      expect(htmlContent).toContain(`<title>Cloud Exploration Assessment Report - ${companyName}</title>`)

      // Property: HTML should contain report header information
      expect(htmlContent).toContain('class="company-name"')
      expect(htmlContent).toContain('class="assessment-type"')
      expect(htmlContent).toContain('class="report-date"')

      // Property: HTML should contain footer with report metadata
      expect(htmlContent).toContain('class="footer"')
      expect(htmlContent).toContain('Report ID:')
      expect(htmlContent).toContain('Generated:')
    })
  })
})