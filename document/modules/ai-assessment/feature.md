# AI Assessment Module - Features

## Core Features

### 1. RAPID Questionnaire Integration
- 162 total questions
- 5 categories for Exploratory path
- 6 categories for Migration path
- Subcategory organization
- Original question numbering preservation

### 2. Category-Based Navigation
- Left sidebar with clickable categories
- Visual progress indicators
- Direct navigation to any category
- Subcategory support
- Active category highlighting

### 3. Fixed-Size Question Container
- Consistent UI dimensions
- Proper scrolling
- Responsive design
- No layout shifts
- Professional appearance

### 4. Auto-save Functionality
- Automatic save every 30 seconds
- Immediate save on navigation
- Resume capability
- Data persistence in MongoDB
- Error recovery

### 5. Response Review System
- Comprehensive review modal
- Question-by-question display
- Direct navigation to edit
- Completion validation
- Required field highlighting

### 6. Asynchronous Report Generation [Report Generation]
- External API Gateway integration
- Status tracking via MongoDB
- Polling mechanism
- Retry functionality
- Request history

### 7. Assessment Status UI [Assessment Status UI]
- Status-based icon display (edit/view)
- Read-only assessment viewer
- Session-based data organization
- Chronological session ordering
- Session metadata display

## Assessment Status UI Features

### Status Indicators
- Edit icon for incomplete assessments
- View icon for completed assessments
- Visual differentiation between statuses
- Consistent design integration

### Read-only Viewer
- Complete assessment data display
- Session-based organization
- Question-answer completeness
- Chronological ordering
- Metadata display (date, time, progress)

### Status-based Navigation
- Contextual action buttons
- Edit mode for incomplete assessments
- View mode for completed assessments
- Data preservation during navigation

## Report Generation Features

### Async Report Generation
- Non-blocking report creation
- External API Gateway communication
- Request ID tracking
- Status polling from MongoDB

### Status Tracking
- Real-time status updates
- PENDING/PROCESSING/COMPLETED/FAILED states
- Progress indicators
- Estimated completion time

### Error Handling
- Retry functionality for failed requests
- Error message display
- Request history maintenance
- Graceful degradation

## Advanced Features

### Company Integration
- Company selection interface
- Multi-company support
- Company-based assessment organization
- Seamless navigation to Company Settings

### Path Selection
- Exploratory path (5 categories)
- Migration path (6 categories)
- Path-specific question sets
- Dynamic category loading

### Progress Tracking
- Category completion percentages
- Visual progress indicators
- Clickable navigation
- Completion validation

### Data Management
- MongoDB persistence
- Proper indexing
- Company-based queries
- User-based queries
- Session tracking

## Integration Features

### External API Integration
- External API Gateway for report generation
- SQS queue integration (via External API)
- AWS Bedrock integration (via External API)
- Status tracking via MongoDB

### Company Settings Integration
- Redirect when no companies exist
- Company selection
- Assessment count display
- Seamless navigation

## Performance Features

### Optimization
- Lazy loading of questionnaire data
- Caching of assessment data
- Debounced auto-save
- Efficient status polling

### Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- Data recovery on errors
- User-friendly error messages
