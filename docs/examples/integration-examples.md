# Real-World Integration Examples

## Overview
This document provides complete, real-world examples of integrating the Configurable Authentication Framework into different types of applications.

## Example 1: E-commerce Website

### Scenario
Adding authentication to an existing e-commerce site built with Next.js. Need to protect user accounts, order history, and checkout process.

### Requirements
- Public product browsing (no auth required)
- User accounts for order tracking
- Protected checkout process
- Admin panel for store management
- Integration with existing user database

### Implementation

#### 1. Custom Provider for Existing Database
```typescript
// providers/EcommerceAuthProvider.ts
import { IAuthProvider, AuthResult } from '../interfaces/AuthProvider';
import { LoginCredentials, User } from '../types';

export class EcommerceAuthProvider implements IAuthProvider {
  name = 'ecommerce-auth';
  config = {
    enabled: true,
    priority: 1,
    timeout: 5000
  };

  async initialize(): Promise<void> {
    // Initialize database connection
    console.log('Initializing e-commerce auth provider');
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Call existing user API
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.username, // Use email as username
          password: credentials.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          user: {
            id: data.user.id,
            username: data.user.email,
            email: data.user.email,
            roles: data.user.isAdmin ? ['admin', 'user'] : ['user'],
            lastLogin: new Date(data.user.lastLogin)
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
          error: data.message || 'Invalid email or password'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async validateSession(token: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/users/validate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          user: {
            id: data.user.id,
            username: data.user.email,
            email: data.user.email,
            roles: data.user.isAdmin ? ['admin', 'user'] : ['user'],
            lastLogin: new Date(data.user.lastLogin)
          }
        };
      } else {
        return { success: false, error: 'Session expired' };
      }
    } catch (error) {
      return { success: false, error: 'Session validation failed' };
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

#### 2. App Structure
```typescript
// app/layout.tsx
import { AuthWrapper } from '@/components/AuthWrapper';
import { EcommerceAuthProvider } from '@/providers/EcommerceAuthProvider';
import { authProviderRegistry } from '@/lib/AuthProviderRegistry';

// Register custom provider
authProviderRegistry.register(new EcommerceAuthProvider());

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthWrapper>
          <Header />
          {children}
          <Footer />
        </AuthWrapper>
      </body>
    </html>
  );
}

// components/Header.tsx
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            MyStore
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link href="/products">Products</Link>
            <Link href="/cart">Cart</Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/account">My Account</Link>
                <span>Welcome, {user?.username}</span>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="btn-primary">
                  Login
                </Link>
                <Link href="/register" className="btn-secondary">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
```

#### 3. Protected Routes
```typescript
// app/account/page.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountPage() {
  return (
    <RouteGuard requireAuth={true}>
      <AccountDashboard />
    </RouteGuard>
  );
}

function AccountDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Member since:</strong> {user?.lastLogin?.toLocaleDateString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Orders</h2>
          <Link href="/account/orders" className="text-blue-600 hover:underline">
            View Order History
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <Link href="/account/settings" className="text-blue-600 hover:underline">
            Account Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

// app/checkout/page.tsx
import { RouteGuard } from '@/components/RouteGuard';

export default function CheckoutPage() {
  return (
    <RouteGuard requireAuth={true}>
      <CheckoutForm />
    </RouteGuard>
  );
}

function CheckoutForm() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
        <p className="mb-4">Logged in as: {user?.email}</p>
        
        {/* Checkout form */}
        <form>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" className="form-input" />
            <input type="text" placeholder="Last Name" className="form-input" />
          </div>
          <input type="text" placeholder="Address" className="form-input mt-4" />
          <button type="submit" className="btn-primary mt-6 w-full">
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### 4. Admin Panel
```typescript
// app/admin/layout.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }) {
  return (
    <RouteGuard requireAuth={true}>
      <AdminAccessControl>
        <div className="flex h-screen bg-gray-100">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </AdminAccessControl>
    </RouteGuard>
  );
}

function AdminAccessControl({ children }) {
  const { user } = useAuth();
  
  const isAdmin = user?.roles.includes('admin');
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }
  
  return children;
}

function AdminSidebar() {
  return (
    <div className="w-64 bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="mt-6">
        <Link href="/admin" className="block px-6 py-2 hover:bg-gray-50">
          Dashboard
        </Link>
        <Link href="/admin/products" className="block px-6 py-2 hover:bg-gray-50">
          Products
        </Link>
        <Link href="/admin/orders" className="block px-6 py-2 hover:bg-gray-50">
          Orders
        </Link>
        <Link href="/admin/users" className="block px-6 py-2 hover:bg-gray-50">
          Users
        </Link>
      </nav>
    </div>
  );
}
```

---

## Example 2: SaaS Dashboard

### Scenario
Multi-tenant SaaS application with team-based access control, subscription management, and role-based permissions.

### Requirements
- Multi-tenant authentication
- Team/organization management
- Role-based access control
- Subscription-based features
- SSO integration

### Implementation

#### 1. Multi-tenant Auth Provider
```typescript
// providers/SaaSAuthProvider.ts
export class SaaSAuthProvider implements IAuthProvider {
  name = 'saas-auth';
  config = { enabled: true, priority: 1, timeout: 5000 };

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Extract organization from email domain or subdomain
      const orgSlug = this.extractOrganization(credentials.username);
      
      const response = await fetch(`/api/auth/${orgSlug}/login`, {
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
            username: data.user.email,
            email: data.user.email,
            roles: data.user.roles,
            lastLogin: new Date(),
            // Add SaaS-specific properties
            organizationId: data.user.organizationId,
            organizationSlug: orgSlug,
            subscription: data.user.subscription,
            permissions: data.user.permissions
          },
          token: data.token,
          session: {
            token: data.token,
            userId: data.user.id,
            expiresAt: new Date(data.expiresAt),
            createdAt: new Date(),
            organizationId: data.user.organizationId
          }
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  private extractOrganization(email: string): string {
    // Extract from subdomain or email domain
    if (typeof window !== 'undefined') {
      const subdomain = window.location.hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'app') {
        return subdomain;
      }
    }
    
    // Fallback to email domain
    const domain = email.split('@')[1];
    return domain.replace('.', '-');
  }

  // ... other methods
}
```

#### 2. Permission System
```typescript
// hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };
  
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };
  
  const canAccessFeature = (feature: string): boolean => {
    const subscription = user?.subscription;
    
    // Check subscription limits
    const featureAccess = {
      'advanced-analytics': ['pro', 'enterprise'],
      'team-management': ['team', 'pro', 'enterprise'],
      'api-access': ['pro', 'enterprise'],
      'white-label': ['enterprise']
    };
    
    return featureAccess[feature]?.includes(subscription?.plan) || false;
  };
  
  return {
    hasPermission,
    hasRole,
    canAccessFeature,
    isAdmin: hasRole('admin'),
    isOwner: hasRole('owner'),
    isMember: hasRole('member'),
    subscription: user?.subscription
  };
}

// components/PermissionGate.tsx
interface PermissionGateProps {
  permission?: string;
  role?: string;
  feature?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ 
  permission, 
  role, 
  feature, 
  fallback, 
  children 
}: PermissionGateProps) {
  const { hasPermission, hasRole, canAccessFeature } = usePermissions();
  
  let hasAccess = true;
  
  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }
  
  if (role && !hasRole(role)) {
    hasAccess = false;
  }
  
  if (feature && !canAccessFeature(feature)) {
    hasAccess = false;
  }
  
  if (!hasAccess) {
    return fallback || (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          You don't have permission to access this feature.
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

#### 3. Dashboard Layout
```typescript
// app/dashboard/layout.tsx
import { ApplicationShell } from '@/components/ApplicationShell';
import { RouteGuard } from '@/components/RouteGuard';
import { usePermissions } from '@/hooks/usePermissions';

export default function DashboardLayout({ children }) {
  return (
    <RouteGuard requireAuth={true}>
      <DashboardShell>
        {children}
      </DashboardShell>
    </RouteGuard>
  );
}

function DashboardShell({ children }) {
  const { hasPermission, canAccessFeature } = usePermissions();
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { id: 'projects', label: 'Projects', icon: '📁', href: '/dashboard/projects' },
    
    // Conditional navigation based on permissions
    ...(hasPermission('manage-team') ? [
      { id: 'team', label: 'Team', icon: '👥', href: '/dashboard/team' }
    ] : []),
    
    ...(canAccessFeature('advanced-analytics') ? [
      { id: 'analytics', label: 'Analytics', icon: '📈', href: '/dashboard/analytics' }
    ] : []),
    
    ...(hasPermission('admin') ? [
      { id: 'settings', label: 'Settings', icon: '⚙️', href: '/dashboard/settings' }
    ] : [])
  ];

  return (
    <ApplicationShell navigationItems={navigationItems}>
      {children}
    </ApplicationShell>
  );
}
```

#### 4. Feature-Gated Components
```typescript
// app/dashboard/analytics/page.tsx
import { PermissionGate } from '@/components/PermissionGate';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      
      <PermissionGate 
        feature="advanced-analytics"
        fallback={<UpgradePrompt feature="Advanced Analytics" />}
      >
        <AdvancedAnalyticsDashboard />
      </PermissionGate>
    </div>
  );
}

function AdvancedAnalyticsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500">Chart Placeholder</span>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500">Chart Placeholder</span>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Conversion Rates</h3>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500">Chart Placeholder</span>
        </div>
      </div>
    </div>
  );
}

function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Unlock {feature}
        </h2>
        <p className="text-gray-600 mb-4">
          Upgrade to Pro or Enterprise to access advanced analytics and insights.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
```

---

## Example 3: Content Management System

### Scenario
Multi-user CMS with content approval workflows, role-based editing permissions, and draft/publish states.

### Requirements
- Multiple user roles (Editor, Author, Reviewer, Admin)
- Content approval workflow
- Draft and published content states
- Audit logging
- Bulk operations

### Implementation

#### 1. CMS Auth Provider with Audit Logging
```typescript
// providers/CMSAuthProvider.ts
export class CMSAuthProvider implements IAuthProvider {
  name = 'cms-auth';
  config = { enabled: true, priority: 1, timeout: 5000 };

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch('/api/cms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        // Log authentication event
        await this.logAuditEvent('user_login', {
          userId: data.user.id,
          username: data.user.username,
          timestamp: new Date(),
          ipAddress: this.getClientIP()
        });

        return {
          success: true,
          user: {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            roles: data.user.roles,
            lastLogin: new Date(),
            // CMS-specific properties
            department: data.user.department,
            permissions: data.user.permissions,
            contentAccess: data.user.contentAccess
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
        // Log failed login attempt
        await this.logAuditEvent('login_failed', {
          username: credentials.username,
          timestamp: new Date(),
          ipAddress: this.getClientIP(),
          reason: data.message
        });

        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  private async logAuditEvent(event: string, data: any): Promise<void> {
    try {
      await fetch('/api/cms/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  private getClientIP(): string {
    // Implementation to get client IP
    return 'unknown';
  }

  // ... other methods
}
```

#### 2. Content Permission System
```typescript
// hooks/useContentPermissions.ts
import { useAuth } from '@/contexts/AuthContext';

export function useContentPermissions() {
  const { user } = useAuth();
  
  const canCreateContent = (contentType: string): boolean => {
    const permissions = user?.permissions || [];
    return permissions.includes(`create:${contentType}`) || 
           permissions.includes('create:all');
  };
  
  const canEditContent = (content: any): boolean => {
    const permissions = user?.permissions || [];
    
    // Admin can edit everything
    if (permissions.includes('edit:all')) return true;
    
    // Author can edit their own content
    if (content.authorId === user?.id && permissions.includes('edit:own')) {
      return true;
    }
    
    // Editor can edit content in their department
    if (content.department === user?.department && permissions.includes('edit:department')) {
      return true;
    }
    
    return false;
  };
  
  const canPublishContent = (content: any): boolean => {
    const permissions = user?.permissions || [];
    
    // Only reviewers and admins can publish
    return permissions.includes('publish:content') || 
           permissions.includes('publish:all');
  };
  
  const canDeleteContent = (content: any): boolean => {
    const permissions = user?.permissions || [];
    
    // Admin can delete everything
    if (permissions.includes('delete:all')) return true;
    
    // Author can delete their own drafts
    if (content.authorId === user?.id && 
        content.status === 'draft' && 
        permissions.includes('delete:own')) {
      return true;
    }
    
    return false;
  };
  
  return {
    canCreateContent,
    canEditContent,
    canPublishContent,
    canDeleteContent,
    isAdmin: user?.roles?.includes('admin'),
    isEditor: user?.roles?.includes('editor'),
    isAuthor: user?.roles?.includes('author'),
    isReviewer: user?.roles?.includes('reviewer')
  };
}
```

#### 3. Content Management Interface
```typescript
// app/cms/content/page.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { useContentPermissions } from '@/hooks/useContentPermissions';

export default function ContentListPage() {
  return (
    <RouteGuard requireAuth={true}>
      <ContentManagement />
    </RouteGuard>
  );
}

function ContentManagement() {
  const [contents, setContents] = useState([]);
  const [selectedContents, setSelectedContents] = useState([]);
  const { canCreateContent, canEditContent, canPublishContent, canDeleteContent } = useContentPermissions();
  
  const handleBulkAction = async (action: string) => {
    const validContents = selectedContents.filter(content => {
      switch (action) {
        case 'publish':
          return canPublishContent(content);
        case 'delete':
          return canDeleteContent(content);
        default:
          return false;
      }
    });
    
    if (validContents.length === 0) {
      alert('No valid items selected for this action');
      return;
    }
    
    // Perform bulk action
    try {
      await fetch(`/api/cms/content/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds: validContents.map(c => c.id) })
      });
      
      // Refresh content list
      fetchContents();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Management</h1>
        
        {canCreateContent('article') && (
          <Link href="/cms/content/new" className="btn-primary">
            Create New Article
          </Link>
        )}
      </div>
      
      {/* Bulk Actions */}
      {selectedContents.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <span>{selectedContents.length} items selected</span>
            
            <button 
              onClick={() => handleBulkAction('publish')}
              className="btn-secondary"
              disabled={!selectedContents.some(canPublishContent)}
            >
              Publish Selected
            </button>
            
            <button 
              onClick={() => handleBulkAction('delete')}
              className="btn-danger"
              disabled={!selectedContents.some(canDeleteContent)}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
      
      {/* Content List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContents(contents);
                    } else {
                      setSelectedContents([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contents.map((content) => (
              <ContentRow 
                key={content.id} 
                content={content}
                isSelected={selectedContents.includes(content)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedContents(prev => [...prev, content]);
                  } else {
                    setSelectedContents(prev => prev.filter(c => c.id !== content.id));
                  }
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentRow({ content, isSelected, onSelect }) {
  const { canEditContent, canPublishContent, canDeleteContent } = useContentPermissions();
  
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {content.title}
        </div>
        <div className="text-sm text-gray-500">
          {content.excerpt}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {content.author.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(content.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {canEditContent(content) && (
          <Link href={`/cms/content/${content.id}/edit`} className="text-blue-600 hover:text-blue-900">
            Edit
          </Link>
        )}
        
        {canPublishContent(content) && content.status === 'review' && (
          <button className="text-green-600 hover:text-green-900">
            Publish
          </button>
        )}
        
        {canDeleteContent(content) && (
          <button className="text-red-600 hover:text-red-900">
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
```

#### 4. Content Editor with Workflow
```typescript
// app/cms/content/[id]/edit/page.tsx
import { RouteGuard } from '@/components/RouteGuard';
import { useContentPermissions } from '@/hooks/useContentPermissions';

export default function ContentEditPage({ params }) {
  return (
    <RouteGuard requireAuth={true}>
      <ContentEditor contentId={params.id} />
    </RouteGuard>
  );
}

function ContentEditor({ contentId }) {
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const { canEditContent, canPublishContent, isReviewer } = useContentPermissions();
  
  const handleSave = async (status: 'draft' | 'review' | 'published') => {
    if (!canEditContent(content)) {
      alert('You do not have permission to edit this content');
      return;
    }
    
    if (status === 'published' && !canPublishContent(content)) {
      alert('You do not have permission to publish this content');
      return;
    }
    
    setSaving(true);
    
    try {
      await fetch(`/api/cms/content/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          status,
          lastModified: new Date()
        })
      });
      
      // Log the action
      await fetch('/api/cms/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'content_updated',
          data: {
            contentId,
            status,
            action: status === 'published' ? 'publish' : 'save',
            timestamp: new Date()
          }
        })
      });
      
      alert('Content saved successfully');
    } catch (error) {
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };
  
  if (!content) {
    return <div>Loading...</div>;
  }
  
  if (!canEditContent(content)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h2>
        <p>You do not have permission to edit this content.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Content</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="btn-secondary"
          >
            Save Draft
          </button>
          
          {content.status === 'draft' && (
            <button 
              onClick={() => handleSave('review')}
              disabled={saving}
              className="btn-primary"
            >
              Submit for Review
            </button>
          )}
          
          {(content.status === 'review' && canPublishContent(content)) && (
            <button 
              onClick={() => handleSave('published')}
              disabled={saving}
              className="btn-success"
            >
              Publish
            </button>
          )}
        </div>
      </div>
      
      {/* Content Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input 
              type="text"
              value={content.title}
              onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea 
              value={content.body}
              onChange={(e) => setContent(prev => ({ ...prev, body: e.target.value }))}
              rows={20}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          
          {/* Workflow Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Workflow Status</h3>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                content.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                content.status === 'review' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
              </span>
              
              {content.status === 'review' && isReviewer && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleSave('draft')}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleSave('published')}
                    className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded"
                  >
                    Approve & Publish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

These examples demonstrate how the modular authentication framework can be adapted to different real-world scenarios while maintaining clean architecture and extensibility. Each example shows:

1. **Custom provider implementation** for specific business needs
2. **Permission and role-based access control** tailored to the domain
3. **UI components** that respect authentication state and permissions
4. **Workflow integration** that leverages the authentication system
5. **Audit logging and security** considerations

The framework's modular design allows you to pick and choose components while maintaining consistency and security across your application.