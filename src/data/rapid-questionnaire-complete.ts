/**
 * Complete RAPID Questionnaire Data
 * Based on RAPID Assessment Questionnaires v3.0 - FINAL
 * Total Questions: 162
 */

import { 
  RAPIDQuestionnaireStructure, 
  RAPIDCategory, 
  RAPIDSubcategory, 
  RAPIDQuestion,
  AssessmentType,
  CompletionStatus,
  RAPID_CATEGORIES 
} from '@/types/rapid-questionnaire';

// ===== USE CASE DISCOVERY QUESTIONS (48 questions) =====

// Business Context and Use Case Definition (12 questions)
const businessContextQuestions: RAPIDQuestion[] = [
  {
    id: 'q1-1-1',
    number: 'Q1.1',
    text: 'What business problem(s) does your GenAI application aim to solve? Can you describe the user and use case in terms of your business or operational needs?',
    description: 'Establishes the fundamental business purpose and identifies key user personas for the application.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-2',
    number: 'Q1.2',
    text: 'What is the current state of this use case (in progress, ideated, etc.)?',
    description: 'Determines where in the planning/development lifecycle the use case currently stands.',
    type: 'select',
    required: true,
    options: ['Ideated', 'In Progress', 'Proof of Concept', 'Pilot', 'Production'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-3',
    number: 'Q1.3',
    text: 'What is the urgency for this use case? Is there an impending event or target date to launch?',
    description: 'Identifies timeline constraints and helps prioritize implementation activities.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-4',
    number: 'Q1.4',
    text: 'Who is the business owner for this use case (name, title, and/or group)?',
    description: 'Establishes primary stakeholder and decision-maker for the project.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-5',
    number: 'Q1.5',
    text: 'What is the primary goal or success criteria of the use case?',
    description: 'Clarifies measurable outcomes that will define success for the implementation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-6',
    number: 'Q1.6',
    text: 'How does this use case align with your organization\'s strategic goals?',
    description: 'Connects the GenAI initiative to broader organizational priorities and value creation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-7',
    number: 'Q1.7',
    text: 'What specific pain points does this GenAI application aim to address?',
    description: 'Identifies current problems the application will solve, establishing baseline for ROI calculations.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-8',
    number: 'Q1.8',
    text: 'Are there existing workflows or processes that will be replaced or enhanced?',
    description: 'Maps the implementation to current operational activities for smoother transition planning.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-9',
    number: 'Q1.9',
    text: 'What is the expected business impact in the first 3/6/12 months?',
    description: 'Establishes timeline for expected value realization and helps set realistic expectations.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-10',
    number: 'Q1.10',
    text: 'Are there any immediate cost savings or revenue generation opportunities?',
    description: 'Identifies quick financial wins that could help justify the investment and build momentum.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-11',
    number: 'Q1.11',
    text: 'How will you measure ROI for this implementation?',
    description: 'Establishes key metrics for business value assessment.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  },
  {
    id: 'q1-1-12',
    number: 'Q1.12',
    text: 'What is the scope of impact in terms of users or departments affected?',
    description: 'Helps quantify the reach and potential scale of the solution\'s impact across the organization',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'business-context'
  }
];
// Evaluation and Success Metrics (10 questions)
const evaluationMetricsQuestions: RAPIDQuestion[] = [
  {
    id: 'q1-2-1',
    number: 'Q1.1',
    text: 'How will you measure the success of this GenAI implementation?',
    description: 'Establishes key performance indicators for value assessment.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-2',
    number: 'Q1.2',
    text: 'What quantitative metrics are important (time saved, error reduction, etc.)?',
    description: 'Identifies specific measurable outcomes for ROI calculation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-3',
    number: 'Q1.3',
    text: 'What qualitative feedback will you gather from users?',
    description: 'Establishes user satisfaction measurement approach.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-4',
    number: 'Q1.4',
    text: 'How will you determine if the AI outputs meet quality expectations?',
    description: 'Identifies quality control mechanisms and standards.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-5',
    number: 'Q1.5',
    text: 'What are your primary concerns about implementing this GenAI application?',
    description: 'Identifies perceived risks and concerns for proactive addressing.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-6',
    number: 'Q1.6',
    text: 'What baseline metrics exist for current processes being replaced?',
    description: 'Provides comparison data for improvement measurement.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-7',
    number: 'Q1.7',
    text: 'Who will be responsible for ongoing evaluation of the application?',
    description: 'Identifies ownership of performance monitoring and optimization.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-8',
    number: 'Q1.8',
    text: 'What constitutes a minimum viable product for initial deployment?',
    description: 'Establishes scope requirements for initial release.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-9',
    number: 'Q1.9',
    text: 'How important is factuality and citation in model outputs?',
    description: 'Establishes accuracy requirements and hallucination tolerance.',
    type: 'select',
    required: true,
    options: ['Critical', 'Important', 'Moderate', 'Low Priority'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  },
  {
    id: 'q1-2-10',
    number: 'Q1.10',
    text: 'Define clear success criteria (accuracy, latency, cost)',
    description: 'Set accuracy/performance targets, define latency requirements, establish cost parameters, document additional requirements',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'evaluation-metrics'
  }
];
// Implementation Considerations (11 questions)
const implementationConsiderationsQuestions: RAPIDQuestion[] = [
  {
    id: 'q1-3-1',
    number: 'Q1.1',
    text: 'What is your preferred development timeline?',
    description: 'Establishes scheduling expectations and milestone planning.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-2',
    number: 'Q1.2',
    text: 'Do you have in-house AI/ML expertise?',
    description: 'Determines level of guidance and support needed during implementation.',
    type: 'radio',
    required: true,
    options: ['Yes, extensive', 'Yes, some', 'Limited', 'No'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-3',
    number: 'Q1.3',
    text: 'Who are the primary end users of the application?',
    description: 'Identifies the specific user groups who will directly interact with the application.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-4',
    number: 'Q1.4',
    text: 'How tech-savvy are your intended users?',
    description: 'Helps gauge appropriate user interface complexity and training requirements.',
    type: 'select',
    required: true,
    options: ['Very tech-savvy', 'Moderately tech-savvy', 'Basic tech skills', 'Limited tech skills'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-5',
    number: 'Q1.5',
    text: 'How will users interact with the GenAI application?',
    description: 'Determines interface design and interaction model requirements.',
    type: 'checkbox',
    required: true,
    options: ['Web interface', 'Mobile app', 'API integration', 'Chat interface', 'Voice interface', 'Other'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-6',
    number: 'Q1.6',
    text: 'Do you prefer cloud-based, on-premises, or hybrid deployment?',
    description: 'Determines infrastructure approach and hosting requirements.',
    type: 'radio',
    required: true,
    options: ['Cloud-based', 'On-premises', 'Hybrid', 'No preference'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-7',
    number: 'Q1.7',
    text: 'Are there any existing AI governance policies that must be followed?',
    description: 'Identifies organizational constraints on AI deployment.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-8',
    number: 'Q1.8',
    text: 'Will users need to save, export, or share AI outputs?',
    description: 'Identifies additional functionality beyond core AI capabilities.',
    type: 'checkbox',
    required: false,
    options: ['Save outputs', 'Export to files', 'Share with others', 'Print outputs', 'None needed'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-9',
    number: 'Q1.9',
    text: 'What is your budget range for this implementation?',
    description: 'Helps scope appropriate solution within financial constraints.',
    type: 'select',
    required: false,
    options: ['Under $50K', '$50K-$200K', '$200K-$500K', '$500K-$1M', 'Over $1M', 'Not determined'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-10',
    number: 'Q1.10',
    text: 'What resources can your organization commit to this project?',
    description: 'Identifies available internal support for implementation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  },
  {
    id: 'q1-3-11',
    number: 'Q1.11',
    text: 'Would you prefer a phased approach with iterative deployments?',
    description: 'Determines release strategy and milestone planning.',
    type: 'radio',
    required: true,
    options: ['Yes, phased approach', 'No, full deployment', 'Depends on complexity'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'implementation-considerations'
  }
];
// Technical Requirements and Constraints (13 questions)
const technicalRequirementsQuestions: RAPIDQuestion[] = [
  {
    id: 'q1-4-1',
    number: 'Q1.1',
    text: 'What types of data sources are required to support your generative AI workloads?',
    description: 'Maps data ecosystem needed to support the application.',
    type: 'checkbox',
    required: true,
    options: ['Structured databases', 'Unstructured documents', 'Real-time data streams', 'APIs', 'File systems', 'Cloud storage'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-2',
    number: 'Q1.2',
    text: 'What is the expected volume of data or requests for the use case?',
    description: 'Establishes scale requirements for infrastructure planning.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-3',
    number: 'Q1.3',
    text: 'Are there any existing systems this GenAI application needs to integrate with?',
    description: 'Identifies integration points and potential technical constraints.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-4',
    number: 'Q1.4',
    text: 'What types of AI capabilities are most important for your use case (text generation, classification, summarization, etc.)?',
    description: 'Identifies core AI functions needed for the implementation.',
    type: 'checkbox',
    required: true,
    options: ['Text generation', 'Classification', 'Summarization', 'Question answering', 'Translation', 'Code generation', 'Image analysis'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-5',
    number: 'Q1.5',
    text: 'Are there any specific regulatory or compliance requirements that must be addressed?',
    description: 'Identifies legal and governance constraints for the implementation.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-6',
    number: 'Q1.6',
    text: 'Will your application require domain-specific knowledge or expertise?',
    description: 'Determines need for domain-specific training or fine-tuning.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-7',
    number: 'Q1.7',
    text: 'Do you require multimodal capabilities (text, images, audio)?',
    description: 'Identifies additional model requirements beyond text processing.',
    type: 'checkbox',
    required: false,
    options: ['Text only', 'Text + Images', 'Text + Audio', 'Text + Video', 'All modalities'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-8',
    number: 'Q1.8',
    text: 'Do you have specific latency or response time requirements?',
    description: 'Establishes performance expectations and SLA requirements.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-9',
    number: 'Q1.9',
    text: 'How frequently do you need to update or refresh data from these sources?',
    description: 'Determines real-time vs. batch processing requirements and data currency needs.',
    type: 'select',
    required: true,
    options: ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'As needed'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-10',
    number: 'Q1.10',
    text: 'What data formats do your generative AI models require as input?',
    description: 'Identifies data transformation and preparation requirements.',
    type: 'checkbox',
    required: true,
    options: ['JSON', 'XML', 'CSV', 'Plain text', 'PDF', 'Images', 'Audio files'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-11',
    number: 'Q1.11',
    text: 'What is your expected peak throughput in terms of requests per minute/hour?',
    description: 'Helps size infrastructure and determine scaling requirements.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-12',
    number: 'Q1.12',
    text: 'Do you have preferences for specific LLM platforms or models?',
    description: 'Determines model selection constraints or preferences.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  },
  {
    id: 'q1-4-13',
    number: 'Q1.13',
    text: 'What platforms will users use to access this application (web, mobile, API, etc.)?',
    description: 'Determines UI/UX requirements and delivery channels.',
    type: 'checkbox',
    required: true,
    options: ['Web browser', 'Mobile app', 'Desktop application', 'API integration', 'Command line', 'Other'],
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'technical-requirements'
  }
];
// Use-case Prioritization (2 questions)
const useCasePrioritizationQuestions: RAPIDQuestion[] = [
  {
    id: 'q1-5-1',
    number: 'Q1.1',
    text: 'How do you approach prioritizing and sequencing generative AI workload assessments across different projects and departments in your organization?',
    description: 'Use-case prioritization framework used (Business Value Impact 40%, Technical Feasibility 30%, Implementation Readiness 30%)',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'use-case-prioritization'
  },
  {
    id: 'q1-5-2',
    number: 'Q1.2',
    text: 'What are the key stakeholders need to be involved in this process?',
    description: 'Identifies additional participants whose input will be crucial for success.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    subcategory: 'use-case-prioritization'
  }
];

// ===== DATA READINESS ASSESSMENT QUESTIONS (25 questions) =====

// AI-Specific Data Preparation (7 questions)
const aiDataPreparationQuestions: RAPIDQuestion[] = [
  {
    id: 'q2-1-1',
    number: 'Q2.1',
    text: 'Do you have labeled datasets available for training or fine-tuning models?',
    description: 'Assesses availability of supervised learning data if model customization is required.',
    type: 'radio',
    required: true,
    options: ['Yes, extensive', 'Yes, some', 'Limited', 'No'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-2',
    number: 'Q2.2',
    text: 'Have you performed any data profiling or exploratory analysis on your datasets?',
    description: 'Determines understanding of data characteristics that might impact AI performance.',
    type: 'radio',
    required: true,
    options: ['Yes, comprehensive', 'Yes, basic', 'Planned', 'No'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-3',
    number: 'Q2.3',
    text: 'Are there known biases or gaps in your data that could affect AI outputs?',
    description: 'Identifies potential ethical concerns and performance limitations to address.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-4',
    number: 'Q2.4',
    text: 'Have you established ground truth or benchmark datasets for evaluating AI performance?',
    description: 'Assesses readiness for measuring AI output quality and accuracy.',
    type: 'radio',
    required: true,
    options: ['Yes, established', 'In progress', 'Planned', 'No'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-5',
    number: 'Q2.5',
    text: 'Do you have mechanisms to monitor data drift or quality changes over time?',
    description: 'Identifies capabilities for maintaining AI performance as data evolves.',
    type: 'radio',
    required: true,
    options: ['Yes, automated', 'Yes, manual', 'Planned', 'No'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-6',
    number: 'Q2.6',
    text: 'Do you have processes in place to handle missing, incomplete, or inconsistent data?',
    description: 'Evaluates maturity of data cleansing procedures critical for reliable AI outputs.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  },
  {
    id: 'q2-1-7',
    number: 'Q2.7',
    text: 'What percentage of your data meets your quality standards for generative AI use?',
    description: 'Quantifies the proportion of data that is immediately usable versus requiring cleanup',
    type: 'select',
    required: true,
    options: ['90-100%', '70-89%', '50-69%', '30-49%', 'Less than 30%', 'Unknown'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'ai-data-preparation'
  }
];

// Data Format & Preprocessing (6 questions)
const dataFormatPreprocessingQuestions: RAPIDQuestion[] = [
  {
    id: 'q2-2-1',
    number: 'Q2.1',
    text: 'What data formats comprise your relevant data (structured, unstructured, semi-structured)?',
    description: 'Determines compatibility with GenAI processing requirements and necessary transformations.',
    type: 'checkbox',
    required: true,
    options: ['Structured (databases, CSV)', 'Unstructured (text, documents)', 'Semi-structured (JSON, XML)', 'Images', 'Audio', 'Video'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  },
  {
    id: 'q2-2-2',
    number: 'Q2.2',
    text: 'Are your data sources centralized or distributed across multiple systems?',
    description: 'Identifies potential data integration challenges and accessibility issues.',
    type: 'radio',
    required: true,
    options: ['Centralized', 'Distributed', 'Mixed', 'Unknown'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  },
  {
    id: 'q2-2-3',
    number: 'Q2.3',
    text: 'What data pipeline infrastructure do you currently have in place?',
    description: 'Evaluates existing ETL/ELT capabilities that can support GenAI data flow.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  },
  {
    id: 'q2-2-4',
    number: 'Q2.4',
    text: 'Can your current infrastructure support real-time data processing if required?',
    description: 'Determines if infrastructure upgrades are needed for latency-sensitive applications.',
    type: 'radio',
    required: true,
    options: ['Yes, fully capable', 'Yes, with modifications', 'No, requires upgrade', 'Unknown'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  },
  {
    id: 'q2-2-5',
    number: 'Q2.5',
    text: 'What languages are represented in your data?',
    description: 'Identifies multilingual requirements and potential challenges.',
    type: 'checkbox',
    required: false,
    options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Other'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  },
  {
    id: 'q2-2-6',
    number: 'Q2.6',
    text: 'What text preprocessing or normalization steps have you applied to your data?',
    description: 'Evaluates text-specific preparation work completed for NLP applications.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-format-preprocessing'
  }
];

// Data Quality & Governance (6 questions)
const dataQualityGovernanceQuestions: RAPIDQuestion[] = [
  {
    id: 'q2-3-1',
    number: 'Q2.1',
    text: 'How do you ensure and measure the quality of your data?',
    description: 'Assesses existing data quality processes and metrics that would impact GenAI performance.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  },
  {
    id: 'q2-3-2',
    number: 'Q2.2',
    text: 'How do you classify and manage sensitive information within your datasets?',
    description: 'Assesses risk management practices for personally identifiable or confidential information.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  },
  {
    id: 'q2-3-3',
    number: 'Q2.3',
    text: 'Do you have documented data lineage for the sources you plan to use?',
    description: 'Determines traceability and auditability of data feeding into the GenAI system.',
    type: 'radio',
    required: true,
    options: ['Yes, comprehensive', 'Yes, partial', 'In progress', 'No'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  },
  {
    id: 'q2-3-4',
    number: 'Q2.4',
    text: 'What data access controls and permissions are currently in place?',
    description: 'Identifies security measures and potential constraints for AI system access to data.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  },
  {
    id: 'q2-3-5',
    number: 'Q2.5',
    text: 'Who owns and manages the data sources you plan to use?',
    description: 'Identifies data stewards and access approval processes.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  },
  {
    id: 'q2-3-6',
    number: 'Q2.6',
    text: 'How do you plan to build trust about data usage in generative AI among stakeholders?',
    description: 'Evaluates transparency and communication strategies regarding AI data usage.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-quality-governance'
  }
];

// Data Volume & Storage Requirements (6 questions)
const dataVolumeStorageQuestions: RAPIDQuestion[] = [
  {
    id: 'q2-4-1',
    number: 'Q2.1',
    text: 'What is the current volume of relevant data available for your GenAI application?',
    description: 'Quantifies data scale to determine processing and storage requirements.',
    type: 'select',
    required: true,
    options: ['Less than 1GB', '1GB-10GB', '10GB-100GB', '100GB-1TB', '1TB-10TB', 'More than 10TB'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  },
  {
    id: 'q2-4-2',
    number: 'Q2.2',
    text: 'Where will the training data be stored?',
    description: 'Maps current and planned data repositories and access methods.',
    type: 'checkbox',
    required: true,
    options: ['On-premises servers', 'Cloud storage', 'Hybrid storage', 'Data lakes', 'Data warehouses', 'Other'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  },
  {
    id: 'q2-4-3',
    number: 'Q2.3',
    text: 'What are the storage requirements for training data and model artifacts?',
    description: 'Determines capacity, durability, and availability requirements.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  },
  {
    id: 'q2-4-4',
    number: 'Q2.4',
    text: 'What are the data retention and backup requirements?',
    description: 'Determines storage lifecycle management requirements.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  },
  {
    id: 'q2-4-5',
    number: 'Q2.5',
    text: 'How frequently is your data updated or refreshed?',
    description: 'Assesses data currency requirements and pipeline update frequencies.',
    type: 'select',
    required: true,
    options: ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  },
  {
    id: 'q2-4-6',
    number: 'Q2.6',
    text: 'How do you handle versioning and storage of different iterations of training datasets?',
    description: 'Evaluates version control practices and their impact on storage needs.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.DATA_READINESS,
    subcategory: 'data-volume-storage'
  }
];

// ===== COMPLIANCE & INTEGRATION QUESTIONS (27 questions) =====

// Enterprise Integration (5 questions)
const enterpriseIntegrationQuestions: RAPIDQuestion[] = [
  {
    id: 'q3-1-1',
    number: 'Q3.1',
    text: 'What existing systems will the GenAI application need to integrate with?',
    description: 'Maps integration points that will require API development or connectors.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'enterprise-integration'
  },
  {
    id: 'q3-1-2',
    number: 'Q3.2',
    text: 'Do you have existing single sign-on (SSO) or identity management systems to leverage?',
    description: 'Identifies authentication integration requirements for seamless user experience.',
    type: 'radio',
    required: true,
    options: ['Yes, SSO available', 'Yes, identity management', 'Both available', 'Neither available'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'enterprise-integration'
  },
  {
    id: 'q3-1-3',
    number: 'Q3.3',
    text: 'What APIs or service endpoints are available for integration with your current systems?',
    description: 'Evaluates available technical connection points for enterprise integration.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'enterprise-integration'
  },
  {
    id: 'q3-1-4',
    number: 'Q3.4',
    text: 'Are there specific data exchange formats required for compatibility with your systems?',
    description: 'Identifies format requirements for input/output compatibility.',
    type: 'checkbox',
    required: false,
    options: ['JSON', 'XML', 'CSV', 'REST APIs', 'SOAP', 'GraphQL', 'Other'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'enterprise-integration'
  },
  {
    id: 'q3-1-5',
    number: 'Q3.5',
    text: 'What latency or performance requirements exist for integrations?',
    description: 'Establishes performance expectations for integrated operations.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'enterprise-integration'
  }
];

// Governance & Risk Management (7 questions)
const governanceRiskQuestions: RAPIDQuestion[] = [
  {
    id: 'q3-2-1',
    number: 'Q3.1',
    text: 'Who are the key stakeholders responsible for AI governance and compliance?',
    description: 'Identifies key stakeholders and decision-makers for compliance matters.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-2',
    number: 'Q3.2',
    text: 'What monitoring and reporting processes are needed for AI system oversight?',
    description: 'Determines operational governance requirements for ongoing supervision.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-3',
    number: 'Q3.3',
    text: 'What are your thresholds and criteria for human review of AI outputs?',
    description: 'Identifies when human intervention is required in AI processes.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-4',
    number: 'Q3.4',
    text: 'What change management processes apply to AI model updates or system changes?',
    description: 'Evaluates controls for managing system evolution while maintaining compliance.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-5',
    number: 'Q3.5',
    text: 'How will you monitor for and address model drift or performance degradation?',
    description: 'Identifies ongoing quality management approaches for long-term stability.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-6',
    number: 'Q3.6',
    text: 'What is your organization\'s approach to managing bias in AI systems?',
    description: 'Assesses awareness and mitigation strategies for AI fairness issues.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  },
  {
    id: 'q3-2-7',
    number: 'Q3.7',
    text: 'Have you conducted a risk assessment specific to this GenAI implementation?',
    description: 'Determines if formal risk evaluation has been performed for the use case.',
    type: 'radio',
    required: true,
    options: ['Yes, completed', 'In progress', 'Planned', 'No'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'governance-risk'
  }
];

// Legal and Licensing (4 questions)
const legalLicensingQuestions: RAPIDQuestion[] = [
  {
    id: 'q3-3-1',
    number: 'Q3.1',
    text: 'Have you reviewed licensing terms for all models and data sources you plan to use?',
    description: 'Ensures awareness of legal usage constraints for third-party components.',
    type: 'radio',
    required: true,
    options: ['Yes, all reviewed', 'Partially reviewed', 'In progress', 'Not started'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'legal-licensing'
  },
  {
    id: 'q3-3-2',
    number: 'Q3.2',
    text: 'What intellectual property considerations apply to AI-generated content?',
    description: 'Clarifies ownership and rights related to system outputs.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'legal-licensing'
  },
  {
    id: 'q3-3-3',
    number: 'Q3.3',
    text: 'Have you established terms of service or user agreements for your GenAI application?',
    description: 'Determines if legal frameworks for user interaction are in place.',
    type: 'radio',
    required: true,
    options: ['Yes, established', 'In development', 'Planned', 'Not considered'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'legal-licensing'
  },
  {
    id: 'q3-3-4',
    number: 'Q3.4',
    text: 'What are your requirements for AI explainability and transparency?',
    description: 'Determines AI explainability and transparency requirements.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'legal-licensing'
  }
];

// Regulatory Compliance (6 questions)
const regulatoryComplianceQuestions: RAPIDQuestion[] = [
  {
    id: 'q3-4-1',
    number: 'Q3.1',
    text: 'What industry-specific regulations apply to your AI implementation (HIPAA, GDPR, CCPA, etc.)?',
    description: 'Identifies specific regulatory frameworks that will govern AI usage in the customer\'s context.',
    type: 'checkbox',
    required: false,
    options: ['HIPAA', 'GDPR', 'CCPA', 'SOX', 'PCI DSS', 'FERPA', 'Other', 'None'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  },
  {
    id: 'q3-4-2',
    number: 'Q3.2',
    text: 'Have you conducted a privacy impact assessment for this GenAI use case?',
    description: 'Determines if formal privacy evaluation has been completed to identify potential risks.',
    type: 'radio',
    required: true,
    options: ['Yes, completed', 'In progress', 'Planned', 'Not required'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  },
  {
    id: 'q3-4-3',
    number: 'Q3.3',
    text: 'What requirements do you have for explainability and transparency of AI decisions?',
    description: 'Assesses need for interpretable AI and documentation of decision processes.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  },
  {
    id: 'q3-4-4',
    number: 'Q3.4',
    text: 'What data sovereignty requirements must be addressed?',
    description: 'Determines geographic constraints on data processing and storage.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  },
  {
    id: 'q3-4-5',
    number: 'Q3.5',
    text: 'Do you have protocols for handling right-to-be-forgotten or data deletion requests?',
    description: 'Evaluates readiness for managing consumer privacy rights that may affect model training data.',
    type: 'radio',
    required: false,
    options: ['Yes, established', 'In development', 'Planned', 'Not applicable'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  },
  {
    id: 'q3-4-6',
    number: 'Q3.6',
    text: 'What audit trails or logging requirements apply to your AI system?',
    description: 'Identifies logging and traceability requirements.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'regulatory-compliance'
  }
];

// Security Considerations (5 questions)
const securityConsiderationsQuestions: RAPIDQuestion[] = [
  {
    id: 'q3-5-1',
    number: 'Q3.1',
    text: 'Have you established data classification levels for information processed by the AI system?',
    description: 'Assesses maturity of data security categorization that will affect access controls.',
    type: 'radio',
    required: true,
    options: ['Yes, comprehensive', 'Yes, basic', 'In progress', 'No'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'security-considerations'
  },
  {
    id: 'q3-5-2',
    number: 'Q3.2',
    text: 'What authentication and authorization mechanisms are required for your GenAI application?',
    description: 'Identifies security controls needed for user access management.',
    type: 'checkbox',
    required: true,
    options: ['Multi-factor authentication', 'Role-based access', 'Single sign-on', 'API keys', 'OAuth', 'Other'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'security-considerations'
  },
  {
    id: 'q3-5-3',
    number: 'Q3.3',
    text: 'Do you have requirements for encryption of data at rest and in transit?',
    description: 'Determines security protocols needed for data protection throughout the AI pipeline.',
    type: 'radio',
    required: true,
    options: ['Yes, both required', 'Only in transit', 'Only at rest', 'No requirements'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'security-considerations'
  },
  {
    id: 'q3-5-4',
    number: 'Q3.4',
    text: 'Have you conducted a threat modeling exercise for the proposed GenAI application?',
    description: 'Assesses proactive security planning and risk identification.',
    type: 'radio',
    required: true,
    options: ['Yes, completed', 'In progress', 'Planned', 'No'],
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'security-considerations'
  },
  {
    id: 'q3-5-5',
    number: 'Q3.5',
    text: 'What content moderation or filtering requirements exist?',
    description: 'Identifies safety mechanisms needed for user-facing content.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    subcategory: 'security-considerations'
  }
];

// ===== BUSINESS VALUE & ROI QUESTIONS (10 questions) =====

const businessValueROIQuestions: RAPIDQuestion[] = [
  {
    id: 'q5-1-1',
    number: 'Q5.1',
    text: 'What success metrics are tracked for your GenAI application?',
    description: 'Identifies how business value is measured.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-2',
    number: 'Q5.2',
    text: 'What is the estimated business impact in terms of cost savings, revenue generation, productivity improvement, and customer experience enhancement?',
    description: 'Quantifies operational improvements from implementation.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-3',
    number: 'Q5.3',
    text: 'How many users/departments would benefit from this solution?',
    description: 'Assesses qualitative improvements and user experience.',
    type: 'text',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-4',
    number: 'Q5.4',
    text: 'What is the urgency for implementing this use case? Are there any critical deadlines?',
    description: 'Identifies timeline constraints and helps prioritize implementation activities.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-5',
    number: 'Q5.5',
    text: 'How do executives or stakeholders perceive the value of the application?',
    description: 'Assesses leadership support and perception.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-6',
    number: 'Q5.6',
    text: 'What is the current manual effort or cost associated with this process?',
    description: 'Assesses effort estimation and cost.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-7',
    number: 'Q5.7',
    text: 'Are there existing solutions in place? Why are they inadequate?',
    description: 'Maps the implementation to current operational activities for smoother transition planning.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-8',
    number: 'Q5.8',
    text: 'What specific pain points or business challenges does this GenAI use case aim to address?',
    description: 'Identifies current problems the application will solve, establishing baseline for ROI calculations.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-9',
    number: 'Q5.9',
    text: 'What is your estimated ROI for this application?',
    description: 'Quantifies overall business value delivered.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  },
  {
    id: 'q5-1-10',
    number: 'Q5.10',
    text: 'What is the expected business impact in the first 3/6/12 months?',
    description: 'Establishes timeline for expected value realization.',
    type: 'textarea',
    required: true,
    category: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
    subcategory: 'business-value-roi'
  }
];

// ===== MIGRATION ASSESSMENT QUESTIONS (52 questions) =====

// Agent and Function Implementations (4 questions)
const agentFunctionQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-1-1',
    number: 'Q2.1',
    text: 'Does your application use agent architectures?',
    description: 'Identifies if autonomous agents are employed in the solution.',
    type: 'radio',
    required: true,
    options: ['Yes', 'No', 'Planned'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'agent-function-implementations'
  },
  {
    id: 'q2m-1-2',
    number: 'Q2.2',
    text: 'What agent frameworks or architectures do you employ?',
    description: 'Details specific agent implementation approaches.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'agent-function-implementations'
  },
  {
    id: 'q2m-1-3',
    number: 'Q2.3',
    text: 'What orchestration tools or frameworks do you use?',
    description: 'Identifies workflow and process management components to be migrated or replaced.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'agent-function-implementations'
  },
  {
    id: 'q2m-1-4',
    number: 'Q2.4',
    text: 'How do you manage function calling and API access?',
    description: 'Addresses security and orchestration of external tool access.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'agent-function-implementations'
  }
];

// LLM and Model Information (7 questions)
const llmModelInfoQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-2-1',
    number: 'Q2.1',
    text: 'Which large language model(s) are you currently using?',
    description: 'Identifies specific model selection (e.g., GPT-4, Claude 3, Llama 3, etc.).',
    type: 'checkbox',
    required: true,
    options: ['GPT-4', 'GPT-3.5', 'Claude 3', 'Llama 3', 'Gemini', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-2',
    number: 'Q2.2',
    text: 'Are you using first-party APIs or self-hosted models?',
    description: 'Distinguishes between cloud API-based and on-premises deployments.',
    type: 'radio',
    required: true,
    options: ['First-party APIs', 'Self-hosted models', 'Both', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-3',
    number: 'Q2.3',
    text: 'If using self-hosted models, what infrastructure are they deployed on?',
    description: 'Identifies hardware requirements and on-premises setup.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-4',
    number: 'Q2.4',
    text: 'What model parameters/sizes are you utilizing?',
    description: 'Assesses the computational requirements and capabilities of models in use.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-5',
    number: 'Q2.5',
    text: 'Do you fine-tune or customize your models? If so, how?',
    description: 'Evaluates model customization approaches and sophistication.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-6',
    number: 'Q2.6',
    text: 'What was your model selection process?',
    description: 'Provides insight into decision criteria for model selection.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  },
  {
    id: 'q2m-2-7',
    number: 'Q2.7',
    text: 'What are your current model inference costs?',
    description: 'Quantifies financial considerations for model usage.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'llm-model-information'
  }
];

// Model Outputs and Samples (7 questions)
const modelOutputsSamplesQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-3-1',
    number: 'Q2.1',
    text: 'Can you provide sample inputs and outputs from your system?',
    description: 'Requests concrete examples for quality assessment.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-2',
    number: 'Q2.2',
    text: 'What are examples of high-quality vs. low-quality responses?',
    description: 'Establishes quality benchmarks and expectations.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-3',
    number: 'Q2.3',
    text: 'How consistent are model responses across similar queries?',
    description: 'Evaluates consistency and reliability.',
    type: 'select',
    required: false,
    options: ['Very consistent', 'Mostly consistent', 'Somewhat consistent', 'Inconsistent', 'Unknown'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-4',
    number: 'Q2.4',
    text: 'What types of queries or tasks perform best with your implementation?',
    description: 'Identifies strengths and optimal use cases.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-5',
    number: 'Q2.5',
    text: 'What types of queries or tasks perform poorly?',
    description: 'Identifies limitations and areas for improvement.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-6',
    number: 'Q2.6',
    text: 'Can you share any user feedback on model outputs?',
    description: 'Provides external perspectives on quality and value.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  },
  {
    id: 'q2m-3-7',
    number: 'Q2.7',
    text: 'Can you provide a high-level diagram of your GenAI platform architecture?',
    description: 'Requests visual representation of the overall system to guide migration planning.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'model-outputs-samples'
  }
];

// Performance and SLAs (7 questions)
const performanceSLAsQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-4-1',
    number: 'Q2.1',
    text: 'What are your defined SLAs for the application?',
    description: 'Identifies formal performance commitments.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-2',
    number: 'Q2.2',
    text: 'What KPIs do you track for your GenAI platform?',
    description: 'Lists metrics used to measure success.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-3',
    number: 'Q2.3',
    text: 'How do you measure model performance and quality?',
    description: 'Evaluates approaches to assessing model outputs.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-4',
    number: 'Q2.4',
    text: 'What are your current biggest performance bottlenecks?',
    description: 'Identifies areas for improvement.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-5',
    number: 'Q2.5',
    text: 'How do you handle rate limiting and capacity management?',
    description: 'Evaluates load management strategies.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-6',
    number: 'Q2.6',
    text: 'What caching strategies are implemented?',
    description: 'Identifies performance optimization techniques.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  },
  {
    id: 'q2m-4-7',
    number: 'Q2.7',
    text: 'How do you scale your application during peak demand?',
    description: 'Assesses elasticity and scaling capabilities.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'performance-slas'
  }
];

// Prompt Engineering and Management (6 questions)
const promptEngineeringQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-5-1',
    number: 'Q2.1',
    text: 'How do you structure your prompts?',
    description: 'Assesses prompt engineering sophistication.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  },
  {
    id: 'q2m-5-2',
    number: 'Q2.2',
    text: 'Do you use templates, few-shot learning, or other prompt techniques?',
    description: 'Identifies specific prompt engineering strategies.',
    type: 'checkbox',
    required: false,
    options: ['Templates', 'Few-shot learning', 'Chain-of-thought', 'Role prompting', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  },
  {
    id: 'q2m-5-3',
    number: 'Q2.3',
    text: 'How do you manage prompt versioning and updates?',
    description: 'Evaluates prompt management processes and governance.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  },
  {
    id: 'q2m-5-4',
    number: 'Q2.4',
    text: 'Do you have a prompt library or centralized management system?',
    description: 'Identifies prompt reuse and standardization practices.',
    type: 'radio',
    required: false,
    options: ['Yes, centralized system', 'Yes, informal library', 'No, ad-hoc', 'Planned'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  },
  {
    id: 'q2m-5-5',
    number: 'Q2.5',
    text: 'How do you optimize prompts for performance and accuracy?',
    description: 'Evaluates prompt refinement processes.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  },
  {
    id: 'q2m-5-6',
    number: 'Q2.6',
    text: 'Can you share examples of your most effective prompts?',
    description: 'Provides concrete examples for analysis.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'prompt-engineering'
  }
];

// RAG Implementation (8 questions)
const ragImplementationQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-6-1',
    number: 'Q2.1',
    text: 'Do you use RAG techniques in your application?',
    description: 'Determines if retrieval is used to enhance generation.',
    type: 'radio',
    required: true,
    options: ['Yes', 'No', 'Planned'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-2',
    number: 'Q2.2',
    text: 'What data sources are integrated into your RAG system?',
    description: 'Identifies content types and sources used for retrieval.',
    type: 'checkbox',
    required: false,
    options: ['Documents', 'Databases', 'APIs', 'Web content', 'Knowledge bases', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-3',
    number: 'Q2.3',
    text: 'Which vector database or embedding store do you use?',
    description: 'Identifies technical implementation of vector storage.',
    type: 'select',
    required: false,
    options: ['Pinecone', 'Weaviate', 'Chroma', 'FAISS', 'Elasticsearch', 'Other', 'None'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-4',
    number: 'Q2.4',
    text: 'What embedding models do you use?',
    description: 'Details specific embedding approaches and models.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-5',
    number: 'Q2.5',
    text: 'How do you structure and chunk your documents for embedding?',
    description: 'Evaluates document processing approaches.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-6',
    number: 'Q2.6',
    text: 'What is your retrieval strategy (semantic search, hybrid search, reranking)?',
    description: 'Details implementation of search and retrieval components.',
    type: 'checkbox',
    required: false,
    options: ['Semantic search', 'Keyword search', 'Hybrid search', 'Reranking', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-7',
    number: 'Q2.7',
    text: 'How do you measure retrieval quality and relevance?',
    description: 'Identifies evaluation metrics for retrieval effectiveness.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  },
  {
    id: 'q2m-6-8',
    number: 'Q2.8',
    text: 'How frequently is your knowledge base updated?',
    description: 'Assesses freshness and maintenance of retrieved information.',
    type: 'select',
    required: false,
    options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'As needed'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'rag-implementation'
  }
];

// Security and Governance (7 questions)
const securityGovernanceQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-7-1',
    number: 'Q2.1',
    text: 'How do you authenticate and authorize users?',
    description: 'Assesses access control mechanisms.',
    type: 'checkbox',
    required: false,
    options: ['Username/password', 'Multi-factor authentication', 'SSO', 'API keys', 'OAuth', 'Other'],
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-2',
    number: 'Q2.2',
    text: 'How do you secure API endpoints and model access?',
    description: 'Evaluates API security practices.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-3',
    number: 'Q2.3',
    text: 'What PII (Personally Identifiable Information) handling procedures are in place?',
    description: 'Assesses data privacy compliance.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-4',
    number: 'Q2.4',
    text: 'Do you implement content filtering or moderation? How?',
    description: 'Evaluates safety measures for generated content.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-5',
    number: 'Q2.5',
    text: 'What logging and audit mechanisms are in place?',
    description: 'Assesses compliance and security monitoring.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-6',
    number: 'Q2.6',
    text: 'How do you handle data sovereignty and regional compliance requirements?',
    description: 'Evaluates geographic and regulatory compliance.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  },
  {
    id: 'q2m-7-7',
    number: 'Q2.7',
    text: 'What incident response procedures exist for AI-related failures?',
    description: 'Assesses preparedness for AI-specific incidents.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'security-governance'
  }
];

// Usage Metrics (6 questions)
const usageMetricsQuestions: RAPIDQuestion[] = [
  {
    id: 'q2m-8-1',
    number: 'Q2.1',
    text: 'What is the total number of active users on your platform?',
    description: 'Establishes the scale of user adoption.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  },
  {
    id: 'q2m-8-2',
    number: 'Q2.2',
    text: 'What is your average and peak concurrent user count?',
    description: 'Helps understand typical and maximum load on the application.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  },
  {
    id: 'q2m-8-3',
    number: 'Q2.3',
    text: 'What is your average daily/monthly query volume?',
    description: 'Quantifies overall application usage.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  },
  {
    id: 'q2m-8-4',
    number: 'Q2.4',
    text: 'When do you experience peak usage hours?',
    description: 'Identifies time-based usage patterns that may affect performance requirements.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  },
  {
    id: 'q2m-8-5',
    number: 'Q2.5',
    text: 'What is your average response time during normal operations and peak hours?',
    description: 'Establishes typical performance metrics and identifies performance degradation during high load scenarios.',
    type: 'text',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  },
  {
    id: 'q2m-8-6',
    number: 'Q2.6',
    text: 'How has usage grown over the past 6 months?',
    description: 'Tracks adoption trends and growth trajectory.',
    type: 'textarea',
    required: false,
    category: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
    subcategory: 'usage-metrics'
  }
];

// ===== COMPLETE RAPID QUESTIONNAIRE STRUCTURE =====

// Exploratory Path Categories
const exploratoryCategories: RAPIDSubcategory[] = [
  {
    id: 'business-context',
    title: 'Business Context and Use Case Definition',
    questions: businessContextQuestions,
    questionCount: businessContextQuestions.length
  },
  {
    id: 'evaluation-metrics',
    title: 'Evaluation and Success Metrics',
    questions: evaluationMetricsQuestions,
    questionCount: evaluationMetricsQuestions.length
  },
  {
    id: 'implementation-considerations',
    title: 'Implementation Considerations',
    questions: implementationConsiderationsQuestions,
    questionCount: implementationConsiderationsQuestions.length
  },
  {
    id: 'technical-requirements',
    title: 'Technical Requirements and Constraints',
    questions: technicalRequirementsQuestions,
    questionCount: technicalRequirementsQuestions.length
  },
  {
    id: 'use-case-prioritization',
    title: 'Use-case Prioritization',
    questions: useCasePrioritizationQuestions,
    questionCount: useCasePrioritizationQuestions.length
  }
];

// Migration Path Categories
const migrationCategories: RAPIDSubcategory[] = [
  {
    id: 'agent-function-implementations',
    title: 'Agent and Function Implementations',
    questions: agentFunctionQuestions,
    questionCount: agentFunctionQuestions.length
  },
  {
    id: 'llm-model-information',
    title: 'LLM and Model Information',
    questions: llmModelInfoQuestions,
    questionCount: llmModelInfoQuestions.length
  },
  {
    id: 'model-outputs-samples',
    title: 'Model Outputs and Samples',
    questions: modelOutputsSamplesQuestions,
    questionCount: modelOutputsSamplesQuestions.length
  },
  {
    id: 'performance-slas',
    title: 'Performance and SLAs',
    questions: performanceSLAsQuestions,
    questionCount: performanceSLAsQuestions.length
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering and Management',
    questions: promptEngineeringQuestions,
    questionCount: promptEngineeringQuestions.length
  },
  {
    id: 'rag-implementation',
    title: 'RAG Implementation',
    questions: ragImplementationQuestions,
    questionCount: ragImplementationQuestions.length
  },
  {
    id: 'security-governance',
    title: 'Security and Governance',
    questions: securityGovernanceQuestions,
    questionCount: securityGovernanceQuestions.length
  },
  {
    id: 'usage-metrics',
    title: 'Usage Metrics',
    questions: usageMetricsQuestions,
    questionCount: usageMetricsQuestions.length
  }
];

// Data Readiness Categories (shared between both paths)
const dataReadinessCategories: RAPIDSubcategory[] = [
  {
    id: 'ai-data-preparation',
    title: 'AI-Specific Data Preparation',
    questions: aiDataPreparationQuestions,
    questionCount: aiDataPreparationQuestions.length
  },
  {
    id: 'data-format-preprocessing',
    title: 'Data Format & Preprocessing',
    questions: dataFormatPreprocessingQuestions,
    questionCount: dataFormatPreprocessingQuestions.length
  },
  {
    id: 'data-quality-governance',
    title: 'Data Quality & Governance',
    questions: dataQualityGovernanceQuestions,
    questionCount: dataQualityGovernanceQuestions.length
  },
  {
    id: 'data-volume-storage',
    title: 'Data Volume & Storage Requirements',
    questions: dataVolumeStorageQuestions,
    questionCount: dataVolumeStorageQuestions.length
  }
];

// Compliance & Integration Categories (shared between both paths)
const complianceIntegrationCategories: RAPIDSubcategory[] = [
  {
    id: 'enterprise-integration',
    title: 'Enterprise Integration',
    questions: enterpriseIntegrationQuestions,
    questionCount: enterpriseIntegrationQuestions.length
  },
  {
    id: 'governance-risk',
    title: 'Governance & Risk Management',
    questions: governanceRiskQuestions,
    questionCount: governanceRiskQuestions.length
  },
  {
    id: 'legal-licensing',
    title: 'Legal and Licensing',
    questions: legalLicensingQuestions,
    questionCount: legalLicensingQuestions.length
  },
  {
    id: 'regulatory-compliance',
    title: 'Regulatory Compliance',
    questions: regulatoryComplianceQuestions,
    questionCount: regulatoryComplianceQuestions.length
  },
  {
    id: 'security-considerations',
    title: 'Security Considerations',
    questions: securityConsiderationsQuestions,
    questionCount: securityConsiderationsQuestions.length
  }
];

// Business Value & ROI Categories (shared between both paths)
const businessValueCategories: RAPIDSubcategory[] = [
  {
    id: 'business-value-roi',
    title: 'Business Value and ROI',
    questions: businessValueROIQuestions,
    questionCount: businessValueROIQuestions.length
  }
];

// Complete RAPID Questionnaire Structure for Exploratory Assessment
export const exploratoryRAPIDQuestionnaire: RAPIDQuestionnaireStructure = {
  version: '3.0',
  assessmentType: 'EXPLORATORY' as AssessmentType,
  totalQuestions: 110, // 48 + 25 + 27 + 10
  lastUpdated: new Date('2025-01-06'),
  categories: [
    {
      id: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
      title: 'Use Case Discovery',
      description: 'Business context, requirements, and success criteria',
      subcategories: exploratoryCategories,
      totalQuestions: 48,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.DATA_READINESS,
      title: 'Data Readiness Assessment',
      description: 'Data preparation, quality, and infrastructure readiness',
      subcategories: dataReadinessCategories,
      totalQuestions: 25,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
      title: 'Compliance & Integration',
      description: 'Regulatory compliance and enterprise integration requirements',
      subcategories: complianceIntegrationCategories,
      totalQuestions: 27,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
      title: 'Business Value & ROI',
      description: 'Business impact measurement and return on investment',
      subcategories: businessValueCategories,
      totalQuestions: 10,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    }
  ]
};

// Complete RAPID Questionnaire Structure for Migration Assessment
export const migrationRAPIDQuestionnaire: RAPIDQuestionnaireStructure = {
  version: '3.0',
  assessmentType: 'MIGRATION' as AssessmentType,
  totalQuestions: 162, // 48 + 52 + 25 + 27 + 10
  lastUpdated: new Date('2025-01-06'),
  categories: [
    {
      id: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
      title: 'Use Case Discovery',
      description: 'Business context, requirements, and success criteria',
      subcategories: exploratoryCategories,
      totalQuestions: 48,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.CURRENT_SYSTEM_ASSESSMENT,
      title: 'Current System Assessment',
      description: 'Existing system architecture, performance, and capabilities',
      subcategories: migrationCategories,
      totalQuestions: 52,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.DATA_READINESS,
      title: 'Data Readiness Assessment',
      description: 'Data preparation, quality, and infrastructure readiness',
      subcategories: dataReadinessCategories,
      totalQuestions: 25,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
      title: 'Compliance & Integration',
      description: 'Regulatory compliance and enterprise integration requirements',
      subcategories: complianceIntegrationCategories,
      totalQuestions: 27,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    },
    {
      id: RAPID_CATEGORIES.BUSINESS_VALUE_ROI,
      title: 'Business Value & ROI',
      description: 'Business impact measurement and return on investment',
      subcategories: businessValueCategories,
      totalQuestions: 10,
      completionPercentage: 0,
      status: 'not_started' as CompletionStatus
    }
  ]
};

// Export individual question arrays for testing and component usage
export {
  businessContextQuestions,
  evaluationMetricsQuestions,
  implementationConsiderationsQuestions,
  technicalRequirementsQuestions,
  useCasePrioritizationQuestions,
  aiDataPreparationQuestions,
  dataFormatPreprocessingQuestions,
  dataQualityGovernanceQuestions,
  dataVolumeStorageQuestions,
  enterpriseIntegrationQuestions,
  governanceRiskQuestions,
  legalLicensingQuestions,
  regulatoryComplianceQuestions,
  securityConsiderationsQuestions,
  businessValueROIQuestions,
  agentFunctionQuestions,
  llmModelInfoQuestions,
  modelOutputsSamplesQuestions,
  performanceSLAsQuestions,
  promptEngineeringQuestions,
  ragImplementationQuestions,
  securityGovernanceQuestions,
  usageMetricsQuestions
};

// Utility functions for accessing questionnaire data
export const getRAPIDQuestionnaire = (assessmentType: AssessmentType): RAPIDQuestionnaireStructure => {
  return assessmentType === 'EXPLORATORY' ? exploratoryRAPIDQuestionnaire : migrationRAPIDQuestionnaire;
};

export const getRAPIDQuestionsByCategory = (assessmentType: AssessmentType, categoryId: string): RAPIDQuestion[] => {
  const questionnaire = getRAPIDQuestionnaire(assessmentType);
  const category = questionnaire.categories.find(cat => cat.id === categoryId);
  if (!category) return [];
  
  return category.subcategories.flatMap(subcategory => subcategory.questions);
};

export const getRAPIDQuestionsBySubcategory = (assessmentType: AssessmentType, categoryId: string, subcategoryId: string): RAPIDQuestion[] => {
  const questionnaire = getRAPIDQuestionnaire(assessmentType);
  const category = questionnaire.categories.find(cat => cat.id === categoryId);
  if (!category) return [];
  
  const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
  return subcategory?.questions || [];
};

export const getAllRAPIDQuestions = (assessmentType: AssessmentType): RAPIDQuestion[] => {
  const questionnaire = getRAPIDQuestionnaire(assessmentType);
  return questionnaire.categories.flatMap(category => 
    category.subcategories.flatMap(subcategory => subcategory.questions)
  );
};

export const getRAPIDCategoryProgress = (assessmentType: AssessmentType, categoryId: string, responses: Record<string, any>): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const questions = getRAPIDQuestionsByCategory(assessmentType, categoryId);
  const completed = questions.filter(q => responses[q.id] !== undefined && responses[q.id] !== '').length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};