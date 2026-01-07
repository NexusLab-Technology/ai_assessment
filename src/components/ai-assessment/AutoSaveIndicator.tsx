/**
 * AutoSaveIndicator Component
 * Displays auto-save status with visual feedback
 */

import React from 'react'
import { useAutoSaveStatus } from '@/hooks/useAutoSave'

interface AutoSaveIndicatorProps {
  status: {
    status: 'idle' | 'saving' | 'saved' | 'error' | 'retrying'
    lastSaved: Date | null
    hasUnsavedChanges: boolean
    error: string | null
  }
  className?: string
  showDetails?: boolean
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  className = '',
  showDetails = true
}) => {
  const { display, hasUnsavedChanges, isError, isSaving } = useAutoSaveStatus(status)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Icon */}
      <div className={`flex items-center ${display.color}`}>
        <span className="text-sm mr-1">{display.icon}</span>
        {showDetails && (
          <span className="text-xs font-medium">{display.text}</span>
        )}
      </div>

      {/* Loading Spinner for Saving State */}
      {isSaving && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
      )}

      {/* Retry Button for Error State */}
      {isError && (
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-red-600 hover:text-red-800 underline"
          title="Click to retry"
        >
          Retry
        </button>
      )}

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && status.status !== 'saving' && (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Unsaved changes"></div>
      )}
    </div>
  )
}

/**
 * Compact Auto-Save Indicator for Headers/Toolbars
 */
export const CompactAutoSaveIndicator: React.FC<{
  status: AutoSaveIndicatorProps['status']
  className?: string
}> = ({ status, className = '' }) => {
  const { display, isSaving } = useAutoSaveStatus(status)

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className={`text-xs ${display.color}`}>{display.icon}</span>
      {isSaving && (
        <div className="animate-spin rounded-full h-2 w-2 border-b border-blue-600"></div>
      )}
    </div>
  )
}

/**
 * Detailed Auto-Save Status Panel
 */
export const AutoSaveStatusPanel: React.FC<{
  status: AutoSaveIndicatorProps['status']
  onSaveNow?: () => void
  className?: string
}> = ({ status, onSaveNow, className = '' }) => {
  const { display, hasUnsavedChanges, isError, isSaving } = useAutoSaveStatus(status)

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${display.color}`}>{display.icon}</span>
          <span className="text-sm font-medium text-gray-900">Auto-Save Status</span>
        </div>
        
        {onSaveNow && hasUnsavedChanges && !isSaving && (
          <button
            onClick={onSaveNow}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Save Now
          </button>
        )}
      </div>

      <div className="mt-2">
        <p className={`text-xs ${display.color}`}>{display.text}</p>
        
        {status.lastSaved && (
          <p className="text-xs text-gray-500 mt-1">
            Last saved: {status.lastSaved.toLocaleString()}
          </p>
        )}

        {isError && status.error && (
          <p className="text-xs text-red-600 mt-1">
            Error: {status.error}
          </p>
        )}
      </div>

      {/* Progress Bar for Saving */}
      {isSaving && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoSaveIndicator