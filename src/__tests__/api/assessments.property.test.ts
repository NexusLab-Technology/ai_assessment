/**
 * Property-based tests for Assessment Data Persistence
 * Feature: ai-assessment, Property 8: Assessment state persistence
 * Validates: Requirements 5.3
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import fc from 'fast-check'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { COLLECTIONS } from '../../lib/models/assessment'
import { initializeDatabase } from '@/lib/db-init'

// Test data generators
const assessmentTypeArb = fc.constantFrom('EXPLORATORY', 'MIGRATION')
const assessmentStatusArb = fc.constantFrom('DRAFT', 'IN_PROGRESS', 'COMPLETED')
const stepStatusArb = fc.constantFrom('not_started', 'partial', 'completed')

const assessmentNameArb = fc.string({ minLength: 2, maxLength: 50 })
const userIdArb = fc.string({ minLength: 2, maxLength: 20 })

const stepStatusObjectArb = fc.record({
  status: stepStatusArb,
  lastModified: fc.date(),
  requiredFieldsCount: fc.integer({ min: 0, max: 10 }),
  filledFieldsCount: fc.integer({ min: 0, max: 10 })
})

const assessmentDocumentArb = fc.record({
  name: assessmentNameArb,
  companyId: fc.string().map(() => new ObjectId()),
  userId: userIdArb,
  type: assessmentTypeArb,
  status: assessmentStatusArb,
  currentStep: fc.integer({ min: 1, max: 8 }),
  totalSteps: fc.integer({ min: 7, max: 8 }),
  responses: fc.dictionary(fc.string(), fc.dictionary(fc.string(), fc.string())),
  stepStatuses: fc.dictionary(
    fc.integer({ min: 1, max: 8 }).map(n => n.toString()),
    stepStatusObjectArb
  ),
  createdAt: fc.date(),
  updatedAt: fc.date()
})

describe('Property 8: Assessment state persistence', () => {
  let assessmentsCollection: any

  beforeAll(async () => {
    // Initialize database
    await initializeDatabase()
    assessmentsCollection = await getCollection(COLLECTIONS.ASSESSMENTS)
  }, 30000)

  beforeEach(async () => {
    // Clean up test data before each test
    await assessmentsCollection.deleteMany({ userId: { $regex: /^test-/ } })
  })

  afterAll(async () => {
    // Clean up test data after all tests
    await assessmentsCollection.deleteMany({ userId: { $regex: /^test-/ } })
  })

  it('should persist assessment data correctly through create-read cycle', async () => {
    console.log('🔄 Starting create-read cycle test...')
    await fc.assert(
      fc.asyncProperty(assessmentDocumentArb, async (assessmentData) => {
        console.log('  📝 Testing assessment:', assessmentData.name.substring(0, 20) + '...')
        // Ensure test user ID
        const testAssessment = {
          ...assessmentData,
          userId: `test-${assessmentData.userId}`
        }

        // Create assessment
        const insertResult = await assessmentsCollection.insertOne(testAssessment)
        expect(insertResult.insertedId).toBeDefined()
        console.log('  ✅ Created assessment with ID:', insertResult.insertedId.toString())

        // Read assessment back
        const retrievedAssessment = await assessmentsCollection.findOne({
          _id: insertResult.insertedId
        })

        // Verify all fields are preserved
        expect(retrievedAssessment).toBeDefined()
        expect(retrievedAssessment.name).toBe(testAssessment.name)
        expect(retrievedAssessment.companyId.toString()).toBe(testAssessment.companyId.toString())
        expect(retrievedAssessment.userId).toBe(testAssessment.userId)
        expect(retrievedAssessment.type).toBe(testAssessment.type)
        expect(retrievedAssessment.status).toBe(testAssessment.status)
        expect(retrievedAssessment.currentStep).toBe(testAssessment.currentStep)
        expect(retrievedAssessment.totalSteps).toBe(testAssessment.totalSteps)
        expect(retrievedAssessment.responses).toEqual(testAssessment.responses)
        expect(retrievedAssessment.stepStatuses).toEqual(testAssessment.stepStatuses)
        console.log('  ✅ Verified all fields match')

        // Clean up
        await assessmentsCollection.deleteOne({ _id: insertResult.insertedId })
        console.log('  🗑️ Cleaned up test data')
      }),
      { numRuns: 1 }
    )
    console.log('✅ Create-read cycle test completed')
  }, 15000)

  it('should maintain data integrity during update operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentDocumentArb,
        fc.record({
          currentStep: fc.integer({ min: 1, max: 8 }),
          status: assessmentStatusArb,
          responses: fc.dictionary(fc.string(), fc.dictionary(fc.string(), fc.string())),
          updatedAt: fc.date()
        }),
        async (initialData, updateData) => {
          // Ensure test user ID and make data different
          const testAssessment = {
            ...initialData,
            userId: `test-${initialData.userId}`,
            currentStep: 1,
            status: 'DRAFT' as const
          }

          // Make update data different from initial
          const differentUpdateData = {
            ...updateData,
            currentStep: testAssessment.currentStep + 1,
            status: 'IN_PROGRESS' as const
          }

          // Create initial assessment
          const insertResult = await assessmentsCollection.insertOne(testAssessment)

          // Update assessment
          const updateResult = await assessmentsCollection.updateOne(
            { _id: insertResult.insertedId },
            { $set: differentUpdateData }
          )
          expect(updateResult.modifiedCount).toBe(1)

          // Verify update
          const updatedAssessment = await assessmentsCollection.findOne({
            _id: insertResult.insertedId
          })

          expect(updatedAssessment).toBeDefined()
          expect(updatedAssessment.currentStep).toBe(differentUpdateData.currentStep)
          expect(updatedAssessment.status).toBe(differentUpdateData.status)
          expect(updatedAssessment.responses).toEqual(differentUpdateData.responses)
          
          // Verify unchanged fields remain intact
          expect(updatedAssessment.name).toBe(testAssessment.name)
          expect(updatedAssessment.companyId.toString()).toBe(testAssessment.companyId.toString())
          expect(updatedAssessment.userId).toBe(testAssessment.userId)
          expect(updatedAssessment.type).toBe(testAssessment.type)

          // Clean up
          await assessmentsCollection.deleteOne({ _id: insertResult.insertedId })
        }
      ),
      { numRuns: 2 }
    )
  }, 15000)

  it('should handle step status updates correctly', async () => {
    console.log('🔄 Starting step status updates test...')
    await fc.assert(
      fc.asyncProperty(
        assessmentDocumentArb,
        fc.integer({ min: 1, max: 8 }),
        stepStatusObjectArb,
        async (assessmentData, stepNumber, stepStatus) => {
          console.log(`  📝 Testing step ${stepNumber} status update for:`, assessmentData.name.substring(0, 20) + '...')
          // Ensure test user ID
          const testAssessment = {
            ...assessmentData,
            userId: `test-${assessmentData.userId}`
          }

          // Create assessment
          const insertResult = await assessmentsCollection.insertOne(testAssessment)
          console.log('  ✅ Created assessment')

          // Update step status
          const stepKey = `stepStatuses.${stepNumber}`
          const updateResult = await assessmentsCollection.updateOne(
            { _id: insertResult.insertedId },
            { $set: { [stepKey]: stepStatus } }
          )
          expect(updateResult.modifiedCount).toBe(1)
          console.log(`  ✅ Updated step ${stepNumber} status`)

          // Verify step status update
          const updatedAssessment = await assessmentsCollection.findOne({
            _id: insertResult.insertedId
          })

          expect(updatedAssessment).toBeDefined()
          expect(updatedAssessment.stepStatuses[stepNumber]).toEqual(stepStatus)
          console.log('  ✅ Verified step status update')

          // Clean up
          await assessmentsCollection.deleteOne({ _id: insertResult.insertedId })
          console.log('  🗑️ Cleaned up test data')
        }
      ),
      { numRuns: 1 }
    )
    console.log('✅ Step status updates test completed')
  }, 10000)

  it('should preserve response data structure integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentDocumentArb,
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }), // stepId
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }), // questionId
            fc.string({ minLength: 1, maxLength: 20 }) // answer
          )
        ),
        async (assessmentData, responseData) => {
          // Ensure test user ID
          const testAssessment = {
            ...assessmentData,
            userId: `test-${assessmentData.userId}`,
            responses: responseData
          }

          // Create assessment with responses
          const insertResult = await assessmentsCollection.insertOne(testAssessment)

          // Read back and verify response structure
          const retrievedAssessment = await assessmentsCollection.findOne({
            _id: insertResult.insertedId
          })

          expect(retrievedAssessment).toBeDefined()
          expect(retrievedAssessment.responses).toEqual(responseData)

          // Verify nested structure is preserved
          for (const [stepId, stepResponses] of Object.entries(responseData)) {
            expect(retrievedAssessment.responses[stepId]).toEqual(stepResponses)
            
            for (const [questionId, answer] of Object.entries(stepResponses as any)) {
              expect(retrievedAssessment.responses[stepId][questionId]).toEqual(answer)
            }
          }

          // Clean up
          await assessmentsCollection.deleteOne({ _id: insertResult.insertedId })
        }
      ),
      { numRuns: 2 }
    )
  }, 10000)
})