'use client'

import React from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface FormValidationErrorProps {
  error?: string
  errors?: string[]
  className?: string
  show?: boolean
}

/**
 * Form validation error component for displaying field-level errors
 */
const FormValidationError: React.FC<FormValidationErrorProps> = ({
  error,
  errors,
  className = '',
  show = true
}) => {
  if (!show || (!error && (!errors || errors.length === 0))) {
    return null
  }

  const errorList = errors || (error ? [error] : [])

  return (
    <div className={`mt-1 ${className}`}>
      {errorList.map((errorMessage, index) => (
        <div key={index} className="flex items-center text-sm text-red-600">
          <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ))}
    </div>
  )
}

export default FormValidationError