# Environment Configuration Module

The Environment Configuration Module provides centralized configuration management for the Configurable Authentication Framework, enabling easy customization through environment variables and configuration objects.

## Overview

The Environment Configuration Module serves as the central configuration hub for the entire authentication framework. It provides type-safe configuration management, environment variable parsing, validation, and default value handling.

### Key Features

- **Environment Variable Support** - Configure via `.env` files
- **Type-Safe Configuration** - TypeScript interfaces for all config options
- **Default Value Handling** - Sensible defaults for all configuration options
- **Validation** - Input validation and error handling
- **Hot Reloading** - Configuration changes without restart (development)
- **Multi-Environment Support** - Different configs for dev/staging/production
- **Configuration Merging** - Hierarchical configuration with overrides

## Core Configuration

### ConfigManager

The central configuration management class.

```typescript
import { ConfigManager } from '@/lib/config';

// Get authentication configuration
const authConfig = ConfigManager.getAuthConfig();

// Check if authentication is enabled
const isAuthEnabled = ConfigManager.isAuthEnabled();

// Get sidebar configuration
const sidebarConfig = ConfigManager.getSidebarConfig();

// Reset configuration (useful for testing)
ConfigManager.resetConfig();
```

**Methods:**
- `getAuthConfig(): AuthConfig` - Get authentication configuration
- `getSidebarConfig(): SidebarConfig` - Get sidebar configuration
- `isAuthEnabled(): boolean` - Check if authentication is enabled
- `resetConfig(): void` - Reset configuration to defaults
- `validateConfig(): ValidationResult` - Validate current configuration

## Environment Variables

### Authentication Configuration

```bash
# Enable/disable authentication (default: true)
AUTH_ENABLED=true

# Session timeout in milliseconds (default: 3600000 = 1 hour)
SESSION_TIMEOUT=3600000

# Session refresh threshold in milliseconds (default: 300000 = 5 minutes)
SESSION_REFRESH_THRESHOLD=300000

# Maximum login attempts before lockout (default: 5)
MAX_LOGIN_ATTEMPTS=5

# Login attempt lockout duration in milliseconds (default: 900000 = 15 minutes)
LOGIN_LOCKOUT_DURATION=900000

# Enable remember me functionality (default: true)
ENABLE_REMEMBER_ME=true

# Remember me duration in milliseconds (default: 2592000000 = 30 days)
REMEMBER_ME_DURATION=2592000000
```

### Sidebar Configuration

```bash
# Remember sidebar state across sessions (default: true)
REMEMBER_SIDEBAR=true

# Default sidebar collapsed state (default: false)
SIDEBAR_DEFAULT_COLLAPSED=false

# Enable sidebar animations (default: true)
SIDEBAR_ANIMATIONS=true

# Sidebar mobile breakpoint in pixels (default: 768)
SIDEBAR_MOBILE_BREAKPOINT=768
```

### Security Configuration

```bash
# Enable HTTPS only cookies (default: true in production)
SECURE_COOKIES=true

# Cookie SameSite policy (default: 'lax')
COOKIE_SAME_SITE=lax

# Enable CSRF protection (default: true)
ENABLE_CSRF_PROTECTION=true

# CSRF token header name (default: 'X-CSRF-Token')
CSRF_HEADER_NAME=X-CSRF-Token
```

### External Integration Configuration

```bash
# External authentication system URL
EXTERNAL_AUTH_URL=https://auth.example.com

# External authentication API key
EXTERNAL_AUTH_API_KEY=your-api-key

# External authentication timeout in milliseconds (default: 5000)
EXTERNAL_AUTH_TIMEOUT=5000

# Enable external authentication sync (default: false)
ENABLE_EXTERNAL_AUTH_SYNC=false
```

### Development Configuration

```bash
# Enable debug logging (default: false)
DEBUG_AUTH=false

# Enable development mode features (default: false)
DEV_MODE=false

# Mock authentication in development (default: false)
MOCK_AUTH=false

# Development server port (default: 3000)
PORT=3000
```

## Configuration Interfaces

### AuthConfig

```typescript
interface AuthConfig {
  // Core authentication settings
  authEnabled: boolean;
  sessionTimeout: number;
  sessionRefreshThreshold: number;
  
  // Login security settings
  maxLoginAttempts: number;
  loginLockoutDuration: number;
  
  // Remember me settings
  enableRememberMe: boolean;
  rememberMeDuration: number;
  
  // Security settings
  secureCookies: boolean;
  cookieSameSite: 'strict' | 'lax' | 'none';
  enableCSRFProtection: boolean;
  csrfHeaderName: string;
  
  // External integration settings
  externalAuthUrl?: string;
  externalAuthApiKey?: string;
  externalAuthTimeout: number;
  enableExternalAuthSync: boolean;
  
  // Development settings
  debugAuth: boolean;
  devMode: boolean;
  mockAuth: boolean;
}
```

### SidebarConfig

```typescript
interface SidebarConfig {
  // State management
  rememberSidebar: boolean;
  defaultCollapsed: boolean;
  
  // UI settings
  enableAnimations: boolean;
  mobileBreakpoint: number;
  
  // Theme settings
  theme: 'light' | 'dark' | 'auto';
  customTheme?: SidebarTheme;
}

interface SidebarTheme {
  background: string;
  border: string;
  text: string;
  activeBackground: string;
  activeText: string;
  hoverBackground: string;
  iconColor: string;
}
```

### ValidationConfig

```typescript
interface ValidationConfig {
  // Username validation
  usernameMinLength: number;
  usernameMaxLength: number;
  usernamePattern?: RegExp;
  
  // Password validation
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  
  // Email validation
  emailRequired: boolean;
  emailPattern?: RegExp;
}
```

## Configuration Loading

### Environment File Hierarchy

Configuration is loaded in the following order (later files override earlier ones):

1. `.env` - Base environment variables
2. `.env.local` - Local overrides (gitignored)
3. `.env.development` - Development environment
4. `.env.production` - Production environment
5. `.env.test` - Test environment

### Example Configuration Files

**.env (Base configuration)**
```bash
# Base configuration for all environments
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
REMEMBER_SIDEBAR=true
SIDEBAR_DEFAULT_COLLAPSED=false
```

**.env.development**
```bash
# Development-specific overrides
DEBUG_AUTH=true
DEV_MODE=true
MOCK_AUTH=true
SECURE_COOKIES=false
```

**.env.production**
```bash
# Production-specific overrides
DEBUG_AUTH=false
DEV_MODE=false
MOCK_AUTH=false
SECURE_COOKIES=true
COOKIE_SAME_SITE=strict
```

**.env.test**
```bash
# Test-specific overrides
AUTH_ENABLED=false
MOCK_AUTH=true
SESSION_TIMEOUT=60000
```

## Configuration Validation

### Validation Rules

```typescript
const configValidationRules = {
  sessionTimeout: {
    min: 60000, // 1 minute minimum
    max: 86400000, // 24 hours maximum
    type: 'number'
  },
  maxLoginAttempts: {
    min: 1,
    max: 10,
    type: 'number'
  },
  sidebarMobileBreakpoint: {
    min: 320,
    max: 1920,
    type: 'number'
  },
  cookieSameSite: {
    enum: ['strict', 'lax', 'none'],
    type: 'string'
  }
};

// Validation function
function validateConfig(config: Partial<AuthConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate session timeout
  if (config.sessionTimeout) {
    const rule = configValidationRules.sessionTimeout;
    if (config.sessionTimeout < rule.min) {
      errors.push(`Session timeout must be at least ${rule.min}ms`);
    }
    if (config.sessionTimeout > rule.max) {
      warnings.push(`Session timeout is very long (${config.sessionTimeout}ms)`);
    }
  }
  
  // Validate security settings
  if (config.secureCookies === false && process.env.NODE_ENV === 'production') {
    warnings.push('Secure cookies should be enabled in production');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

### Runtime Validation

```typescript
class ConfigManager {
  private static config: AuthConfig | null = null;
  
  static getAuthConfig(): AuthConfig {
    if (!this.config) {
      this.config = this.loadConfig();
      const validation = this.validateConfig(this.config);
      
      if (!validation.isValid) {
        console.error('Configuration validation failed:', validation.errors);
        throw new Error('Invalid configuration');
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:', validation.warnings);
      }
    }
    
    return this.config;
  }
  
  private static loadConfig(): AuthConfig {
    return {
      authEnabled: this.parseBoolean(process.env.AUTH_ENABLED, true),
      sessionTimeout: this.parseNumber(process.env.SESSION_TIMEOUT, 3600000),
      sessionRefreshThreshold: this.parseNumber(process.env.SESSION_REFRESH_THRESHOLD, 300000),
      maxLoginAttempts: this.parseNumber(process.env.MAX_LOGIN_ATTEMPTS, 5),
      loginLockoutDuration: this.parseNumber(process.env.LOGIN_LOCKOUT_DURATION, 900000),
      enableRememberMe: this.parseBoolean(process.env.ENABLE_REMEMBER_ME, true),
      rememberMeDuration: this.parseNumber(process.env.REMEMBER_ME_DURATION, 2592000000),
      secureCookies: this.parseBoolean(process.env.SECURE_COOKIES, process.env.NODE_ENV === 'production'),
      cookieSameSite: this.parseEnum(process.env.COOKIE_SAME_SITE, ['strict', 'lax', 'none'], 'lax'),
      enableCSRFProtection: this.parseBoolean(process.env.ENABLE_CSRF_PROTECTION, true),
      csrfHeaderName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token',
      externalAuthUrl: process.env.EXTERNAL_AUTH_URL,
      externalAuthApiKey: process.env.EXTERNAL_AUTH_API_KEY,
      externalAuthTimeout: this.parseNumber(process.env.EXTERNAL_AUTH_TIMEOUT, 5000),
      enableExternalAuthSync: this.parseBoolean(process.env.ENABLE_EXTERNAL_AUTH_SYNC, false),
      debugAuth: this.parseBoolean(process.env.DEBUG_AUTH, false),
      devMode: this.parseBoolean(process.env.DEV_MODE, process.env.NODE_ENV === 'development'),
      mockAuth: this.parseBoolean(process.env.MOCK_AUTH, false),
    };
  }
  
  private static parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }
  
  private static parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  private static parseEnum<T extends string>(
    value: string | undefined,
    allowedValues: T[],
    defaultValue: T
  ): T {
    if (value === undefined) return defaultValue;
    return allowedValues.includes(value as T) ? (value as T) : defaultValue;
  }
}
```

## Dynamic Configuration

### Runtime Configuration Updates

```typescript
class DynamicConfigManager extends ConfigManager {
  private static listeners: Array<(config: AuthConfig) => void> = [];
  
  static updateConfig(updates: Partial<AuthConfig>): void {
    const currentConfig = this.getAuthConfig();
    const newConfig = { ...currentConfig, ...updates };
    
    const validation = this.validateConfig(newConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`);
    }
    
    this.config = newConfig;
    this.notifyListeners(newConfig);
  }
  
  static onConfigChange(listener: (config: AuthConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private static notifyListeners(config: AuthConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Config change listener error:', error);
      }
    });
  }
}

// Usage
const unsubscribe = DynamicConfigManager.onConfigChange((config) => {
  console.log('Configuration updated:', config);
  // Update UI or restart services as needed
});

// Update configuration at runtime
DynamicConfigManager.updateConfig({
  sessionTimeout: 7200000, // 2 hours
  maxLoginAttempts: 3
});
```

### Configuration Hooks

```typescript
function useConfig() {
  const [config, setConfig] = useState(() => ConfigManager.getAuthConfig());
  
  useEffect(() => {
    const unsubscribe = DynamicConfigManager.onConfigChange(setConfig);
    return unsubscribe;
  }, []);
  
  const updateConfig = useCallback((updates: Partial<AuthConfig>) => {
    DynamicConfigManager.updateConfig(updates);
  }, []);
  
  return {
    config,
    updateConfig,
    isAuthEnabled: config.authEnabled,
    sessionTimeout: config.sessionTimeout
  };
}

// Usage in components
function ConfigurableComponent() {
  const { config, updateConfig, isAuthEnabled } = useConfig();
  
  const handleToggleAuth = () => {
    updateConfig({ authEnabled: !isAuthEnabled });
  };
  
  return (
    <div>
      <p>Authentication: {isAuthEnabled ? 'Enabled' : 'Disabled'}</p>
      <button onClick={handleToggleAuth}>
        {isAuthEnabled ? 'Disable' : 'Enable'} Auth
      </button>
    </div>
  );
}
```

## Deployment Configurations

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Set default environment variables
ENV AUTH_ENABLED=true
ENV SESSION_TIMEOUT=3600000
ENV SECURE_COOKIES=true
ENV COOKIE_SAME_SITE=strict

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AUTH_ENABLED=true
      - SESSION_TIMEOUT=3600000
      - SECURE_COOKIES=true
      - EXTERNAL_AUTH_URL=https://auth.example.com
      - EXTERNAL_AUTH_API_KEY=${EXTERNAL_AUTH_API_KEY}
    env_file:
      - .env.production
    depends_on:
      - redis
      
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Kubernetes Configuration

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-config
data:
  AUTH_ENABLED: "true"
  SESSION_TIMEOUT: "3600000"
  SECURE_COOKIES: "true"
  COOKIE_SAME_SITE: "strict"
  REMEMBER_SIDEBAR: "true"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
type: Opaque
data:
  EXTERNAL_AUTH_API_KEY: <base64-encoded-key>

---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-app
  template:
    metadata:
      labels:
        app: auth-app
    spec:
      containers:
      - name: auth-app
        image: your-registry/auth-app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: auth-config
        - secretRef:
            name: auth-secrets
        env:
        - name: NODE_ENV
          value: "production"
```

### Vercel Configuration

**vercel.json**
```json
{
  "env": {
    "AUTH_ENABLED": "true",
    "SESSION_TIMEOUT": "3600000",
    "SECURE_COOKIES": "true"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

**Environment Variables in Vercel Dashboard:**
```bash
# Production
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
SECURE_COOKIES=true
EXTERNAL_AUTH_API_KEY=prod-api-key

# Preview
AUTH_ENABLED=true
SESSION_TIMEOUT=1800000
SECURE_COOKIES=false
EXTERNAL_AUTH_API_KEY=staging-api-key

# Development
AUTH_ENABLED=true
DEBUG_AUTH=true
MOCK_AUTH=true
SECURE_COOKIES=false
```

## Testing Configuration

### Test Configuration Setup

```typescript
// test-utils/config.ts
export function createTestConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    authEnabled: true,
    sessionTimeout: 60000, // 1 minute for faster tests
    sessionRefreshThreshold: 10000,
    maxLoginAttempts: 3,
    loginLockoutDuration: 30000,
    enableRememberMe: true,
    rememberMeDuration: 86400000,
    secureCookies: false,
    cookieSameSite: 'lax',
    enableCSRFProtection: false,
    csrfHeaderName: 'X-CSRF-Token',
    externalAuthTimeout: 1000,
    enableExternalAuthSync: false,
    debugAuth: true,
    devMode: true,
    mockAuth: true,
    ...overrides
  };
}

// Mock ConfigManager for tests
export function mockConfigManager(config: Partial<AuthConfig> = {}) {
  const testConfig = createTestConfig(config);
  
  jest.spyOn(ConfigManager, 'getAuthConfig').mockReturnValue(testConfig);
  jest.spyOn(ConfigManager, 'isAuthEnabled').mockReturnValue(testConfig.authEnabled);
  
  return testConfig;
}
```

### Configuration Testing

```typescript
import { ConfigManager } from '@/lib/config';
import { createTestConfig, mockConfigManager } from '@/test-utils/config';

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.resetConfig();
  });
  
  test('should load default configuration', () => {
    const config = ConfigManager.getAuthConfig();
    
    expect(config.authEnabled).toBe(true);
    expect(config.sessionTimeout).toBe(3600000);
    expect(config.maxLoginAttempts).toBe(5);
  });
  
  test('should parse environment variables correctly', () => {
    process.env.AUTH_ENABLED = 'false';
    process.env.SESSION_TIMEOUT = '7200000';
    
    ConfigManager.resetConfig();
    const config = ConfigManager.getAuthConfig();
    
    expect(config.authEnabled).toBe(false);
    expect(config.sessionTimeout).toBe(7200000);
  });
  
  test('should validate configuration', () => {
    const invalidConfig = createTestConfig({
      sessionTimeout: 30000, // Too short
      maxLoginAttempts: 0 // Invalid
    });
    
    const validation = ConfigManager.validateConfig(invalidConfig);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      expect.stringContaining('Session timeout must be at least')
    );
  });
});
```

### Property-Based Configuration Testing

```typescript
import * as fc from 'fast-check';

describe('Configuration Properties', () => {
  it('should maintain configuration consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          authEnabled: fc.boolean(),
          sessionTimeout: fc.integer({ min: 60000, max: 86400000 }),
          maxLoginAttempts: fc.integer({ min: 1, max: 10 }),
          secureCookies: fc.boolean()
        }),
        (configOverrides) => {
          const config = createTestConfig(configOverrides);
          mockConfigManager(config);
          
          // Property: Configuration should be accessible
          const loadedConfig = ConfigManager.getAuthConfig();
          expect(loadedConfig).toBeDefined();
          
          // Property: Auth enabled state should be consistent
          const isAuthEnabled = ConfigManager.isAuthEnabled();
          expect(isAuthEnabled).toBe(config.authEnabled);
          
          // Property: Configuration should be valid
          const validation = ConfigManager.validateConfig(config);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Troubleshooting

### Common Configuration Issues

#### 1. Environment variables not loading

**Cause:** Incorrect file naming or loading order

**Solution:**
```bash
# Check file names
.env                # Base configuration
.env.local         # Local overrides (gitignored)
.env.development   # Development environment
.env.production    # Production environment

# Verify loading in Next.js
console.log('AUTH_ENABLED:', process.env.AUTH_ENABLED);
```

#### 2. Configuration validation errors

**Cause:** Invalid values or missing required configuration

**Solution:**
```typescript
// Add detailed error logging
try {
  const config = ConfigManager.getAuthConfig();
} catch (error) {
  console.error('Configuration error:', error);
  console.log('Environment variables:', {
    AUTH_ENABLED: process.env.AUTH_ENABLED,
    SESSION_TIMEOUT: process.env.SESSION_TIMEOUT,
    // ... other relevant vars
  });
}
```

#### 3. Configuration not updating in development

**Cause:** Configuration caching or missing hot reload

**Solution:**
```typescript
// Force configuration reload in development
if (process.env.NODE_ENV === 'development') {
  ConfigManager.resetConfig();
}

// Or use dynamic configuration
const config = DynamicConfigManager.getAuthConfig();
```

### Performance Considerations

1. **Configuration Caching** - Cache configuration to avoid repeated parsing
2. **Validation Caching** - Cache validation results for performance
3. **Environment Variable Access** - Minimize `process.env` access in hot paths
4. **Configuration Serialization** - Use efficient serialization for config storage

### Security Best Practices

1. **Sensitive Data** - Never commit sensitive configuration to version control
2. **Environment Separation** - Use different configurations for different environments
3. **Validation** - Always validate configuration before use
4. **Access Control** - Restrict access to configuration files in production
5. **Encryption** - Encrypt sensitive configuration values when stored

## Requirements Mapping

This module implements the following requirements:

- **1.1** - Environment-based authentication control via AUTH_ENABLED
- **1.2** - Configuration management and environment variable parsing
- **1.3** - Default value handling and configuration validation
- **7.1** - Centralized configuration management structure
- **7.2** - Type-safe configuration interfaces and validation
- **7.3** - Comprehensive configuration documentation
- **7.5** - Configuration templates and examples
- **7.6** - Deployment configuration examples and best practices