/**
 * RAPID Question Step Component
 * Renders questions for RAPID questionnaire structure
 */

import React from 'react';
import { RAPIDCategory, RAPIDQuestion } from '../../types/rapid-questionnaire';

interface RAPIDQuestionStepProps {
  category: RAPIDCategory;
  responses: { [questionId: string]: any };
  onResponseChange: (questionId: string, value: any) => void;
  validationErrors?: { [questionId: string]: { isValid: boolean; error?: string } };
}

export const RAPIDQuestionStep: React.FC<RAPIDQuestionStepProps> = ({
  category,
  responses,
  onResponseChange,
  validationErrors = {}
}) => {
  const renderQuestion = (question: RAPIDQuestion) => {
    const value = responses[question.id] || '';
    const error = validationErrors[question.id];

    return (
      <div key={question.id} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {question.number}. {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {question.description && (
          <p className="text-xs text-gray-500 mb-3">{question.description}</p>
        )}

        {question.type === 'text' && (
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error && !error.isValid ? 'border-red-300' : 'border-gray-300'
            }`}
            value={value}
            onChange={(e) => onResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
          />
        )}

        {question.type === 'textarea' && (
          <textarea
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error && !error.isValid ? 'border-red-300' : 'border-gray-300'
            }`}
            value={value}
            onChange={(e) => onResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
          />
        )}

        {question.type === 'select' && question.options && (
          <select
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error && !error.isValid ? 'border-red-300' : 'border-gray-300'
            }`}
            value={value}
            onChange={(e) => onResponseChange(question.id, e.target.value)}
          >
            <option value="">Select an option...</option>
            {question.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )}

        {question.type === 'radio' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onResponseChange(question.id, e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {error && !error.isValid && (
          <p className="mt-1 text-sm text-red-600">{error.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {category.title}
      </h2>
      
      {category.description && (
        <p className="text-gray-600 mb-6">{category.description}</p>
      )}

      <div className="space-y-6">
        {category.subcategories.map(subcategory => (
          <div key={subcategory.id}>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {subcategory.title}
            </h3>
            {subcategory.questions.map(renderQuestion)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RAPIDQuestionStep;