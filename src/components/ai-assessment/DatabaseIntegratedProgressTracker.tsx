/**
 * Database Integrated Progress Tracker Component
 * Task 18.1: Complete EnhancedProgressTracker integration
 * 
 * Features:
 * - Real-time progress tracking with database integration
 * - Category completion status from assessment data
 * - Visual indicators that update with real data
 * - Clickable category navigation functionality
 * - Accurate progress calculations for RAPID structure
 * - Auto-refresh capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PlayCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';
import { 
  RAPIDCategory, 
  CategoryCompletionStatus,
  Assessment,
  AssessmentResponses
} from '../../types/rapid-questionnaire';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface DatabaseIntegratedProgressTrackerProps {
  assessment: Assessment;
  categories: RAPIDCategory[];
  currentCategory: string;
  onCategoryClick: (categoryId: string) => void;
  className?: string;
  showDetailedProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onProgressUpdate?: (progress: ProgressSummary) => void;
}

interface ProgressSummary {
  totalCategories: number;
  completedCategories: number;
  inProgressCategories: number;
  notStartedCategories: number;
  overallPercentage: number;
  categoryStatuses: CategoryCompletionStatus[];
}

interface CategoryProgress {
  categoryId: string;
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  completionPercentage: number;
  status: 'not_started' | 'partial' | 'completed';
}

export const DatabaseIntegratedProgressTracker: React.FC<DatabaseIntegratedProgressTrackerProps> = ({
  assessment,
  categories,
  currentCategory,
  onCategoryClick,
  className = '',
  showDetailedProgress = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onProgressUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressSummary | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Calculate category progress from responses
  const calculateCategoryProgress = useCallback((
    categoryId: string, 
    responses: AssessmentResponses
  ): CategoryProgress => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return {
        categoryId,
        totalQuestions: 0,
        answeredQuestions: 0,
        requiredQuestions: 0,
        answeredRequiredQuestions: 0,
        completionPercentage: 0,
        status: 'not_started'
      };
    }

    const categoryResponses = responses[categoryId] || {};
    const allQuestions = category.subcategories.flatMap(sub => sub.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    
    const answeredQuestions = allQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== undefined && response !== null && response !== '';
    });

    const answeredRequiredQuestions = requiredQuestions.filter(q => {
      const response = categoryResponses[q.id];
      return response !== undefined && response !== null && response !== '';
    });

    const completionPercentage = allQuestions.length > 0 ? 
      Math.round((answeredQuestions.length / allQuestions.length) * 100) : 0;

    let status: 'not_started' | 'partial' | 'completed' = 'not_started';
    
    if (answeredRequiredQuestions.length === requiredQuestions.length && requiredQuestions.length > 0) {
      status = 'completed';
    } else if (answeredQuestions.length > 0) {
      status = 'partial';
    }

    return {
      categoryId,
      totalQuestions: allQuestions.length,
      answeredQuestions: answeredQuestions.length,
      requiredQuestions: requiredQuestions.length,
      answeredRequiredQuestions: answeredRequiredQuestions.length,
      completionPercentage,
      status
    };
  }, [categories]);

  // Load progress data from assessment
  const loadProgressData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate progress for each category
      const categoryProgresses = categories.map(category => 
        calculateCategoryProgress(category.id, assessment.responses)
      );

      // Convert to CategoryCompletionStatus format
      const categoryStatuses: CategoryCompletionStatus[] = categoryProgresses.map(progress => ({
        categoryId: progress.categoryId,
        status: progress.status,
        completionPercentage: progress.completionPercentage,
        lastModified: new Date()
      }));

      // Calculate overall progress
      const totalCategories = categories.length;
      const completedCategories = categoryProgresses.filter(p => p.status === 'completed').length;
      const inProgressCategories = categoryProgresses.filter(p => p.status === 'partial').length;
      const notStartedCategories = totalCategories - completedCategories - inProgressCategories;
      
      const overallPercentage = totalCategories > 0 ? 
        Math.round(((completedCategories + (inProgressCategories * 0.5)) / totalCategories) * 100) : 0;

      const progressSummary: ProgressSummary = {
        totalCategories,
        completedCategories,
        inProgressCategories,
        notStartedCategories,
        overallPercentage,
        categoryStatuses
      };

      setProgressData(progressSummary);
      setLastRefresh(new Date());
      onProgressUpdate?.(progressSummary);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress data';
      setError(errorMessage);
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  }, [assessment.responses, categories, calculateCategoryProgress, onProgressUpdate]);

  // Auto-refresh effect
  useEffect(() => {
    loadProgressData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadProgressData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadProgressData, autoRefresh, refreshInterval]);

  // Refresh when assessment responses change
  useEffect(() => {
    loadProgressData();
  }, [assessment.responses, loadProgressData]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Get completion status for a specific category
  const getCategoryStatus = useCallback((categoryId: string): CategoryCompletionStatus => {
    if (!progressData) {
      return {
        categoryId,
        status: 'not_started',
        completionPercentage: 0,
        lastModified: new Date()
      };
    }

    return progressData.categoryStatuses.find(status => status.categoryId === categoryId) || {
      categoryId,
      status: 'not_started',
      completionPercentage: 0,
      lastModified: new Date()
    };
  }, [progressData]);

  // Get status icon for a category
  const getStatusIcon = useCallback((category: RAPIDCategory, status: CategoryCompletionStatus) => {
    const isActive = category.id === currentCategory;
    
    switch (status.status) {
      case 'completed':
        return (
          <CheckCircleIconSolid 
            className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-green-500'}`} 
          />
        );
      case 'partial':
        return (
          <div className={`relative w-6 h-6 ${isActive ? 'ring-2 ring-blue-600 ring-offset-1' : ''} rounded-full`}>
            <ClockIcon className="w-6 h-6 text-blue-500" />
            <div 
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              style={{
                background: `conic-gradient(#3b82f6 ${status.completionPercentage * 3.6}deg, transparent 0deg)`
              }}
            />
          </div>
        );
      case 'not_started':
      default:
        return (
          <PlayCircleIcon 
            className={`w-6 h-6 ${isActive ? 'text-gray-700 ring-2 ring-gray-600 ring-offset-1 rounded-full' : 'text-gray-400'}`} 
          />
        );
    }
  }, [currentCategory]);

  // Get status color classes
  const getStatusColors = useCallback((category: RAPIDCategory, status: CategoryCompletionStatus) => {
    const isActive = category.id === currentCategory;
    
    if (isActive) {
      return {
        container: 'bg-blue-50 border-blue-200 shadow-md',
        title: 'text-blue-900',
        subtitle: 'text-blue-700',
        progress: 'bg-blue-600'
      };
    }

    switch (status.status) {
      case 'completed':
        return {
          container: 'bg-green-50 border-green-200 hover:bg-green-100',
          title: 'text-green-900',
          subtitle: 'text-green-700',
          progress: 'bg-green-600'
        };
      case 'partial':
        return {
          container: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
          title: 'text-blue-900',
          subtitle: 'text-blue-700',
          progress: 'bg-blue-600'
        };
      case 'not_started':
      default:
        return {
          container: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
          title: 'text-gray-900',
          subtitle: 'text-gray-600',
          progress: 'bg-gray-400'
        };
    }
  }, [currentCategory]);

  if (loading && !progressData) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (error && !progressData) {
    return (
      <div className={className}>
        <ErrorMessage
          title="Failed to Load Progress"
          message={error}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        No progress data available
      </div>
    );
  }

  return (
    <div className={`database-integrated-progress-tracker ${className}`}>
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Assessment Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh progress"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Progress data may be outdated: {error}
            </span>
          </div>
        </div>
      )}

      {/* Overall Progress Header */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            {progressData.overallPercentage}% Complete
          </span>
          <span className="text-xs text-gray-500">
            Assessment: {assessment.name}
          </span>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressData.overallPercentage}%` }}
          />
        </div>
        
        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{progressData.completedCategories}</div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{progressData.inProgressCategories}</div>
            <div className="text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{progressData.notStartedCategories}</div>
            <div className="text-gray-500">Not Started</div>
          </div>
        </div>
      </div>

      {/* Category Progress List */}
      <div className="space-y-3">
        {categories.map((category, index) => {
          const status = getCategoryStatus(category.id);
          const colors = getStatusColors(category, status);
          const isActive = category.id === currentCategory;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={`
                w-full text-left p-4 border rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${colors.container}
                ${isActive ? 'transform scale-[1.02]' : 'hover:transform hover:scale-[1.01]'}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(category, status)}
                </div>
                
                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-base font-medium truncate ${colors.title}`}>
                      {index + 1}. {category.title}
                    </h4>
                    
                    {/* Progress Percentage */}
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className={`text-sm font-medium ${colors.subtitle}`}>
                        {status.completionPercentage}%
                      </span>
                      {isActive && (
                        <ChevronRightIcon className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Category Description */}
                  {category.description && (
                    <p className={`text-sm mb-3 line-clamp-2 ${colors.subtitle}`}>
                      {category.description}
                    </p>
                  )}
                  
                  {/* Question Count and Progress Details */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${colors.subtitle}`}>
                      {category.totalQuestions} questions
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${status.status === 'completed' ? 'bg-green-100 text-green-800' :
                        status.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {status.status === 'completed' ? 'Complete' :
                       status.status === 'partial' ? 'In Progress' :
                       'Not Started'}
                    </span>
                  </div>
                  
                  {/* Detailed Progress Bar */}
                  {showDetailedProgress && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.progress}`}
                        style={{ width: `${status.completionPercentage}%` }}
                      />
                    </div>
                  )}

                  {/* Response Details */}
                  {status.status !== 'not_started' && (
                    <div className={`text-xs ${colors.subtitle}`}>
                      Answered: {calculateCategoryProgress(category.id, assessment.responses).answeredQuestions} / {category.totalQuestions} questions
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              // Find first incomplete category
              const nextCategory = categories.find(cat => {
                const status = getCategoryStatus(cat.id);
                return status.status !== 'completed';
              });
              if (nextCategory) {
                onCategoryClick(nextCategory.id);
              }
            }}
            className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            Continue Assessment
          </button>
          
          <button
            onClick={() => {
              // Find first not started category
              const firstIncomplete = categories.find(cat => {
                const status = getCategoryStatus(cat.id);
                return status.status === 'not_started';
              });
              if (firstIncomplete) {
                onCategoryClick(firstIncomplete.id);
              }
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Start Next Section
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400">
            Auto-refreshing every {Math.round(refreshInterval / 1000)} seconds
          </span>
        </div>
      )}
    </div>
  );
};

export default DatabaseIntegratedProgressTracker;