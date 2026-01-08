/**
 * EnhancedProgressTracker Component
 * Displays visual progress for each category with clickable navigation
 * Shows completion indicators, progress percentages, and highlights current category
 */

import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PlayCircleIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';
import { 
  RAPIDCategory, 
  CategoryCompletionStatus 
} from '../../../types/rapid-questionnaire';

interface EnhancedProgressTrackerProps {
  categories: RAPIDCategory[];
  currentCategory: string;
  categoryStatuses: CategoryCompletionStatus[];
  onCategoryClick: (categoryId: string) => void;
  className?: string;
  showDetailedProgress?: boolean;
}

export const EnhancedProgressTracker: React.FC<EnhancedProgressTrackerProps> = ({
  categories,
  currentCategory,
  categoryStatuses,
  onCategoryClick,
  className = '',
  showDetailedProgress = true
}) => {
  // Get completion status for a specific category
  const getCategoryStatus = (categoryId: string): CategoryCompletionStatus => {
    return categoryStatuses.find(status => status.categoryId === categoryId) || {
      categoryId,
      status: 'not_started',
      completionPercentage: 0,
      lastModified: new Date()
    };
  };

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    const totalCategories = categories.length;
    const completedCategories = categoryStatuses.filter(status => status.status === 'completed').length;
    const inProgressCategories = categoryStatuses.filter(status => status.status === 'partial').length;
    const notStartedCategories = totalCategories - completedCategories - inProgressCategories;
    
    const overallPercentage = totalCategories > 0 ? 
      Math.round(((completedCategories + (inProgressCategories * 0.5)) / totalCategories) * 100) : 0;

    return {
      totalCategories,
      completedCategories,
      inProgressCategories,
      notStartedCategories,
      overallPercentage
    };
  }, [categories.length, categoryStatuses]);

  // Get status icon for a category
  const getStatusIcon = (category: RAPIDCategory, status: CategoryCompletionStatus) => {
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
  };

  // Get status color classes
  const getStatusColors = (category: RAPIDCategory, status: CategoryCompletionStatus) => {
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
  };

  return (
    <div className={`enhanced-progress-tracker ${className}`}>
      {/* Overall Progress Header */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Assessment Progress</h3>
          <span className="text-sm font-medium text-gray-600">
            {overallProgress.overallPercentage}% Complete
          </span>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress.overallPercentage}%` }}
          />
        </div>
        
        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{overallProgress.completedCategories}</div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{overallProgress.inProgressCategories}</div>
            <div className="text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{overallProgress.notStartedCategories}</div>
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
                  
                  {/* Question Count */}
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.progress}`}
                        style={{ width: `${status.completionPercentage}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Last Modified */}
                  {status.status !== 'not_started' && (
                    <div className={`text-xs mt-2 ${colors.subtitle}`}>
                      Last updated: {new Date(status.lastModified).toLocaleDateString()} at {new Date(status.lastModified).toLocaleTimeString()}
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
    </div>
  );
};

export default EnhancedProgressTracker;