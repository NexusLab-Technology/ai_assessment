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
 * 
 * Refactored to use extracted hooks for better code organization (Rule 3 compliance)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  RAPIDCategory, 
  Assessment
} from '../../../types/rapid-questionnaire';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useProgressCalculation, ProgressSummary } from '../hooks/progress-tracker/DatabaseIntegratedProgressTrackerLogic';
import { useProgressTrackerUI } from '../hooks/progress-tracker/DatabaseIntegratedProgressTrackerUI';

interface DatabaseIntegratedProgressTrackerProps {
  assessment: Assessment;
  categories: RAPIDCategory[];
  currentCategory: string;
  onCategoryClick: (categoryId: string) => void;
  className?: string;
  showDetailedProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onProgressUpdate?: (progress: ProgressSummary) => void;
}

export const DatabaseIntegratedProgressTracker: React.FC<DatabaseIntegratedProgressTrackerProps> = ({
  assessment,
  categories,
  currentCategory,
  onCategoryClick,
  className = '',
  showDetailedProgress = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onProgressUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressSummary | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Use extracted hooks
  const { calculateCategoryProgress, loadProgressData: calculateProgressData } = useProgressCalculation(
    assessment,
    categories
  );

  const { getCategoryStatus, getStatusIcon, getStatusColors } = useProgressTrackerUI(
    progressData,
    currentCategory
  );

  // Load progress data from assessment
  const loadProgressData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const progressSummary = await calculateProgressData();
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
  }, [calculateProgressData, onProgressUpdate]);

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
