import { NextRequest } from 'next/server'
import { getDatabase } from '../../../../lib/mongodb'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-utils'
import crypto from 'crypto'

// Encryption key - in production, this should be from environment variables
const ENCRYPTION_KEY = process.env.AWS_CREDENTIALS_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars'

interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

interface StoredCredentials {
  _id?: string
  companyId: string
  encryptedAccessKeyId: string
  encryptedSecretAccessKey: string
  region: string
  accessKeyIdIv: string
  accessKeyIdAuthTag: string
  secretAccessKeyIv: string
  secretAccessKeyAuthTag: string
  createdAt: Date
  updatedAt: Date
}

function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY.slice(0, 32))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Note: For production, use proper GCM mode with authentication
  // This is a simplified version for development
  const authTag = crypto.randomBytes(16).toString('hex')
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag
  }
}

function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY.slice(0, 32))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return createErrorResponse('Company ID is required', 400)
    }

    const db = await getDatabase()
    const collection = db.collection<StoredCredentials>('aws_credentials')

    const storedCredentials = await collection.findOne({ companyId })

    if (!storedCredentials) {
      return createSuccessResponse({
        hasCredentials: false,
        message: 'No AWS credentials found for this company'
      })
    }

    // Decrypt and return credentials (without secret key for security)
    const accessKeyId = decrypt({
      encrypted: storedCredentials.encryptedAccessKeyId,
      iv: storedCredentials.accessKeyIdIv,
      authTag: storedCredentials.accessKeyIdAuthTag
    })

    return createSuccessResponse({
      hasCredentials: true,
      credentials: {
        accessKeyId: accessKeyId.substring(0, 8) + '...' + accessKeyId.substring(accessKeyId.length - 4), // Masked
        region: storedCredentials.region,
        lastUpdated: storedCredentials.updatedAt
      }
    })

  } catch (error) {
    console.error('Error retrieving AWS credentials:', error)
    return createErrorResponse('Failed to retrieve AWS credentials', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, credentials }: { companyId: string; credentials: AWSCredentials } = await request.json()

    if (!companyId) {
      return createErrorResponse('Company ID is required', 400)
    }

    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
      return createErrorResponse('All credential fields are required', 400)
    }

    // Validate AWS Access Key ID format
    if (!/^AKIA[0-9A-Z]{16}$/.test(credentials.accessKeyId)) {
      return createErrorResponse('Invalid AWS Access Key ID format', 400)
    }

    // Encrypt credentials
    const encryptedAccessKeyId = encrypt(credentials.accessKeyId)
    const encryptedSecretAccessKey = encrypt(credentials.secretAccessKey)

    const db = await getDatabase()
    const collection = db.collection<StoredCredentials>('aws_credentials')

    const now = new Date()
    const credentialsDoc: Omit<StoredCredentials, '_id'> = {
      companyId,
      encryptedAccessKeyId: encryptedAccessKeyId.encrypted,
      encryptedSecretAccessKey: encryptedSecretAccessKey.encrypted,
      region: credentials.region,
      accessKeyIdIv: encryptedAccessKeyId.iv,
      accessKeyIdAuthTag: encryptedAccessKeyId.authTag,
      secretAccessKeyIv: encryptedSecretAccessKey.iv,
      secretAccessKeyAuthTag: encryptedSecretAccessKey.authTag,
      createdAt: now,
      updatedAt: now
    }

    // Upsert credentials (update if exists, insert if not)
    const result = await collection.replaceOne(
      { companyId },
      credentialsDoc,
      { upsert: true }
    )

    return createSuccessResponse({
      success: true,
      message: 'AWS credentials saved successfully',
      credentialsId: result.upsertedId || 'updated'
    })

  } catch (error) {
    console.error('Error saving AWS credentials:', error)
    return createErrorResponse('Failed to save AWS credentials', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return createErrorResponse('Company ID is required', 400)
    }

    const db = await getDatabase()
    const collection = db.collection<StoredCredentials>('aws_credentials')

    const result = await collection.deleteOne({ companyId })

    if (result.deletedCount === 0) {
      return createErrorResponse('No AWS credentials found for this company', 404)
    }

    return createSuccessResponse({
      success: true,
      message: 'AWS credentials deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting AWS credentials:', error)
    return createErrorResponse('Failed to delete AWS credentials', 500)
  }
}