import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { Assessment, AssessmentDocument, AssessmentResponses } from '../../types/assessment'

export class AssessmentModel {
  private static collectionName = 'assessments'

  static async getCollection() {
    return getCollection(this.collectionName)
  }

  static async findAll(userId: string, companyId?: string): Promise<Assessment[]> {
    const collection = await this.getCollection()
    const filter: any = { userId }
    
    if (companyId) {
      filter.companyId = companyId
    }

    const documents = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map(this.documentToAssessment)
  }

  static async findById(id: string, userId: string): Promise<Assessment | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return document ? this.documentToAssessment(document) : null
  }

  static async create(data: {
    name: string
    companyId: string
    type: 'EXPLORATORY' | 'MIGRATION'
    userId: string
  }): Promise<Assessment> {
    const collection = await this.getCollection()
    const now = new Date()

    // Determine total steps based on assessment type
    const totalSteps = data.type === 'EXPLORATORY' ? 7 : 8

    const document: Omit<AssessmentDocument, '_id'> = {
      name: data.name,
      companyId: data.companyId,
      userId: data.userId,
      type: data.type,
      status: 'DRAFT',
      currentStep: 1,
      totalSteps,
      responses: {},
      createdAt: now,
      updatedAt: now
    }

    const result = await collection.insertOne(document)
    const created = await collection.findOne({ _id: result.insertedId })

    if (!created) {
      throw new Error('Failed to create assessment')
    }

    return this.documentToAssessment(created)
  }

  static async update(
    id: string, 
    userId: string, 
    data: {
      name?: string
      status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
      currentStep?: number
      responses?: AssessmentResponses
      completedAt?: Date
    }
  ): Promise<Assessment | null> {
    const collection = await this.getCollection()
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    }

    // If status is being set to COMPLETED, set completedAt
    if (data.status === 'COMPLETED' && !data.completedAt) {
      updateData.completedAt = new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result ? this.documentToAssessment(result) : null
  }

  static async saveResponses(
    id: string,
    userId: string,
    stepId: string,
    responses: { [questionId: string]: any },
    currentStep: number
  ): Promise<Assessment | null> {
    const collection = await this.getCollection()
    
    // First, get the current document to merge responses properly
    const currentDoc = await collection.findOne({ _id: new ObjectId(id), userId })
    if (!currentDoc) {
      return null
    }

    // Merge the new responses with existing ones
    const updatedResponses = {
      ...currentDoc.responses,
      [stepId]: responses
    }

    const updateData = {
      responses: updatedResponses,
      currentStep,
      status: 'IN_PROGRESS' as const,
      updatedAt: new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result ? this.documentToAssessment(result) : null
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return result.deletedCount === 1
  }

  static async getByCompany(companyId: string, userId: string): Promise<Assessment[]> {
    const collection = await this.getCollection()
    const documents = await collection
      .find({ companyId, userId })
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map(this.documentToAssessment)
  }

  private static documentToAssessment(document: any): Assessment {
    return {
      id: document._id.toString(),
      name: document.name,
      companyId: document.companyId,
      type: document.type,
      status: document.status,
      currentStep: document.currentStep,
      totalSteps: document.totalSteps,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      completedAt: document.completedAt || undefined
    }
  }

  // Create indexes for better performance
  static async createIndexes() {
    const collection = await this.getCollection()
    
    // Index for user queries
    await collection.createIndex({ userId: 1 })
    
    // Index for company queries
    await collection.createIndex({ companyId: 1, userId: 1 })
    
    // Compound index for user + status
    await collection.createIndex({ userId: 1, status: 1 })
    
    // Compound index for user + createdAt (for sorting)
    await collection.createIndex({ userId: 1, createdAt: -1 })
    
    // Text index for search functionality
    await collection.createIndex({ 
      name: 'text' 
    })
  }
}