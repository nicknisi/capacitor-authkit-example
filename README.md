# Capacitor AuthKit Example

Complete example showing WorkOS AuthKit in a Capacitor mobile app with Next.js backend, featuring RBAC, organizations, and multi-page UI.

## What This Demonstrates

Mobile apps use custom URL schemes for OAuth instead of HTTP redirects. This example shows:

1. **Mobile OAuth Flow**: System browser authentication with custom URL scheme callback
2. **Next.js Backend**: Modern API routes handling token exchange with WorkOS
3. **Enhanced Session Data**: Roles, permissions, entitlements, and feature flags
4. **Multi-Page UI**: Home, Account, and Settings pages with navigation
5. **Organization Management**: Switch between organizations, view memberships
6. **RBAC**: Role-based access control with permissions display
7. **Token Management**: Automatic refresh, manual refresh, secure storage

## Project Structure

This is a pnpm workspace with two packages:

```
capacitor-authkit-example/
├── backend/          # Next.js 15 API backend with WorkOS integration
└── capacitor-app/    # Capacitor app with iOS/Android projects
```

**Why Next.js?** Modern TypeScript, edge-compatible API routes, better DX, and easy deployment to Vercel/Netlify.

## Prerequisites

- Node.js 18 or higher
- pnpm (`npm install -g pnpm`)
- Xcode (for iOS development)
- Android Studio (for Android development)
- WorkOS account with AuthKit configured

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd capacitor-authkit-example
pnpm install
```

This installs dependencies for both the backend and Capacitor app.

### 2. Configure WorkOS

Get your credentials from [WorkOS Dashboard](https://dashboard.workos.com/):

1. Copy backend environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` with your WorkOS credentials:
   ```bash
   WORKOS_API_KEY=sk_test_...
   WORKOS_CLIENT_ID=client_...
   ```

3. Add redirect URI to WorkOS Dashboard:
   - Go to: WorkOS Dashboard → Your Application → Configuration → Redirect URIs
   - Add: `workosauthdemo://callback`

### 3. Run Both Apps

Start the Next.js backend and Capacitor dev server together:

```bash
pnpm dev
```

This runs:
- Next.js backend on `http://localhost:3001`
- Capacitor dev server (Vite) on `http://localhost:5173`

You can also run them separately:

```bash
pnpm dev:backend     # Backend only
pnpm dev:app         # Capacitor app only
```

### 4. Run on iOS Simulator

```bash
# Build web assets
pnpm -F capacitor-app build

# First time only: Add iOS platform
pnpm -F capacitor-app exec cap add ios

# Sync to iOS
pnpm sync:ios

# Open in Xcode
pnpm -F capacitor-app open:ios
```

Click ▶ in Xcode to run on the simulator.

Or use the CLI to run directly:

```bash
pnpm -F capacitor-app run:ios
```

### 5. Run on Android

```bash
# Build web assets
pnpm -F capacitor-app build

# First time only: Add Android platform
pnpm -F capacitor-app exec cap add android

# Sync to Android
pnpm sync:android

# Open in Android Studio
pnpm -F capacitor-app open:android
```

Click ▶ in Android Studio to run on the emulator.

Or use the CLI:

```bash
pnpm -F capacitor-app run:android
```

## Testing on Real Devices

Real devices can't reach `localhost`. You need to expose your backend:

### Option 1: Use ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose backend
ngrok http 3001
```

Update `capacitor-app/src/config.ts` with the ngrok URL:

```typescript
export const CONFIG = {
  BACKEND_URL: 'https://abc123.ngrok.io',  // Your ngrok URL
  // ...
};
```

### Option 2: Use Your Machine's IP

Find your local IP:

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

Update `capacitor-app/src/config.ts`:

```typescript
export const CONFIG = {
  BACKEND_URL: 'http://192.168.1.100:3001',  // Your IP
  // ...
};
```

Make sure your device is on the same network as your machine.

### Rebuild After Config Changes

```bash
pnpm -F capacitor-app build
pnpm sync
```

Then run on your device from Xcode or Android Studio.

## Available Scripts

### Root Scripts

```bash
pnpm dev              # Run backend + app dev servers
pnpm dev:backend      # Run backend only
pnpm dev:app          # Run Capacitor app only
pnpm build            # Build all packages
pnpm sync             # Sync Capacitor to all platforms
pnpm sync:ios         # Sync to iOS only
pnpm sync:android     # Sync to Android only
```

### Backend Scripts

```bash
pnpm -F backend dev         # Run with hot reload
pnpm -F backend start       # Run without hot reload
```

### Capacitor App Scripts

```bash
pnpm -F capacitor-app dev           # Vite dev server
pnpm -F capacitor-app build         # Build web assets
pnpm -F capacitor-app sync          # Sync to all platforms
pnpm -F capacitor-app sync:ios      # Sync to iOS
pnpm -F capacitor-app sync:android  # Sync to Android
pnpm -F capacitor-app open:ios      # Open in Xcode
pnpm -F capacitor-app open:android  # Open in Android Studio
pnpm -F capacitor-app run:ios       # Build and run on iOS
pnpm -F capacitor-app run:android   # Build and run on Android
```

## How It Works

### Mobile OAuth vs Web OAuth

**Web OAuth:**
```
1. Redirect to WorkOS
2. User authenticates
3. WorkOS redirects back to your domain
4. Your server handles the callback route
```

**Mobile OAuth (this example):**
```
1. Open system browser with WorkOS AuthKit
2. User authenticates
3. WorkOS redirects to: workosauthdemo://callback?code=...
4. iOS/Android intercepts the custom URL
5. App receives the URL via App.addListener('appUrlOpen')
6. App extracts code and sends to Next.js backend
7. Backend exchanges code for tokens + enhanced session data
   (roles, permissions, entitlements, feature flags)
8. App stores session and navigates to Home page
```

### Key Components

**Custom URL Scheme Registration** (`capacitor-app/capacitor.config.ts`):
```typescript
{
  ios: { scheme: 'workosauthdemo' },
  android: { scheme: 'workosauthdemo' }
}
```

**URL Callback Handler** (`capacitor-app/src/auth.ts`):
```typescript
App.addListener('appUrlOpen', async (event) => {
  const url = new URL(event.url);
  const code = url.searchParams.get('code');
  await exchangeCodeForTokens(code);
});
```

**Backend Token Exchange** (`backend/server.js`):
```javascript
const { user, accessToken, refreshToken } =
  await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID,
    code: authorizationCode,
  });
```

## Common Issues

### "Invalid redirect_uri" Error

WorkOS doesn't recognize your custom URL scheme.

**Fix:**
1. Check WorkOS Dashboard → Redirect URIs
2. Add: `workosauthdemo://callback`
3. Scheme must match exactly (case-sensitive)

### Callback Not Received

Custom URL scheme not registered in iOS/Android project.

**Fix:**
```bash
pnpm -F capacitor-app build
pnpm sync
```

Check that:
- iOS: `ios/App/App/Info.plist` has `CFBundleURLTypes`
- Android: `android/app/src/main/AndroidManifest.xml` has intent filter

### Backend Connection Fails

Device can't reach `localhost`.

**Fix:**
- iOS Simulator: `localhost` works
- Android Emulator: Use `10.0.2.2` instead of `localhost`
- Real Device: Use ngrok or your machine's IP address

### Xcode Scheme Error

If you get "scheme named 'workosauthdemo' does not exist", the iOS platform has stale configuration.

**Fix:**
```bash
rm -rf capacitor-app/ios
pnpm -F capacitor-app exec cap add ios
pnpm sync:ios
```

## Project Documentation

- [Backend API Documentation](backend/README.md) - API endpoints and testing
- [Capacitor App Implementation](capacitor-app/README.md) - Code walkthrough and platform details

## Security Best Practices

1. **Never store client secret in the app** - Always exchange code on backend
2. **Use secure storage** - Keychain (iOS) / Keystore (Android) for production
3. **Validate state parameter** - Prevent CSRF attacks
4. **Implement token refresh** - Don't force users to re-authenticate
5. **Verify tokens on backend** - Never trust client-provided tokens

## OAuth Protocol Reference

### Step 1: Generate Authorization URL

```
GET https://api.workos.com/user_management/authorize
  ?client_id=client_123
  &redirect_uri=workosauthdemo://callback
  &response_type=code
  &state=abc123
```

### Step 2: User Authenticates

WorkOS AuthKit handles the entire authentication UI.

### Step 3: Receive Callback

WorkOS redirects to:
```
workosauthdemo://callback?code=01ABCDEF...&state=abc123
```

### Step 4: Exchange Code for Tokens (Backend)

```bash
curl -X POST https://api.workos.com/user_management/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client_123",
    "client_secret": "sk_secret_456",
    "code": "01ABCDEF...",
    "grant_type": "authorization_code"
  }'
```

Returns:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "ey_refresh...",
  "user": {
    "id": "user_01...",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Step 5: Refresh Tokens

```bash
curl -X POST https://api.workos.com/user_management/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client_123",
    "client_secret": "sk_secret_456",
    "refresh_token": "ey_refresh...",
    "grant_type": "refresh_token"
  }'
```

## Adapting for Your App

To use this pattern in your own Capacitor app:

1. **Choose your URL scheme** (e.g., `myapp://`)
2. **Update `capacitor.config.ts`**:
   ```typescript
   {
     appId: 'com.mycompany.myapp',
     ios: { scheme: 'myapp' },
     android: { scheme: 'myapp' }
   }
   ```
3. **Update WorkOS redirect URI** to `myapp://callback`
4. **Copy auth logic** from `capacitor-app/src/auth.ts`
5. **Run `cap sync`** to apply changes

## Resources

- [WorkOS AuthKit Documentation](https://workos.com/docs/user-management/authkit)
- [WorkOS User Management API](https://workos.com/docs/reference/user-management)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [OAuth 2.0 for Native Apps (RFC 8252)](https://www.rfc-editor.org/rfc/rfc8252)
