import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { AssessmentReport, ReportDocument, ReportMetadata } from '../../types/assessment'

export class ReportModel {
  private static collectionName = 'reports'

  static async getCollection() {
    return getCollection(this.collectionName)
  }

  static async findAll(userId: string, companyId?: string): Promise<AssessmentReport[]> {
    const collection = await this.getCollection()
    const filter: any = { userId }
    
    if (companyId) {
      filter.companyId = companyId
    }

    const documents = await collection
      .find(filter)
      .sort({ generatedAt: -1 })
      .toArray()

    return documents.map(this.documentToReport)
  }

  static async findById(id: string, userId: string): Promise<AssessmentReport | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return document ? this.documentToReport(document) : null
  }

  static async findByAssessmentId(assessmentId: string, userId: string): Promise<AssessmentReport | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      assessmentId, 
      userId 
    })

    return document ? this.documentToReport(document) : null
  }

  static async create(data: {
    assessmentId: string
    companyId: string
    htmlContent: string
    metadata: ReportMetadata
    userId: string
  }): Promise<AssessmentReport> {
    const collection = await this.getCollection()
    const now = new Date()

    const document: Omit<ReportDocument, '_id'> = {
      assessmentId: data.assessmentId,
      companyId: data.companyId,
      userId: data.userId,
      htmlContent: data.htmlContent,
      generatedAt: now,
      metadata: data.metadata
    }

    const result = await collection.insertOne(document)
    const created = await collection.findOne({ _id: result.insertedId })

    if (!created) {
      throw new Error('Failed to create report')
    }

    return this.documentToReport(created)
  }

  static async update(
    id: string, 
    userId: string, 
    data: {
      htmlContent?: string
      metadata?: ReportMetadata
    }
  ): Promise<AssessmentReport | null> {
    const collection = await this.getCollection()
    const updateData = {
      ...data,
      generatedAt: new Date() // Update generation time when content changes
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result?.value ? this.documentToReport(result.value) : null
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return result.deletedCount === 1
  }

  static async deleteByAssessmentId(assessmentId: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteMany({ 
      assessmentId, 
      userId 
    })

    return result.deletedCount > 0
  }

  static async getByCompany(companyId: string, userId: string): Promise<AssessmentReport[]> {
    const collection = await this.getCollection()
    const documents = await collection
      .find({ companyId, userId })
      .sort({ generatedAt: -1 })
      .toArray()

    return documents.map(this.documentToReport)
  }

  private static documentToReport(document: any): AssessmentReport {
    return {
      id: document._id.toString(),
      assessmentId: document.assessmentId,
      companyId: document.companyId,
      htmlContent: document.htmlContent,
      generatedAt: document.generatedAt,
      metadata: document.metadata
    }
  }

  // Create indexes for better performance
  static async createIndexes() {
    const collection = await this.getCollection()
    
    // Index for user queries
    await collection.createIndex({ userId: 1 })
    
    // Index for assessment queries
    await collection.createIndex({ assessmentId: 1, userId: 1 })
    
    // Index for company queries
    await collection.createIndex({ companyId: 1, userId: 1 })
    
    // Compound index for user + generatedAt (for sorting)
    await collection.createIndex({ userId: 1, generatedAt: -1 })
    
    // Unique index to prevent duplicate reports per assessment
    await collection.createIndex({ 
      assessmentId: 1, 
      userId: 1 
    }, { unique: true })
  }
}