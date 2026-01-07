/**
 * Enhanced CategoryNavigationSidebar with Database Integration
 * Task 15.1: Real-time category completion status updates with error handling
 * Requirements: 12.1, 12.2, 12.4
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { LoadingSpinner, CategoryLoading } from './LoadingSpinner'
import { CategoryError } from './ErrorMessage'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import type { 
  RAPIDQuestionnaireStructure, 
  Assessment, 
  CategoryCompletionStatus,
  RAPIDCategory 
} from '@/types/rapid-questionnaire'

interface EnhancedCategoryNavigationSidebarProps {
  questionnaire: RAPIDQuestionnaireStructure
  assessment: Assessment
  currentCategory: string
  currentSubcategory?: string
  onCategoryChange: (categoryId: string, subcategoryId?: string) => void
  onSubcategoryChange?: (subcategoryId: string) => void
  onStatusUpdate?: (categoryId: string, status: CategoryCompletionStatus) => void
  className?: string
  isMobile?: boolean
}

interface CategoryStats {
  totalQuestions: number
  answeredQuestions: number
  requiredQuestions: number
  answeredRequiredQuestions: number
  completionPercentage: number
  isComplete: boolean
}

export const EnhancedCategoryNavigationSidebar: React.FC<EnhancedCategoryNavigationSidebarProps> = ({
  questionnaire,
  assessment,
  currentCategory,
  currentSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onStatusUpdate,
  className = '',
  isMobile = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isMobile)
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Error handling
  const {
    error,
    isLoading: isErrorLoading,
    executeWithErrorHandling,
    retry,
    clearError
  } = useErrorHandler({
    maxRetries: 3,
    onError: (error) => console.error('Category navigation error:', error)
  })

  // Update category statistics
  const updateCategoryStats = useCallback(() => {
    const newStats: Record<string, CategoryStats> = {}
    
    questionnaire.categories.forEach(category => {
      const categoryResponses = assessment.responses[category.id] || {}
      const allQuestions = category.subcategories.flatMap(sub => sub.questions)
      const requiredQuestions = allQuestions.filter(q => q.required)
      
      const answeredQuestions = allQuestions.filter(q => {
        const response = categoryResponses[q.id]
        return response !== undefined && response !== null && response !== ''
      })
      
      const answeredRequiredQuestions = requiredQuestions.filter(q => {
        const response = categoryResponses[q.id]
        return response !== undefined && response !== null && response !== ''
      })

      const completionPercentage = allQuestions.length > 0 
        ? Math.round((answeredQuestions.length / allQuestions.length) * 100)
        : 0

      const isComplete = answeredRequiredQuestions.length === requiredQuestions.length

      newStats[category.id] = {
        totalQuestions: allQuestions.length,
        answeredQuestions: answeredQuestions.length,
        requiredQuestions: requiredQuestions.length,
        answeredRequiredQuestions: answeredRequiredQuestions.length,
        completionPercentage,
        isComplete
      }
    })
    
    setCategoryStats(newStats)
    setLastUpdated(new Date())
    setIsLoading(false)
  }, [questionnaire.categories, assessment.responses])

  // Real-time updates when assessment responses change
  useEffect(() => {
    updateCategoryStats()
  }, [updateCategoryStats])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateCategoryStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [updateCategoryStats])

  // Handle category selection with status update
  const handleCategorySelect = useCallback(async (categoryId: string, subcategoryId?: string) => {
    try {
      // Update category status if callback provided
      if (onStatusUpdate && categoryStats[categoryId]) {
        const stats = categoryStats[categoryId]
        const status: CategoryCompletionStatus = {
          categoryId,
          status: stats.isComplete ? 'completed' : stats.answeredQuestions > 0 ? 'partial' : 'not_started',
          completionPercentage: stats.completionPercentage,
          lastModified: new Date()
        }
        
        onStatusUpdate(categoryId, status)
      }

      // Navigate to category
      onCategoryChange(categoryId, subcategoryId)
      
      if (isMobile) {
        setIsCollapsed(true)
      }
    } catch (error) {
      console.error('Category navigation error:', error)
    }
  }, [categoryStats, onStatusUpdate, onCategoryChange, isMobile])

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((subcategoryId: string) => {
    if (onSubcategoryChange) {
      onSubcategoryChange(subcategoryId)
    }
  }, [onSubcategoryChange])

  // Get status icon based on completion
  const getStatusIcon = useCallback((category: RAPIDCategory) => {
    const stats = categoryStats[category.id]
    if (!stats) {
      return (
        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <LoadingSpinner size="sm" />
        </div>
      )
    }

    const { completionPercentage, isComplete } = stats
    
    if (isComplete && completionPercentage === 100) {
      return (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    } else if (completionPercentage > 0) {
      return (
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center relative flex-shrink-0">
          <div 
            className="absolute inset-0 bg-blue-500 rounded-full transition-all duration-300"
            style={{ 
              clipPath: `polygon(0 0, ${completionPercentage}% 0, ${completionPercentage}% 100%, 0 100%)` 
            }}
          />
          <span className="text-xs font-medium text-blue-700 relative z-10">
            {Math.round(completionPercentage)}%
          </span>
        </div>
      )
    } else {
      return (
        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-500">{questionnaire.categories.indexOf(category) + 1}</span>
        </div>
      )
    }
  }, [categoryStats, questionnaire.categories])

  // Get category status for display
  const getCategoryStatus = useCallback((categoryId: string) => {
    const stats = categoryStats[categoryId]
    if (!stats) return 'loading'
    
    // A category is complete only if ALL required questions are answered
    if (stats.answeredRequiredQuestions === stats.requiredQuestions && stats.requiredQuestions > 0) return 'completed'
    if (stats.answeredQuestions > 0) return 'partial'
    return 'not_started'
  }, [categoryStats])

  // Toggle sidebar collapse
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  // Show loading state
  if (isLoading && !error) {
    return (
      <div className={`bg-white border-r border-gray-200 ${className}`}>
        <CategoryLoading categoryName="Navigation" operation="Loading" />
      </div>
    )
  }

  // Show error state
  if (error && !isErrorLoading) {
    return (
      <div className={`bg-white border-r border-gray-200 p-4 ${className}`}>
        <CategoryError
          categoryName="Navigation"
          operation="load"
          error={error}
          onRetry={retry}
          onSkip={clearError}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 z-50
        ${isMobile ? 'fixed left-0 top-0 h-full w-80' : 'relative'}
        ${isCollapsed && isMobile ? '-translate-x-full' : 'translate-x-0'}
        ${className}
      `}>
        {/* Mobile header with toggle */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex flex-col h-full">
          {/* Header */}
          {!isMobile && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Assessment Categories</h2>
                <div className="text-sm text-gray-500">
                  {questionnaire.categories.length} categories
                </div>
              </div>
              
              {/* Real-time update indicator */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                {isErrorLoading && <LoadingSpinner size="sm" />}
              </div>
            </div>
          )}
          
          {/* Category list */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {questionnaire.categories.map((category) => {
                const isActive = category.id === currentCategory
                const stats = categoryStats[category.id]
                const status = getCategoryStatus(category.id)
                
                return (
                  <div key={category.id} className="space-y-1">
                    {/* Main category button */}
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      disabled={isErrorLoading}
                      className={`
                        w-full text-left p-3 rounded-lg transition-all duration-200 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isActive
                          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(category)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-sm font-medium truncate ${
                              isActive ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {category.title}
                            </h3>
                            
                            {stats && stats.completionPercentage > 0 && (
                              <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                                stats.isComplete ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {Math.round(stats.completionPercentage)}%
                              </span>
                            )}
                          </div>
                          
                          {category.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {stats ? `${stats.answeredQuestions}/${stats.totalQuestions}` : category.subcategories.reduce((sum: number, sub: any) => sum + sub.questions.length, 0)} questions
                            </span>
                            
                            {/* Status badge */}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              status === 'completed' ? 'bg-green-100 text-green-800' :
                              status === 'partial' ? 'bg-blue-100 text-blue-800' :
                              status === 'loading' ? 'bg-gray-100 text-gray-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {status === 'completed' ? 'Complete' :
                               status === 'partial' ? 'In Progress' :
                               status === 'loading' ? 'Loading...' :
                               'Not Started'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Subcategories (show when category is active) */}
                    {isActive && category.subcategories.length > 0 && (
                      <div className="ml-9 space-y-1">
                        {category.subcategories.map((subcategory) => {
                          const isSubActive = subcategory.id === currentSubcategory
                          const subcategoryResponses = assessment.responses[category.id] || {}
                          const answeredInSub = subcategory.questions.filter(q => {
                            const response = subcategoryResponses[q.id]
                            return response !== undefined && response !== null && response !== ''
                          }).length

                          return (
                            <button
                              key={subcategory.id}
                              onClick={() => handleSubcategorySelect(subcategory.id)}
                              disabled={isErrorLoading}
                              className={`
                                w-full text-left p-2 rounded-md text-sm transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${isSubActive
                                  ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-500'
                                  : 'hover:bg-gray-50 text-gray-700 border-l-2 border-transparent'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{subcategory.title}</span>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {answeredInSub}/{subcategory.questions.length}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
          
          {/* Progress summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Progress Summary</h4>
            <div className="space-y-2">
              {(() => {
                const completed = Object.values(categoryStats).filter(s => 
                  s.answeredRequiredQuestions === s.requiredQuestions && s.requiredQuestions > 0
                ).length
                const inProgress = Object.values(categoryStats).filter(s => 
                  s.answeredQuestions > 0 && !(s.answeredRequiredQuestions === s.requiredQuestions && s.requiredQuestions > 0)
                ).length
                const notStarted = questionnaire.categories.length - completed - inProgress
                const overallPercentage = questionnaire.categories.length > 0 
                  ? Math.round(((completed + (inProgress * 0.5)) / questionnaire.categories.length) * 100)
                  : 0

                return (
                  <>
                    {/* Overall progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="font-medium">{overallPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                          style={{ width: `${overallPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Category counts */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-700">{completed}</div>
                        <div className="text-green-600">Complete</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-medium text-blue-700">{inProgress}</div>
                        <div className="text-blue-600">In Progress</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-700">{notStarted}</div>
                        <div className="text-gray-600">Not Started</div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile toggle button */}
      {isMobile && isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg border border-gray-200 lg:hidden"
          aria-label="Open navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </ErrorBoundary>
  )
}

export default EnhancedCategoryNavigationSidebar