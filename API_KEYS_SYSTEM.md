# ScopePad API Key System (MTR-288)

Complete API key authentication system for ScopePad, enabling programmatic access to the platform for Pro tier and above subscribers.

## Files Created

### 1. Type Definitions
**Location:** `/src/lib/api-keys/types.ts`

Exports:
- `ApiKey` - Full API key record (includes hash)
- `ApiKeyPublic` - Public-facing API key (no hash)
- `ApiKeyPermissions` - Permission model with 6 scopes
- `CreateApiKeyInput` - Request body schema
- `DEFAULT_PERMISSIONS` - Safe defaults for new keys

Permission scopes:
- `read` - Document/proposal reading
- `create` - Creating new documents
- `edit` - Modifying existing documents
- `send` - Sending proposals/invoices
- `financial` - Financial operations (payments)
- `delete` - Deleting resources

Each permission can be: `'auto'` | `'approve'` | `'block'`

### 2. Utility Functions
**Location:** `/src/lib/api-keys/utils.ts`

Functions:
- `generateApiKey()` - Creates new key with format `sk_scopepad_{random_32_hex_chars}`
  - Returns: `{ key, hash, prefix }`
  - Uses crypto.randomBytes(32) for entropy
  - Uses SHA-256 for hashing (fast lookups, not bcrypt)

- `hashApiKey(key)` - SHA-256 hash any API key

- `maskApiKey(key)` - Display format: first 12 chars + "..." + last 4

### 3. Authentication Middleware
**Location:** `/src/lib/api-keys/auth.ts`

Export: `authenticateApiKey(request: Request)`

Workflow:
1. Extract Bearer token from `Authorization: Bearer sk_scopepad_...`
2. Hash the key with SHA-256
3. Look up by `key_hash` in database (fast)
4. Validate:
   - Key is active
   - Not expired
   - Freelancer has Pro tier or above
5. Update usage metrics (`last_used_at`, `request_count`)
6. Return `AuthenticatedRequest` with freelancer_id, api_key_id, permissions, tier

**Rate Limiting:**
- 100 requests/minute per API key
- In-memory tracking with automatic cleanup
- Returns 429 if exceeded

**Error Responses:**
- 401: Missing/invalid token, inactive key, expired key
- 403: Free tier (no API access)
- 429: Rate limit exceeded

### 4. API Routes

#### GET/POST `/api/api-keys`
**Location:** `/src/app/api/api-keys/route.ts`

**GET** - List all API keys
- Auth: Session (user must be logged in)
- Returns: `ApiKeyPublic[]` (never includes hash)
- Sorted by creation date (newest first)

**POST** - Create new API key
- Auth: Session
- Body:
  ```json
  {
    "name": "Production API Key",
    "permissions": {
      "read": "auto",
      "financial": "approve"
    },
    "expires_at": "2027-03-29T00:00:00Z"
  }
  ```
- Requirements:
  - `name` required, non-empty string
  - `permissions` optional (defaults to DEFAULT_PERMISSIONS)
  - `expires_at` optional, ISO-8601 timestamp
  - User must have Pro tier or above
- Returns: Full key ONCE (only on creation)
  ```json
  {
    "id": "uuid",
    "name": "Production API Key",
    "key_prefix": "sk_scope_...",
    "key": "sk_scopepad_...",
    "permissions": {...},
    "is_active": true,
    "created_at": "...",
    "message": "Save your API key securely. You will not be shown it again."
  }
  ```

#### PUT/DELETE `/api/api-keys/[id]`
**Location:** `/src/app/api/api-keys/[id]/route.ts`

**PUT** - Update API key
- Auth: Session
- Body:
  ```json
  {
    "name": "New Name",
    "permissions": { "read": "block" },
    "is_active": false
  }
  ```
- All fields optional
- Returns: Updated `ApiKeyPublic`

**DELETE** - Hard delete API key
- Auth: Session
- Returns: `{ message: "API key deleted successfully" }`

## Database Schema

Run this migration to set up the API keys table:

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{...}'::jsonb,
  last_used_at TIMESTAMP WITH TIME ZONE,
  request_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_freelancer_id ON api_keys(freelancer_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

Full migration with RLS policies: See bottom of this file.

## Usage Examples

### Creating an API Key (Session Auth)
```typescript
// POST /api/api-keys
const response = await fetch('/api/api-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Integration',
    expires_at: '2027-12-31T23:59:59Z'
  })
});

const { key, ...metadata } = await response.json();
// !! Save `key` somewhere secure - you won't see it again
// Use `metadata` for display
```

### Using an API Key
```typescript
// Any API call with the key
const response = await fetch('/api/v1/proposals', {
  headers: {
    'Authorization': 'Bearer sk_scopepad_...',
    'Content-Type': 'application/json'
  }
});
```

### Using authenticateApiKey in Protected Routes
```typescript
// In /api/v1/proposals/route.ts or similar
import { authenticateApiKey } from '@/lib/api-keys/auth';

export async function GET(request: Request) {
  // Authenticate the API key
  const authResult = await authenticateApiKey(request);

  if (authResult instanceof Response) {
    return authResult; // Error response
  }

  const { freelancer_id, permissions, tier } = authResult;

  // Check permissions
  if (permissions.read === 'block') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  // Proceed with logic using freelancer_id...
}
```

## Security Notes

1. **Keys are never stored** - Only SHA-256 hashes stored in database
2. **Full key shown once** - POST response only, never again in API
3. **Fast lookups** - SHA-256 allows quick database queries
4. **Rate limiting** - Built-in 100 req/min per key
5. **Tier gating** - Free tier cannot use API keys
6. **Expiration** - Optional key expiration with validation
7. **RLS policies** - Users can only access their own keys

## Integration Points

- Use `authenticateApiKey()` in any `/api/v1/*` route
- Check `permissions` object for action authorization
- Use `tier` for feature availability
- Log `api_key_id` in audit trails
- Update `last_used_at` for monitoring (automatic)

## Testing

```bash
# Create a key
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"name":"test"}'

# List keys
curl http://localhost:3000/api/api-keys \
  -H "Cookie: [session-cookie]"

# Use an API key
curl http://localhost:3000/api/v1/proposals \
  -H "Authorization: Bearer sk_scopepad_..."
```

## Deployment Checklist

- [ ] Create `api_keys` table with migration
- [ ] Enable RLS policies
- [ ] Create indexes on `freelancer_id` and `key_hash`
- [ ] Test tier gating (free users cannot create keys)
- [ ] Test rate limiting (100 req/min)
- [ ] Test key expiration
- [ ] Test permission enforcement in /api/v1/* routes
- [ ] Document API in API reference
- [ ] Add key management to dashboard
