# Module Usage Guide - Configurable Authentication Framework

## Overview
This guide explains how to use individual modules from the Configurable Authentication Framework in your own projects. Each module is designed to be independent and reusable.

## Quick Start

### 1. Identify Your Needs
Choose the integration scenario that best fits your project:

| Scenario | Use Case | Complexity | Time Required |
|----------|----------|------------|---------------|
| **Full Integration** | New project, need complete auth system | 🟢 Low | 2-4 hours |
| **Core Auth Only** | Existing UI, need auth logic | 🟡 Medium | 4-6 hours |
| **Custom Provider** | Integrate with existing auth system | 🟡 Medium | 3-5 hours |
| **Route Protection** | Add auth to existing routes | 🟢 Low | 1-2 hours |
| **UI Components** | Need auth UI components | 🟢 Low | 2-3 hours |

### 2. Copy Required Files
Based on your scenario, copy the appropriate files to your project.

### 3. Configure Environment
Set up environment variables for your needs.

### 4. Integrate and Test
Follow the integration examples below.

## Module Details

### Core Authentication Module 🔐

**What it provides:**
- Environment-based configuration management
- Authentication context and state management
- Session handling and validation
- Provider registry system
- Type definitions

**When to use:**
- You need authentication logic
- You want configurable auth behavior
- You need session management
- You want to support multiple auth providers

**Files to copy:**
```
src/lib/config.ts              # Configuration management
src/contexts/AuthContext.tsx   # Authentication context
src/lib/AuthProviderRegistry.ts # Provider system
src/types/index.ts             # Type definitions
src/lib/validation.ts          # Input validation
src/lib/utils.ts              # Utility functions
src/lib/constants.ts          # Constants and defaults
```

**Environment variables:**
```bash
# Optional - all have sensible defaults
AUTH_ENABLED=true              # Enable/disable authentication
SESSION_TIMEOUT=3600000        # Session timeout in milliseconds
REMEMBER_SIDEBAR=true          # Remember sidebar state
DEFAULT_ROUTE=/               # Default landing page
```

**Basic usage:**
```typescript
// 1. Wrap your app with AuthProvider
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

// 2. Use authentication in components
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login, isAuthenticated, user } = useAuth();
  
  const handleLogin = async (credentials) => {
    const success = await login(credentials);
    if (success) {
      console.log('Logged in as:', user?.username);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.username}!</p>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

**Advanced configuration:**
```typescript
// Custom configuration
import { ConfigManager } from './lib/config';

// Check if auth is enabled
if (ConfigManager.isAuthEnabled()) {
  // Auth-specific logic
}

// Get full configuration
const config = ConfigManager.getAuthConfig();
console.log('Session timeout:', config.sessionTimeout);
```

### UI Components Module 🎨

**What it provides:**
- Complete application layout with sidebar
- Route protection components
- Login page component
- Responsive navigation
- Authentication-aware UI

**When to use:**
- You want ready-made auth UI
- You need responsive layout
- You want sidebar navigation
- You need route protection UI

**Files to copy:**
```
src/components/ApplicationShell.tsx  # Main layout
src/components/Sidebar.tsx          # Navigation sidebar
src/components/RouteGuard.tsx       # Route protection
src/components/LoginPage.tsx        # Login form
src/components/AuthWrapper.tsx      # Auth provider wrapper
```

**Dependencies:**
- Core Authentication Module (required)
- TailwindCSS (for styling, can be replaced)

**Basic usage:**
```typescript
// 1. Use ApplicationShell for layout
import { ApplicationShell } from './components/ApplicationShell';

function MyApp() {
  const navigationItems = [
    { id: 'home', label: 'Home', icon: '🏠', href: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' }
  ];

  return (
    <ApplicationShell navigationItems={navigationItems}>
      <YourPageContent />
    </ApplicationShell>
  );
}

// 2. Protect routes
import { RouteGuard } from './components/RouteGuard';

function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      <SensitiveContent />
    </RouteGuard>
  );
}

// 3. Use login page
import { LoginPage } from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';

function LoginRoute() {
  const { login, loading, error } = useAuth();
  
  return (
    <LoginPage
      onLogin={login}
      loading={loading}
      error={error}
    />
  );
}
```

**Customization:**
```typescript
// Custom styling (replace TailwindCSS classes)
const customClasses = {
  sidebar: 'my-custom-sidebar-class',
  navigation: 'my-custom-nav-class',
  loginForm: 'my-custom-form-class'
};

// Custom navigation items
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <HomeIcon />, // Use your icon component
    href: '/',
    children: [
      { id: 'sub1', label: 'Sub Item', icon: <SubIcon />, href: '/sub1' }
    ]
  }
];
```

### Provider Integration Module 🔌

**What it provides:**
- Plugin architecture for auth providers
- Provider registry and management
- Hook system for auth events
- External system integration
- Priority-based provider selection

**When to use:**
- You have existing auth system
- You need multiple auth methods
- You want to integrate with external services
- You need custom authentication logic

**Files to copy:**
```
src/interfaces/AuthProvider.ts      # Provider interfaces
src/lib/AuthProviderRegistry.ts     # Registry system
src/providers/MockAuthProvider.ts   # Example provider
```

**Create custom provider:**
```typescript
// 1. Implement the interface
import { IAuthProvider, AuthResult } from './interfaces/AuthProvider';

class FirebaseAuthProvider implements IAuthProvider {
  name = 'firebase-auth';
  config = {
    enabled: true,
    priority: 1,
    timeout: 5000
  };

  async initialize(): Promise<void> {
    // Initialize Firebase
    await firebase.initializeApp(firebaseConfig);
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.username,
        credentials.password
      );
      
      const user = userCredential.user;
      
      return {
        success: true,
        user: {
          id: user.uid,
          username: user.email || '',
          email: user.email || '',
          roles: ['user'],
          lastLogin: new Date()
        },
        token: await user.getIdToken(),
        session: {
          token: await user.getIdToken(),
          userId: user.uid,
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateSession(token: string): Promise<AuthResult> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Return user data
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup Firebase resources
  }
}

// 2. Register the provider
import { authProviderRegistry } from './lib/AuthProviderRegistry';
authProviderRegistry.register(new FirebaseAuthProvider());
```

**Add authentication hooks:**
```typescript
// Custom hook for logging
import { IAuthHook } from './interfaces/AuthProvider';

class AuthLoggingHook implements IAuthHook {
  name = 'auth-logging';

  async afterAuthenticate(user: User, session: Session): Promise<void> {
    console.log(`User ${user.username} logged in at ${new Date()}`);
    
    // Send to analytics
    analytics.track('user_login', {
      userId: user.id,
      username: user.username,
      timestamp: new Date()
    });
  }

  async afterLogout(userId: string): Promise<void> {
    console.log(`User ${userId} logged out at ${new Date()}`);
    
    // Send to analytics
    analytics.track('user_logout', {
      userId,
      timestamp: new Date()
    });
  }
}

// Register the hook
import { authHookRegistry } from './lib/AuthProviderRegistry';
authHookRegistry.registerHook(new AuthLoggingHook());
```

### Hooks Module 🪝

**What it provides:**
- Reusable authentication logic
- Conditional authentication hooks
- External system integration hooks
- Login page state management

**When to use:**
- You need custom authentication logic
- You want reusable auth state
- You need conditional auth behavior
- You're building custom components

**Files to copy:**
```
src/hooks/useConditionalAuth.ts  # Conditional auth logic
src/hooks/useExternalAuth.ts     # External integration
src/hooks/useLoginPage.ts        # Login page state
```

**Usage examples:**
```typescript
// 1. Conditional authentication
import { useConditionalAuth } from './hooks/useConditionalAuth';

function ConditionalComponent() {
  const auth = useConditionalAuth();
  
  // auth is null if authentication is disabled
  if (!auth) {
    return <PublicContent />;
  }
  
  // auth is available if authentication is enabled
  if (auth.isAuthenticated) {
    return <AuthenticatedContent user={auth.user} />;
  }
  
  return <LoginPrompt />;
}

// 2. External auth integration
import { useExternalAuth } from './hooks/useExternalAuth';

function ExternalAuthComponent() {
  const { 
    isExternalAuthAvailable,
    externalAuthStatus,
    syncWithExternal 
  } = useExternalAuth();
  
  useEffect(() => {
    if (isExternalAuthAvailable) {
      syncWithExternal();
    }
  }, [isExternalAuthAvailable, syncWithExternal]);
  
  return (
    <div>
      {isExternalAuthAvailable && (
        <p>External auth system detected</p>
      )}
    </div>
  );
}

// 3. Login page state
import { useLoginPage } from './hooks/useLoginPage';

function CustomLoginPage() {
  const {
    credentials,
    setCredentials,
    loading,
    error,
    handleSubmit,
    handleInputChange
  } = useLoginPage();
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        value={credentials.username}
        onChange={handleInputChange}
        placeholder="Username"
      />
      <input
        type="password"
        name="password"
        value={credentials.password}
        onChange={handleInputChange}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

## Integration Examples

### Example 1: E-commerce Site
```typescript
// Add authentication to existing e-commerce site
import { AuthProvider, useAuth } from './lib/contexts/AuthContext';
import { RouteGuard } from './components/RouteGuard';

function EcommerceApp() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route 
          path="/account" 
          element={
            <RouteGuard requireAuth={true}>
              <AccountPage />
            </RouteGuard>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <RouteGuard requireAuth={true}>
              <OrdersPage />
            </RouteGuard>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <header>
      <Logo />
      <Navigation />
      {isAuthenticated ? (
        <div>
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
```

### Example 2: Admin Dashboard
```typescript
// Full integration for admin dashboard
import { ApplicationShell } from './components/ApplicationShell';
import { RouteGuard } from './components/RouteGuard';

function AdminDashboard() {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
    { id: 'users', label: 'Users', icon: '👥', href: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' }
  ];

  return (
    <RouteGuard requireAuth={true}>
      <ApplicationShell navigationItems={navigationItems}>
        <Routes>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Routes>
      </ApplicationShell>
    </RouteGuard>
  );
}
```

### Example 3: Multi-tenant SaaS
```typescript
// Custom provider for multi-tenant authentication
class TenantAuthProvider implements IAuthProvider {
  name = 'tenant-auth';
  config = { enabled: true, priority: 1, timeout: 5000 };

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    // Extract tenant from username (e.g., user@tenant.com)
    const [username, tenant] = credentials.username.split('@');
    
    const response = await fetch(`/api/auth/${tenant}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: credentials.password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        user: {
          ...data.user,
          tenant: tenant
        },
        token: data.token,
        session: data.session
      };
    }
    
    return { success: false, error: data.message };
  }
  
  // ... other methods
}

// Register tenant-specific provider
authProviderRegistry.register(new TenantAuthProvider());
```

## Migration Guide

### From Existing Auth System

1. **Assess current system:**
   ```typescript
   // Document your current auth flow
   const currentAuthFlow = {
     login: 'POST /api/login',
     logout: 'POST /api/logout',
     session: 'GET /api/session',
     storage: 'localStorage + cookies'
   };
   ```

2. **Create migration provider:**
   ```typescript
   class MigrationAuthProvider implements IAuthProvider {
     // Implement using your existing API endpoints
   }
   ```

3. **Gradual migration:**
   ```typescript
   // Phase 1: Add new auth alongside existing
   // Phase 2: Migrate components one by one
   // Phase 3: Remove old auth system
   ```

### From No Auth System

1. **Start with core module:**
   ```typescript
   // Copy core authentication files
   // Set up basic configuration
   // Add AuthProvider to app root
   ```

2. **Add UI components:**
   ```typescript
   // Add login page
   // Add route protection
   // Add navigation
   ```

3. **Enhance with providers:**
   ```typescript
   // Add custom providers as needed
   // Add hooks for analytics/logging
   // Add external integrations
   ```

## Troubleshooting

### Common Issues

1. **"useAuth must be used within AuthProvider"**
   ```typescript
   // Solution: Wrap your app with AuthProvider
   <AuthProvider>
     <App />
   </AuthProvider>
   ```

2. **Configuration not loading**
   ```typescript
   // Solution: Check environment variables
   console.log('AUTH_ENABLED:', process.env.AUTH_ENABLED);
   
   // Or use fallback configuration
   const config = ConfigManager.getAuthConfig() || defaultConfig;
   ```

3. **Provider not working**
   ```typescript
   // Solution: Check provider registration
   console.log('Registered providers:', authProviderRegistry.getAllProviders());
   
   // Ensure provider is initialized
   await authProviderRegistry.initialize();
   ```

4. **Styling issues**
   ```typescript
   // Solution: Replace TailwindCSS classes
   const customStyles = {
     button: 'btn btn-primary', // Your CSS classes
     form: 'form-container',
     sidebar: 'nav-sidebar'
   };
   ```

### Debug Mode

Enable debug logging:
```typescript
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging
  localStorage.setItem('auth_debug', 'true');
}
```

## Performance Tips

1. **Lazy load providers:**
   ```typescript
   const loadProvider = async (name: string) => {
     const module = await import(`./providers/${name}Provider`);
     return module.default;
   };
   ```

2. **Memoize expensive operations:**
   ```typescript
   const config = useMemo(() => ConfigManager.getAuthConfig(), []);
   ```

3. **Optimize re-renders:**
   ```typescript
   const authValue = useMemo(() => ({
     isAuthenticated,
     user,
     login,
     logout
   }), [isAuthenticated, user, login, logout]);
   ```

## Next Steps

1. **Choose your integration scenario**
2. **Copy the required files**
3. **Set up environment variables**
4. **Follow the integration examples**
5. **Test thoroughly**
6. **Customize as needed**

For more detailed examples and advanced usage, see the [Architecture Guide](../architecture/README.md).