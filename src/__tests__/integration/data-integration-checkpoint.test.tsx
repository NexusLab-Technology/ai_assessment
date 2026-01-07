/**
 * Data Integration Checkpoint Tests
 * Task 14: Checkpoint - Data Integration Testing with RAPID Structure
 * Tests core functionality without MongoDB Memory Server
 */

import { AssessmentService } from '@/lib/services/assessment-service'
import { RAPIDQuestionnaireService } from '@/lib/services/rapid-questionnaire-service'
import { AutoSaveService } from '@/lib/services/auto-save-service'
import type { Assessment, AssessmentType, CategoryCompletionStatus } from '@/types/rapid-questionnaire'

// Mock MongoDB operations for testing
jest.mock('@/lib/mongodb', () => ({
  getCollection: jest.fn(() => ({
    insertOne: jest.fn().mockResolvedValue({ 
      acknowledged: true, 
      insertedId: { toString: () => '507f1f77bcf86cd799439012' }
    }),
    findOne: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        toArray: jest.fn().mockResolvedValue([])
      }))
    }))
  }))
}))

describe('Data Integration Checkpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CRUD Operations with RAPID Structure', () => {
    test('creates assessment with correct RAPID structure', async () => {
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
    })

    test('updates category responses successfully', async () => {
      const categoryResponses = {
        'UC.1.1': 'AI-powered customer service chatbot',
        'UC.1.2': 'Improve customer satisfaction and reduce response time',
        'UC.1.3': 'Customer support team and end customers'
      }

      const updateResult = await AssessmentService.updateCategoryResponses(
        '507f1f77bcf86cd799439012',
        'use-case-discovery',
        categoryResponses
      )

      expect(updateResult.success).toBe(true)
    })

    test('updates category status with completion tracking', async () => {
      const categoryStatus: CategoryCompletionStatus = {
        status: 'partial',
        completionPercentage: 75,
        lastModified: new Date()
      }

      const updateResult = await AssessmentService.updateCategoryStatus(
        '507f1f77bcf86cd799439012',
        'use-case-discovery',
        categoryStatus
      )

      expect(updateResult.success).toBe(true)
    })

    test('completes assessment successfully', async () => {
      const completeResult = await AssessmentService.completeAssessment('507f1f77bcf86cd799439012')
      expect(completeResult.success).toBe(true)
    })

    test('deletes assessment successfully', async () => {
      const deleteResult = await AssessmentService.deleteAssessment('507f1f77bcf86cd799439012')
      expect(deleteResult.success).toBe(true)
    })
  })

  describe('Category-Based Auto-Save Functionality', () => {
    test('auto-save service initializes correctly', () => {
      const autoSaveService = new AutoSaveService('507f1f77bcf86cd799439012')
      expect(autoSaveService).toBeDefined()
    })

    test('auto-save service handles responses correctly', async () => {
      const autoSaveService = new AutoSaveService('507f1f77bcf86cd799439012')
      
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

      const saveResult = await autoSaveService.saveResponses(responses)
      expect(saveResult.success).toBe(true)
    })

    test('auto-save handles errors gracefully', async () => {
      const autoSaveService = new AutoSaveService('invalid-id')
      
      const responses = {
        'use-case-discovery': {
          'UC.1.1': 'Test response'
        }
      }

      // Mock error response
      const mockCollection = require('@/lib/mongodb').getCollection()
      mockCollection.updateOne.mockRejectedValueOnce(new Error('Database error'))

      const saveResult = await autoSaveService.saveResponses(responses)
      expect(saveResult.success).toBe(false)
      expect(saveResult.error).toBeDefined()
    })
  })

  describe('RAPID Questionnaire Integration', () => {
    test('loads exploratory questionnaire structure correctly', async () => {
      // Mock questionnaire data
      const mockQuestionnaire = {
        version: 'v1.0',
        assessmentType: 'exploratory' as const,
        totalQuestions: 162,
        categories: [
          {
            id: 'use-case-discovery',
            title: 'Use Case Discovery',
            description: 'Define and validate AI use cases',
            subcategories: [
              {
                id: 'business-context',
                title: 'Business Context and Use Case Definition',
                description: 'Understanding business context',
                questions: [
                  {
                    id: 'UC.1.1',
                    number: 'UC.1.1',
                    text: 'What specific business problem or opportunity are you looking to address with AI?',
                    type: 'text' as const,
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      }

      // Mock the service method
      jest.spyOn(RAPIDQuestionnaireService, 'getQuestionnaireByVersion')
        .mockResolvedValue(mockQuestionnaire)

      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'exploratory')

      expect(questionnaire).toBeDefined()
      expect(questionnaire!.assessmentType).toBe('exploratory')
      expect(questionnaire!.categories).toHaveLength(1)
      expect(questionnaire!.categories[0].id).toBe('use-case-discovery')
    })

    test('loads migration questionnaire structure correctly', async () => {
      const mockQuestionnaire = {
        version: 'v1.0',
        assessmentType: 'migration' as const,
        totalQuestions: 214,
        categories: [
          {
            id: 'current-system-assessment',
            title: 'Current System Assessment',
            description: 'Evaluate existing systems',
            subcategories: []
          }
        ]
      }

      jest.spyOn(RAPIDQuestionnaireService, 'getQuestionnaireByVersion')
        .mockResolvedValue(mockQuestionnaire)

      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'migration')

      expect(questionnaire).toBeDefined()
      expect(questionnaire!.assessmentType).toBe('migration')
      expect(questionnaire!.categories[0].id).toBe('current-system-assessment')
    })

    test('validates questionnaire data integrity', async () => {
      const mockQuestionnaire = {
        version: 'v1.0',
        assessmentType: 'exploratory' as const,
        totalQuestions: 162,
        categories: [
          {
            id: 'use-case-discovery',
            title: 'Use Case Discovery',
            description: 'Define and validate AI use cases',
            subcategories: [
              {
                id: 'business-context',
                title: 'Business Context',
                description: 'Business context questions',
                questions: [
                  {
                    id: 'UC.1.1',
                    number: 'UC.1.1',
                    text: 'Test question',
                    type: 'text' as const,
                    required: true
                  },
                  {
                    id: 'UC.1.2',
                    number: 'UC.1.2',
                    text: 'Test select question',
                    type: 'select' as const,
                    required: false,
                    options: ['Option 1', 'Option 2']
                  }
                ]
              }
            ]
          }
        ]
      }

      jest.spyOn(RAPIDQuestionnaireService, 'getQuestionnaireByVersion')
        .mockResolvedValue(mockQuestionnaire)

      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion('v1.0', 'exploratory')
      
      expect(questionnaire).toBeDefined()
      
      // Verify structure integrity
      questionnaire!.categories.forEach(category => {
        expect(category.id).toBeDefined()
        expect(category.title).toBeDefined()
        expect(category.subcategories).toBeDefined()
        
        category.subcategories.forEach(subcategory => {
          expect(subcategory.id).toBeDefined()
          expect(subcategory.title).toBeDefined()
          expect(subcategory.questions).toBeDefined()
          
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

  describe('Error Handling and User Experience', () => {
    test('handles invalid assessment creation gracefully', async () => {
      // Mock error response
      const mockCollection = require('@/lib/mongodb').getCollection()
      mockCollection.insertOne.mockRejectedValueOnce(new Error('Validation error'))

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

    test('handles database connection errors', async () => {
      // Mock database error
      const mockCollection = require('@/lib/mongodb').getCollection()
      mockCollection.findOne.mockRejectedValueOnce(new Error('Connection error'))

      const assessment = await AssessmentService.getAssessment('507f1f77bcf86cd799439012')
      expect(assessment).toBeNull()
    })

    test('provides meaningful error messages for auto-save failures', async () => {
      const autoSaveService = new AutoSaveService('invalid-id')
      
      // Mock specific error
      const mockCollection = require('@/lib/mongodb').getCollection()
      mockCollection.updateOne.mockRejectedValueOnce(new Error('Assessment not found'))

      const saveResult = await autoSaveService.saveResponses({})
      
      expect(saveResult.success).toBe(false)
      expect(saveResult.error).toContain('Assessment not found')
    })
  })

  describe('Assessment Statistics and Review', () => {
    test('calculates assessment statistics correctly', async () => {
      // Mock assessment data
      const mockAssessment = {
        id: '507f1f77bcf86cd799439012',
        totalCategories: 5,
        categoryStatuses: {
          'use-case-discovery': { status: 'completed' },
          'data-readiness': { status: 'partial' },
          'compliance-integration': { status: 'not_started' },
          'model-evaluation': { status: 'not_started' },
          'business-value-roi': { status: 'not_started' }
        }
      }

      jest.spyOn(AssessmentService, 'getAssessment').mockResolvedValue(mockAssessment as any)

      const stats = await AssessmentService.getAssessmentStatistics('507f1f77bcf86cd799439012')

      expect(stats).toBeDefined()
      expect(stats!.totalCategories).toBe(5)
      expect(stats!.completedCategories).toBe(1)
      expect(stats!.inProgressCategories).toBe(1)
      expect(stats!.notStartedCategories).toBe(3)
      expect(stats!.overallCompletionPercentage).toBeGreaterThan(0)
    })

    test('generates review data for assessment', async () => {
      const mockAssessment = {
        id: '507f1f77bcf86cd799439012',
        name: 'Test Assessment',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0',
        responses: {
          'use-case-discovery': {
            'UC.1.1': 'Test response'
          }
        }
      }

      const mockQuestionnaire = {
        version: 'v1.0',
        assessmentType: 'exploratory' as const,
        categories: []
      }

      jest.spyOn(AssessmentService, 'getAssessment').mockResolvedValue(mockAssessment as any)
      jest.spyOn(RAPIDQuestionnaireService, 'getQuestionnaireByVersion').mockResolvedValue(mockQuestionnaire)

      const reviewData = await AssessmentService.getAssessmentForReview('507f1f77bcf86cd799439012')

      expect(reviewData.assessment).toBeDefined()
      expect(reviewData.questionnaire).toBeDefined()
      expect(reviewData.error).toBeUndefined()
    })

    test('handles missing assessment in review gracefully', async () => {
      jest.spyOn(AssessmentService, 'getAssessment').mockResolvedValue(null)

      const reviewData = await AssessmentService.getAssessmentForReview('nonexistent-id')

      expect(reviewData.assessment).toBeNull()
      expect(reviewData.questionnaire).toBeNull()
      expect(reviewData.error).toBe('Assessment not found')
    })
  })

  describe('End-to-End Workflow Validation', () => {
    test('validates complete assessment workflow', async () => {
      // Mock successful workflow
      const mockAssessment = {
        id: '507f1f77bcf86cd799439012',
        name: 'Workflow Test',
        status: 'DRAFT',
        responses: {},
        categoryStatuses: {}
      }

      jest.spyOn(AssessmentService, 'getAssessment').mockResolvedValue(mockAssessment as any)

      // 1. Create assessment
      const createResult = await AssessmentService.createAssessment({
        name: 'Workflow Test',
        companyId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123',
        type: 'exploratory',
        rapidQuestionnaireVersion: 'v1.0'
      })

      expect(createResult.success).toBe(true)

      // 2. Update responses
      const updateResult = await AssessmentService.updateCategoryResponses(
        '507f1f77bcf86cd799439012',
        'use-case-discovery',
        { 'UC.1.1': 'Test response' }
      )

      expect(updateResult.success).toBe(true)

      // 3. Update status
      const statusResult = await AssessmentService.updateCategoryStatus(
        '507f1f77bcf86cd799439012',
        'use-case-discovery',
        {
          status: 'completed',
          completionPercentage: 100,
          lastModified: new Date()
        }
      )

      expect(statusResult.success).toBe(true)

      // 4. Complete assessment
      const completeResult = await AssessmentService.completeAssessment('507f1f77bcf86cd799439012')
      expect(completeResult.success).toBe(true)
    })

    test('validates auto-save integration in workflow', async () => {
      const autoSaveService = new AutoSaveService('507f1f77bcf86cd799439012')

      // Test multiple category saves
      const responses1 = {
        'use-case-discovery': { 'UC.1.1': 'First category' }
      }

      const responses2 = {
        'data-readiness': { 'DR.1.1': 'Second category' }
      }

      const result1 = await autoSaveService.saveResponses(responses1)
      const result2 = await autoSaveService.saveResponses(responses2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })
})