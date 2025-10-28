# Next.js Backend

API backend for WorkOS AuthKit mobile OAuth.

## Setup

```bash
# Environment variables
cp .env.example .env
# Edit .env with WorkOS credentials

# Run
pnpm dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Auth

- `POST /api/auth/url` - Get authorization URL
- `POST /api/auth/callback` - Exchange code for tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/signout` - Sign out and get logout URL

### User

- `GET /api/user/profile` - Get user profile (requires Bearer token)
- `GET /api/user/organizations` - List user's organizations
- `POST /api/user/switch-org` - Switch organization

## Structure

```
backend/
├── app/api/          # API routes
├── lib/              # Utilities
│   ├── types.ts      # TypeScript types
│   ├── workos.ts     # WorkOS client
│   ├── cors.ts       # CORS config
│   └── jwt-utils.ts  # JWT helpers
└── .env              # Environment vars
```

## Environment

```
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
```

## Testing

```bash
# Generate auth URL
curl -X POST http://localhost:3001/api/auth/url \
  -H "Content-Type: application/json" \
  -d '{"redirectUri": "workosauthdemo://callback"}'

# Exchange code
curl -X POST http://localhost:3001/api/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_CODE"}'
```

## Deployment

Vercel:
```bash
vercel
```

Other platforms:
```bash
pnpm build
pnpm start
```