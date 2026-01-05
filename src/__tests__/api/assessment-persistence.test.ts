import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, Db } from 'mongodb'
import * as fc from 'fast-check'

/**
 * Property-Based Test for Assessment State Persistence
 * **Property 8: Assessment state persistence**
 * **Validates: Requirements 5.3**
 * 
 * Tests that for any assessment that is saved and later restored,
 * all responses and the current step position should be identical
 * to when it was last saved.
 */

// Mock the mongodb module to use our test database
let testClient: MongoClient
let testDb: Db

// Mock the mongodb connection functions
jest.mock('../../lib/mongodb', () => ({
  getDatabase: jest.fn(() => testDb),
  getCollection: jest.fn((collectionName: string) => testDb.collection(collectionName)),
}))

// Import models after mocking
import { AssessmentModel } from '../../lib/models/Assessment'
import { CompanyModel } from '../../lib/models/Company'

describe('Assessment State Persistence - Property Tests', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    
    // Connect to the test database
    testClient = new MongoClient(uri)
    await testClient.connect()
    testDb = testClient.db('test-ai-assessment')
  })

  afterAll(async () => {
    if (testClient) {
      await testClient.close()
    }
    if (mongoServer) {
      await mongoServer.stop()
    }
  })

  beforeEach(async () => {
    // Clean up collections before each test
    await testDb.collection('assessments').deleteMany({})
    await testDb.collection('companies').deleteMany({})
  })

  /**
   * Property 8: Assessment state persistence
   * For any assessment that is saved and later restored,
   * all responses and the current step position should be identical
   * to when it was last saved
   */
  test('Property 8: Assessment state persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          // Company data
          companyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          
          // Assessment data
          assessmentName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          assessmentType: fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const),
          userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          
          // Step progression data
          targetStep: fc.integer({ min: 1, max: 8 }),
          
          // Response data - generate realistic assessment responses
          responses: fc.dictionary(
            // Step IDs (step-1, step-2, etc.) - ensure valid MongoDB field names
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('.')),
            // Response data for each step
            fc.dictionary(
              // Question IDs - ensure valid MongoDB field names
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && !s.includes('.')),
              // Question responses (various types)
              fc.oneof(
                fc.string({ maxLength: 500 }), // text responses
                fc.integer({ min: 0, max: 100 }), // number responses
                fc.array(fc.string({ maxLength: 100 })), // multiselect responses
                fc.boolean() // checkbox responses
              )
            )
          )
        }),
        
        async (testData) => {
          const { 
            companyName, 
            assessmentName, 
            assessmentType, 
            userId, 
            targetStep,
            responses 
          } = testData

          // Step 1: Create a company
          const company = await CompanyModel.create({
            name: companyName,
            description: 'Test company for persistence testing',
            userId
          })

          // Step 2: Create an assessment
          const assessment = await AssessmentModel.create({
            name: assessmentName,
            companyId: company.id,
            type: assessmentType,
            userId
          })

          // Ensure target step doesn't exceed total steps
          const validTargetStep = Math.min(targetStep, assessment.totalSteps)

          // Step 3: Save responses for multiple steps leading up to target step
          const savedResponses: { [stepId: string]: { [questionId: string]: any } } = {}
          let actualFinalStep = 1 // Track the actual final step that was saved

          // Save responses for each step up to the target step
          for (let step = 1; step <= validTargetStep; step++) {
            const stepId = `step-${step}`
            const stepResponses = responses[stepId] || {}
            
            // Only save if there are responses for this step
            if (Object.keys(stepResponses).length > 0) {
              savedResponses[stepId] = stepResponses
              
              const updatedAssessment = await AssessmentModel.saveResponses(
                assessment.id,
                userId,
                stepId,
                stepResponses,
                step
              )
              
              expect(updatedAssessment).not.toBeNull()
              if (updatedAssessment) {
                actualFinalStep = step // Update the actual final step
              }
            }
          }

          // Step 4: Retrieve the assessment from database (simulating restoration)
          const restoredAssessment = await AssessmentModel.findById(assessment.id, userId)
          expect(restoredAssessment).not.toBeNull()

          // Step 5: Get the full assessment document with responses
          const collection = testDb.collection('assessments')
          const fullDocument = await collection.findOne({ 
            _id: new (require('mongodb').ObjectId)(assessment.id), 
            userId 
          })
          expect(fullDocument).not.toBeNull()

          // Property Verification: All saved data should be identical when restored
          
          // Verify current step position is preserved (only if we actually saved responses)
          if (Object.keys(savedResponses).length > 0) {
            expect(restoredAssessment!.currentStep).toBe(actualFinalStep)
          } else {
            // If no responses were saved, step should remain at initial value
            expect(restoredAssessment!.currentStep).toBe(1)
          }
          
          // Verify all responses are preserved exactly as saved
          const restoredResponses = fullDocument!.responses || {}
          
          // Check that all saved responses are present and identical
          for (const [stepId, stepResponses] of Object.entries(savedResponses)) {
            expect(restoredResponses[stepId]).toBeDefined()
            
            // Verify each question response is identical
            for (const [questionId, expectedResponse] of Object.entries(stepResponses)) {
              expect(restoredResponses[stepId][questionId]).toEqual(expectedResponse)
            }
          }
          
          // Verify assessment metadata is preserved
          expect(restoredAssessment!.id).toBe(assessment.id)
          expect(restoredAssessment!.name).toBe(assessmentName)
          expect(restoredAssessment!.companyId).toBe(company.id)
          expect(restoredAssessment!.type).toBe(assessmentType)
          expect(restoredAssessment!.totalSteps).toBe(assessment.totalSteps)
          
          // Verify status progression
          if (Object.keys(savedResponses).length > 0) {
            expect(restoredAssessment!.status).toBe('IN_PROGRESS')
          }
          
          // Verify timestamps are updated appropriately
          expect(restoredAssessment!.updatedAt.getTime()).toBeGreaterThanOrEqual(
            assessment.createdAt.getTime()
          )
        }
      ),
      { 
        numRuns: 100, // Run 100 iterations for comprehensive testing
        timeout: 30000 // 30 second timeout for database operations
      }
    )
  }, 60000) // 60 second test timeout

  /**
   * Edge case: Test persistence with empty responses
   */
  test('Property 8 Edge Case: Empty responses persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          assessmentName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          assessmentType: fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const),
          userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          targetStep: fc.integer({ min: 1, max: 8 })
        }),
        
        async (testData) => {
          const { companyName, assessmentName, assessmentType, userId, targetStep } = testData

          // Create company and assessment
          const company = await CompanyModel.create({
            name: companyName,
            description: 'Test company',
            userId
          })

          const assessment = await AssessmentModel.create({
            name: assessmentName,
            companyId: company.id,
            type: assessmentType,
            userId
          })

          const validTargetStep = Math.min(targetStep, assessment.totalSteps)

          // Save empty responses
          await AssessmentModel.saveResponses(
            assessment.id,
            userId,
            `step-${validTargetStep}`,
            {}, // Empty responses
            validTargetStep
          )

          // Restore and verify
          const restoredAssessment = await AssessmentModel.findById(assessment.id, userId)
          const collection = testDb.collection('assessments')
          const fullDocument = await collection.findOne({ 
            _id: new (require('mongodb').ObjectId)(assessment.id), 
            userId 
          })

          // Verify empty responses are preserved
          expect(restoredAssessment!.currentStep).toBe(validTargetStep)
          expect(fullDocument!.responses[`step-${validTargetStep}`]).toEqual({})
          expect(restoredAssessment!.status).toBe('IN_PROGRESS')
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Edge case: Test persistence across multiple save operations
   */
  test('Property 8 Edge Case: Multiple save operations persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          assessmentName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          assessmentType: fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const),
          userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          saveOperations: fc.array(
            fc.record({
              stepId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('.')),
              responses: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && !s.includes('.')),
                fc.string({ maxLength: 200 })
              ),
              currentStep: fc.integer({ min: 1, max: 8 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        
        async (testData) => {
          const { companyName, assessmentName, assessmentType, userId, saveOperations } = testData

          // Create company and assessment
          const company = await CompanyModel.create({
            name: companyName,
            description: 'Test company',
            userId
          })

          const assessment = await AssessmentModel.create({
            name: assessmentName,
            companyId: company.id,
            type: assessmentType,
            userId
          })

          // Perform multiple save operations
          let lastValidStep = 1
          const allSavedResponses: { [stepId: string]: { [questionId: string]: any } } = {}

          for (const operation of saveOperations) {
            const validStep = Math.min(operation.currentStep, assessment.totalSteps)
            
            await AssessmentModel.saveResponses(
              assessment.id,
              userId,
              operation.stepId,
              operation.responses,
              validStep
            )
            
            allSavedResponses[operation.stepId] = operation.responses
            lastValidStep = validStep
          }

          // Restore and verify all operations are preserved
          const restoredAssessment = await AssessmentModel.findById(assessment.id, userId)
          const collection = testDb.collection('assessments')
          const fullDocument = await collection.findOne({ 
            _id: new (require('mongodb').ObjectId)(assessment.id), 
            userId 
          })

          // Verify final state
          expect(restoredAssessment!.currentStep).toBe(lastValidStep)
          
          // Verify all responses from all operations are preserved
          for (const [stepId, expectedResponses] of Object.entries(allSavedResponses)) {
            expect(fullDocument!.responses[stepId]).toEqual(expectedResponses)
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})