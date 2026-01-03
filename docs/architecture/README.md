# Architecture Overview - Configurable Authentication Framework

## Table of Contents
- [System Architecture](#system-architecture)
- [Module Structure](#module-structure)
- [Design Patterns](#design-patterns)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js Pages  │  React Components  │  Custom Hooks      │
├─────────────────────────────────────────────────────────────┤
│                    Framework Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Auth Context   │  Route Guards     │  UI Components      │
├─────────────────────────────────────────────────────────────┤
│                     Core Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Config Manager │  Provider Registry │  Validation        │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Environment    │  Local Storage    │  External APIs      │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Interface Segregation**: Clients depend only on interfaces they use
4. **Plugin Architecture**: Extensible through provider registration
5. **Configuration-Driven**: Behavior controlled by environment variables

## Module Structure

### 1. Core Authentication Module 🔐

**Purpose**: Provides core authentication functionality
**Location**: `src/lib/`, `src/contexts/`, `src/types/`

```typescript
// Core interfaces
interface AuthConfig {
  authEnabled: boolean;
  sessionTimeout: number;
  rememberSidebar: boolean;
  defaultRoute: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  lastLogin: Date;
}
```

**Key Components**:
- `ConfigManager`: Environment-based configuration
- `AuthContext`: React context for authentication state
- `AuthProviderRegistry`: Plugin system for auth providers
- Type definitions and validation utilities

### 2. UI Framework Module 🎨

**Purpose**: Reusable UI components for authentication
**Location**: `src/components/`

```typescript
// Component interfaces
interface ApplicationShellProps {
  children: React.ReactNode;
  navigationItems?: NavigationItem[];
  showSidebar?: boolean;
  className?: string;
}

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}
```

**Key Components**:
- `ApplicationShell`: Main layout with sidebar
- `RouteGuard`: Route protection component
- `Sidebar`: Collapsible navigation
- `LoginPage`: Authentication form

### 3. Provider Integration Module 🔌

**Purpose**: Extensible authentication provider system
**Location**: `src/interfaces/`, `src/providers/`

```typescript
// Provider interface
interface IAuthProvider {
  name: string;
  config: AuthProviderConfig;
  initialize(): Promise<void>;
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;
  validateSession(token: string): Promise<AuthResult>;
  cleanup(): Promise<void>;
}
```

**Key Features**:
- Plugin architecture
- Priority-based provider selection
- Hook system for lifecycle events
- External system integration

### 4. Hooks Module 🪝

**Purpose**: Reusable React hooks for authentication logic
**Location**: `src/hooks/`

```typescript
// Hook examples
const useConditionalAuth = () => AuthContextType | null;
const useExternalAuth = () => ExternalAuthState;
const useLoginPage = () => LoginPageState;
```

## Design Patterns

### 1. Registry Pattern
Used for managing authentication providers:

```typescript
class AuthProviderRegistry {
  private providers: Map<string, IAuthProvider> = new Map();
  
  register(provider: IAuthProvider): void;
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;
}
```

### 2. Strategy Pattern
Different authentication strategies through providers:

```typescript
// OAuth Provider
class OAuthProvider implements IAuthProvider {
  async authenticate(credentials) {
    // OAuth implementation
  }
}

// LDAP Provider  
class LDAPProvider implements IAuthProvider {
  async authenticate(credentials) {
    // LDAP implementation
  }
}
```

### 3. Observer Pattern
Hook system for authentication events:

```typescript
interface IAuthHook {
  beforeAuthenticate?(credentials: LoginCredentials): Promise<LoginCredentials | null>;
  afterAuthenticate?(user: User, session: Session): Promise<void>;
  beforeLogout?(user: User, session: Session): Promise<void>;
  afterLogout?(userId: string): Promise<void>;
}
```

### 4. Factory Pattern
Configuration factory based on environment:

```typescript
class ConfigManager {
  static getAuthConfig(): AuthConfig {
    return {
      authEnabled: this.parseAuthEnabled(),
      sessionTimeout: this.parseSessionTimeout(),
      rememberSidebar: this.parseRememberSidebar(),
      defaultRoute: this.parseDefaultRoute(),
    };
  }
}
```

### 5. Higher-Order Component Pattern
Route protection and layout wrapping:

```typescript
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true
) {
  return (props: P) => (
    <RouteGuard requireAuth={requireAuth}>
      <Component {...props} />
    </RouteGuard>
  );
}
```

## Integration Guide

### Scenario 1: Full Framework Integration

**Use Case**: New application needs complete authentication system

**Steps**:
1. Copy all core modules
2. Set up environment variables
3. Wrap application with AuthProvider
4. Use ApplicationShell for layout

**Files to Copy**:
```
src/lib/
src/contexts/
src/types/
src/interfaces/
src/components/
src/hooks/
```

**Integration Code**:
```typescript
// app/layout.tsx
import { AuthWrapper } from '@/components/AuthWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}

// app/page.tsx
import { ApplicationShell } from '@/components/ApplicationShell';
import { RouteGuard } from '@/components/RouteGuard';

export default function HomePage() {
  return (
    <RouteGuard requireAuth={true}>
      <ApplicationShell>
        <h1>Welcome to your app!</h1>
      </ApplicationShell>
    </RouteGuard>
  );
}
```

### Scenario 2: Core Authentication Only

**Use Case**: Existing application needs authentication logic only

**Steps**:
1. Copy core authentication module
2. Implement custom UI components
3. Use authentication context

**Files to Copy**:
```
src/lib/config.ts
src/contexts/AuthContext.tsx
src/lib/AuthProviderRegistry.ts
src/types/index.ts
src/lib/validation.ts
src/lib/utils.ts
src/lib/constants.ts
```

**Integration Code**:
```typescript
// Your existing app
import { AuthProvider, useAuth } from './lib/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourExistingLayout>
        <AuthenticatedContent />
      </YourExistingLayout>
    </AuthProvider>
  );
}

function AuthenticatedContent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <YourCustomLoginForm onLogin={login} />;
  }
  
  return (
    <div>
      <p>Welcome, {user?.username}!</p>
      <button onClick={logout}>Logout</button>
      <YourAppContent />
    </div>
  );
}
```

### Scenario 3: Custom Provider Integration

**Use Case**: Integrate with existing authentication system

**Steps**:
1. Copy provider interfaces and registry
2. Implement custom provider
3. Register provider

**Files to Copy**:
```
src/interfaces/AuthProvider.ts
src/lib/AuthProviderRegistry.ts
src/types/index.ts
```

**Integration Code**:
```typescript
// Custom provider implementation
import { IAuthProvider, AuthResult } from './interfaces/AuthProvider';

class MyCustomAuthProvider implements IAuthProvider {
  name = 'my-custom-auth';
  config = {
    enabled: true,
    priority: 1,
    timeout: 5000
  };

  async initialize(): Promise<void> {
    // Initialize your auth system
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Your authentication logic
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          user: data.user,
          token: data.token,
          session: data.session
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async validateSession(token: string): Promise<AuthResult> {
    // Your session validation logic
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Register the provider
import { authProviderRegistry } from './lib/AuthProviderRegistry';
authProviderRegistry.register(new MyCustomAuthProvider());
```

### Scenario 4: Route Protection Only

**Use Case**: Add route protection to existing application

**Files to Copy**:
```
src/components/RouteGuard.tsx
src/contexts/AuthContext.tsx
src/lib/config.ts
src/types/index.ts
```

**Integration Code**:
```typescript
// Protect specific routes
import { RouteGuard } from './components/RouteGuard';

function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      <YourPageContent />
    </RouteGuard>
  );
}

// Protect entire app sections
function AdminSection() {
  return (
    <RouteGuard requireAuth={true}>
      <AdminDashboard />
    </RouteGuard>
  );
}
```

## Best Practices

### 1. Environment Configuration
Always use environment variables for configuration:

```bash
# .env.local
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
REMEMBER_SIDEBAR=true
DEFAULT_ROUTE=/dashboard
```

### 2. Error Handling
Implement proper error boundaries:

```typescript
try {
  const config = ConfigManager.getAuthConfig();
} catch (error) {
  console.error('Config error:', error);
  // Use fallback configuration
  const config = {
    authEnabled: true,
    sessionTimeout: 3600000,
    rememberSidebar: true,
    defaultRoute: '/'
  };
}
```

### 3. Type Safety
Always use TypeScript interfaces:

```typescript
// Good: Type-safe configuration
const config: AuthConfig = ConfigManager.getAuthConfig();

// Good: Type-safe authentication
const result: AuthResult = await provider.authenticate(credentials);
```

### 4. Testing
Test each module independently:

```typescript
// Unit test for ConfigManager
describe('ConfigManager', () => {
  it('should parse auth enabled correctly', () => {
    process.env.AUTH_ENABLED = 'false';
    expect(ConfigManager.isAuthEnabled()).toBe(false);
  });
});

// Integration test for AuthContext
describe('AuthContext', () => {
  it('should authenticate user successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });
    
    const success = await result.current.login({
      username: 'test',
      password: 'password'
    });
    
    expect(success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 5. Performance
Optimize for performance:

```typescript
// Lazy load authentication providers
const loadProvider = async (providerName: string) => {
  const provider = await import(`./providers/${providerName}Provider`);
  return provider.default;
};

// Memoize expensive operations
const memoizedConfig = useMemo(() => {
  return ConfigManager.getAuthConfig();
}, []);
```

### 6. Security
Follow security best practices:

```typescript
// Secure session storage
const saveSession = (user: User, token: string) => {
  // Use httpOnly cookies for sensitive data
  document.cookie = `auth_token=${token}; HttpOnly; Secure; SameSite=Strict`;
  
  // Store non-sensitive data in localStorage
  localStorage.setItem('user_preferences', JSON.stringify({
    theme: user.theme,
    language: user.language
  }));
};

// Validate all inputs
const validateCredentials = (credentials: LoginCredentials) => {
  if (!credentials.username || credentials.username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  
  if (!credentials.password || credentials.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
};
```

## Conclusion

This modular architecture provides:

- **Flexibility**: Use only the modules you need
- **Extensibility**: Add custom providers and hooks
- **Maintainability**: Clear separation of concerns
- **Testability**: Each module can be tested independently
- **Reusability**: Modules can be used across different projects

The framework is designed to grow with your application while maintaining clean architecture principles.