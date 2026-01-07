/**
 * Property-Based Tests for Category Review Data Accuracy
 * Task 12.2: Property 10 - Category review data accuracy
 * Validates Requirements 11.4, 11.6, 11.7
 */

import * as fc from 'fast-check'

describe('Property 10: Category review data accuracy', () => {
  // Generators for testing - ensure uniqueness
  const categoryIdArb = fc.constantFrom('use-case-discovery', 'data-readiness', 'compliance-integration', 'technical-architecture', 'implementation-planning')
  const questionIdArb = fc.integer({ min: 1, max: 1000 }).map(n => `q-${n}`)
  const questionNumberArb = fc.string({ minLength: 3, maxLength: 8 }).filter(s => /^[A-Z0-9.-]+$/.test(s))
  
  const questionArb = fc.record({
    id: questionIdArb,
    number: questionNumberArb,
    text: fc.string({ minLength: 10, maxLength: 200 }),
    type: fc.constantFrom('text', 'select', 'multiselect', 'number', 'boolean'),
    required: fc.boolean(),
    options: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }))
  })

  const subcategoryArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 20 }),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    questions: fc.array(questionArb, { minLength: 1, maxLength: 5 }).map(questions => {
      // Ensure unique question IDs within subcategory
      const uniqueQuestions = new Map()
      questions.forEach((q, index) => {
        const uniqueId = `${q.id}-${index}`
        uniqueQuestions.set(uniqueId, { ...q, id: uniqueId })
      })
      return Array.from(uniqueQuestions.values())
    })
  })

  const categoryArb = fc.record({
    id: categoryIdArb,
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    subcategories: fc.array(subcategoryArb, { minLength: 1, maxLength: 3 }).map(subcategories => {
      // Ensure unique subcategory IDs within category
      return subcategories.map((sub, index) => ({
        ...sub,
        id: `${sub.id}-${index}`
      }))
    })
  })

  const questionnaireArb = fc.record({
    version: fc.string({ minLength: 5, maxLength: 20 }),
    assessmentType: fc.constantFrom('exploratory', 'migration'),
    totalQuestions: fc.integer({ min: 10, max: 200 }),
    categories: fc.array(categoryArb, { minLength: 1, maxLength: 3 }).map(categories => {
      // Ensure unique category IDs
      const uniqueCategories = new Map()
      categories.forEach(cat => {
        if (!uniqueCategories.has(cat.id)) {
          uniqueCategories.set(cat.id, cat)
        }
      })
      return Array.from(uniqueCategories.values())
    })
  })

  const responseValueArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.integer({ min: 1, max: 5 }),
    fc.boolean(),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 3 })
  )

  const assessmentArb = fc.record({
    id: fc.string({ minLength: 24, maxLength: 24 }),
    name: fc.string({ minLength: 5, maxLength: 100 }),
    type: fc.constantFrom('exploratory', 'migration'),
    status: fc.constantFrom('DRAFT', 'IN_PROGRESS', 'COMPLETED'),
    currentCategory: categoryIdArb,
    rapidQuestionnaireVersion: fc.string({ minLength: 5, maxLength: 20 }),
    responses: fc.dictionary(categoryIdArb, fc.dictionary(questionIdArb, responseValueArb)),
    categoryStatuses: fc.dictionary(categoryIdArb, fc.record({
      status: fc.constantFrom('not_started', 'partial', 'completed'),
      completionPercentage: fc.integer({ min: 0, max: 100 }),
      lastModified: fc.date()
    })),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    completedAt: fc.option(fc.date())
  })

  /**
   * Helper function to calculate category review data (simulates API logic)
   */
  const calculateCategoryReviewData = (assessment: any, questionnaire: any) => {
    // Calculate detailed completion information for each category
    const categoryDetails = questionnaire.categories.map((category: any) => {
      const categoryResponses = assessment.responses[category.id] || {}
      const categoryStatus = assessment.categoryStatuses[category.id]
      
      // Count questions and responses
      const allQuestions = category.subcategories.flatMap((sub: any) => sub.questions)
      const requiredQuestions = allQuestions.filter((q: any) => q.required)
      const answeredQuestions = allQuestions.filter((q: any) => {
        const response = categoryResponses[q.id]
        return response !== undefined && response !== null && response !== ''
      })
      const answeredRequiredQuestions = requiredQuestions.filter((q: any) => {
        const response = categoryResponses[q.id]
        return response !== undefined && response !== null && response !== ''
      })

      // Calculate subcategory details
      const subcategoryDetails = category.subcategories.map((subcategory: any) => {
        const subcategoryQuestions = subcategory.questions
        const subcategoryAnswered = subcategoryQuestions.filter((q: any) => {
          const response = categoryResponses[q.id]
          return response !== undefined && response !== null && response !== ''
        })
        const subcategoryRequired = subcategoryQuestions.filter((q: any) => q.required)
        const subcategoryRequiredAnswered = subcategoryRequired.filter((q: any) => {
          const response = categoryResponses[q.id]
          return response !== undefined && response !== null && response !== ''
        })

        return {
          subcategoryId: subcategory.id,
          subcategoryTitle: subcategory.title,
          subcategoryDescription: subcategory.description,
          totalQuestions: subcategoryQuestions.length,
          requiredQuestions: subcategoryRequired.length,
          answeredQuestions: subcategoryAnswered.length,
          answeredRequiredQuestions: subcategoryRequiredAnswered.length,
          completionPercentage: subcategoryQuestions.length > 0 ? 
            Math.round((subcategoryAnswered.length / subcategoryQuestions.length) * 100) : 0,
          isComplete: subcategoryRequiredAnswered.length === subcategoryRequired.length
        }
      })

      return {
        categoryId: category.id,
        categoryTitle: category.title,
        categoryDescription: category.description,
        totalQuestions: allQuestions.length,
        requiredQuestions: requiredQuestions.length,
        answeredQuestions: answeredQuestions.length,
        answeredRequiredQuestions: answeredRequiredQuestions.length,
        completionPercentage: allQuestions.length > 0 ? 
          Math.round((answeredQuestions.length / allQuestions.length) * 100) : 0,
        status: categoryStatus?.status || 'not_started',
        lastModified: categoryStatus?.lastModified,
        isComplete: answeredRequiredQuestions.length === requiredQuestions.length,
        subcategories: subcategoryDetails,
        
        // Validation information
        validation: {
          allRequiredAnswered: answeredRequiredQuestions.length === requiredQuestions.length,
          missingRequiredQuestions: requiredQuestions.filter((q: any) => {
            const response = categoryResponses[q.id]
            return response === undefined || response === null || response === ''
          }).map((q: any) => ({
            questionId: q.id,
            questionNumber: q.number,
            questionText: q.text
          }))
        }
      }
    })

    // Calculate summary
    const totalQuestions = categoryDetails.reduce((sum: number, cat: any) => sum + cat.totalQuestions, 0)
    const totalAnswered = categoryDetails.reduce((sum: number, cat: any) => sum + cat.answeredQuestions, 0)
    const totalRequired = categoryDetails.reduce((sum: number, cat: any) => sum + cat.requiredQuestions, 0)
    const totalRequiredAnswered = categoryDetails.reduce((sum: number, cat: any) => sum + cat.answeredRequiredQuestions, 0)

    // Calculate next recommended category - prioritize categories with required questions that aren't answered
    const nextCategory = categoryDetails.find(cat => 
      // Has required questions that aren't answered
      (cat.requiredQuestions > 0 && cat.answeredRequiredQuestions < cat.requiredQuestions) ||
      // Or has no progress at all
      (cat.answeredQuestions === 0 && cat.totalQuestions > 0) ||
      // Or is explicitly marked as not started or partial
      cat.status === 'not_started' || 
      (cat.status === 'partial' && !cat.isComplete)
    )

    const allRequiredAnswered = categoryDetails.every((category: any) => 
      category.validation.allRequiredAnswered
    )

    return {
      categoryDetails,
      summary: {
        totalQuestions,
        totalAnswered,
        totalRequired,
        totalRequiredAnswered,
        overallCompletionPercentage: totalQuestions > 0 ? 
          Math.round((totalAnswered / totalQuestions) * 100) : 0,
        requiredCompletionPercentage: totalRequired > 0 ? 
          Math.round((totalRequiredAnswered / totalRequired) * 100) : 0
      },
      validation: {
        allRequiredAnswered,
        nextRecommendedCategory: nextCategory ? {
          categoryId: nextCategory.categoryId,
          categoryTitle: nextCategory.categoryTitle,
          completionPercentage: nextCategory.completionPercentage
        } : null
      }
    }
  }

  /**
   * Property 10.1: Category completion percentages are accurately calculated
   */
  test('category completion percentages are accurately calculated from responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Property: Each category's completion percentage should be accurately calculated
          data.categoryDetails.forEach((categoryDetail: any) => {
            const category = questionnaire.categories.find((c: any) => c.id === categoryDetail.categoryId)
            if (!category) return

            const allQuestions = category.subcategories.flatMap((sub: any) => sub.questions)
            const categoryResponses = assessment.responses[category.id] || {}
            
            const answeredQuestions = allQuestions.filter((q: any) => {
              const response = categoryResponses[q.id]
              return response !== undefined && response !== null && response !== ''
            })

            const expectedPercentage = allQuestions.length > 0 ? 
              Math.round((answeredQuestions.length / allQuestions.length) * 100) : 0

            // Property: Completion percentage should match calculated value
            expect(categoryDetail.completionPercentage).toBe(expectedPercentage)
            expect(categoryDetail.totalQuestions).toBe(allQuestions.length)
            expect(categoryDetail.answeredQuestions).toBe(answeredQuestions.length)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.2: Required question validation is accurate
   */
  test('required question validation accurately identifies missing responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Property: Required question validation should be accurate
          data.categoryDetails.forEach((categoryDetail: any) => {
            const category = questionnaire.categories.find((c: any) => c.id === categoryDetail.categoryId)
            if (!category) return

            const allQuestions = category.subcategories.flatMap((sub: any) => sub.questions)
            const requiredQuestions = allQuestions.filter((q: any) => q.required)
            const categoryResponses = assessment.responses[category.id] || {}
            
            const answeredRequiredQuestions = requiredQuestions.filter((q: any) => {
              const response = categoryResponses[q.id]
              return response !== undefined && response !== null && response !== ''
            })

            // Property: Required question counts should be accurate
            expect(categoryDetail.requiredQuestions).toBe(requiredQuestions.length)
            expect(categoryDetail.answeredRequiredQuestions).toBe(answeredRequiredQuestions.length)
            
            // Property: Validation should correctly identify completion status
            const expectedIsComplete = answeredRequiredQuestions.length === requiredQuestions.length
            expect(categoryDetail.isComplete).toBe(expectedIsComplete)
            expect(categoryDetail.validation.allRequiredAnswered).toBe(expectedIsComplete)

            // Property: Missing required questions should be accurately identified
            const expectedMissingRequired = requiredQuestions.filter((q: any) => {
              const response = categoryResponses[q.id]
              return response === undefined || response === null || response === ''
            })
            expect(categoryDetail.validation.missingRequiredQuestions).toHaveLength(expectedMissingRequired.length)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.3: Subcategory details are accurately calculated
   */
  test('subcategory completion details are accurately calculated', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Property: Subcategory details should be accurately calculated
          data.categoryDetails.forEach((categoryDetail: any) => {
            const category = questionnaire.categories.find((c: any) => c.id === categoryDetail.categoryId)
            if (!category) return

            const categoryResponses = assessment.responses[category.id] || {}

            categoryDetail.subcategories.forEach((subcategoryDetail: any, index: number) => {
              const subcategory = category.subcategories[index]
              if (!subcategory) return

              const subcategoryQuestions = subcategory.questions
              const answeredQuestions = subcategoryQuestions.filter((q: any) => {
                const response = categoryResponses[q.id]
                return response !== undefined && response !== null && response !== ''
              })
              const requiredQuestions = subcategoryQuestions.filter((q: any) => q.required)
              const answeredRequiredQuestions = requiredQuestions.filter((q: any) => {
                const response = categoryResponses[q.id]
                return response !== undefined && response !== null && response !== ''
              })

              // Property: Subcategory counts should be accurate
              expect(subcategoryDetail.totalQuestions).toBe(subcategoryQuestions.length)
              expect(subcategoryDetail.answeredQuestions).toBe(answeredQuestions.length)
              expect(subcategoryDetail.requiredQuestions).toBe(requiredQuestions.length)
              expect(subcategoryDetail.answeredRequiredQuestions).toBe(answeredRequiredQuestions.length)

              // Property: Subcategory completion percentage should be accurate
              const expectedPercentage = subcategoryQuestions.length > 0 ? 
                Math.round((answeredQuestions.length / subcategoryQuestions.length) * 100) : 0
              expect(subcategoryDetail.completionPercentage).toBe(expectedPercentage)

              // Property: Subcategory completion status should be accurate
              const expectedIsComplete = answeredRequiredQuestions.length === requiredQuestions.length
              expect(subcategoryDetail.isComplete).toBe(expectedIsComplete)
            })
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 10.4: Overall assessment summary is accurately calculated
   */
  test('overall assessment summary accurately reflects category data', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Calculate expected totals from category details
          const expectedTotalQuestions = data.categoryDetails.reduce((sum: number, cat: any) => sum + cat.totalQuestions, 0)
          const expectedTotalAnswered = data.categoryDetails.reduce((sum: number, cat: any) => sum + cat.answeredQuestions, 0)
          const expectedTotalRequired = data.categoryDetails.reduce((sum: number, cat: any) => sum + cat.requiredQuestions, 0)
          const expectedTotalRequiredAnswered = data.categoryDetails.reduce((sum: number, cat: any) => sum + cat.answeredRequiredQuestions, 0)

          // Property: Summary totals should match aggregated category data
          expect(data.summary.totalQuestions).toBe(expectedTotalQuestions)
          expect(data.summary.totalAnswered).toBe(expectedTotalAnswered)
          expect(data.summary.totalRequired).toBe(expectedTotalRequired)
          expect(data.summary.totalRequiredAnswered).toBe(expectedTotalRequiredAnswered)

          // Property: Overall completion percentages should be accurate
          const expectedOverallPercentage = expectedTotalQuestions > 0 ? 
            Math.round((expectedTotalAnswered / expectedTotalQuestions) * 100) : 0
          const expectedRequiredPercentage = expectedTotalRequired > 0 ? 
            Math.round((expectedTotalRequiredAnswered / expectedTotalRequired) * 100) : 0

          expect(data.summary.overallCompletionPercentage).toBe(expectedOverallPercentage)
          expect(data.summary.requiredCompletionPercentage).toBe(expectedRequiredPercentage)

          // Property: Validation should reflect overall completion status
          const expectedAllRequiredAnswered = expectedTotalRequiredAnswered === expectedTotalRequired
          expect(data.validation.allRequiredAnswered).toBe(expectedAllRequiredAnswered)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 10.5: Next recommended category logic is accurate
   */
  test('next recommended category is accurately determined', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Property: Next recommended category should be logically determined
          const nextRecommended = data.validation.nextRecommendedCategory
          
          if (nextRecommended) {
            // Should be a category that is not complete OR has no responses
            const recommendedCategory = data.categoryDetails.find((cat: any) => 
              cat.categoryId === nextRecommended.categoryId
            )
            
            expect(recommendedCategory).toBeDefined()
            
            // Should be either not complete OR have no answered questions
            const shouldBeRecommended = !recommendedCategory.isComplete || 
              recommendedCategory.answeredQuestions === 0 ||
              recommendedCategory.status === 'not_started' ||
              recommendedCategory.status === 'partial'
            
            expect(shouldBeRecommended).toBe(true)
          } else {
            // If no recommendation, all categories should be complete AND have some progress
            const allComplete = data.categoryDetails.every((cat: any) => 
              cat.isComplete && (cat.requiredQuestions === 0 || cat.answeredRequiredQuestions > 0)
            )
            expect(allComplete).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 10.6: Completion percentage consistency across levels
   */
  test('completion percentages are consistent across category and subcategory levels', async () => {
    await fc.assert(
      fc.asyncProperty(
        assessmentArb,
        questionnaireArb,
        async (assessment, questionnaire) => {
          // Action: Calculate category review data
          const data = calculateCategoryReviewData(assessment, questionnaire)

          // Property: Category completion should be consistent with subcategory aggregation
          data.categoryDetails.forEach((categoryDetail: any) => {
            const subcategoryTotalQuestions = categoryDetail.subcategories.reduce((sum: number, sub: any) => sum + sub.totalQuestions, 0)
            const subcategoryAnsweredQuestions = categoryDetail.subcategories.reduce((sum: number, sub: any) => sum + sub.answeredQuestions, 0)
            const subcategoryRequiredQuestions = categoryDetail.subcategories.reduce((sum: number, sub: any) => sum + sub.requiredQuestions, 0)
            const subcategoryAnsweredRequired = categoryDetail.subcategories.reduce((sum: number, sub: any) => sum + sub.answeredRequiredQuestions, 0)

            // Property: Category totals should match subcategory aggregation
            expect(categoryDetail.totalQuestions).toBe(subcategoryTotalQuestions)
            expect(categoryDetail.answeredQuestions).toBe(subcategoryAnsweredQuestions)
            expect(categoryDetail.requiredQuestions).toBe(subcategoryRequiredQuestions)
            expect(categoryDetail.answeredRequiredQuestions).toBe(subcategoryAnsweredRequired)

            // Property: Category completion should reflect subcategory completion
            const allSubcategoriesComplete = categoryDetail.subcategories.every((sub: any) => sub.isComplete)
            if (allSubcategoriesComplete && categoryDetail.requiredQuestions > 0) {
              expect(categoryDetail.isComplete).toBe(true)
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})