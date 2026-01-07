/**
 * Enhanced RAPID Questionnaire Loader Component
 * Task 17.1: Complete RAPIDQuestionnaireLoader database integration
 * 
 * Features:
 * - Database integration with MongoDB RAPID data
 * - Caching for RAPID questionnaire data
 * - Error handling for questionnaire loading
 * - Support for both Exploratory and Migration assessment types
 * - Fallback to static data if database is unavailable
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  RAPIDQuestionnaireStructure, 
  AssessmentType 
} from '../../types/rapid-questionnaire';
import { getRAPIDQuestionnaire } from '../../data/rapid-questionnaire-complete';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface EnhancedRAPIDQuestionnaireLoaderProps {
  assessmentType: AssessmentType;
  version?: string; // Optional specific version
  onQuestionsLoaded: (questions: RAPIDQuestionnaireStructure) => void;
  onError?: (error: string) => void;
  enableCaching?: boolean; // Enable client-side caching
  fallbackToStatic?: boolean; // Fallback to static data if API fails
}

// Cache for questionnaire data
const questionnaireCache = new Map<string, {
  data: RAPIDQuestionnaireStructure;
  timestamp: number;
  ttl: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export const EnhancedRAPIDQuestionnaireLoader: React.FC<EnhancedRAPIDQuestionnaireLoaderProps> = ({
  assessmentType,
  version,
  onQuestionsLoaded,
  onError,
  enableCaching = true,
  fallbackToStatic = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<RAPIDQuestionnaireStructure | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'cache' | 'static' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Generate cache key
  const getCacheKey = useCallback((type: AssessmentType, ver?: string) => {
    return `rapid_${type}_${ver || 'active'}`;
  }, []);

  // Check cache for questionnaire data
  const getCachedQuestionnaire = useCallback((cacheKey: string): RAPIDQuestionnaireStructure | null => {
    if (!enableCaching) return null;

    const cached = questionnaireCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      questionnaireCache.delete(cacheKey);
    }

    return null;
  }, [enableCaching]);

  // Cache questionnaire data
  const cacheQuestionnaire = useCallback((cacheKey: string, data: RAPIDQuestionnaireStructure) => {
    if (!enableCaching) return;

    questionnaireCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
  }, [enableCaching]);

  // Load questionnaire from database API
  const loadFromDatabase = useCallback(async (type: AssessmentType, ver?: string): Promise<RAPIDQuestionnaireStructure> => {
    const params = new URLSearchParams({ type });
    if (ver) {
      params.append('version', ver);
    }

    const response = await fetch(`/api/questionnaires/rapid?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Invalid response format from API');
    }

    return result.data;
  }, []);

  // Load questionnaire from static data (fallback)
  const loadFromStatic = useCallback((type: AssessmentType): RAPIDQuestionnaireStructure => {
    const staticQuestionnaire = getRAPIDQuestionnaire(type);
    
    if (!staticQuestionnaire) {
      throw new Error(`Static questionnaire not found for type: ${type}`);
    }

    return staticQuestionnaire;
  }, []);

  // Main questionnaire loading function
  const loadQuestionnaire = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = getCacheKey(assessmentType, version);
      
      // Check cache first
      const cachedData = getCachedQuestionnaire(cacheKey);
      if (cachedData) {
        setQuestionnaire(cachedData);
        setDataSource('cache');
        onQuestionsLoaded(cachedData);
        setLoading(false);
        return;
      }

      let loadedQuestionnaire: RAPIDQuestionnaireStructure;
      let source: 'database' | 'static';

      try {
        // Try loading from database first
        loadedQuestionnaire = await loadFromDatabase(assessmentType, version);
        source = 'database';
      } catch (dbError) {
        console.warn('Failed to load from database:', dbError);
        
        if (!fallbackToStatic) {
          throw dbError;
        }

        // Fallback to static data
        if (version) {
          throw new Error('Specific version requested but database unavailable. Cannot fallback to static data.');
        }

        loadedQuestionnaire = loadFromStatic(assessmentType);
        source = 'static';
      }

      // Cache the loaded data
      cacheQuestionnaire(cacheKey, loadedQuestionnaire);
      
      setQuestionnaire(loadedQuestionnaire);
      setDataSource(source);
      onQuestionsLoaded(loadedQuestionnaire);
      setRetryCount(0); // Reset retry count on success
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questionnaire';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Error loading RAPID questionnaire:', err);
    } finally {
      setLoading(false);
    }
  }, [
    assessmentType, 
    version, 
    getCacheKey, 
    getCachedQuestionnaire, 
    cacheQuestionnaire, 
    loadFromDatabase, 
    loadFromStatic, 
    fallbackToStatic, 
    onQuestionsLoaded, 
    onError
  ]);

  // Retry loading with exponential backoff
  const retryLoading = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
    setRetryCount(prev => prev + 1);
    
    setTimeout(() => {
      loadQuestionnaire();
    }, delay);
  }, [retryCount, loadQuestionnaire]);

  // Load questionnaire on mount and when dependencies change
  useEffect(() => {
    loadQuestionnaire();
  }, [loadQuestionnaire]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      if (enableCaching) {
        // Clean up expired cache entries
        const now = Date.now();
        for (const [key, cached] of questionnaireCache.entries()) {
          if (now - cached.timestamp >= cached.ttl) {
            questionnaireCache.delete(key);
          }
        }
      }
    };
  }, [enableCaching]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading RAPID questionnaire...</p>
        <p className="text-sm text-gray-500">
          Preparing {assessmentType?.toLowerCase() || 'assessment'} assessment questions
          {version && ` (version ${version})`}
        </p>
        {retryCount > 0 && (
          <p className="text-xs text-orange-600 mt-2">
            Retry attempt {retryCount}...
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage 
          message={error}
          title="Failed to Load Questionnaire"
          onRetry={retryLoading}
          className="mb-4"
        />
        
        {/* Show retry information */}
        {retryCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-800">
              Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}. 
              {retryCount < 3 ? ' Will retry automatically.' : ' Please check your connection.'}
            </p>
          </div>
        )}

        {/* Show fallback information */}
        {!fallbackToStatic && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              💡 Tip: Enable fallback to static data for offline support.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="p-8">
        <ErrorMessage 
          message="Questionnaire data is not available"
          title="No Questionnaire Found"
          onRetry={retryLoading}
        />
      </div>
    );
  }

  // Get data source indicator
  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'database':
        return { 
          icon: '🗄️', 
          text: 'Database', 
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'cache':
        return { 
          icon: '⚡', 
          text: 'Cached', 
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200'
        };
      case 'static':
        return { 
          icon: '📁', 
          text: 'Static Fallback', 
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200'
        };
      default:
        return { 
          icon: '❓', 
          text: 'Unknown', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
    }
  };

  const sourceInfo = getDataSourceInfo();

  // Render questionnaire summary with enhanced information
  return (
    <div className={`border rounded-lg p-6 ${sourceInfo.bgColor}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900">
              RAPID Questionnaire Loaded
            </h3>
            <div className={`flex items-center space-x-1 text-xs ${sourceInfo.color}`}>
              <span>{sourceInfo.icon}</span>
              <span>{sourceInfo.text}</span>
            </div>
          </div>
          
          <p className="text-blue-700 mt-1">
            {assessmentType === 'EXPLORATORY' ? 'New GenAI Development' : 'GenAI Migration to AWS'}
            {version && ` • Version ${version}`}
          </p>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Version:</span>
              <span className="ml-2 text-blue-600">{questionnaire.version}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Total Questions:</span>
              <span className="ml-2 text-blue-600">{questionnaire.totalQuestions}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Categories:</span>
              <span className="ml-2 text-blue-600">{questionnaire.categories.length}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Last Updated:</span>
              <span className="ml-2 text-blue-600">
                {questionnaire.lastUpdated 
                  ? new Date(questionnaire.lastUpdated).toLocaleDateString()
                  : 'Unknown'
                }
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Categories:</h4>
            <div className="space-y-1">
              {questionnaire.categories.map((category) => (
                <div key={category.id} className="flex justify-between text-sm">
                  <span className="text-blue-700">{category.title}</span>
                  <span className="text-blue-600">
                    {category.totalQuestions} questions
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cache information */}
          {enableCaching && dataSource === 'cache' && (
            <div className="mt-4 p-2 bg-blue-100 rounded text-xs text-blue-800">
              ⚡ Loaded from cache for faster performance
            </div>
          )}

          {/* Fallback warning */}
          {dataSource === 'static' && (
            <div className="mt-4 p-2 bg-orange-100 rounded text-xs text-orange-800">
              ⚠️ Using static data - database connection unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedRAPIDQuestionnaireLoader;