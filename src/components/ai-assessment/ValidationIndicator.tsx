/**
 * Validation Indicator Component
 * Task 19.1: Implement RAPID structure validation
 * 
 * Features:
 * - Real-time validation status display
 * - Error and warning indicators
 * - Completion progress visualization
 * - Interactive error details
 * - Requirements: 4.5, 14.7
 */

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';
import { ValidationState } from '../../hooks/useValidation';
import { LoadingSpinner } from './LoadingSpinner';

interface ValidationIndicatorProps {
  validationState: ValidationState;
  isValidationPending?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  onErrorClick?: (error: string) => void;
  onWarningClick?: (warning: string) => void;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  validationState,
  isValidationPending = false,
  showDetails = true,
  compact = false,
  className = '',
  onErrorClick,
  onWarningClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isValidating,
    validationErrors,
    validationWarnings,
    isValid,
    completionPercentage
  } = validationState;

  // Determine overall status
  const getStatus = () => {
    if (isValidating || isValidationPending) return 'validating';
    if (validationErrors.length > 0) return 'error';
    if (validationWarnings.length > 0) return 'warning';
    if (isValid) return 'valid';
    return 'unknown';
  };

  const status = getStatus();

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
        return <LoadingSpinner size="sm" className="text-blue-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'valid':
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'validating':
        return 'Validating...';
      case 'error':
        return `${validationErrors.length} error${validationErrors.length !== 1 ? 's' : ''}`;
      case 'warning':
        return `${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''}`;
      case 'valid':
        return 'Valid';
      default:
        return 'Unknown';
    }
  };

  // Get status colors
  const getStatusColors = () => {
    switch (status) {
      case 'validating':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700'
        };
      case 'valid':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700'
        };
    }
  };

  const colors = getStatusColors();

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${colors.text}`}>
          {getStatusText()}
        </span>
        {completionPercentage > 0 && (
          <span className="text-xs text-gray-500">
            ({completionPercentage.toFixed(0)}%)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`validation-indicator ${className}`}>
      {/* Main Status Bar */}
      <div className={`
        flex items-center justify-between p-3 rounded-lg border
        ${colors.bg} ${colors.border}
      `}>
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className={`font-medium ${colors.text}`}>
              {getStatusText()}
            </div>
            {completionPercentage > 0 && (
              <div className="text-sm text-gray-600">
                {completionPercentage.toFixed(1)}% complete
              </div>
            )}
          </div>
        </div>

        {showDetails && (validationErrors.length > 0 || validationWarnings.length > 0) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              p-1 rounded-md hover:bg-white/50 transition-colors
              ${colors.text}
            `}
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {completionPercentage > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`
                h-2 rounded-full transition-all duration-300
                ${status === 'error' ? 'bg-red-500' :
                  status === 'warning' ? 'bg-yellow-500' :
                  status === 'valid' ? 'bg-green-500' :
                  'bg-blue-500'}
              `}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Detailed Messages */}
      {showDetails && isExpanded && (validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="mt-3 space-y-2">
          {/* Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-red-700 flex items-center">
                <XCircleIcon className="w-4 h-4 mr-1" />
                Errors ({validationErrors.length})
              </h4>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className={`
                      text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200
                      ${onErrorClick ? 'cursor-pointer hover:bg-red-100' : ''}
                    `}
                    onClick={() => onErrorClick?.(error)}
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationWarnings.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-yellow-700 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Warnings ({validationWarnings.length})
              </h4>
              <div className="space-y-1">
                {validationWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`
                      text-sm text-yellow-600 p-2 bg-yellow-50 rounded border border-yellow-200
                      ${onWarningClick ? 'cursor-pointer hover:bg-yellow-100' : ''}
                    `}
                    onClick={() => onWarningClick?.(warning)}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationIndicator;