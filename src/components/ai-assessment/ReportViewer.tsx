'use client'

import React, { useState } from 'react'
import { 
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { AssessmentReport, Assessment, Company } from '../../types/assessment'

interface ReportViewerProps {
  report: AssessmentReport
  assessment: Assessment
  company: Company
  onBack?: () => void
  className?: string
}

// Mock HTML report content for demonstration
const generateMockReportContent = (assessment: Assessment, company: Company): string => {
  const assessmentTypeLabel = assessment.type === 'EXPLORATORY' ? 'Exploratory Assessment' : 'Migration Assessment'
  
  return `
    <div class="report-content">
      <header class="report-header">
        <h1>AI Assessment Report</h1>
        <h2>${assessmentTypeLabel}</h2>
        <div class="report-meta">
          <p><strong>Company:</strong> ${company.name}</p>
          <p><strong>Assessment:</strong> ${assessment.name}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section class="executive-summary">
        <h2>Executive Summary</h2>
        <p>This ${assessmentTypeLabel.toLowerCase()} provides a comprehensive analysis of ${company.name}'s current AI readiness and strategic recommendations for implementing generative AI solutions.</p>
        
        <div class="key-findings">
          <h3>Key Findings</h3>
          <ul>
            <li><strong>AI Readiness Score:</strong> 7.2/10 - Good foundation with room for improvement</li>
            <li><strong>Data Infrastructure:</strong> Well-established data sources with moderate integration complexity</li>
            <li><strong>Technical Capabilities:</strong> Strong development team with cloud experience</li>
            <li><strong>Compliance Requirements:</strong> Standard security protocols in place</li>
          </ul>
        </div>
      </section>

      <section class="detailed-analysis">
        <h2>Detailed Analysis</h2>
        
        <div class="analysis-section">
          <h3>1. Use Case Assessment</h3>
          <p>The identified use cases demonstrate strong business value potential with clear ROI projections. The primary focus areas include:</p>
          <ul>
            <li>Customer service automation</li>
            <li>Content generation and optimization</li>
            <li>Data analysis and insights</li>
          </ul>
        </div>

        <div class="analysis-section">
          <h3>2. Data Readiness</h3>
          <p>Current data infrastructure shows good maturity with structured databases and APIs readily available. Key considerations:</p>
          <ul>
            <li>Data quality: High (8/10)</li>
            <li>Data accessibility: Moderate (6/10)</li>
            <li>Data governance: Good (7/10)</li>
          </ul>
        </div>

        <div class="analysis-section">
          <h3>3. Technical Infrastructure</h3>
          <p>Existing cloud infrastructure provides a solid foundation for AI implementation:</p>
          <ul>
            <li>Cloud readiness: Excellent</li>
            <li>Scalability: High</li>
            <li>Security posture: Strong</li>
          </ul>
        </div>

        ${assessment.type === 'MIGRATION' ? `
        <div class="analysis-section">
          <h3>4. Migration Strategy</h3>
          <p>Recommended migration approach based on current system analysis:</p>
          <ul>
            <li><strong>Approach:</strong> Phased migration with parallel systems</li>
            <li><strong>Timeline:</strong> 3-6 months</li>
            <li><strong>Risk Level:</strong> Low to Moderate</li>
            <li><strong>Expected Downtime:</strong> Minimal (< 1 hour)</li>
          </ul>
        </div>
        ` : ''}
      </section>

      <section class="recommendations">
        <h2>Strategic Recommendations</h2>
        
        <div class="recommendation-item">
          <h3>Short-term (1-3 months)</h3>
          <ul>
            <li>Establish AI governance framework</li>
            <li>Begin pilot project with customer service use case</li>
            <li>Implement data quality improvements</li>
            <li>Team training and skill development</li>
          </ul>
        </div>

        <div class="recommendation-item">
          <h3>Medium-term (3-6 months)</h3>
          <ul>
            <li>Scale successful pilot to production</li>
            <li>Implement additional use cases</li>
            <li>Enhance monitoring and analytics</li>
            <li>Develop internal AI expertise</li>
          </ul>
        </div>

        <div class="recommendation-item">
          <h3>Long-term (6-12 months)</h3>
          <ul>
            <li>Full AI platform deployment</li>
            <li>Advanced analytics and insights</li>
            <li>Cross-functional AI integration</li>
            <li>Continuous optimization and improvement</li>
          </ul>
        </div>
      </section>

      <section class="implementation-roadmap">
        <h2>Implementation Roadmap</h2>
        <div class="roadmap-timeline">
          <div class="timeline-item">
            <h4>Phase 1: Foundation (Weeks 1-4)</h4>
            <p>Setup infrastructure, governance, and initial pilot</p>
          </div>
          <div class="timeline-item">
            <h4>Phase 2: Pilot (Weeks 5-8)</h4>
            <p>Deploy and test first use case with limited users</p>
          </div>
          <div class="timeline-item">
            <h4>Phase 3: Scale (Weeks 9-16)</h4>
            <p>Expand to full production and additional use cases</p>
          </div>
          <div class="timeline-item">
            <h4>Phase 4: Optimize (Weeks 17-24)</h4>
            <p>Performance tuning, advanced features, and expansion</p>
          </div>
        </div>
      </section>

      <section class="risk-assessment">
        <h2>Risk Assessment & Mitigation</h2>
        <div class="risk-matrix">
          <div class="risk-item low-risk">
            <h4>Low Risk</h4>
            <ul>
              <li>Technical implementation</li>
              <li>Team adoption</li>
              <li>Infrastructure scaling</li>
            </ul>
          </div>
          <div class="risk-item medium-risk">
            <h4>Medium Risk</h4>
            <ul>
              <li>Data quality issues</li>
              <li>Integration complexity</li>
              <li>Change management</li>
            </ul>
          </div>
          <div class="risk-item high-risk">
            <h4>High Risk</h4>
            <ul>
              <li>Regulatory compliance</li>
              <li>Budget overruns</li>
              <li>Timeline delays</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="cost-benefit">
        <h2>Cost-Benefit Analysis</h2>
        <div class="financial-summary">
          <div class="cost-breakdown">
            <h3>Estimated Costs</h3>
            <ul>
              <li>Implementation: $150,000 - $250,000</li>
              <li>Annual Operations: $50,000 - $100,000</li>
              <li>Training & Support: $25,000 - $50,000</li>
            </ul>
          </div>
          <div class="benefit-projection">
            <h3>Projected Benefits</h3>
            <ul>
              <li>Efficiency Gains: $200,000 - $400,000/year</li>
              <li>Cost Savings: $100,000 - $200,000/year</li>
              <li>Revenue Growth: $300,000 - $600,000/year</li>
            </ul>
          </div>
          <div class="roi-summary">
            <h3>ROI Summary</h3>
            <p><strong>Payback Period:</strong> 8-12 months</p>
            <p><strong>3-Year ROI:</strong> 250% - 400%</p>
          </div>
        </div>
      </section>

      <footer class="report-footer">
        <p>This report was generated on ${new Date().toLocaleDateString()} based on the assessment responses provided.</p>
        <p>For questions or clarifications, please contact your AI implementation team.</p>
      </footer>
    </div>
  `
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  assessment,
  company,
  onBack,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // For demo purposes, we'll use mock content if report.htmlContent is empty
  const reportContent = report.htmlContent || generateMockReportContent(assessment, company)
  
  // Mock pagination - in real implementation, this would be based on actual content length
  const totalPages = 8
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AI Assessment Report - ${company.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .report-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
              .report-header h1 { color: #1f2937; margin: 0; }
              .report-header h2 { color: #6b7280; margin: 5px 0; }
              .report-meta p { margin: 5px 0; color: #6b7280; }
              section { margin-bottom: 30px; }
              h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
              h3 { color: #374151; }
              .key-findings, .analysis-section, .recommendation-item { margin-bottom: 20px; }
              .timeline-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #3b82f6; }
              .risk-matrix { display: flex; gap: 20px; }
              .risk-item { flex: 1; padding: 15px; border-radius: 5px; }
              .low-risk { background-color: #d1fae5; }
              .medium-risk { background-color: #fef3c7; }
              .high-risk { background-color: #fee2e2; }
              .financial-summary { display: flex; gap: 20px; }
              .financial-summary > div { flex: 1; }
              .report-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
            </style>
          </head>
          <body>
            ${reportContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Assessment Report - ${company.name}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .report-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .report-header h1 { color: #1f2937; margin: 0; font-size: 2em; }
            .report-header h2 { color: #6b7280; margin: 5px 0; font-size: 1.5em; }
            .report-meta p { margin: 5px 0; color: #6b7280; }
            section { margin-bottom: 30px; }
            h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            h3 { color: #374151; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            .key-findings, .analysis-section, .recommendation-item { margin-bottom: 20px; }
            .timeline-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #3b82f6; background-color: #f8fafc; }
            .risk-matrix { display: flex; gap: 20px; margin-top: 15px; }
            .risk-item { flex: 1; padding: 15px; border-radius: 5px; }
            .low-risk { background-color: #d1fae5; border: 1px solid #10b981; }
            .medium-risk { background-color: #fef3c7; border: 1px solid #f59e0b; }
            .high-risk { background-color: #fee2e2; border: 1px solid #ef4444; }
            .financial-summary { display: flex; gap: 20px; margin-top: 15px; }
            .financial-summary > div { flex: 1; padding: 15px; background-color: #f8fafc; border-radius: 5px; }
            .report-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `], { type: 'text/html' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AI_Assessment_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Assessment Report - ${company.name}`,
          text: `AI Assessment Report for ${company.name} - ${assessment.name}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Report link copied to clipboard!')
    }
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />
                AI Assessment Report
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  {company.name}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {new Date(report.generatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Report Viewer */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg m-6">
            <div className="p-8">
              <div 
                className="report-content prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: reportContent }}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151'
                }}
              />
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Assessment Type:</span>
            <span className="ml-2 text-gray-600">
              {assessment.type === 'EXPLORATORY' ? 'Exploratory Assessment' : 'Migration Assessment'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Generation Duration:</span>
            <span className="ml-2 text-gray-600">{report.metadata.generationDuration}ms</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">AI Model:</span>
            <span className="ml-2 text-gray-600">{report.metadata.bedrockModel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportViewer