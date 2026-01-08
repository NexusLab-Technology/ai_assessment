# AI Assessment Module

## Overview

The AI Assessment Module is a comprehensive RAPID questionnaire-based assessment system that enables organizations to assess their GenAI readiness. It supports both exploratory assessments for new AI development and migration assessments for existing AI systems.

This module includes:
- **Core Assessment Functionality**: RAPID questionnaire integration, category-based navigation, auto-save
- **Assessment Status UI**: Status indicators and read-only viewer for completed assessments
- **Report Generation**: Asynchronous report generation via External API Gateway

## Key Features

- 📋 **RAPID Questionnaire Integration** - 162 questions organized by categories
- 🗂️ **Category-Based Navigation** - 5 categories for Exploratory, 6 for Migration
- 📊 **Enhanced Progress Tracking** - Visual progress indicators with clickable navigation
- 📦 **Fixed-Size Question Container** - Consistent UI with proper scrolling
- 🔍 **Response Review System** - Comprehensive review before completion
- 💾 **Auto-save Functionality** - Automatic saving every 30 seconds
- 📄 **Asynchronous Report Generation** - External API Gateway integration
- 📊 **Status Indicators** - Visual status indicators (edit/view icons) based on assessment completion
- 👁️ **Read-only Viewer** - View completed assessments with session-based organization
- 🔄 **Status-based Navigation** - Different actions based on assessment status

## Quick Start

### Basic Usage

```typescript
import AssessmentContainer from '@/components/ai-assessment/AssessmentContainer';

function AssessmentPage() {
  return (
    <AssessmentContainer 
      selectedCompany={company}
      onCompanySelectorDisabled={(disabled) => {}}
    />
  );
}
```

## RAPID Questionnaire Structure

### Exploratory Path (5 Categories)
- Use Case Discovery: 48 questions (5 subcategories)
- Data Readiness: 25 questions (4 subcategories)
- Compliance & Integration: 27 questions (5 subcategories)
- Model Evaluation: Guided process
- Business Value & ROI: 10 questions

### Migration Path (6 Categories)
- All Exploratory categories plus:
- Current System Assessment: 52 questions (8 subcategories)

## Related Modules

- [Company Settings Module](../supporting/company-settings/README.md) - Company management
- [Authentication Module](../security/authentication/README.md) - Authentication system
