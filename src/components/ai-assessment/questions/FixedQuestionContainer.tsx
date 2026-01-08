/**
 * FixedQuestionContainer Component
 * Maintains consistent container dimensions with proper scrolling
 * Provides responsive design for different screen sizes
 * Prevents layout shifts during navigation
 */

import React from 'react';

interface FixedQuestionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const FixedQuestionContainer: React.FC<FixedQuestionContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <div 
      className={`
        fixed-question-container
        h-[600px] w-full
        border border-gray-200 rounded-lg
        bg-white shadow-sm
        overflow-hidden
        flex flex-col
        transition-all duration-200
        md:h-[650px]
        lg:h-[700px]
        sm:h-[500px]
        ${className}
      `}
      style={{
        minHeight: '500px' // Fallback for older browsers
      }}
    >
      <div 
        className="
          question-content
          flex-1 overflow-y-auto
          p-6 md:p-8 sm:p-4
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          hover:scrollbar-thumb-gray-400
        "
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}
      >
        <div className="question-content-wrapper max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FixedQuestionContainer;