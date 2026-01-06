# RAPID Questionnaire Data Structure

This directory contains the data structures and mock data for the RAPID (Rapid AI Project Development) questionnaire system.

## Files

### `rapid-questionnaire-mock.ts`
Contains mock data for development and testing:
- **mockExploratoryQuestionnaire**: Complete questionnaire structure for new GenAI development (110 questions, 5 categories)
- **mockMigrationQuestionnaire**: Complete questionnaire structure for GenAI migration (162 questions, 6 categories)
- **mockCompanies**: Sample company data for testing
- **mockAssessments**: Sample assessment data for testing

### Key Features

#### RAPID Categories
1. **Use Case Discovery** (48 questions, 5 subcategories)
   - Business Context and Use Case Definition
   - Evaluation and Success Metrics
   - Implementation Considerations
   - Technical Requirements and Constraints
   - Use-case Prioritization

2. **Data Readiness Assessment** (25 questions, 4 subcategories)
   - AI-Specific Data Preparation
   - Data Format & Preprocessing
   - Data Quality & Governance
   - Data Volume & Storage Requirements

3. **Compliance & Integration** (27 questions, 5 subcategories)
   - Enterprise Integration
   - Governance & Risk Management
   - Legal and Licensing
   - Regulatory Compliance
   - Security Considerations

4. **Model Evaluation** (Guided process)
   - Evaluation Process Guidelines
   - Evaluation Metrics

5. **Business Value & ROI** (10 questions, 1 category)
   - Business Value and ROI Assessment

6. **Current System Assessment** (52 questions, 8 subcategories) - Migration Only
   - Agent and Function Implementations
   - LLM and Model Information
   - Model Outputs and Samples
   - Performance and SLAs
   - Prompt Engineering and Management
   - RAG Implementation
   - Security and Governance
   - Usage Metrics

## Usage

```typescript
import { getRAPIDQuestionnaire } from '@/data/rapid-questionnaire-mock';
import { AssessmentType } from '@/types/rapid-questionnaire';

// Load exploratory questionnaire
const exploratoryQuestionnaire = getRAPIDQuestionnaire('EXPLORATORY');

// Load migration questionnaire
const migrationQuestionnaire = getRAPIDQuestionnaire('MIGRATION');
```

## Data Structure

The questionnaire follows a hierarchical structure:
- **Questionnaire** → **Categories** → **Subcategories** → **Questions**

Each question includes:
- Unique ID and number
- Question text and description
- Question type (text, textarea, select, radio, checkbox, number)
- Required flag
- Options (for select/radio/checkbox questions)
- Category and subcategory references

## Version

Current version: **3.0** (Last updated: 2025-01-06)
Based on RAPID Assessment Questionnaires - Complete Reference