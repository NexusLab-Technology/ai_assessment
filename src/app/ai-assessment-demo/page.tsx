'use client'

import React, { useState, useEffect } from 'react'
import { ApplicationShell } from '../../components/ApplicationShell'
import { RouteGuard } from '../../components/RouteGuard'
import { AssessmentWizard } from '../../components/ai-assessment/AssessmentWizard'
import { Assessment, AssessmentResponses, RAPIDQuestionnaireStructure } from '../../types/rapid-questionnaire'
import { exploratoryRAPIDQuestionnaire, migrationRAPIDQuestionnaire } from '../../data/rapid-questionnaire-complete'

export default function AIAssessmentDemoPage() {
  const [currentView, setCurrentView] = useState<'selection' | 'assessment'>('selection')
  const [selectedType, setSelectedType] = useState<'EXPLORATORY' | 'MIGRATION'>('EXPLORATORY')
  const [responses, setResponses] = useState<AssessmentResponses>({})
  const [currentCategory, setCurrentCategory] = useState<string>('')

  // Get the appropriate questionnaire based on type
  const rapidQuestions: RAPIDQuestionnaireStructure = selectedType === 'EXPLORATORY' 
    ? exploratoryRAPIDQuestionnaire 
    : migrationRAPIDQuestionnaire

  // Mock assessment for demo
  const mockAssessment: Assessment = {
    id: 'demo-assessment-1',
    name: 'Demo AI Assessment',
    companyId: 'demo-company-1',
    userId: 'demo-user-1',
    type: selectedType,
    status: 'IN_PROGRESS',
    currentCategory: currentCategory || rapidQuestions.categories[0]?.id || '',
    totalCategories: rapidQuestions.categories.length,
    responses: responses,
    categoryStatuses: {},
    rapidQuestionnaireVersion: '3.0',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Initialize current category when questionnaire loads
  useEffect(() => {
    if (rapidQuestions.categories.length > 0 && !currentCategory) {
      setCurrentCategory(rapidQuestions.categories[0].id)
    }
  }, [rapidQuestions.categories, currentCategory])

  const handleStartAssessment = (type: 'EXPLORATORY' | 'MIGRATION') => {
    setSelectedType(type)
    setResponses({})
    setCurrentCategory('')
    setCurrentView('assessment')
  }

  const handleResponseChange = (categoryId: string, categoryResponses: any) => {
    setResponses(prev => ({
      ...prev,
      [categoryId]: categoryResponses
    }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setCurrentCategory(categoryId)
  }

  const handleComplete = () => {
    console.log('Assessment completed with responses:', responses)
    alert('Assessment completed! Check console for responses.')
    setCurrentView('selection')
    setResponses({})
    setCurrentCategory('')
  }

  if (currentView === 'assessment') {
    return (
      <RouteGuard>
        <ApplicationShell>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Assessment Demo - {selectedType === 'EXPLORATORY' ? 'Exploratory' : 'Migration'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Demo of the new RAPID questionnaire with category-based navigation
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('selection')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Back to Selection
                </button>
              </div>
            </div>

            {/* Assessment Wizard */}
            <div className="flex-1 overflow-hidden">
              <AssessmentWizard
                assessment={mockAssessment}
                rapidQuestions={rapidQuestions}
                responses={responses}
                onResponseChange={handleResponseChange}
                onCategoryChange={handleCategoryChange}
                onComplete={handleComplete}
              />
            </div>
          </div>
        </ApplicationShell>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🤖 AI Assessment Demo
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Experience the new RAPID questionnaire with enhanced UI/UX
            </p>
            <p className="text-sm text-gray-500">
              This demo showcases all the new features from Phase 1 implementation
            </p>
          </div>

          {/* Features Overview */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              ✨ New Features in This Demo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Category-based navigation sidebar</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Fixed-size question container</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Enhanced progress tracking</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Response preservation during navigation</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Category-based response management</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Comprehensive response review modal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exploratory Assessment */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="text-center mb-4">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Exploratory Assessment</h3>
                <p className="text-sm text-gray-600 mt-2">
                  For organizations exploring AI adoption possibilities
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Categories:</span>
                  <span className="text-gray-600 ml-2">5 main areas</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Questions:</span>
                  <span className="text-gray-600 ml-2">~80 questions</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="text-gray-600 ml-2">15-20 minutes</span>
                </div>
              </div>

              <button
                onClick={() => handleStartAssessment('EXPLORATORY')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Exploratory Assessment
              </button>
            </div>

            {/* Migration Assessment */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="text-center mb-4">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Migration Assessment</h3>
                <p className="text-sm text-gray-600 mt-2">
                  For organizations planning cloud migration with AI
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Categories:</span>
                  <span className="text-gray-600 ml-2">6 main areas</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Questions:</span>
                  <span className="text-gray-600 ml-2">~100 questions</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="text-gray-600 ml-2">20-25 minutes</span>
                </div>
              </div>

              <button
                onClick={() => handleStartAssessment('MIGRATION')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Start Migration Assessment
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📋 How to Test the Demo
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>1. Choose either Exploratory or Migration assessment type</p>
              <p>2. Navigate between categories using the sidebar on the left</p>
              <p>3. Fill out questions and see how responses are preserved</p>
              <p>4. Use the progress tracker to see completion status</p>
              <p>5. Try the "Review Responses" button to see the summary modal</p>
              <p>6. Complete the assessment to see the final workflow</p>
            </div>
          </div>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}