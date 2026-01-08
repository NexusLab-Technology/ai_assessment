/**
 * Database Integrated Progress Tracker - UI Rendering Logic
 * Extracted from DatabaseIntegratedProgressTracker.tsx for better code organization
 * 
 * Handles:
 * - Status icon rendering
 * - Status color classes
 * - Category status retrieval
 */

import { useCallback } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';
import { 
  RAPIDCategory, 
  CategoryCompletionStatus,
  ProgressSummary
} from '../../../../types/rapid-questionnaire';

export interface UseProgressTrackerUIReturn {
  getCategoryStatus: (categoryId: string) => CategoryCompletionStatus;
  getStatusIcon: (category: RAPIDCategory, status: CategoryCompletionStatus) => React.ReactNode;
  getStatusColors: (category: RAPIDCategory, status: CategoryCompletionStatus) => {
    container: string;
    title: string;
    subtitle: string;
    progress: string;
  };
}

export function useProgressTrackerUI(
  progressData: ProgressSummary | null,
  currentCategory: string
): UseProgressTrackerUIReturn {
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
  const getStatusIcon = useCallback((category: RAPIDCategory, status: CategoryCompletionStatus): React.ReactNode => {
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

  return {
    getCategoryStatus,
    getStatusIcon,
    getStatusColors
  };
}
