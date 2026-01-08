'use client'

import React, { useState, useEffect } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Question, ValidationRules } from '../../../types/assessment'
import { FormFieldError as FormValidationError } from '../common/ErrorMessage'

interface QuestionStepProps {
  question: Question
  value: any
  onChange: (value: any) => void
  error?: string
  onValidation?: (isValid: boolean, error?: string) => void
}

const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  value,
  onChange,
  error,
  onValidation
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const validateValue = (val: any): { isValid: boolean; error?: string } => {
    const validation = question.validation || {}
    
    // Required validation
    if (question.required) {
      if (val === null || val === undefined || val === '') {
        return { isValid: false, error: `${question.label} is required` }
      }
      
      // For arrays (multiselect, checkbox)
      if (Array.isArray(val) && val.length === 0) {
        return { isValid: false, error: `${question.label} is required` }
      }
    }

    // Type-specific validation
    if (val !== null && val !== undefined && val !== '') {
      switch (question.type) {
        case 'text':
        case 'textarea':
          return validateText(val, validation)
        case 'number':
          return validateNumber(val, validation)
        case 'select':
        case 'radio':
          return validateSelect(val)
        case 'multiselect':
        case 'checkbox':
          return validateMultiSelect(val)
      }
    }

    return { isValid: true }
  }

  const validateText = (val: string, validation: ValidationRules) => {
    if (validation.minLength && val.length < validation.minLength) {
      return { isValid: false, error: `Minimum ${validation.minLength} characters required` }
    }
    if (validation.maxLength && val.length > validation.maxLength) {
      return { isValid: false, error: `Maximum ${validation.maxLength} characters allowed` }
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(val)) {
        return { isValid: false, error: 'Invalid format' }
      }
    }
    return { isValid: true }
  }

  const validateNumber = (val: number, validation: ValidationRules) => {
    if (validation.min !== undefined && val < validation.min) {
      return { isValid: false, error: `Minimum value is ${validation.min}` }
    }
    if (validation.max !== undefined && val > validation.max) {
      return { isValid: false, error: `Maximum value is ${validation.max}` }
    }
    return { isValid: true }
  }

  const validateSelect = (val: string) => {
    if (!question.options?.some(opt => opt.value === val)) {
      return { isValid: false, error: 'Invalid selection' }
    }
    return { isValid: true }
  }

  const validateMultiSelect = (val: string[]) => {
    if (!Array.isArray(val)) {
      return { isValid: false, error: 'Invalid selection format' }
    }
    const validValues = question.options?.map(opt => opt.value) || []
    const invalidValues = val.filter(v => !validValues.includes(v))
    if (invalidValues.length > 0) {
      return { isValid: false, error: 'Invalid selection(s)' }
    }
    return { isValid: true }
  }

  useEffect(() => {
    if (touched || value !== null) {
      const validation = validateValue(value)
      const errorMessage = validation.error || ''
      
      // Only update if the error message actually changed
      setLocalError(prev => prev !== errorMessage ? errorMessage : prev)
      onValidation?.(validation.isValid, validation.error)
    }
  }, [value, touched, question.id, question.required, question.validation])

  const handleBlur = () => {
    setTouched(true)
  }

  const displayError = error || localError

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              displayError 
                ? 'border-red-300 text-red-900 placeholder-red-300' 
                : 'border-gray-300'
            }`}
            placeholder={question.description}
          />
        )

      case 'textarea':
        return (
          <div>
            <textarea
              rows={4}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onBlur={handleBlur}
              className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                displayError 
                  ? 'border-red-300 text-red-900 placeholder-red-300' 
                  : 'border-gray-300'
              }`}
              placeholder={question.description}
            />
            {question.validation?.maxLength && (
              <p className="mt-1 text-sm text-gray-500">
                {(value || '').length}/{question.validation.maxLength} characters
              </p>
            )}
          </div>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            onBlur={handleBlur}
            min={question.validation?.min}
            max={question.validation?.max}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              displayError 
                ? 'border-red-300 text-red-900 placeholder-red-300' 
                : 'border-gray-300'
            }`}
            placeholder={question.description}
          />
        )

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              displayError 
                ? 'border-red-300 text-red-900' 
                : 'border-gray-300'
            }`}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || []
                    if (e.target.checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.value))
                    }
                  }}
                  onBlur={handleBlur}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={handleBlur}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || []
                    if (e.target.checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.value))
                    }
                  }}
                  onBlur={handleBlur}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )

      default:
        return <div>Unsupported question type: {question.type}</div>
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900">
          {question.label}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {question.description && (
          <div className="mt-1 flex items-start">
            <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <p className="text-sm text-gray-600">{question.description}</p>
          </div>
        )}
      </div>

      <div className="mt-2">
        {renderInput()}
      </div>

      {displayError && (
        <FormValidationError 
          error={displayError}
          fieldName=""
        />
      )}
    </div>
  )
}

export default QuestionStep