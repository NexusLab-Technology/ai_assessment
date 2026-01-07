/**
 * Comprehensive Data Integration Tests with RAPID Structure
 * Task 14: Checkpoint - Data Integration Testing
 * Tests all CRUD operations, auto-save, error handling, and category-based functionality
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, Db } from 'mongodb'
import { AssessmentService } from '@/lib/services/assessment-service'
import { RAPIDQuestionnaireService } from '@/lib/services/rapid-questionnaire-service'
import { AutoSaveService } from '@/lib/services/auto-save-service'
import { rapidQuestionnaireExploratory, rapidQuestionnaireMigration } from '@/data/rapid-questionnaire-complete'
import type { Assessment, AssessmentType, CategoryCompletionStatus } from '@/types/rapid-questionnaire'

describe('Comprehensive Data Integration Tests with RAPID Structure', () => {
  let mongoServer: MongoMemoryServer
  let mongoClient: MongoClient
  let db: Db

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri)
    await mongoClient.connect()
    db = mongoClient.db('test-ai-assessment')

    // Set up environment for services
    process.env.MONGODB_URI = mongoUri
    process.env.MONGODB_DB_NAME = 'test-ai-assessment'
  })

  afterAll(async () => {
    await mongoClient.close()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = await db.collections()
    for (const collection of collections) {
      await collection.deleteMany({})
    }

    // Initialize RAPID questionnaires
    await RAPIDQuestionnaireService.initializeQuestionnaires()
  })

  describe('CRUD Operations with RAPID Structure', () => {
    test('creates assessment with RAPID questionnaire structure', async () => {
      const assessmentData = {
        name: 'Test RAPID Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory' as AssessmentType,
        rapidQuestionnaireVersion: 'v1.0'
      }

      const result = await AssessmentService.createAssessment(assessmentData)

      expect(result.success).toBe(true)
      expect(result.assessmentId).toBeDefined()

      // Verify assessment was created with correct structure
      const assessment = await AssessmentService.getAssessment(result.assessmentId!)
      expect(assessment).toBeDefined()
      expect(assessment!.name).toBe(assessmentData.name)
      expect(assessment!.type).toBe(assessmentData.type)
      expect(assessment!.rapidQuestionnaireVersion).toBe(assessmentData.rapidQuestionnaireVersion)
      expect(assessment!.responses).toEqual({})
      expect(assessment!.categoryStatuses).toEqual({})
    })

    test('handles both exploratory and migration assessment types', async () => {
      // Test exploratory assessment
      const exploratoryResult = await AssessmentService.createAssessment({
        name: 'Exploratory Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      expect(exploratoryResult.success).toBe(true)

      // Test migration assessment
      const migrationResult = await AssessmentService.createAssessment({
        name: 'Migration Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'migration',
        rapidQuestionnaireVersion: 'v1.0'
      })

      expect(migrationResult.success).toBe(true)

      // Verify both assessments exist
      const exploratoryAssessment = await AssessmentService.getAssessment(exploratoryResult.assessmentId!)
      const migrationAssessment = await AssessmentService.getAssessment(migrationResult.assessmentId!)

      expect(exploratoryAssessment!.type).toBe('exploratory')
      expect(migrationAssessment!.type).toBe('migration')
    })

    test('updates category responses with RAPID structure', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Response Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Update responses for use-case-discovery category
      const categoryResponses = {
        'UC.1.1': 'AI-powered customer service chatbot',
        'UC.1.2': 'Improve customer satisfaction and reduce response time',
        'UC.1.3': 'Customer support team and end customers'
      }

      const updateResult = await AssessmentService.updateCategoryResponses(
        assessmentId,
        'use-case-discovery',
        categoryResponses
      )

      expect(updateResult.success).toBe(true)

      // Verify responses were saved
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment!.responses['use-case-discovery']).toEqual(categoryResponses)
    })

    test('updates category status with completion tracking', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Status Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Update category status
      const categoryStatus: CategoryCompletionStatus = {
        status: 'partial',
        completionPercentage: 75,
        lastModified: new Date()
      }

      const updateResult = await AssessmentService.updateCategoryStatus(
        assessmentId,
        'use-case-discovery',
        categoryStatus
      )

      expect(updateResult.success).toBe(true)

      // Verify status was saved
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment!.categoryStatuses['use-case-discovery']).toMatchObject({
        status: 'partial',
        completionPercentage: 75
      })
    })

    test('completes assessment and updates status', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Completion Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Complete assessment
      const completeResult = await AssessmentService.completeAssessment(assessmentId)
      expect(completeResult.success).toBe(true)

      // Verify completion
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment!.status).toBe('COMPLETED')
      expect(assessment!.completedAt).toBeDefined()
    })

    test('deletes assessment successfully', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Delete Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Delete assessment
      const deleteResult = await AssessmentService.deleteAssessment(assessmentId)
      expect(deleteResult.success).toBe(true)

      // Verify deletion
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment).toBeNull()
    })
  })

  describe('Category-Based Auto-Save Functionality', () => {
    test('auto-save service saves responses correctly', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Auto-Save Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Create auto-save service instance
      const autoSaveService = new AutoSaveService(assessmentId)

      // Prepare test responses
      const responses = {
        'use-case-discovery': {
          'UC.1.1': 'Test use case',
          'UC.1.2': 'Test objective'
        },
        'data-readiness': {
          'DR.1.1': 'Test data source',
          'DR.1.2': 'Test data quality'
        }
      }

      // Save responses using auto-save service
      const saveResult = await autoSaveService.saveResponses(responses)
      expect(saveResult.success).toBe(true)

      // Verify responses were saved
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment!.responses).toEqual(responses)
    })

    test('auto-save handles network errors gracefully', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Error Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!
      const autoSaveService = new AutoSaveService(assessmentId)

      // Mock network error by using invalid assessment ID
      const invalidAutoSaveService = new AutoSaveService('invalid-id')
      
      const responses = {
        'use-case-discovery': {
          'UC.1.1': 'Test response'
        }
      }

      const saveResult = await invalidAutoSaveService.saveResponses(responses)
      expect(saveResult.success).toBe(false)
      expect(saveResult.error).toBeDefined()
    })

    test('auto-save preserves data integrity during concurrent operations', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Concurrent Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!
      const autoSaveService = new AutoSaveService(assessmentId)

      // Simulate concurrent saves
      const responses1 = {
        'use-case-discovery': {
          'UC.1.1': 'First save'
        }
      }

      const responses2 = {
        'data-readiness': {
          'DR.1.1': 'Second save'
        }
      }

      // Execute concurrent saves
      const [result1, result2] = await Promise.all([
        autoSaveService.saveResponses(responses1),
        autoSaveService.saveResponses(responses2)
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Verify both saves were preserved
      const assessment = await AssessmentService.getAssessment(assessmentId)
      expect(assessment!.responses['use-case-discovery']).toEqual(responses1['use-case-discovery'])
      expect(assessment!.responses['data-readiness']).toEqual(responses2['data-readiness'])
    })
  })

  describe('Category-Based Response Review API', () => {
    test('generates comprehensive review data for various completion states', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Review Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Add partial responses to different categories
      await AssessmentService.updateCategoryResponses(assessmentId, 'use-case-discovery', {
        'UC.1.1': 'AI chatbot for customer service',
        'UC.1.2': 'Improve response time and satisfaction'
      })

      await AssessmentService.updateCategoryResponses(assessmentId, 'data-readiness', {
        'DR.1.1': 'Customer interaction logs',
        'DR.1.2': 'High quality, regularly updated'
      })

      // Update category statuses
      await AssessmentService.updateCategoryStatus(assessmentId, 'use-case-discovery', {
        status: 'partial',
        completionPercentage: 60,
        lastModified: new Date()
      })

      await AssessmentService.updateCategoryStatus(assessmentId, 'data-readiness', {
        status: 'completed',
        completionPercentage: 100,
        lastModified: new Date()
      })

      // Get review data
      const reviewData = await AssessmentService.getAssessmentForReview(assessmentId)

      expect(reviewData.assessment).toBeDefined()
      expect(reviewData.questionnaire).toBeDefined()
      expect(reviewData.error).toBeUndefined()

      // Verify assessment data
      expect(reviewData.assessment!.id).toBe(assessmentId)
      expect(reviewData.assessment!.responses['use-case-discovery']).toBeDefined()
      expect(reviewData.assessment!.responses['data-readiness']).toBeDefined()

      // Verify questionnaire structure
      expect(reviewData.questionnaire!.categories).toBeDefined()
      expect(reviewData.questionnaire!.categories.length).toBeGreaterThan(0)
    })

    test('calculates accurate completion statistics', async () => {
      // Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Statistics Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Set up different completion states
      await AssessmentService.updateCategoryStatus(assessmentId, 'use-case-discovery', {
        status: 'completed',
        completionPercentage: 100,
        lastModified: new Date()
      })

      await AssessmentService.updateCategoryStatus(assessmentId, 'data-readiness', {
        status: 'partial',
        completionPercentage: 50,
        lastModified: new Date()
      })

      await AssessmentService.updateCategoryStatus(assessmentId, 'compliance-integration', {
        status: 'not_started',
        completionPercentage: 0,
        lastModified: new Date()
      })

      // Get statistics
      const stats = await AssessmentService.getAssessmentStatistics(assessmentId)

      expect(stats).toBeDefined()
      expect(stats!.completedCategories).toBe(1)
      expect(stats!.inProgressCategories).toBe(1)
      expect(stats!.notStartedCategories).toBeGreaterThan(0)
      expect(stats!.overallCompletionPercentage).toBeGreaterThan(0)
      expect(stats!.overallCompletionPercentage).toBeLessThan(100)
    })

    test('handles missing assessment gracefully', async () => {
      const reviewData = await AssessmentService.getAssessmentForReview('nonexistent-id')

      expect(reviewData.assessment).toBeNull()
      expect(reviewData.questionnaire).toBeNull()
      expect(reviewData.error).toBe('Assessment not found')
    })
  })

  describe('Error Handling and User Experience', () => {
    test('handles invalid assessment creation gracefully', async () => {
      const result = await AssessmentService.createAssessment({
        name: '',
        companyId: 'invalid-id',
        userId: '',
        type: 'invalid' as any,
        rapidQuestionnaireVersion: 'nonexistent'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('handles invalid category updates gracefully', async () => {
      // Create valid assessment first
      const createResult = await AssessmentService.createAssessment({
        name: 'Error Test Assessment',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      const assessmentId = createResult.assessmentId!

      // Try to update with invalid data
      const updateResult = await AssessmentService.updateCategoryResponses(
        'invalid-id',
        'nonexistent-category',
        { 'invalid': 'data' }
      )

      expect(updateResult.success).toBe(false)
    })

    test('provides meaningful error messages', async () => {
      // Test with completely invalid assessment ID
      const result = await AssessmentService.getAssessment('not-a-valid-object-id')
      expect(result).toBeNull()

      // Test auto-save with invalid ID
      const autoSaveService = new AutoSaveService('invalid-id')
      const saveResult = await autoSaveService.saveResponses({})
      
      expect(saveResult.success).toBe(false)
      expect(saveResult.error).toContain('Assessment not found')
    })
  })

  describe('RAPID Questionnaire Integration', () => {
    test('loads correct questionnaire structure for exploratory path', async () => {
      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'exploratory')

      expect(questionnaire).toBeDefined()
      expect(questionnaire!.assessmentType).toBe('exploratory')
      expect(questionnaire!.categories).toHaveLength(5) // Exploratory has 5 categories
      
      // Verify category structure
      const categoryIds = questionnaire!.categories.map(cat => cat.id)
      expect(categoryIds).toContain('use-case-discovery')
      expect(categoryIds).toContain('data-readiness')
      expect(categoryIds).toContain('compliance-integration')
      expect(categoryIds).toContain('model-evaluation')
      expect(categoryIds).toContain('business-value-roi')
    })

    test('loads correct questionnaire structure for migration path', async () => {
      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'migration')

      expect(questionnaire).toBeDefined()
      expect(questionnaire!.assessmentType).toBe('migration')
      expect(questionnaire!.categories).toHaveLength(6) // Migration has 6 categories
      
      // Verify migration-specific category
      const categoryIds = questionnaire!.categories.map(cat => cat.id)
      expect(categoryIds).toContain('current-system-assessment')
    })

    test('validates questionnaire data integrity', async () => {
      const exploratoryQuestionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'exploratory')
      
      expect(exploratoryQuestionnaire).toBeDefined()
      
      // Verify each category has subcategories and questions
      exploratoryQuestionnaire!.categories.forEach(category => {
        expect(category.subcategories).toBeDefined()
        expect(category.subcategories.length).toBeGreaterThan(0)
        
        category.subcategories.forEach(subcategory => {
          expect(subcategory.questions).toBeDefined()
          expect(subcategory.questions.length).toBeGreaterThan(0)
          
          subcategory.questions.forEach(question => {
            expect(question.id).toBeDefined()
            expect(question.text).toBeDefined()
            expect(question.type).toBeDefined()
            expect(['text', 'select', 'multiselect', 'number', 'boolean']).toContain(question.type)
          })
        })
      })
    })
  })

  describe('End-to-End Assessment Workflow', () => {
    test('completes full assessment workflow with RAPID structure', async () => {
      // 1. Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Full Workflow Test',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      expect(createResult.success).toBe(true)
      const assessmentId = createResult.assessmentId!

      // 2. Get questionnaire structure
      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'exploratory')
      expect(questionnaire).toBeDefined()

      // 3. Fill out responses for each category
      for (const category of questionnaire!.categories) {
        const responses: { [questionId: string]: any } = {}
        
        // Fill first few questions in each category
        category.subcategories.forEach(subcategory => {
          subcategory.questions.slice(0, 2).forEach(question => {
            switch (question.type) {
              case 'text':
                responses[question.id] = `Sample response for ${question.id}`
                break
              case 'select':
                responses[question.id] = question.options?.[0] || 'Option 1'
                break
              case 'multiselect':
                responses[question.id] = question.options?.slice(0, 2) || ['Option 1', 'Option 2']
                break
              case 'number':
                responses[question.id] = 5
                break
              case 'boolean':
                responses[question.id] = true
                break
            }
          })
        })

        // Save category responses
        const updateResult = await AssessmentService.updateCategoryResponses(
          assessmentId,
          category.id,
          responses
        )
        expect(updateResult.success).toBe(true)

        // Update category status
        const statusResult = await AssessmentService.updateCategoryStatus(
          assessmentId,
          category.id,
          {
            status: 'completed',
            completionPercentage: 100,
            lastModified: new Date()
          }
        )
        expect(statusResult.success).toBe(true)
      }

      // 4. Get review data
      const reviewData = await AssessmentService.getAssessmentForReview(assessmentId)
      expect(reviewData.assessment).toBeDefined()
      expect(reviewData.questionnaire).toBeDefined()

      // 5. Complete assessment
      const completeResult = await AssessmentService.completeAssessment(assessmentId)
      expect(completeResult.success).toBe(true)

      // 6. Verify final state
      const finalAssessment = await AssessmentService.getAssessment(assessmentId)
      expect(finalAssessment!.status).toBe('COMPLETED')
      expect(finalAssessment!.completedAt).toBeDefined()

      // 7. Verify statistics
      const stats = await AssessmentService.getAssessmentStatistics(assessmentId)
      expect(stats!.completedCategories).toBe(questionnaire!.categories.length)
      expect(stats!.overallCompletionPercentage).toBe(100)
    })
  })
})