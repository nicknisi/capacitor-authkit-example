# Capacitor AuthKit Example

WorkOS AuthKit in a Capacitor mobile app with Next.js backend.

## Quick Start

**1. Install dependencies**
```bash
pnpm install
```

**2. Configure WorkOS**

Get credentials from [WorkOS Dashboard](https://dashboard.workos.com/):
- Copy your Client ID and API Key
- Add redirect URI: `workosauthdemo://callback`

Create backend `.env`:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

**3. Run backend**
```bash
pnpm dev:backend
# Backend runs on http://localhost:3001
```

**4. Run iOS app** (in new terminal)
```bash
pnpm ios
# Opens Xcode - click ▶ to run
```

**Or run Android app**
```bash
pnpm android
# Opens Android Studio - click ▶ to run
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

## Additional Scripts

```bash
pnpm dev:backend      # Run backend only
pnpm build:app        # Build app only
pnpm sync:ios         # Sync to iOS
pnpm sync:android     # Sync to Android
```

## Troubleshooting

**Invalid redirect_uri**: Add `workosauthdemo://callback` to WorkOS Dashboard

**Backend connection fails on device**: Use ngrok or your machine's IP in `capacitor-app/src/config.ts`

**iOS build errors**: Run `rm -rf capacitor-app/ios && pnpm -F capacitor-app exec cap add ios && pnpm sync:ios`