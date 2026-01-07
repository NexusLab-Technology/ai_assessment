'use client'

import React, { useState } from 'react'
import { ApplicationShell } from '../../components/ApplicationShell'
import { RouteGuard } from '../../components/RouteGuard'
import FixedQuestionContainer from '../../components/ai-assessment/FixedQuestionContainer'
import { exploratoryRAPIDQuestionnaire, migrationRAPIDQuestionnaire } from '../../data/rapid-questionnaire-complete'
import { RAPIDQuestionnaireStructure, AssessmentResponses } from '../../types/rapid-questionnaire'

export default function AIAssessmentBasicPage() {
  const [selectedType, setSelectedType] = useState<'EXPLORATORY' | 'MIGRATION'>('EXPLORATORY')
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [responses, setResponses] = useState<AssessmentResponses>({})
  const [showAssessment, setShowAssessment] = useState(false)

  // Get the appropriate questionnaire
  const rapidQuestions: RAPIDQuestionnaireStructure = selectedType === 'EXPLORATORY' 
    ? exploratoryRAPIDQuestionnaire 
    : migrationRAPIDQuestionnaire

  // Initialize current category
  React.useEffect(() => {
    if (rapidQuestions?.categories?.length > 0 && !currentCategory) {
      setCurrentCategory(rapidQuestions.categories[0].id)
    }
  }, [rapidQuestions?.categories, currentCategory])

  const handleStartAssessment = (type: 'EXPLORATORY' | 'MIGRATION') => {
    setSelectedType(type)
    setCurrentCategory('')
    setResponses({})
    setShowAssessment(true)
  }

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentCategory]: {
        ...prev[currentCategory],
        [questionId]: value
      }
    }))
  }

  if (!showAssessment) {
    return (
      <RouteGuard>
        <ApplicationShell>
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🧪 AI Assessment - Basic Demo
              </h1>
              <p className="text-lg text-gray-600">
                Test the FixedQuestionContainer component with RAPID questions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Exploratory Assessment</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {exploratoryRAPIDQuestionnaire?.categories?.length || 0} categories, {exploratoryRAPIDQuestionnaire?.totalQuestions || 0} questions
                  </p>
                </div>
                <button
                  onClick={() => handleStartAssessment('EXPLORATORY')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Test Exploratory
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Migration Assessment</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {migrationRAPIDQuestionnaire?.categories?.length || 0} categories, {migrationRAPIDQuestionnaire?.totalQuestions || 0} questions
                  </p>
                </div>
                <button
                  onClick={() => handleStartAssessment('MIGRATION')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Test Migration
                </button>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🎯 What This Demo Tests
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• FixedQuestionContainer component with consistent sizing</p>
                <p>• RAPID questionnaire data loading and display</p>
                <p>• Basic category navigation with buttons</p>
                <p>• Response handling and state management</p>
                <p>• Real RAPID questions from the complete dataset</p>
              </div>
            </div>
          </div>
        </ApplicationShell>
      </RouteGuard>
    )
  }

  const currentCategoryData = rapidQuestions?.categories?.find(cat => cat.id === currentCategory)
  const currentQuestions = currentCategoryData?.subcategories?.flatMap(sub => sub.questions) || []
  const allCategories = rapidQuestions?.categories || []

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Basic Demo - {selectedType === 'EXPLORATORY' ? 'Exploratory' : 'Migration'}
                </h1>
                <p className="text-sm text-gray-600">
                  Category: {currentCategoryData?.title || 'Loading...'}
                </p>
              </div>
              <button
                onClick={() => setShowAssessment(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Selection
              </button>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setCurrentCategory(category.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {index + 1}. {category.title}
                </button>
              ))}
            </div>
          </div>

          {/* Question Container */}
          <div className="flex-1 overflow-auto">
            <FixedQuestionContainer>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentCategoryData?.title}
                </h2>
                
                {currentCategoryData?.description && (
                  <p className="text-gray-600 mb-6">
                    {currentCategoryData.description}
                  </p>
                )}

                <div className="space-y-6">
                  {currentQuestions.slice(0, 10).map((question) => (
                    <div key={question.id} className="border-b border-gray-200 pb-4">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={responses[currentCategory]?.[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          placeholder="Enter your answer..."
                        />
                      )}

                      {question.type === 'textarea' && (
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={responses[currentCategory]?.[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          placeholder="Enter your answer..."
                        />
                      )}

                      {question.type === 'select' && question.options && (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={responses[currentCategory]?.[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
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
                                checked={responses[currentCategory]?.[question.id] === option}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {currentQuestions.length > 10 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Showing first 10 questions of {currentQuestions.length} total questions in this category.
                      This is a demo - full implementation would show all questions with pagination.
                    </p>
                  </div>
                )}

                {/* Response Summary */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Current Responses:</h3>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(responses, null, 2)}
                  </pre>
                </div>
              </div>
            </FixedQuestionContainer>
          </div>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}