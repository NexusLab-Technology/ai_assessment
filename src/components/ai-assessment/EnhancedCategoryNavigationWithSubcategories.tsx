/**
 * Enhanced Category Navigation with Subcategories
 * Displays categories with expandable subcategories and question counts
 * Allows navigation to specific subcategories
 */

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { RAPIDCategory, CategoryCompletionStatus } from '@/types/rapid-questionnaire';

interface EnhancedCategoryNavigationProps {
  categories: RAPIDCategory[];
  currentCategory: string;
  currentSubcategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
  completionStatus: CategoryCompletionStatus[];
  className?: string;
}

interface SubcategoryCompletionStatus {
  subcategoryId: string;
  completedQuestions: number;
  totalQuestions: number;
  percentage: number;
  status: 'not_started' | 'partial' | 'completed';
}

export const EnhancedCategoryNavigationWithSubcategories: React.FC<EnhancedCategoryNavigationProps> = ({
  categories,
  currentCategory,
  currentSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  completionStatus,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([currentCategory]) // Auto-expand current category
  );

  // Calculate subcategory completion status
  const getSubcategoryStatus = (categoryId: string, subcategoryId: string): SubcategoryCompletionStatus => {
    // This would be calculated based on actual responses
    // For now, return mock data
    const totalQuestions = categories
      .find(cat => cat.id === categoryId)
      ?.subcategories.find(sub => sub.id === subcategoryId)
      ?.questionCount || 0;
    
    const completedQuestions = 0; // Would be calculated from responses
    const percentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
    
    let status: 'not_started' | 'partial' | 'completed' = 'not_started';
    if (percentage === 100) status = 'completed';
    else if (percentage > 0) status = 'partial';
    
    return {
      subcategoryId,
      completedQuestions,
      totalQuestions,
      percentage,
      status
    };
  };

  // Get category completion status
  const getCategoryStatus = (categoryId: string) => {
    return completionStatus.find(status => status.categoryId === categoryId);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId);
    // Auto-expand when selected
    setExpandedCategories(prev => new Set([...prev, categoryId]));
  };

  // Handle subcategory click
  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onSubcategorySelect(categoryId, subcategoryId);
  };

  // Get status icon for category
  const getCategoryStatusIcon = (category: RAPIDCategory) => {
    const status = getCategoryStatus(category.id);
    const percentage = status?.completionPercentage || 0;
    
    if (percentage === 100) {
      return (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <CheckIcon className="w-3 h-3 text-white" />
        </div>
      );
    } else if (percentage > 0) {
      return (
        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center relative">
          <div 
            className="absolute inset-0 bg-blue-500 rounded-full"
            style={{ 
              clipPath: `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)` 
            }}
          />
          <span className="text-xs font-medium text-blue-700 relative z-10">
            {Math.round(percentage)}
          </span>
        </div>
      );
    } else {
      return (
        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-500">{categories.indexOf(category) + 1}</span>
        </div>
      );
    }
  };

  // Get status icon for subcategory
  const getSubcategoryStatusIcon = (categoryId: string, subcategoryId: string) => {
    const status = getSubcategoryStatus(categoryId, subcategoryId);
    
    if (status.status === 'completed') {
      return <CheckIcon className="w-4 h-4 text-green-500" />;
    } else if (status.status === 'partial') {
      return <ClockIcon className="w-4 h-4 text-blue-500" />;
    } else {
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 overflow-y-auto ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assessment Categories</h2>
          <div className="text-sm text-gray-500">
            {categories.length} categories
          </div>
        </div>
        
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = category.id === currentCategory;
            const isExpanded = expandedCategories.has(category.id);
            const status = getCategoryStatus(category.id);
            const percentage = status?.completionPercentage || 0;
            
            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`
                      flex-1 flex items-center space-x-3 p-2 rounded-lg text-left transition-colors
                      ${isActive
                        ? 'bg-blue-50 text-blue-900 border-l-2 border-blue-500'
                        : 'hover:bg-gray-50 text-gray-900'
                      }
                    `}
                  >
                    {getCategoryStatusIcon(category)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium truncate">
                          {category.title}
                        </h3>
                        {percentage > 0 && (
                          <span className={`text-xs font-medium ml-2 ${
                            percentage === 100 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {Math.round(percentage)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {category.subcategories.length} topics • {category.totalQuestions} questions
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Subcategories */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {category.subcategories.map((subcategory) => {
                      const isSubActive = currentSubcategory === subcategory.id;
                      const subStatus = getSubcategoryStatus(category.id, subcategory.id);
                      
                      return (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                          className={`
                            w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors
                            ${isSubActive
                              ? 'bg-blue-100 text-blue-900'
                              : 'hover:bg-gray-50 text-gray-700'
                            }
                          `}
                        >
                          {getSubcategoryStatusIcon(category.id, subcategory.id)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {subcategory.title}
                              </h4>
                              <span className="text-xs text-gray-500 ml-2">
                                {subcategory.questionCount}
                              </span>
                            </div>
                            
                            {subStatus.percentage > 0 && (
                              <div className="mt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">
                                    {subStatus.completedQuestions}/{subStatus.totalQuestions} completed
                                  </span>
                                  <span className={`font-medium ${
                                    subStatus.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                                  }`}>
                                    {subStatus.percentage}%
                                  </span>
                                </div>
                                <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      subStatus.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${subStatus.percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Progress Summary */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Progress Summary</h4>
          <div className="space-y-1">
            {(() => {
              const completed = completionStatus.filter(s => s.status === 'completed').length;
              const inProgress = completionStatus.filter(s => s.status === 'partial').length;
              const notStarted = categories.length - completed - inProgress;
              
              return (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Completed</span>
                    <span className="font-medium">{completed}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">In Progress</span>
                    <span className="font-medium">{inProgress}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Not Started</span>
                    <span className="font-medium">{notStarted}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCategoryNavigationWithSubcategories;