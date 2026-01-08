# Authentication Module - Structure

## File Organization

```
src/
├── contexts/
│   └── AuthContext.tsx              # Main authentication context provider
├── components/
│   ├── LoginPage.tsx                # Login form component
│   ├── RouteGuard.tsx               # Route protection component
│   └── AuthWrapper.tsx               # Auth provider wrapper component
├── lib/
│   ├── config.ts                    # Configuration management (ConfigManager)
│   ├── AuthProviderRegistry.ts      # Provider registry system
│   ├── validation.ts                # Validation utilities
│   ├── utils.ts                     # General utility functions
│   └── constants.ts                 # Application constants
├── hooks/
│   ├── useConditionalAuth.ts        # Conditional authentication logic
│   ├── useExternalAuth.ts           # External authentication integration
│   └── useLoginPage.ts              # Login page logic hook
├── interfaces/
│   └── AuthProvider.ts              # Authentication provider interfaces
└── providers/
    └── MockAuthProvider.ts          # Example mock authentication provider
```

## Component Hierarchy

```
AuthProvider (Context)
├── AuthWrapper
│   ├── RouteGuard
│   │   └── Protected Routes
│   └── LoginPage
│       └── Login Form
└── Application Components
```

## Core Components

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

**Purpose**: Provides authentication state and methods to the entire application

**Key Exports**:
- `AuthProvider` - Context provider component
- `useAuth` - Hook to access authentication context

**State Management**:
- `isAuthenticated` - Boolean indicating authentication status
- `user` - Current user object or null
- `loading` - Loading state for async operations
- `error` - Error message if any

**Methods**:
- `login(credentials)` - Authenticate user
- `logout()` - Terminate session
- `checkAuth()` - Validate current session

### 2. ConfigManager (`src/lib/config.ts`)

**Purpose**: Centralized configuration management

**Key Methods**:
- `getAuthConfig()` - Get complete auth configuration
- `isAuthEnabled()` - Check if authentication is enabled
- `getDefaultRoute()` - Get default route after login

**Configuration Sources**:
- Environment variables (`AUTH_ENABLED`, `SESSION_TIMEOUT`, etc.)
- Default values for missing configurations

### 3. AuthProviderRegistry (`src/lib/AuthProviderRegistry.ts`)

**Purpose**: Manages multiple authentication providers

**Key Features**:
- Provider registration and unregistration
- Priority-based provider execution
- Provider initialization and cleanup
- Hook system for lifecycle events

**Registry Methods**:
- `register(provider)` - Register a new provider
- `unregister(name)` - Remove a provider
- `authenticate(credentials)` - Try authentication with all providers
- `initialize()` - Initialize all registered providers

### 4. RouteGuard (`src/components/RouteGuard.tsx`)

**Purpose**: Protects routes based on authentication state

**Props**:
- `requireAuth` - Boolean indicating if route requires authentication
- `children` - Protected content

**Behavior**:
- Checks authentication state before rendering
- Redirects to login if not authenticated
- Stores return URL for post-login redirect
- Shows loading state during auth check

### 5. LoginPage (`src/components/LoginPage.tsx`)

**Purpose**: User login interface

**Features**:
- Username and password input fields
- Form validation
- Password visibility toggle
- Loading state during authentication
- Error message display

**Props**:
- `onLogin` - Login handler function
- `loading` - Loading state
- `error` - Error message

## Data Models

### User

```typescript
interface User {
  id: string
  username: string
  email: string
  roles: string[]
  lastLogin: Date
}
```

### Session

```typescript
interface Session {
  token: string
  userId: string
  expiresAt: Date
  createdAt: Date
}
```

### LoginCredentials

```typescript
interface LoginCredentials {
  username: string
  password: string
}
```

### AuthConfig

```typescript
interface AuthConfig {
  authEnabled: boolean
  sessionTimeout: number
  rememberSidebar: boolean
  defaultRoute: string
}
```

## Dependencies

### Internal Dependencies
- React Context API for state management
- Next.js routing for navigation
- TypeScript for type safety

### External Dependencies
- None (pure React/Next.js implementation)

### Environment Dependencies
- `AUTH_ENABLED` - Enable/disable authentication
- `SESSION_TIMEOUT` - Session expiration time
- `REMEMBER_SIDEBAR` - Sidebar state persistence
- `DEFAULT_ROUTE` - Default route after login

## Integration Points

### With Route Protection Module
- RouteGuard uses AuthContext for authentication checks

### With Sidebar Navigation Module
- Sidebar uses AuthContext for user actions display

### With Application Shell
- ApplicationShell wraps app with AuthProvider
