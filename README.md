# Capacitor AuthKit Example

WorkOS AuthKit in a Capacitor mobile app with Next.js backend.

## Quick Start

```bash
# Install
git clone <your-repo>
cd capacitor-authkit-example
pnpm install

# Configure WorkOS
cp backend/.env.example backend/.env
# Edit backend/.env with your WorkOS credentials

# Run both apps
pnpm dev
```

Backend runs on `http://localhost:3001`, Capacitor app on `http://localhost:5173`.

## WorkOS Setup

1. Get credentials from [WorkOS Dashboard](https://dashboard.workos.com/)
2. Add redirect URI: `workosauthdemo://callback`

## Run on iOS

```bash
pnpm -F capacitor-app build
pnpm -F capacitor-app exec cap add ios  # First time only
pnpm sync:ios
pnpm -F capacitor-app open:ios
```

## Run on Android

```bash
pnpm -F capacitor-app build
pnpm -F capacitor-app exec cap add android  # First time only
pnpm sync:android
pnpm -F capacitor-app open:android
```

## Real Device Testing

Use ngrok:
```bash
ngrok http 3001
# Update capacitor-app/src/config.ts with ngrok URL
```

Or use your machine's IP:
```bash
# Update capacitor-app/src/config.ts with your IP
# e.g., http://192.168.1.100:3001
```

## Project Structure

```
capacitor-authkit-example/
├── backend/          # Next.js API backend
└── capacitor-app/    # Capacitor mobile app
```

## Features

- Mobile OAuth with custom URL schemes
- Token exchange via backend
- Organizations & role switching
- RBAC with permissions
- Token refresh
- Secure session storage

## Scripts

```bash
pnpm dev              # Run both apps
pnpm build            # Build all
pnpm sync             # Sync Capacitor
pnpm sync:ios         # Sync iOS only
pnpm sync:android     # Sync Android only
```

## Environment Variables

Backend `.env`:
```
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
```

## Troubleshooting

**Invalid redirect_uri**: Add `workosauthdemo://callback` to WorkOS Dashboard

**Backend connection fails**: Use ngrok or machine IP for real devices

**iOS scheme error**: Run `rm -rf capacitor-app/ios && pnpm -F capacitor-app exec cap add ios`