# API Reference

Complete API documentation for the Configurable Authentication Framework.

## Core APIs

### Components

- [**AuthWrapper**](./components/AuthWrapper.md) - Root authentication wrapper component
- [**AuthProvider**](./components/AuthProvider.md) - Authentication context provider
- [**ApplicationShell**](./components/ApplicationShell.md) - Main application layout with sidebar
- [**RouteGuard**](./components/RouteGuard.md) - Route protection component
- [**Sidebar**](./components/Sidebar.md) - Collapsible navigation sidebar
- [**LoginPage**](./components/LoginPage.md) - Authentication login form

### Hooks

- [**useAuth**](./hooks/useAuth.md) - Authentication context hook
- [**useConditionalAuth**](./hooks/useConditionalAuth.md) - Safe authentication hook for disabled auth
- [**useExternalAuth**](./hooks/useExternalAuth.md) - External authentication integration hook
- [**useAuthProviderRegistry**](./hooks/useAuthProviderRegistry.md) - Provider registry management hook
- [**useAuthHookRegistry**](./hooks/useAuthHookRegistry.md) - Hook registry management hook

### Contexts

- [**AuthContext**](./contexts/AuthContext.md) - Authentication state context
- [**AuthContextType**](./contexts/AuthContextType.md) - Authentication context type definition

### Interfaces

- [**IAuthProvider**](./interfaces/IAuthProvider.md) - Authentication provider interface
- [**IAuthProviderRegistry**](./interfaces/IAuthProviderRegistry.md) - Provider registry interface
- [**IAuthHook**](./interfaces/IAuthHook.md) - Authentication hook interface
- [**IAuthHookRegistry**](./interfaces/IAuthHookRegistry.md) - Hook registry interface
- [**IExternalAuthIntegration**](./interfaces/IExternalAuthIntegration.md) - External auth integration interface

### Types

- [**User**](./types/User.md) - User data type
- [**Session**](./types/Session.md) - Session data type
- [**AuthState**](./types/AuthState.md) - Authentication state type
- [**LoginCredentials**](./types/LoginCredentials.md) - Login credentials type
- [**AuthConfig**](./types/AuthConfig.md) - Authentication configuration type
- [**NavigationItem**](./types/NavigationItem.md) - Navigation item type

### Utilities

- [**ConfigManager**](./utils/ConfigManager.md) - Configuration management utility
- [**AuthProviderRegistry**](./utils/AuthProviderRegistry.md) - Provider registry implementation
- [**AuthHookRegistry**](./utils/AuthHookRegistry.md) - Hook registry implementation
- [**ExternalAuthIntegration**](./utils/ExternalAuthIntegration.md) - External auth integration utility
- [**Validation**](./utils/validation.md) - Validation utilities
- [**Utils**](./utils/utils.md) - General utility functions

### Middleware

- [**Authentication Middleware**](./middleware/auth-middleware.md) - Server-side authentication middleware

## Usage Patterns

### Basic Authentication Flow

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { login, isAuthenticated, loading } = useAuth();
  
  const handleLogin = async (credentials) => {
    const success = await login(credentials);
    if (success) {
      // Handle successful login
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (isAuthenticated) return <div>Welcome!</div>;
  
  return <LoginForm onSubmit={handleLogin} />;
}
```

### Route Protection

```tsx
import { RouteGuard } from '@/components/RouteGuard';

function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      <div>This content requires authentication</div>
    </RouteGuard>
  );
}
```

### External Provider Integration

```tsx
import { useAuthProviderRegistry } from '@/hooks/useExternalAuth';
import { MyCustomProvider } from './MyCustomProvider';

function setupCustomProvider() {
  const { registerProvider } = useAuthProviderRegistry();
  
  const customProvider = new MyCustomProvider({
    name: 'my-provider',
    enabled: true,
    priority: 10,
    settings: { apiUrl: 'https://api.example.com' }
  });
  
  registerProvider(customProvider);
}
```

## Type Definitions

All TypeScript type definitions are available in the [`@/types`](./types/) directory and are fully documented with JSDoc comments.

## Error Handling

The framework provides comprehensive error handling with specific error types:

- `AuthenticationError` - Authentication-related errors
- `SessionError` - Session management errors
- `ConfigurationError` - Configuration-related errors
- `ValidationError` - Input validation errors

## Testing Utilities

Testing utilities and helpers are documented in the [Testing API](./testing/) section.