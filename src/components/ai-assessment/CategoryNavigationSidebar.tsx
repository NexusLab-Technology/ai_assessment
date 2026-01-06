/**
 * CategoryNavigationSidebar Component
 * Displays main categories in left sidebar with visual progress indicators
 * Supports responsive design for mobile devices
 */

import React, { useState } from 'react';
import { RAPIDCategory, CategoryCompletionStatus } from '@/types/rapid-questionnaire';

interface CategoryNavigationSidebarProps {
  categories: RAPIDCategory[];
  currentCategory: string;
  onCategorySelect: (categoryId: string) => void;
  completionStatus: CategoryCompletionStatus[];
  className?: string;
  isMobile?: boolean;
}

export const CategoryNavigationSidebar: React.FC<CategoryNavigationSidebarProps> = ({
  categories,
  currentCategory,
  onCategorySelect,
  completionStatus,
  className = '',
  isMobile = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  const getCompletionStatus = (categoryId: string) => {
    return completionStatus.find(status => status.categoryId === categoryId);
  };

  const getStatusIcon = (category: RAPIDCategory) => {
    const status = getCompletionStatus(category.id);
    const percentage = status?.completionPercentage || 0;
    
    if (percentage === 100) {
      return (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (percentage > 0) {
      return (
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center relative flex-shrink-0">
          <div 
            className="absolute inset-0 bg-blue-500 rounded-full transition-all duration-300"
            style={{ 
              clipPath: `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)` 
            }}
          />
          <span className="text-xs font-medium text-blue-700 relative z-10">
            {Math.round(percentage)}%
          </span>
        </div>
      );
    } else {
      return (
        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-500">{categories.indexOf(category) + 1}</span>
        </div>
      );
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 z-50
        ${isMobile ? 'fixed left-0 top-0 h-full' : 'relative'}
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
        
        <div className="p-4 overflow-y-auto h-full">
          {!isMobile && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Assessment Categories</h2>
              <div className="text-sm text-gray-500">
                {categories.length} categories
              </div>
            </div>
          )}
          
          <nav className="space-y-2">
            {categories.map((category, index) => {
              const isActive = category.id === currentCategory;
              const status = getCompletionStatus(category.id);
              const percentage = status?.completionPercentage || 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategorySelect(category.id);
                    if (isMobile) setIsCollapsed(true);
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
                        
                        {percentage > 0 && (
                          <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                            percentage === 100 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {Math.round(percentage)}%
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
                          {category.totalQuestions} questions
                        </span>
                        
                        {/* Progress bar for mobile */}
                        {isMobile && percentage > 0 && (
                          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          
          {/* Progress summary */}
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
    </>
  );
};

export default CategoryNavigationSidebar;