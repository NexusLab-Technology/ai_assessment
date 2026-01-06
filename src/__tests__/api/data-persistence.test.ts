/**
 * Property-based tests for data persistence
 * Tests Task 10.3: Property 8 - Assessment state persistence
 * Validates Requirements 5.3
 */

import fc from 'fast-check'
import { AssessmentDocument } from '../../lib/models/assessment'
import { CompanyModel } from '../../lib/models/Company'
import { ReportModel } from '../../lib/models/Report'
import { getDatabase } from '../../lib/mongodb'

// Mock user ID for testing
const TEST_USER_ID = 'test-user-persistence'

// Setup and teardown
beforeAll(async () => {
  await getDatabase()
})

afterEach(async () => {
  // Clean up test data after each test
  const assessmentCollection = await AssessmentModel.getCollection()
  const companyCollection = await CompanyModel.getCollection()
  const reportCollection = await ReportModel.getCollection()
  
  await assessmentCollection.deleteMany({ userId: TEST_USER_ID })
  await companyCollection.deleteMany({ userId: TEST_USER_ID })
  await reportCollection.deleteMany({ userId: TEST_USER_ID })
})

describe('Data Persistence Property Tests', () => {
  /**
   * Property 8: Assessment state persistence
   * Validates: Requirements 5.3
   * 
   * Tests that assessment state (responses, current step, status) 
   * is correctly persisted and retrieved from the database
   */
  test('Property 8: Assessment state persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 50 }),
          assessmentName: fc.string({ minLength: 1, maxLength: 50 }),
          assessmentType: fc.constantFrom('EXPLORATORY', 'MIGRATION'),
          responses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }), // stepId
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }), // questionId
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.array(fc.string())
              )
            )
          ),
          currentStep: fc.integer({ min: 1, max: 8 }),
          status: fc.constantFrom('DRAFT', 'IN_PROGRESS', 'COMPLETED')
        }),
        async (testData) => {
          // Create company first
          const company = await CompanyModel.create({
            name: testData.companyName,
            userId: TEST_USER_ID
          })

          // Create assessment
          const assessment = await AssessmentModel.create({
            name: testData.assessmentName,
            companyId: company.id,
            type: testData.assessmentType as 'EXPLORATORY' | 'MIGRATION',
            userId: TEST_USER_ID
          })

          // Update assessment with responses and state
          const updatedAssessment = await AssessmentModel.update(
            assessment.id,
            TEST_USER_ID,
            {
              responses: testData.responses,
              currentStep: Math.min(testData.currentStep, assessment.totalSteps),
              status: testData.status as 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED',
              ...(testData.status === 'COMPLETED' ? { completedAt: new Date() } : {})
            }
          )

          // Verify persistence by retrieving from database
          const retrievedAssessment = await AssessmentModel.findById(assessment.id, TEST_USER_ID)

          // Assertions
          expect(retrievedAssessment).not.toBeNull()
          expect(retrievedAssessment!.id).toBe(assessment.id)
          expect(retrievedAssessment!.name).toBe(testData.assessmentName)
          expect(retrievedAssessment!.type).toBe(testData.assessmentType)
          expect(retrievedAssessment!.status).toBe(testData.status)
          expect(retrievedAssessment!.currentStep).toBe(Math.min(testData.currentStep, assessment.totalSteps))

          // Verify responses are persisted correctly
          const collection = await AssessmentModel.getCollection()
          const document = await collection.findOne({ 
            _id: new (require('mongodb').ObjectId)(assessment.id),
            userId: TEST_USER_ID 
          })
          
          expect(document).not.toBeNull()
          expect(document!.responses).toEqual(testData.responses)

          // If completed, verify completedAt is set
          if (testData.status === 'COMPLETED') {
            expect(retrievedAssessment!.completedAt).toBeDefined()
            expect(retrievedAssessment!.completedAt).toBeInstanceOf(Date)
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    )
  })

  /**
   * Property: Company-Assessment relationship integrity
   * Validates that assessments are correctly associated with companies
   * and filtering by company works correctly
   */
  test('Property: Company-Assessment relationship integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
            assessments: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }),
                type: fc.constantFrom('EXPLORATORY', 'MIGRATION')
              }),
              { minLength: 0, maxLength: 5 }
            )
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (companiesData) => {
          const createdCompanies = []
          const createdAssessments = []

          // Create companies and their assessments
          for (const companyData of companiesData) {
            const company = await CompanyModel.create({
              name: companyData.companyName,
              userId: TEST_USER_ID
            })
            createdCompanies.push(company)

            for (const assessmentData of companyData.assessments) {
              const assessment = await AssessmentModel.create({
                name: assessmentData.name,
                companyId: company.id,
                type: assessmentData.type as 'EXPLORATORY' | 'MIGRATION',
                userId: TEST_USER_ID
              })
              createdAssessments.push({ ...assessment, expectedCompanyId: company.id })
            }
          }

          // Test filtering by company
          for (const company of createdCompanies) {
            const companyAssessments = await AssessmentModel.getByCompany(company.id, TEST_USER_ID)
            const expectedCount = createdAssessments.filter(a => a.expectedCompanyId === company.id).length
            
            expect(companyAssessments).toHaveLength(expectedCount)
            
            // Verify all returned assessments belong to the correct company
            for (const assessment of companyAssessments) {
              expect(assessment.companyId).toBe(company.id)
            }
          }

          // Test getting all assessments
          const allAssessments = await AssessmentModel.findAll(TEST_USER_ID)
          expect(allAssessments).toHaveLength(createdAssessments.length)
        }
      ),
      { numRuns: 10, timeout: 15000 }
    )
  })

  /**
   * Property: Response preservation during step navigation
   * Validates that responses are preserved when navigating between steps
   */
  test('Property: Response preservation during step navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 50 }),
          assessmentName: fc.string({ minLength: 1, maxLength: 50 }),
          stepSequence: fc.array(
            fc.record({
              stepId: fc.string({ minLength: 1, maxLength: 20 }),
              responses: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.oneof(fc.string(), fc.integer(), fc.boolean())
              ),
              currentStep: fc.integer({ min: 1, max: 7 })
            }),
            { minLength: 2, maxLength: 5 }
          )
        }),
        async (testData) => {
          // Create company and assessment
          const company = await CompanyModel.create({
            name: testData.companyName,
            userId: TEST_USER_ID
          })

          const assessment = await AssessmentModel.create({
            name: testData.assessmentName,
            companyId: company.id,
            type: 'EXPLORATORY',
            userId: TEST_USER_ID
          })

          const allResponses: any = {}

          // Simulate step navigation with response saving
          for (const step of testData.stepSequence) {
            await AssessmentModel.saveResponses(
              assessment.id,
              TEST_USER_ID,
              step.stepId,
              step.responses,
              step.currentStep
            )

            // Accumulate expected responses
            allResponses[step.stepId] = step.responses
          }

          // Retrieve assessment and verify all responses are preserved
          const collection = await AssessmentModel.getCollection()
          const document = await collection.findOne({ 
            _id: new (require('mongodb').ObjectId)(assessment.id),
            userId: TEST_USER_ID 
          })

          expect(document).not.toBeNull()
          expect(document!.responses).toEqual(allResponses)

          // Verify current step is set to the last step
          const lastStep = testData.stepSequence[testData.stepSequence.length - 1]
          expect(document!.currentStep).toBe(lastStep.currentStep)
          expect(document!.status).toBe('IN_PROGRESS')
        }
      ),
      { numRuns: 15, timeout: 12000 }
    )
  })

  /**
   * Property: Report-Assessment association integrity
   * Validates that reports are correctly associated with assessments
   */
  test('Property: Report-Assessment association integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 50 }),
          assessmentName: fc.string({ minLength: 1, maxLength: 50 }),
          htmlContent: fc.string({ minLength: 100, maxLength: 1000 }),
          metadata: fc.record({
            assessmentType: fc.constantFrom('EXPLORATORY', 'MIGRATION'),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
            generationDuration: fc.integer({ min: 100, max: 10000 }),
            bedrockModel: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        async (testData) => {
          // Create company and assessment
          const company = await CompanyModel.create({
            name: testData.companyName,
            userId: TEST_USER_ID
          })

          const assessment = await AssessmentModel.create({
            name: testData.assessmentName,
            companyId: company.id,
            type: testData.metadata.assessmentType as 'EXPLORATORY' | 'MIGRATION',
            userId: TEST_USER_ID
          })

          // Mark assessment as completed
          await AssessmentModel.update(assessment.id, TEST_USER_ID, {
            status: 'COMPLETED',
            completedAt: new Date()
          })

          // Create report
          const report = await ReportModel.create({
            assessmentId: assessment.id,
            companyId: company.id,
            htmlContent: testData.htmlContent,
            metadata: testData.metadata,
            userId: TEST_USER_ID
          })

          // Verify report-assessment association
          const retrievedReport = await ReportModel.findByAssessmentId(assessment.id, TEST_USER_ID)
          expect(retrievedReport).not.toBeNull()
          expect(retrievedReport!.id).toBe(report.id)
          expect(retrievedReport!.assessmentId).toBe(assessment.id)
          expect(retrievedReport!.companyId).toBe(company.id)
          expect(retrievedReport!.htmlContent).toBe(testData.htmlContent)
          expect(retrievedReport!.metadata).toEqual(testData.metadata)

          // Verify report appears in company reports
          const companyReports = await ReportModel.getByCompany(company.id, TEST_USER_ID)
          expect(companyReports).toHaveLength(1)
          expect(companyReports[0].id).toBe(report.id)
        }
      ),
      { numRuns: 10, timeout: 10000 }
    )
  })
})