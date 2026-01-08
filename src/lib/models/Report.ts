import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { AssessmentReport, ReportDocument, ReportMetadata } from '../../types/assessment'

export class ReportModel {
  private static collectionName = 'reports'

  static async getCollection() {
    return getCollection(this.collectionName)
  }

  static async findAll(companyId?: string): Promise<AssessmentReport[]> {
    const collection = await this.getCollection()
    const filter: any = {
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility for existing records
      ]
    }
    
    if (companyId) {
      filter.companyId = new ObjectId(companyId)
    }

    const documents = await collection
      .find(filter)
      .sort({ generatedAt: -1 })
      .toArray()

    return documents.map(this.documentToReport)
  }

  static async findById(id: string): Promise<AssessmentReport | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id),
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility for existing records
      ]
    })

    return document ? this.documentToReport(document) : null
  }

  static async findByAssessmentId(assessmentId: string): Promise<AssessmentReport | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      assessmentId: new ObjectId(assessmentId),
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility for existing records
      ]
    })

    return document ? this.documentToReport(document) : null
  }

  static async create(data: {
    assessmentId: string
    companyId: string
    htmlContent: string
    metadata: ReportMetadata
  }): Promise<AssessmentReport> {
    const collection = await this.getCollection()
    const now = new Date()

    const document: Omit<ReportDocument, '_id'> = {
      assessmentId: new ObjectId(data.assessmentId),
      companyId: new ObjectId(data.companyId),
      htmlContent: data.htmlContent,
      generatedAt: now,
      isActive: true, // New reports are active by default
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
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result?.value ? this.documentToReport(result.value) : null
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    
    // Soft delete: Set isActive to false instead of deleting the record
    const result = await collection.findOneAndUpdate(
      { 
        _id: new ObjectId(id)
      },
      { 
        $set: { 
          isActive: false,
          generatedAt: new Date() // Update timestamp
        } 
      },
      { returnDocument: 'after' }
    )

    return result !== null
  }

  static async deleteByAssessmentId(assessmentId: string): Promise<boolean> {
    const collection = await this.getCollection()
    
    // Soft delete: Set isActive to false for all reports of this assessment
    const result = await collection.updateMany(
      { 
        assessmentId: new ObjectId(assessmentId)
      },
      { 
        $set: { 
          isActive: false,
          generatedAt: new Date() // Update timestamp
        } 
      }
    )

    return result.modifiedCount > 0
  }

  static async getByCompany(companyId: string): Promise<AssessmentReport[]> {
    const collection = await this.getCollection()
    const documents = await collection
      .find({ 
        companyId: new ObjectId(companyId),
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Backward compatibility for existing records
        ]
      })
      .sort({ generatedAt: -1 })
      .toArray()

    return documents.map(this.documentToReport)
  }

  private static documentToReport(document: any): AssessmentReport {
    return {
      id: document._id.toString(),
      assessmentId: document.assessmentId.toString(),
      companyId: document.companyId.toString(),
      htmlContent: document.htmlContent,
      generatedAt: document.generatedAt,
      metadata: document.metadata
    }
  }

  // Create indexes for better performance
  static async createIndexes() {
    const collection = await this.getCollection()
    
    // Index for assessment queries
    await collection.createIndex({ assessmentId: 1 }, { unique: true })
    
    // Index for company queries
    await collection.createIndex({ companyId: 1 })
    
    // Index for isActive (for filtering active reports)
    await collection.createIndex({ isActive: 1 })
    
    // Index for generatedAt (for sorting)
    await collection.createIndex({ generatedAt: -1 })
  }
}