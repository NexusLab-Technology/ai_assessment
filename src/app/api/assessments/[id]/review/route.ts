/**
 * Enhanced Assessment Review API Route
 * GET /api/assessments/[id]/review - Get comprehensive assessment data for category-based review
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssessmentService } from '@/lib/services/assessment-service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // Get assessment and questionnaire data for review
    const reviewData = await AssessmentService.getAssessmentForReview(id)
    
    if (reviewData.error) {
      return NextResponse.json(
        { error: reviewData.error },
        { status: 404 }
      )
    }

    if (!reviewData.assessment || !reviewData.questionnaire) {
      return NextResponse.json(
        { error: 'Assessment or questionnaire data not found' },
        { status: 404 }
      )
    }

    // Get assessment statistics
    const statistics = await AssessmentService.getAssessmentStatistics(id)

    // Calculate detailed completion information for each category
    const categoryDetails = reviewData.questionnaire.categories.map((category: any) => {
      const categoryResponses = reviewData.assessment!.responses[category.id] || {}
      const categoryStatus = reviewData.assessment!.categoryStatuses[category.id]
      
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
          isComplete: subcategoryRequiredAnswered.length === subcategoryRequired.length,
          questions: subcategoryQuestions.map((question: any) => ({
            questionId: question.id,
            questionNumber: question.number,
            questionText: question.text,
            questionType: question.type,
            required: question.required,
            options: question.options,
            response: categoryResponses[question.id],
            hasResponse: categoryResponses[question.id] !== undefined && 
                        categoryResponses[question.id] !== null && 
                        categoryResponses[question.id] !== '',
            isValid: question.required ? 
              (categoryResponses[question.id] !== undefined && 
               categoryResponses[question.id] !== null && 
               categoryResponses[question.id] !== '') : true
          }))
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
          })),
          invalidResponses: allQuestions.filter((q: any) => {
            const response = categoryResponses[q.id]
            if (q.required && (response === undefined || response === null || response === '')) {
              return true
            }
            // Add more validation rules here if needed
            return false
          }).map((q: any) => ({
            questionId: q.id,
            questionNumber: q.number,
            questionText: q.text,
            issue: 'Required field is empty'
          }))
        }
      }
    })

    // Check overall assessment completion status
    const allRequiredAnswered = categoryDetails.every((category: any) => 
      category.validation.allRequiredAnswered
    )

    const totalQuestions = categoryDetails.reduce((sum, cat) => sum + cat.totalQuestions, 0)
    const totalAnswered = categoryDetails.reduce((sum, cat) => sum + cat.answeredQuestions, 0)
    const totalRequired = categoryDetails.reduce((sum, cat) => sum + cat.requiredQuestions, 0)
    const totalRequiredAnswered = categoryDetails.reduce((sum, cat) => sum + cat.answeredRequiredQuestions, 0)

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

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: reviewData.assessment.id,
          name: reviewData.assessment.name,
          type: reviewData.assessment.type,
          status: reviewData.assessment.status,
          currentCategory: reviewData.assessment.currentCategory,
          rapidQuestionnaireVersion: reviewData.assessment.rapidQuestionnaireVersion,
          createdAt: reviewData.assessment.createdAt,
          updatedAt: reviewData.assessment.updatedAt,
          completedAt: reviewData.assessment.completedAt
        },
        questionnaire: {
          version: reviewData.questionnaire.version,
          assessmentType: reviewData.questionnaire.assessmentType,
          totalQuestions: reviewData.questionnaire.totalQuestions,
          totalCategories: reviewData.questionnaire.categories.length
        },
        statistics: statistics || {
          totalCategories: 0,
          completedCategories: 0,
          inProgressCategories: 0,
          notStartedCategories: 0,
          overallCompletionPercentage: 0
        },
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
          readyForCompletion: allRequiredAnswered && reviewData.assessment.status !== 'COMPLETED',
          nextRecommendedCategory: nextCategory ? {
            categoryId: nextCategory.categoryId,
            categoryTitle: nextCategory.categoryTitle,
            completionPercentage: nextCategory.completionPercentage
          } : null,
          completionIssues: categoryDetails.flatMap(cat => 
            cat.validation.missingRequiredQuestions.map(q => ({
              categoryId: cat.categoryId,
              categoryTitle: cat.categoryTitle,
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              questionText: q.questionText,
              issue: 'Required field is empty'
            }))
          )
        }
      }
    })

  } catch (error) {
    console.error('Error getting assessment review data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}