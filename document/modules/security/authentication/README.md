# Authentication Module

## Overview

The Authentication Module provides a configurable authentication framework that can be enabled or disabled through environment configuration. It features a flexible provider registry system, session management, and seamless integration with Next.js App Router.

## Key Features

- 🔐 **Configurable Authentication** - Enable/disable via environment variables
- 🔌 **Provider Registry System** - Plugin-based architecture for custom auth providers
- 🛡️ **Session Management** - Secure session handling with expiration
- 🪝 **Hook System** - Extensible hook system for authentication lifecycle events
- 🔄 **External Integration** - Support for external authentication systems
- 📱 **Route Protection** - Client and server-side route protection

## Quick Start

### Basic Usage

```typescript
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/RouteGuard';

function App() {
  return (
    <AuthProvider>
      <RouteGuard requireAuth={true}>
        <YourApp />
      </RouteGuard>
    </AuthProvider>
  );
}
```

### Environment Configuration

```bash
# Enable/disable authentication
AUTH_ENABLED=true

# Session timeout in milliseconds (default: 3600000 = 1 hour)
SESSION_TIMEOUT=3600000

# Remember sidebar state (default: true)
REMEMBER_SIDEBAR=true

# Default route after login (default: /)
DEFAULT_ROUTE=/
```

## Module Structure

```
authentication/
├── contexts/
│   └── AuthContext.tsx          # Authentication context provider
├── components/
│   ├── LoginPage.tsx            # Login form component
│   ├── RouteGuard.tsx           # Route protection component
│   └── AuthWrapper.tsx          # Auth provider wrapper
├── lib/
│   ├── config.ts                # Configuration management
│   ├── AuthProviderRegistry.ts  # Provider registry system
│   ├── validation.ts            # Validation utilities
│   └── utils.ts                 # Utility functions
└── hooks/
    ├── useConditionalAuth.ts     # Conditional auth logic
    ├── useExternalAuth.ts        # External system integration
    └── useLoginPage.ts           # Login page logic
```

## Documentation Files

- [Requirements](./requirement.md) - Functional requirements and acceptance criteria
- [Structure](./structure.md) - File structure and component organization
- [Flow](./flow.md) - Data flow and authentication workflows
- [Features](./feature.md) - Detailed feature descriptions
- [Checklist](./checklist.md) - Implementation checklist

## Integration

This module is designed to be easily integrated into other applications. See [Modularity Analysis](../../modularity-analysis.md) for integration details.

## Related Modules

- [Route Protection Module](../route-protection/README.md) - Uses authentication for route protection (Security Group)
- [Sidebar Navigation Module](../../supporting/sidebar-navigation/README.md) - Integrates with authentication state
