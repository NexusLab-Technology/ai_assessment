import fc from 'fast-check'
import { 
  validateCompanyName, 
  validateCompanyDescription, 
  validateCompanyForm,
  checkDuplicateCompanyName,
  COMPANY_NAME_MIN_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_DESCRIPTION_MAX_LENGTH,
  COMPANY_NAME_PATTERN
} from '@/utils/company-validation'
import { CompanyFormData } from '@/types/company'

describe('Company Validation', () => {
  describe('Unit Tests', () => {
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

    describe('checkDuplicateCompanyName', () => {
      const existingCompanies = [
        { name: 'TechCorp' },
        { name: 'Digital Solutions' },
        { name: 'Global Manufacturing' }
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

  describe('Property-Based Tests', () => {
    /**
     * Feature: company-settings, Property 1: Company name uniqueness per user
     * For any user, no two companies should have the same name within that user's company list
     * Validates: Requirements 7.4
     */
    it('Property 1: Company name uniqueness per user', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          name: fc.string({ minLength: COMPANY_NAME_MIN_LENGTH, maxLength: COMPANY_NAME_MAX_LENGTH })
            .filter(name => COMPANY_NAME_PATTERN.test(name.trim())),
          id: fc.string({ minLength: 1 })
        }), { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: COMPANY_NAME_MIN_LENGTH, maxLength: COMPANY_NAME_MAX_LENGTH })
          .filter(name => COMPANY_NAME_PATTERN.test(name.trim())),
        (existingCompanies, newCompanyName) => {
          // Test that duplicate detection works correctly
          const hasDuplicate = existingCompanies.some(company => 
            company.name.toLowerCase().trim() === newCompanyName.toLowerCase().trim()
          )
          
          const detectedDuplicate = checkDuplicateCompanyName(newCompanyName, existingCompanies)
          
          // The duplicate detection function should match our expectation
          expect(detectedDuplicate).toBe(hasDuplicate)
        }
      ), { numRuns: 100 })
    })

    /**
     * Feature: company-settings, Property 7: Form validation consistency
     * For any invalid company data submission, the form should prevent submission 
     * and display appropriate error messages for all invalid fields
     * Validates: Requirements 7.1, 7.2, 7.3
     */
    it('Property 7: Form validation consistency', () => {
      fc.assert(fc.property(
        fc.record({
          name: fc.string(),
          description: fc.option(fc.string(), { nil: undefined })
        }),
        (formData: CompanyFormData) => {
          const errors = validateCompanyForm(formData)
          
          // Check name validation consistency
          const nameError = validateCompanyName(formData.name)
          if (nameError) {
            expect(errors.name).toBe(nameError)
          } else {
            expect(errors.name).toBeUndefined()
          }
          
          // Check description validation consistency
          const descriptionError = validateCompanyDescription(formData.description)
          if (descriptionError) {
            expect(errors.description).toBe(descriptionError)
          } else {
            expect(errors.description).toBeUndefined()
          }
          
          // If there are validation errors, form should be invalid
          const hasErrors = Object.keys(errors).length > 0
          const shouldHaveErrors = nameError !== undefined || descriptionError !== undefined
          expect(hasErrors).toBe(shouldHaveErrors)
        }
      ), { numRuns: 100 })
    })

    it('should validate company names with various edge cases', () => {
      fc.assert(fc.property(
        fc.string(),
        (name) => {
          const error = validateCompanyName(name)
          const trimmedName = name.trim()
          
          if (trimmedName.length === 0) {
            expect(error).toBe('Company name is required')
          } else if (trimmedName.length < COMPANY_NAME_MIN_LENGTH) {
            expect(error).toBe(`Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`)
          } else if (trimmedName.length > COMPANY_NAME_MAX_LENGTH) {
            expect(error).toBe(`Company name must not exceed ${COMPANY_NAME_MAX_LENGTH} characters`)
          } else if (!COMPANY_NAME_PATTERN.test(trimmedName)) {
            expect(error).toContain('invalid characters')
          } else {
            expect(error).toBeUndefined()
          }
        }
      ), { numRuns: 100 })
    })

    it('should validate company descriptions with length constraints', () => {
      fc.assert(fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (description) => {
          const error = validateCompanyDescription(description)
          
          if (!description) {
            expect(error).toBeUndefined()
          } else if (description.length > COMPANY_DESCRIPTION_MAX_LENGTH) {
            expect(error).toBe(`Description must not exceed ${COMPANY_DESCRIPTION_MAX_LENGTH} characters`)
          } else {
            expect(error).toBeUndefined()
          }
        }
      ), { numRuns: 100 })
    })
  })
})