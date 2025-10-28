# Backend Server

Express server handling OAuth code exchange and token management for the Capacitor app.

## Why a Backend?

Mobile apps cannot securely store the WorkOS client secret. The secret must remain on your backend server. The mobile app sends the authorization code to your backend, which exchanges it for tokens using the secret.

**Never put your client secret in a mobile app.**

## Running

From the workspace root:

```bash
pnpm dev:backend
```

Or from this directory:

```bash
pnpm dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### POST /auth/url

Generate WorkOS authorization URL for the mobile app to open.

**Request:**
```json
{
  "redirectUri": "workosauthdemo://callback",
  "state": "optional-state-value",
  "organizationId": "org_123"
}
```

**Parameters:**
- `redirectUri` (required): Must match WorkOS Dashboard configuration
- `state` (optional): CSRF token and routing data
- `organizationId` (optional): Pre-select organization

**Response:**
```json
{
  "authorizationUrl": "https://api.workos.com/user_management/authorize?..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/url \
  -H "Content-Type: application/json" \
  -d '{"redirectUri": "workosauthdemo://callback"}'
```

### POST /auth/callback

Exchange authorization code for access and refresh tokens.

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
    "profilePictureUrl": "https://..."
  },
  "organizationId": "org_01...",
  "impersonator": null
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "01ABCDEF..."}'
```

**Implementation:**
```javascript
const { user, accessToken, refreshToken, organizationId, impersonator } =
  await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID,
    code: req.body.code,
  });
```

### POST /auth/refresh

Refresh an expired access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "ey_refresh..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "ey_refresh..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "ey_refresh..."}'
```

**Implementation:**
```javascript
const { accessToken, refreshToken } =
  await workos.userManagement.authenticateWithRefreshToken({
    clientId: process.env.WORKOS_CLIENT_ID,
    refreshToken: req.body.refreshToken,
  });
```

### POST /auth/verify

Verify an access token and return user information.

**Request:**
```json
{
  "accessToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user_01...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "eyJhbGc..."}'
```

### POST /auth/roles

Get user's organization membership and role information (RBAC).

**Request:**
```json
{
  "userId": "user_01...",
  "organizationId": "org_01..."
}
```

**Response:**
```json
{
  "userId": "user_01...",
  "organizationId": "org_01...",
  "role": {
    "slug": "admin",
    "name": "Admin"
  },
  "status": "active"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/roles \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_01...",
    "organizationId": "org_01..."
  }'
```

### GET /api/protected

Example protected endpoint demonstrating Bearer token authentication.

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "message": "This is a protected endpoint",
  "user": {
    "id": "user_01...",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/protected \
  -H "Authorization: Bearer eyJhbGc..."
```

**Implementation:**
```javascript
// Extract token from Authorization header
const token = req.headers.authorization?.replace('Bearer ', '');

// Verify token
const { user } = await workos.userManagement.getUser(token);

// Return protected data
res.json({ message: 'Protected data', user });
```

## Environment Variables

Create a `.env` file:

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
```

Get these from [WorkOS Dashboard](https://dashboard.workos.com/).

## Production Deployment

### Vercel

1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel Dashboard

### Railway

1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Render

1. Create new Web Service
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

## Security Notes

- Client secret must never be exposed to the mobile app
- All token exchanges require the client secret
- Access tokens typically expire after 1 hour
- Refresh tokens should be stored securely in the mobile app
- Always verify tokens on the backend for protected routes
- Use HTTPS in production

## CORS Configuration

The server allows requests from `http://localhost:5173` (Vite dev server) and `capacitor://localhost` (Capacitor iOS).

For production, update the CORS configuration:

```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'capacitor://localhost',
    'http://localhost' // iOS
  ]
}));
```

## Testing the Full Flow

1. Start the backend:
   ```bash
   pnpm dev
   ```

2. Generate authorization URL:
   ```bash
   curl -X POST http://localhost:3001/auth/url \
     -H "Content-Type: application/json" \
     -d '{"redirectUri": "workosauthdemo://callback"}'
   ```

3. Open the returned URL in a browser and complete authentication

4. WorkOS redirects to: `workosauthdemo://callback?code=...`

5. Exchange the code for tokens:
   ```bash
   curl -X POST http://localhost:3001/auth/callback \
     -H "Content-Type: application/json" \
     -d '{"code": "YOUR_CODE_HERE"}'
   ```

6. Use the access token with protected endpoints:
   ```bash
   curl -X GET http://localhost:3001/api/protected \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Code Structure

```
server.js
├── WorkOS initialization
├── CORS configuration
├── Auth endpoints
│   ├── /auth/url        - Generate authorization URL
│   ├── /auth/callback   - Exchange code for tokens
│   ├── /auth/refresh    - Refresh access token
│   ├── /auth/verify     - Verify access token
│   └── /auth/roles      - Get user roles (RBAC)
└── Protected endpoints
    └── /api/protected   - Example Bearer auth
```
