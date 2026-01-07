# Module Documentation - RAPID AI Assessment Platform

## Overview

This guide provides comprehensive documentation for all modules in the RAPID AI Assessment Platform. Each module is designed to work independently while integrating seamlessly with other modules.

## Module Index

### Core Modules

1. **[Authentication Module](./authentication.md)** 🔐
   - Configurable authentication framework
   - Session management
   - Route protection
   - External provider integration

2. **[AI Assessment Module](./ai-assessment.md)** 📊
   - RAPID questionnaire integration
   - Category-based navigation
   - Response management
   - Report generation

3. **[Company Settings Module](./company-settings.md)** 🏢
   - Company management
   - CRUD operations
   - Assessment integration

### Supporting Modules

4. **[Environment Configuration](./environment-configuration.md)** ⚙️
   - Environment variable management
   - Configuration system

5. **[Route Protection](./route-protection.md)** 🛡️
   - Client and server-side protection
   - Route guards

6. **[Sidebar Navigation](./sidebar-navigation.md)** 📱
   - Collapsible sidebar
   - Navigation management

7. **[External Integration](./external-integration.md)** 🔌
   - External system integration
   - Provider system

## Quick Start

### Scenario 1: Full Platform Integration

**Use Case**: New project needs complete RAPID AI Assessment Platform

**Modules Required**:
- Authentication Module
- AI Assessment Module
- Company Settings Module
- All supporting modules

**Time Required**: 4-6 hours

**Steps**:
1. Set up Next.js project with TypeScript
2. Install dependencies
3. Configure MongoDB connection
4. Set up environment variables
5. Copy all module files
6. Configure authentication
7. Initialize RAPID questionnaires
8. Test complete workflow

---

### Scenario 2: AI Assessment Only

**Use Case**: Existing application needs AI assessment functionality

**Modules Required**:
- AI Assessment Module
- Company Settings Module (for company management)
- Authentication Module (if not already present)

**Time Required**: 3-5 hours

**Steps**:
1. Copy AI Assessment components
2. Copy Company Settings components
3. Set up API routes
4. Configure MongoDB
5. Initialize RAPID questionnaires
6. Integrate with existing authentication (if needed)

---

### Scenario 3: Company Management Only

**Use Case**: Need company management functionality

**Modules Required**:
- Company Settings Module
- Authentication Module (for user isolation)

**Time Required**: 2-3 hours

**Steps**:
1. Copy Company Settings components
2. Set up API routes
3. Configure MongoDB
4. Integrate with existing authentication

---

## Module Details

### 1. Authentication Module 🔐

**Documentation**: [authentication.md](./authentication.md)

**Purpose**: Provides configurable authentication framework with environment-based control

**Key Features**:
- Environment-based configuration
- Session management
- External provider support
- Route protection
- Non-interference when disabled

**Files**:
```
src/contexts/AuthContext.tsx
src/lib/config.ts
src/lib/AuthProviderRegistry.ts
src/components/AuthWrapper.tsx
src/components/RouteGuard.tsx
src/components/LoginPage.tsx
```

**Dependencies**: React, Next.js

**Integration**: Wrap app with `AuthProvider` or `AuthWrapper`

---

### 2. AI Assessment Module 📊

**Documentation**: [ai-assessment.md](./ai-assessment.md)

**Purpose**: Core assessment functionality with RAPID questionnaire integration

**Key Features**:
- RAPID questionnaire (162 questions)
- Category-based navigation
- Auto-save functionality
- Response review system
- Asynchronous report generation

**Files**:
```
src/components/ai-assessment/
src/app/ai-assessment/
src/lib/services/rapid-questionnaire-service.ts
src/lib/services/assessment-service.ts
```

**Dependencies**: 
- Authentication Module (for user isolation)
- Company Settings Module (for company selection)
- MongoDB (for data persistence)

**Integration**: 
1. Set up company management first
2. Initialize RAPID questionnaires
3. Integrate assessment components

---

### 3. Company Settings Module 🏢

**Documentation**: [company-settings.md](./company-settings.md)

**Purpose**: Company management and organization

**Key Features**:
- Company CRUD operations
- Search functionality
- Assessment count tracking
- Integration with AI Assessment module

**Files**:
```
src/components/company-settings/
src/app/company-settings/
src/lib/models/Company.ts
```

**Dependencies**:
- Authentication Module (for user isolation)
- MongoDB (for data persistence)

**Integration**: 
1. Set up authentication
2. Configure MongoDB
3. Copy company components and API routes

---

### 4. Environment Configuration ⚙️

**Documentation**: [environment-configuration.md](./environment-configuration.md)

**Purpose**: Centralized configuration management

**Key Features**:
- Environment variable parsing
- Type-safe configuration
- Default values
- Configuration caching

**Files**:
```
src/lib/config.ts
src/lib/constants.ts
```

**Dependencies**: None (core utility)

**Integration**: Import `ConfigManager` where needed

---

### 5. Route Protection 🛡️

**Documentation**: [route-protection.md](./route-protection.md)

**Purpose**: Client and server-side route protection

**Key Features**:
- Client-side route guards
- Server-side middleware
- Redirect handling
- Conditional protection

**Files**:
```
src/components/RouteGuard.tsx
src/middleware.ts
```

**Dependencies**: Authentication Module

**Integration**: Wrap protected routes with `RouteGuard`

---

### 6. Sidebar Navigation 📱

**Documentation**: [sidebar-navigation.md](./sidebar-navigation.md)

**Purpose**: Collapsible sidebar navigation

**Key Features**:
- Collapsible sidebar
- State persistence
- Responsive design
- Module navigation

**Files**:
```
src/components/Sidebar.tsx
src/components/SidebarContainer.tsx
src/components/ApplicationShell.tsx
```

**Dependencies**: Authentication Module (for user context)

**Integration**: Use `ApplicationShell` for main layout

---

### 7. External Integration 🔌

**Documentation**: [external-integration.md](./external-integration.md)

**Purpose**: External system integration

**Key Features**:
- Provider registry system
- Hook system
- External auth integration
- Non-interference design

**Files**:
```
src/lib/AuthProviderRegistry.ts
src/interfaces/AuthProvider.ts
src/hooks/useExternalAuth.ts
```

**Dependencies**: Authentication Module

**Integration**: Register custom providers and hooks

---

## Module Dependencies

```
Authentication Module (Core)
    ├── Environment Configuration
    └── Route Protection
            └── Sidebar Navigation

Company Settings Module
    ├── Authentication Module
    └── MongoDB

AI Assessment Module
    ├── Authentication Module
    ├── Company Settings Module
    ├── MongoDB
    └── External Integration (for reports)
```

## Integration Examples

### Example 1: Basic Setup

```typescript
// app/layout.tsx
import { AuthWrapper } from '@/components/AuthWrapper';
import { ApplicationShell } from '@/components/ApplicationShell';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthWrapper>
          <ApplicationShell>
            {children}
          </ApplicationShell>
        </AuthWrapper>
      </body>
    </html>
  );
}
```

### Example 2: AI Assessment Integration

```typescript
// app/ai-assessment/page.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { AssessmentContainer } from '@/components/ai-assessment/AssessmentContainer';

export default function AIAssessmentPage() {
  return (
    <RouteGuard>
      <AssessmentContainer />
    </RouteGuard>
  );
}
```

### Example 3: Company Settings Integration

```typescript
// app/company-settings/page.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { CompanyContainer } from '@/components/company-settings/CompanyContainer';

export default function CompanySettingsPage() {
  return (
    <RouteGuard>
      <CompanyContainer />
    </RouteGuard>
  );
}
```

## Testing

### Module Testing

Each module includes comprehensive tests:

- **Unit Tests**: Component and function-level
- **Integration Tests**: Module integration
- **Property-Based Tests**: Universal correctness properties

### Test Structure

```
src/__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── integration/      # Integration tests
├── properties/       # Property-based tests
└── unit/            # Unit tests
```

## Best Practices

### 1. Module Isolation

- Keep modules independent
- Use interfaces for communication
- Avoid direct dependencies when possible

### 2. Configuration

- Use environment variables
- Provide sensible defaults
- Document all configuration options

### 3. Error Handling

- Implement comprehensive error handling
- Provide user-friendly error messages
- Log errors for debugging

### 4. Type Safety

- Use TypeScript throughout
- Define clear interfaces
- Validate data at boundaries

### 5. Testing

- Test each module independently
- Test module integration
- Use property-based testing for correctness

## Troubleshooting

### Common Issues

#### Module Not Working

1. Check module dependencies are installed
2. Verify environment variables are set
3. Check module initialization
4. Review error logs

#### Integration Issues

1. Verify module dependencies
2. Check API compatibility
3. Review integration examples
4. Test module isolation

#### Performance Issues

1. Check database indexes
2. Review API query optimization
3. Monitor component re-renders
4. Check for memory leaks

## Related Documentation

- [Project Structure](../../document/project-structure.md)
- [API Documentation](../api/README.md)
- [Architecture Documentation](../architecture/README.md)
- [Technical Specifications](../technical-specifications.md)

## Support

For module-specific questions, refer to individual module documentation:

- [Authentication Module](./authentication.md)
- [AI Assessment Module](./ai-assessment.md)
- [Company Settings Module](./company-settings.md)
- [Environment Configuration](./environment-configuration.md)
- [Route Protection](./route-protection.md)
- [Sidebar Navigation](./sidebar-navigation.md)
- [External Integration](./external-integration.md)
