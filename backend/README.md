# Next.js Backend

Next.js 15 API backend for WorkOS AuthKit mobile OAuth flow with enhanced session data.

## Why Next.js?

This backend uses Next.js instead of Express to provide:
- Modern TypeScript with better type inference
- API routes with edge-compatible runtime
- Built-in CORS handling
- Better developer experience
- Easy deployment to Vercel, Netlify, or other platforms

The Capacitor mobile app makes HTTP requests to these API routes to handle OAuth code exchange and session management.

## Architecture

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **@workos-inc/node** SDK for WorkOS integration
- **API Routes** under `app/api/*`
- **CORS middleware** for Capacitor origins

## Environment Setup

Create a `.env.local` file (or use the existing `.env`):

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
```

Get credentials from [WorkOS Dashboard](https://dashboard.workos.com/).

## Running

From workspace root:

```bash
pnpm dev:backend
```

Or from this directory:

```bash
pnpm dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Authentication

#### `POST /api/auth/url`

Generate WorkOS authorization URL for mobile OAuth flow.

**Request:**
```json
{
  "redirectUri": "workosauthdemo://callback",
  "state": "optional-state",
  "organizationId": "org_123"
}
```

**Response:**
```json
{
  "authorizationUrl": "https://api.workos.com/user_management/authorize?..."
}
```

#### `POST /api/auth/callback`

Exchange authorization code for access/refresh tokens with full user data.

**Request:**
```json
{
  "code": "01ABCDEF..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "ey_refresh...",
  "user": {
    "id": "user_01...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "profilePictureUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "organizationId": "org_01...",
  "role": { "slug": "admin", "name": "Admin" },
  "roles": [{ "slug": "admin", "name": "Admin" }],
  "permissions": [{ "id": "perm_01", "name": "read:users" }],
  "entitlements": [{ "id": "ent_01", "name": "premium", "value": true }],
  "featureFlags": [{ "id": "ff_01", "name": "new_ui", "enabled": true }],
  "impersonator": null,
  "authenticationMethod": "password"
}
```

#### `POST /api/auth/refresh`

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "ey_refresh..."
}
```

**Response:** Same as callback response

#### `POST /api/auth/signout`

Sign out user and optionally get logout URL.

**Request:**
```json
{
  "sessionId": "session_01..."
}
```

**Response:**
```json
{
  "success": true,
  "logoutUrl": "https://api.workos.com/user_management/sessions/logout?..."
}
```

### User Management

#### `GET /api/user/profile`

Get user profile with roles and permissions (requires Bearer token).

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "user": { ... },
  "organizationId": "org_01...",
  "role": { "slug": "admin", "name": "Admin" },
  "roles": [...],
  "permissions": [...],
  "entitlements": [...],
  "featureFlags": [...],
  "impersonator": null
}
```

#### `GET /api/user/organizations?userId=user_01`

List organizations user belongs to.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "organizations": [
    {
      "organization": {
        "id": "org_01...",
        "name": "Acme Corp",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "membership": {
        "id": "om_01...",
        "userId": "user_01...",
        "organizationId": "org_01...",
        "role": { "slug": "admin", "name": "Admin" },
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

#### `POST /api/user/switch-org`

Switch user's active organization.

**Request:**
```json
{
  "userId": "user_01...",
  "organizationId": "org_02...",
  "accessToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "organizationId": "org_02...",
  "role": { "slug": "member", "name": "Member" }
}
```

## Code Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── url/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── signout/route.ts
│   │   └── user/
│   │       ├── profile/route.ts
│   │       ├── switch-org/route.ts
│   │       └── organizations/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── workos.ts         # WorkOS client & helpers
│   └── cors.ts           # CORS middleware
├── .env                  # Environment variables
└── package.json
```

## Key Implementation Details

### JWT Decoding

The backend decodes the WorkOS access token (JWT) to extract roles, permissions, entitlements, and feature flags:

```typescript
const parts = accessToken.split('.');
if (parts.length === 3) {
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  const decodedToken = JSON.parse(payload);

  const roles = decodedToken.roles || [];
  const permissions = decodedToken.permissions || [];
  const entitlements = decodedToken.entitlements || [];
  const featureFlags = decodedToken.feature_flags || [];
}
```

### CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `capacitor://localhost` (Capacitor iOS)
- `http://localhost` (Capacitor iOS)
- `ionic://localhost` (Capacitor Android)

See `lib/cors.ts` for implementation.

### Error Handling

All routes return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": { ... }
}
```

## Deployment

### Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

### Other Platforms

Build the Next.js app:

```bash
pnpm build
pnpm start
```

Set environment variables and expose port 3001 (or configure as needed).

## Security Notes

- Client secret never exposed to mobile app
- All token exchanges happen on backend
- CORS properly configured
- JWT signature verified by WorkOS SDK
- Bearer token authentication for protected routes
- HTTPS required in production

## Testing

Test with curl:

```bash
# Generate auth URL
curl -X POST http://localhost:3001/api/auth/url \
  -H "Content-Type: application/json" \
  -d '{"redirectUri": "workosauthdemo://callback"}'

# Exchange code for tokens
curl -X POST http://localhost:3001/api/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_CODE"}'

# Get user profile
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Differences from Express

This backend replaces the original Express implementation with:

- Next.js API routes instead of Express routes
- TypeScript with better type inference
- Edge-compatible runtime
- Built-in middleware support
- Easier deployment options
- Same API contract (mobile app works without changes)

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [WorkOS Node SDK](https://workos.com/docs/reference/node)
- [WorkOS User Management](https://workos.com/docs/user-management)
