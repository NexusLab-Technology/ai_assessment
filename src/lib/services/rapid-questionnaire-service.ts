/**
 * RAPID Questionnaire Service
 * Handles database operations for RAPID questionnaire data
 */

import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { COLLECTIONS, RAPIDQuestionnaireDocument } from '@/lib/models/assessment'
import { RAPIDQuestionnaireStructure, AssessmentType } from '@/types/rapid-questionnaire'

export class RAPIDQuestionnaireService {
  private static async getCollection() {
    return getCollection(COLLECTIONS.RAPID_QUESTIONNAIRES)
  }

  /**
   * Store RAPID questionnaire structure in MongoDB
   */
  static async storeQuestionnaire(
    questionnaire: RAPIDQuestionnaireStructure
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const document: RAPIDQuestionnaireDocument = {
        version: questionnaire.version,
        assessmentType: questionnaire.assessmentType,
        totalQuestions: questionnaire.totalQuestions,
        categories: questionnaire.categories.map(category => ({
          id: category.id,
          title: category.title,
          description: category.description,
          subcategories: category.subcategories.map(subcategory => ({
            id: subcategory.id,
            title: subcategory.title,
            questions: subcategory.questions,
            questionCount: subcategory.questionCount
          })),
          totalQuestions: category.totalQuestions
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }

      // Check if questionnaire with same version and type already exists
      const existing = await collection.findOne({
        version: questionnaire.version,
        assessmentType: questionnaire.assessmentType
      })

      if (existing) {
        // Update existing questionnaire
        const result = await collection.updateOne(
          { _id: existing._id },
          { 
            $set: {
              ...document,
              updatedAt: new Date()
            }
          }
        )

        return {
          success: result.modifiedCount > 0,
          id: existing._id.toString()
        }
      } else {
        // Insert new questionnaire
        const result = await collection.insertOne(document)
        
        return {
          success: result.acknowledged,
          id: result.insertedId.toString()
        }
      }
    } catch (error) {
      console.error('Error storing RAPID questionnaire:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get active RAPID questionnaire by type
   */
  static async getActiveQuestionnaire(
    assessmentType: AssessmentType
  ): Promise<RAPIDQuestionnaireStructure | null> {
    try {
      const collection = await this.getCollection()
      
      const document = await collection.findOne({
        assessmentType,
        isActive: true
      }, {
        sort: { createdAt: -1 } // Get the latest version
      })

      if (!document) {
        return null
      }

      return {
        version: document.version,
        assessmentType: document.assessmentType,
        totalQuestions: document.totalQuestions,
        categories: document.categories.map(category => ({
          id: category.id,
          title: category.title,
          description: category.description,
          subcategories: category.subcategories,
          totalQuestions: category.totalQuestions,
          completionPercentage: 0, // Will be calculated based on responses
          status: 'not_started' // Will be calculated based on responses
        })),
        lastUpdated: document.updatedAt
      }
    } catch (error) {
      console.error('Error getting active RAPID questionnaire:', error)
      return null
    }
  }

  /**
   * Get RAPID questionnaire by version and type
   */
  static async getQuestionnaireByVersion(
    version: string,
    assessmentType: AssessmentType
  ): Promise<RAPIDQuestionnaireStructure | null> {
    try {
      const collection = await this.getCollection()
      
      const document = await collection.findOne({
        version,
        assessmentType
      })

      if (!document) {
        return null
      }

      return {
        version: document.version,
        assessmentType: document.assessmentType,
        totalQuestions: document.totalQuestions,
        categories: document.categories.map(category => ({
          id: category.id,
          title: category.title,
          description: category.description,
          subcategories: category.subcategories,
          totalQuestions: category.totalQuestions,
          completionPercentage: 0,
          status: 'not_started'
        })),
        lastUpdated: document.updatedAt
      }
    } catch (error) {
      console.error('Error getting RAPID questionnaire by version:', error)
      return null
    }
  }

  /**
   * List all available questionnaire versions
   */
  static async listVersions(): Promise<{
    version: string
    assessmentType: AssessmentType
    totalQuestions: number
    isActive: boolean
    createdAt: Date
  }[]> {
    try {
      const collection = await this.getCollection()
      
      const documents = await collection.find({}, {
        projection: {
          version: 1,
          assessmentType: 1,
          totalQuestions: 1,
          isActive: 1,
          createdAt: 1
        },
        sort: { createdAt: -1 }
      }).toArray()

      return documents.map(doc => ({
        version: doc.version,
        assessmentType: doc.assessmentType,
        totalQuestions: doc.totalQuestions,
        isActive: doc.isActive,
        createdAt: doc.createdAt
      }))
    } catch (error) {
      console.error('Error listing questionnaire versions:', error)
      return []
    }
  }

  /**
   * Set questionnaire as active/inactive
   */
  static async setQuestionnaireStatus(
    version: string,
    assessmentType: AssessmentType,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const result = await collection.updateOne(
        { version, assessmentType },
        { 
          $set: { 
            isActive,
            updatedAt: new Date()
          }
        }
      )

      return {
        success: result.modifiedCount > 0
      }
    } catch (error) {
      console.error('Error setting questionnaire status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Initialize database with default RAPID questionnaires
   */
  static async initializeDefaultQuestionnaires(): Promise<{
    success: boolean
    initialized: number
    errors: string[]
  }> {
    try {
      // Import the complete RAPID questionnaire data
      const { rapidQuestionnaireExploratory, rapidQuestionnaireMigration } = 
        await import('@/data/rapid-questionnaire-complete')

      const errors: string[] = []
      let initialized = 0

      // Store Exploratory questionnaire
      const exploratoryResult = await this.storeQuestionnaire(rapidQuestionnaireExploratory)
      if (exploratoryResult.success) {
        initialized++
      } else if (exploratoryResult.error) {
        errors.push(`Exploratory: ${exploratoryResult.error}`)
      }

      // Store Migration questionnaire
      const migrationResult = await this.storeQuestionnaire(rapidQuestionnaireMigration)
      if (migrationResult.success) {
        initialized++
      } else if (migrationResult.error) {
        errors.push(`Migration: ${migrationResult.error}`)
      }

      return {
        success: errors.length === 0,
        initialized,
        errors
      }
    } catch (error) {
      console.error('Error initializing default questionnaires:', error)
      return {
        success: false,
        initialized: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}