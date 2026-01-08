import { getDatabase } from './mongodb'
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

function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const iv = Buffer.from(encryptedData.iv, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY.slice(0, 32), iv)
  
  // Set authentication tag for GCM mode
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  try {
    decrypted += decipher.final('utf8')
  } catch (error) {
    throw new Error('Decryption failed: authentication tag mismatch')
  }
  
  return decrypted
}

// Helper function to get decrypted credentials for internal use
export async function getDecryptedCredentials(companyId: string): Promise<AWSCredentials | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<StoredCredentials>('aws_credentials')

    const storedCredentials = await collection.findOne({ companyId: companyId as any })

    if (!storedCredentials) {
      return null
    }

    const accessKeyId = decrypt({
      encrypted: storedCredentials.encryptedAccessKeyId,
      iv: storedCredentials.accessKeyIdIv,
      authTag: storedCredentials.accessKeyIdAuthTag
    })

    const secretAccessKey = decrypt({
      encrypted: storedCredentials.encryptedSecretAccessKey,
      iv: storedCredentials.secretAccessKeyIv,
      authTag: storedCredentials.secretAccessKeyAuthTag
    })

    return {
      accessKeyId,
      secretAccessKey,
      region: storedCredentials.region
    }

  } catch (error) {
    console.error('Error decrypting AWS credentials:', error)
    return null
  }
}