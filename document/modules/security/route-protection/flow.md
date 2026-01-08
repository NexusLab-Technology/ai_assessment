# Route Protection Module - Flow

## Protection Flow

```
RouteGuard mounts
    ↓
Check auth enabled
    ↓
[Disabled] → Render children
    ↓
[Enabled] → Check requireAuth
    ↓
[Not required] → Render children
    ↓
[Required] → Check authentication
    ↓
[Not authenticated] → Redirect to login
    ↓
[Authenticated] → Render children
```
