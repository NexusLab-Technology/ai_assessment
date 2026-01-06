import { 
  validateCompanyName, 
  validateCompanyDescription, 
  validateCompanyForm,
  checkDuplicateCompanyName,
  COMPANY_NAME_MIN_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_DESCRIPTION_MAX_LENGTH
} from '@/utils/company-validation'
import { CompanyFormData, Company } from '@/types/company'

describe('Company Validation', () => {
  describe('validateCompanyName', () => {
    it('should accept valid company names', () => {
      const validNames = [
        'TechCorp',
        'Digital Solutions Ltd.',
        'ABC Manufacturing & Co.',
        'Global-Tech_Systems',
        'Innovation (R&D) Group',
        'Smart.AI Solutions'
      ]
      
      validNames.forEach(name => {
        expect(validateCompanyName(name)).toBeUndefined()
      })
    })

    it('should reject empty or whitespace-only names', () => {
      expect(validateCompanyName('')).toBe('Company name is required')
      expect(validateCompanyName('   ')).toBe('Company name is required')
    })

    it('should reject names that are too short', () => {
      expect(validateCompanyName('A')).toBe(`Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`)
    })

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(COMPANY_NAME_MAX_LENGTH + 1)
      expect(validateCompanyName(longName)).toBe(`Company name must not exceed ${COMPANY_NAME_MAX_LENGTH} characters`)
    })

    it('should reject names with invalid characters', () => {
      const invalidNames = ['Tech@Corp', 'Digital#Solutions', 'Global*Tech', 'Smart+AI']
      invalidNames.forEach(name => {
        expect(validateCompanyName(name)).toContain('invalid characters')
      })
    })
  })

  describe('validateCompanyDescription', () => {
    it('should accept undefined description', () => {
      expect(validateCompanyDescription(undefined)).toBeUndefined()
    })

    it('should accept empty description', () => {
      expect(validateCompanyDescription('')).toBeUndefined()
    })

    it('should accept valid descriptions', () => {
      expect(validateCompanyDescription('A leading technology company')).toBeUndefined()
    })

    it('should reject descriptions that are too long', () => {
      const longDescription = 'A'.repeat(COMPANY_DESCRIPTION_MAX_LENGTH + 1)
      expect(validateCompanyDescription(longDescription)).toBe(`Description must not exceed ${COMPANY_DESCRIPTION_MAX_LENGTH} characters`)
    })
  })

  describe('validateCompanyForm', () => {
    it('should return no errors for valid form data', () => {
      const validData: CompanyFormData = {
        name: 'Valid Company Name',
        description: 'A valid description'
      }
      
      const errors = validateCompanyForm(validData)
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should return name error for invalid name', () => {
      const invalidData: CompanyFormData = {
        name: 'A', // Too short
        description: 'Valid description'
      }
      
      const errors = validateCompanyForm(invalidData)
      expect(errors.name).toBeDefined()
      expect(errors.description).toBeUndefined()
    })

    it('should return description error for invalid description', () => {
      const invalidData: CompanyFormData = {
        name: 'Valid Company Name',
        description: 'A'.repeat(COMPANY_DESCRIPTION_MAX_LENGTH + 1) // Too long
      }
      
      const errors = validateCompanyForm(invalidData)
      expect(errors.name).toBeUndefined()
      expect(errors.description).toBeDefined()
    })

    it('should return both errors when both fields are invalid', () => {
      const invalidData: CompanyFormData = {
        name: '', // Empty
        description: 'A'.repeat(COMPANY_DESCRIPTION_MAX_LENGTH + 1) // Too long
      }
      
      const errors = validateCompanyForm(invalidData)
      expect(errors.name).toBeDefined()
      expect(errors.description).toBeDefined()
    })
  })

  describe('checkDuplicateCompanyName', () => {
    const existingCompanies: Company[] = [
      { 
        id: '1',
        name: 'TechCorp',
        createdAt: new Date(),
        updatedAt: new Date(),
        assessmentCount: 0
      },
      { 
        id: '2',
        name: 'Digital Solutions',
        createdAt: new Date(),
        updatedAt: new Date(),
        assessmentCount: 0
      },
      { 
        id: '3',
        name: 'Global Manufacturing',
        createdAt: new Date(),
        updatedAt: new Date(),
        assessmentCount: 0
      }
    ]

    it('should detect duplicate names (case insensitive)', () => {
      expect(checkDuplicateCompanyName('TechCorp', existingCompanies)).toBe(true)
      expect(checkDuplicateCompanyName('techcorp', existingCompanies)).toBe(true)
      expect(checkDuplicateCompanyName('TECHCORP', existingCompanies)).toBe(true)
    })

    it('should allow unique names', () => {
      expect(checkDuplicateCompanyName('New Company', existingCompanies)).toBe(false)
    })

    it('should handle whitespace in names', () => {
      expect(checkDuplicateCompanyName('  TechCorp  ', existingCompanies)).toBe(true)
    })
  })
})