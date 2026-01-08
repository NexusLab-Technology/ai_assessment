/**
 * Enhanced Assessment Service
 * Handles database operations for category-based assessments with RAPID structure
 */

import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { COLLECTIONS, AssessmentDocument } from '@/lib/models/assessment'
import { 
  Assessment, 
  AssessmentResponses, 
  CategoryCompletionStatus,
  AssessmentType,
  CompletionStatus
} from '@/types/rapid-questionnaire'
import { RAPIDQuestionnaireService } from './rapid-questionnaire-service'

export class AssessmentService {
  private static async getCollection() {
    return getCollection(COLLECTIONS.ASSESSMENTS)
  }

  /**
   * Create a new category-based assessment
   */
  static async createAssessment(data: {
    name: string
    companyId: string
    type: AssessmentType
    rapidQuestionnaireVersion: string
  }): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
    try {
      // Validate companyId is a valid ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(data.companyId)) {
        return {
          success: false,
          error: `Invalid company ID format. Company ID must be a valid MongoDB ObjectId (24 hex characters). Received: ${data.companyId}`
        }
      }

      const collection = await this.getCollection()
      
      // Get the RAPID questionnaire structure
      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion(
        data.rapidQuestionnaireVersion,
        data.type
      )

      if (!questionnaire) {
        return {
          success: false,
          error: `RAPID questionnaire not found: ${data.rapidQuestionnaireVersion} (${data.type})`
        }
      }

      const now = new Date()
      const document: AssessmentDocument = {
        name: data.name,
        companyId: new ObjectId(data.companyId),
        type: data.type,
        status: 'DRAFT',
        isActive: true, // New assessments are active by default
        
        // RAPID-specific fields
        currentCategory: questionnaire.categories[0]?.id || '',
        totalCategories: questionnaire.categories.length,
        rapidQuestionnaireVersion: data.rapidQuestionnaireVersion,
        
        // Initialize empty responses and category statuses
        responses: {},
        categoryStatuses: {},
        
        createdAt: now,
        updatedAt: now
      }

      const result = await collection.insertOne(document)
      
      return {
        success: result.acknowledged,
        assessmentId: result.insertedId.toString()
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get assessment by ID
   */
  static async getAssessment(assessmentId: string): Promise<Assessment | null> {
    try {
      const collection = await this.getCollection()
      
      const document = await collection.findOne({
        _id: new ObjectId(assessmentId),
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Backward compatibility for existing records
        ]
      })

      if (!document) {
        return null
      }

      return this.documentToAssessment(document as AssessmentDocument)
    } catch (error) {
      console.error('Error getting assessment:', error)
      return null
    }
  }

  /**
   * Update category responses
   */
  static async updateCategoryResponses(
    assessmentId: string,
    categoryId: string,
    responses: { [questionId: string]: any }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(assessmentId),
          $or: [
            { isActive: true },
            { isActive: { $exists: false } } // Backward compatibility
          ]
        },
        {
          $set: {
            [`responses.${categoryId}`]: responses,
            updatedAt: new Date()
          }
        }
      )

      return {
        success: result.modifiedCount > 0
      }
    } catch (error) {
      console.error('Error updating category responses:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update category status
   */
  static async updateCategoryStatus(
    assessmentId: string,
    categoryId: string,
    status: CategoryCompletionStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(assessmentId),
          $or: [
            { isActive: true },
            { isActive: { $exists: false } } // Backward compatibility
          ]
        },
        {
          $set: {
            [`categoryStatuses.${categoryId}`]: status,
            updatedAt: new Date()
          }
        }
      )

      return {
        success: result.modifiedCount > 0
      }
    } catch (error) {
      console.error('Error updating category status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update current category
   */
  static async updateCurrentCategory(
    assessmentId: string,
    categoryId: string,
    subcategoryId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const updateData: any = {
        currentCategory: categoryId,
        updatedAt: new Date()
      }

      if (subcategoryId) {
        updateData.currentSubcategory = subcategoryId
      }

      const result = await collection.updateOne(
        { 
          _id: new ObjectId(assessmentId),
          $or: [
            { isActive: true },
            { isActive: { $exists: false } } // Backward compatibility
          ]
        },
        { $set: updateData }
      )

      return {
        success: result.modifiedCount > 0
      }
    } catch (error) {
      console.error('Error updating current category:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Complete assessment
   */
  static async completeAssessment(
    assessmentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      const now = new Date()
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(assessmentId),
          $or: [
            { isActive: true },
            { isActive: { $exists: false } } // Backward compatibility
          ]
        },
        {
          $set: {
            status: 'COMPLETED',
            completedAt: now,
            updatedAt: now
          }
        }
      )

      return {
        success: result.modifiedCount > 0
      }
    } catch (error) {
      console.error('Error completing assessment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * List assessments for a user
   */
  static async listAssessments(
    companyId?: string
  ): Promise<Assessment[]> {
    try {
      const collection = await this.getCollection()
      
      const filter: any = {
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Backward compatibility for existing records
        ]
      }
      if (companyId) {
        // Validate ObjectId format before converting
        // ObjectId must be 24 hex characters
        if (/^[0-9a-fA-F]{24}$/.test(companyId)) {
          filter.companyId = new ObjectId(companyId)
        } else {
          // If companyId is not a valid ObjectId (e.g., mock ID like 'demo-company-1'),
          // skip the companyId filter and return empty array since no assessments
          // in database will match a non-ObjectId companyId
          console.warn(`Invalid ObjectId format for companyId: ${companyId}. Skipping companyId filter.`)
          return []
        }
      }

      const documents = await collection.find(filter, {
        sort: { updatedAt: -1 }
      }).toArray()

      return documents.map(doc => this.documentToAssessment(doc as AssessmentDocument))
    } catch (error) {
      console.error('Error listing assessments:', error)
      return []
    }
  }

  /**
   * Delete assessment
   */
  static async deleteAssessment(
    assessmentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection()
      
      // Soft delete: Set isActive to false instead of deleting the record
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(assessmentId)
        },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          } 
        },
        { returnDocument: 'after' }
      )

      return {
        success: result !== null
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get assessment responses for review
   */
  static async getAssessmentForReview(
    assessmentId: string
  ): Promise<{
    assessment: Assessment | null
    questionnaire: any | null
    error?: string
  }> {
    try {
      const assessment = await this.getAssessment(assessmentId)
      if (!assessment) {
        return {
          assessment: null,
          questionnaire: null,
          error: 'Assessment not found'
        }
      }

      const questionnaire = await RAPIDQuestionnaireService.getQuestionnaireByVersion(
        assessment.rapidQuestionnaireVersion,
        assessment.type
      )

      return {
        assessment,
        questionnaire
      }
    } catch (error) {
      console.error('Error getting assessment for review:', error)
      return {
        assessment: null,
        questionnaire: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Convert MongoDB document to Assessment type
   */
  private static documentToAssessment(document: AssessmentDocument): Assessment {
    return {
      id: document._id!.toString(),
      name: document.name,
      companyId: document.companyId.toString(),
      type: document.type,
      status: document.status,
      currentCategory: document.currentCategory,
      currentSubcategory: document.currentSubcategory,
      totalCategories: document.totalCategories,
      responses: document.responses || {},
      categoryStatuses: document.categoryStatuses || {},
      rapidQuestionnaireVersion: document.rapidQuestionnaireVersion,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      completedAt: document.completedAt
    }
  }

  /**
   * Calculate category completion statistics
   */
  static async getAssessmentStatistics(
    assessmentId: string
  ): Promise<{
    totalCategories: number
    completedCategories: number
    inProgressCategories: number
    notStartedCategories: number
    overallCompletionPercentage: number
  } | null> {
    try {
      const assessment = await this.getAssessment(assessmentId)
      if (!assessment) {
        return null
      }

      const categoryStatuses = Object.values(assessment.categoryStatuses)
      const totalCategories = assessment.totalCategories
      
      const completedCategories = categoryStatuses.filter(s => s.status === 'completed').length
      const inProgressCategories = categoryStatuses.filter(s => s.status === 'partial').length
      const notStartedCategories = totalCategories - completedCategories - inProgressCategories

      const overallCompletionPercentage = totalCategories > 0 ? 
        Math.round(((completedCategories + (inProgressCategories * 0.5)) / totalCategories) * 100) : 0

      return {
        totalCategories,
        completedCategories,
        inProgressCategories,
        notStartedCategories,
        overallCompletionPercentage
      }
    } catch (error) {
      console.error('Error calculating assessment statistics:', error)
      return null
    }
  }
}