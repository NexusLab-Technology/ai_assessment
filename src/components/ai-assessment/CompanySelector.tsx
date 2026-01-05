'use client'

import React, { useState } from 'react'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Company, CompanySelectorProps } from '../../types/assessment'

const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompany,
  onCompanySelect,
  onCreateNew,
  compact = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleCompanySelect = (company: Company) => {
    if (disabled) return
    onCompanySelect(company)
    setIsOpen(false)
  }

  const handleCreateNew = () => {
    if (disabled) return
    onCreateNew()
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  if (companies.length === 0) {
    return (
      <div className={compact ? "text-center" : "bg-white rounded-lg shadow-sm border border-gray-200 p-6"}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center ${compact ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-blue-100`}>
            <PlusIcon className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600`} />
          </div>
          <h3 className={`mt-2 ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>No companies found</h3>
          {!compact && (
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first company.
            </p>
          )}
          <div className={compact ? "mt-2" : "mt-6"}>
            <button
              type="button"
              onClick={handleCreateNew}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm ${compact ? 'text-xs' : 'text-sm'} font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <PlusIcon className={`${compact ? '-ml-0.5 mr-1 h-3 w-3' : '-ml-1 mr-2 h-5 w-5'}`} />
              Create Company
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
            disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">
            {selectedCompany ? selectedCompany.name : 'Select a company...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${
                  selectedCompany?.id === company.id
                    ? 'text-blue-900 bg-blue-100'
                    : 'text-gray-900'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium truncate">{company.name}</span>
                  <span className="text-gray-400 text-xs">
                    {company.assessmentCount} assessment{company.assessmentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {selectedCompany?.id === company.id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
            
            <div className="border-t border-gray-200 mt-1 pt-1">
              <button
                onClick={handleCreateNew}
                className="w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 text-blue-600 hover:bg-blue-50"
              >
                <div className="flex items-center">
                  <PlusIcon className="h-3 w-3 mr-2" />
                  <span className="font-medium text-xs">Create New Company</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Select Company</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a company to manage assessments for.
          </p>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <button
              type="button"
              onClick={handleToggle}
              className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <span className="block truncate">
                {selectedCompany ? selectedCompany.name : 'Select a company...'}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </span>
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${
                      selectedCompany?.id === company.id
                        ? 'text-blue-900 bg-blue-100'
                        : 'text-gray-900'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{company.name}</span>
                      {company.description && (
                        <span className="text-gray-500 text-xs truncate">
                          {company.description}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">
                        {company.assessmentCount} assessment{company.assessmentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {selectedCompany?.id === company.id && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
                
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button
                    onClick={handleCreateNew}
                    className="w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 text-blue-600 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">Create New Company</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedCompany && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {selectedCompany.name}
                  </h4>
                  {selectedCompany.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedCompany.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {selectedCompany.assessmentCount} assessment{selectedCompany.assessmentCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-400">
                    Created {new Date(selectedCompany.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default CompanySelector