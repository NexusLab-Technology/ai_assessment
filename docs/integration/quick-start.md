# Quick Start Guide - Module Integration

## 🚀 5-Minute Setup

### Step 1: Choose Your Scenario

| I want to... | Scenario | Time | Difficulty |
|--------------|----------|------|------------|
| Add complete auth system to new app | [Full Integration](#full-integration) | 15 min | 🟢 Easy |
| Add auth logic to existing app | [Core Auth Only](#core-auth-only) | 10 min | 🟡 Medium |
| Integrate with my existing auth API | [Custom Provider](#custom-provider) | 20 min | 🟡 Medium |
| Just protect some routes | [Route Protection](#route-protection) | 5 min | 🟢 Easy |

---

## Full Integration

**Perfect for**: New applications, prototypes, complete auth system

### Files to Copy
```bash
# Copy these folders to your project
src/lib/
src/contexts/
src/types/
src/components/
src/hooks/
```

### Environment Setup
```bash
# .env.local
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
REMEMBER_SIDEBAR=true
DEFAULT_ROUTE=/dashboard
```

### Integration Code
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
        <h1>Welcome to your secure app!</h1>
        <p>You are now authenticated!</p>
      </ApplicationShell>
    </RouteGuard>
  );
}

// app/login/page.tsx
import { LoginPage } from '@/components/LoginPage';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginRoute() {
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

### Test It
1. Start your app: `npm run dev`
2. Visit `/` - should redirect to `/login`
3. Login with: `admin` / `password`
4. Should see authenticated homepage with sidebar

**✅ Done! You now have a complete authentication system.**

---

## Core Auth Only

**Perfect for**: Existing apps with custom UI, headless auth

### Files to Copy
```bash
src/lib/config.ts
src/contexts/AuthContext.tsx
src/lib/AuthProviderRegistry.ts
src/types/index.ts
src/lib/validation.ts
src/lib/utils.ts
src/lib/constants.ts
```

### Integration Code
```typescript
// Wrap your existing app
import { AuthProvider, useAuth } from './lib/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourExistingApp />
    </AuthProvider>
  );
}

// Add auth to your components
function YourExistingApp() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <YourCustomLoginForm onLogin={login} />;
  }
  
  return (
    <div>
      <YourExistingHeader>
        <span>Welcome, {user?.username}!</span>
        <button onClick={logout}>Logout</button>
      </YourExistingHeader>
      <YourExistingContent />
    </div>
  );
}

// Your custom login form
function YourCustomLoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onLogin(credentials);
    if (!success) {
      alert('Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials(prev => ({
          ...prev,
          username: e.target.value
        }))}
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({
          ...prev,
          password: e.target.value
        }))}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Test It
1. Try login with: `admin` / `password` or `user` / `password`
2. Check authentication state in your components
3. Test logout functionality

**✅ Done! You now have authentication logic in your existing app.**

---

## Custom Provider

**Perfect for**: Integrating with existing auth APIs, Firebase, Auth0, etc.

### Files to Copy
```bash
src/interfaces/AuthProvider.ts
src/lib/AuthProviderRegistry.ts
src/contexts/AuthContext.tsx
src/types/index.ts
```

### Create Your Provider
```typescript
// providers/MyAuthProvider.ts
import { IAuthProvider, AuthResult } from '../interfaces/AuthProvider';
import { LoginCredentials } from '../types';

export class MyAuthProvider implements IAuthProvider {
  name = 'my-auth-api';
  config = {
    enabled: true,
    priority: 1,
    timeout: 5000
  };

  async initialize(): Promise<void> {
    // Initialize your auth system
    console.log('Initializing MyAuthProvider');
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Replace with your API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          user: {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            roles: data.user.roles || ['user'],
            lastLogin: new Date()
          },
          token: data.token,
          session: {
            token: data.token,
            userId: data.user.id,
            expiresAt: new Date(data.expiresAt),
            createdAt: new Date()
          }
        };
      } else {
        return {
          success: false,
          error: data.message || 'Authentication failed'
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
    try {
      // Replace with your session validation endpoint
      const response = await fetch('/api/auth/validate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: 'Invalid session'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Session validation failed'
      };
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup resources if needed
    console.log('Cleaning up MyAuthProvider');
  }
}
```

### Register Your Provider
```typescript
// app/auth-setup.ts
import { authProviderRegistry } from './lib/AuthProviderRegistry';
import { MyAuthProvider } from './providers/MyAuthProvider';

// Register your custom provider
authProviderRegistry.register(new MyAuthProvider());
```

### Use It
```typescript
// app/layout.tsx
import { AuthProvider } from './contexts/AuthContext';
import './auth-setup'; // This registers your provider

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Test It
1. Make sure your API endpoints are working
2. Test login with your actual credentials
3. Check that session validation works

**✅ Done! You're now using your existing auth API.**

---

## Route Protection

**Perfect for**: Adding auth to specific pages, protecting admin areas

### Files to Copy
```bash
src/components/RouteGuard.tsx
src/contexts/AuthContext.tsx
src/lib/config.ts
src/types/index.ts
```

### Protect Individual Routes
```typescript
// pages/admin.tsx
import { RouteGuard } from '../components/RouteGuard';

export default function AdminPage() {
  return (
    <RouteGuard requireAuth={true}>
      <div>
        <h1>Admin Dashboard</h1>
        <p>This page requires authentication</p>
      </div>
    </RouteGuard>
  );
}

// pages/public.tsx
export default function PublicPage() {
  return (
    <div>
      <h1>Public Page</h1>
      <p>This page is accessible to everyone</p>
    </div>
  );
}
```

### Protect Route Groups
```typescript
// app/admin/layout.tsx
import { RouteGuard } from '../../components/RouteGuard';

export default function AdminLayout({ children }) {
  return (
    <RouteGuard requireAuth={true}>
      <div className="admin-layout">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </RouteGuard>
  );
}
```

### Higher-Order Component Pattern
```typescript
// utils/withAuth.tsx
import { RouteGuard } from '../components/RouteGuard';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteGuard requireAuth={true}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedSettings = withAuth(Settings);
```

### Test It
1. Visit protected routes - should redirect to login
2. Login and try again - should show content
3. Test public routes - should work without auth

**✅ Done! Your routes are now protected.**

---

## Common Patterns

### Pattern 1: Conditional Rendering
```typescript
import { useAuth } from './contexts/AuthContext';

function ConditionalComponent() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Welcome back, {user?.username}!</h1>
          <UserDashboard />
        </div>
      ) : (
        <div>
          <h1>Welcome, Guest!</h1>
          <PublicContent />
          <Link to="/login">Sign In</Link>
        </div>
      )}
    </div>
  );
}
```

### Pattern 2: Role-Based Access
```typescript
function RoleBasedComponent() {
  const { user } = useAuth();
  
  const isAdmin = user?.roles.includes('admin');
  const isModerator = user?.roles.includes('moderator');
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {isAdmin && (
        <AdminPanel />
      )}
      
      {(isAdmin || isModerator) && (
        <ModerationTools />
      )}
      
      <UserContent />
    </div>
  );
}
```

### Pattern 3: Loading States
```typescript
function LoadingAwareComponent() {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <AuthenticatedContent user={user} />;
}
```

## Troubleshooting

### Issue: "useAuth must be used within AuthProvider"
```typescript
// ❌ Wrong
function App() {
  const { isAuthenticated } = useAuth(); // Error!
  return <div>...</div>;
}

// ✅ Correct
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth(); // Works!
  return <div>...</div>;
}
```

### Issue: Environment variables not loading
```typescript
// Check if variables are loaded
console.log('AUTH_ENABLED:', process.env.AUTH_ENABLED);

// Use fallback values
const config = {
  authEnabled: process.env.AUTH_ENABLED !== 'false',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'),
  // ...
};
```

### Issue: Infinite redirect loops
```typescript
// Make sure login page doesn't require auth
function LoginPage() {
  return (
    <RouteGuard requireAuth={false}> {/* Important! */}
      <LoginForm />
    </RouteGuard>
  );
}
```

## Next Steps

1. **Test your integration thoroughly**
2. **Customize styling and behavior**
3. **Add error handling**
4. **Set up proper environment variables**
5. **Add logging and analytics**

For more advanced usage, see:
- [Architecture Guide](../architecture/README.md)
- [Module Usage Guide](../modules/README.md)
- [API Reference](../api/README.md)