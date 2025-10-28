# Capacitor App

Capacitor mobile app demonstrating WorkOS AuthKit integration with custom URL schemes.

## How Mobile OAuth Works

Mobile apps can't handle HTTP redirects like web apps. Instead, they use custom URL schemes:

1. App opens system browser with WorkOS URL
2. User authenticates in browser
3. WorkOS redirects to custom scheme: `workosauthdemo://callback?code=...`
4. OS intercepts the URL and returns to your app
5. App receives URL via callback listener
6. App sends code to backend for token exchange

## Key Implementation Files

### src/auth.ts

Core authentication logic. This is the heart of the mobile OAuth implementation.

```typescript
// 1. Register URL callback listener
App.addListener('appUrlOpen', async (event) => {
  const url = new URL(event.url);
  const code = url.searchParams.get('code');
  await exchangeCodeForTokens(code);
});

// 2. Start auth flow
export async function login() {
  const authUrl = await getAuthorizationUrl();
  await Browser.open({ url: authUrl });
}

// 3. Exchange code for tokens
async function exchangeCodeForTokens(code: string) {
  const response = await fetch(`${CONFIG.BACKEND_URL}/auth/callback`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  const { accessToken, user } = await response.json();
  await Preferences.set({ key: 'access_token', value: accessToken });
}
```

**Key points:**
- `App.addListener` must be registered before opening the browser
- `Browser.open()` opens the system browser (Safari on iOS, Chrome on Android)
- Browser automatically closes when redirect happens
- Code exchange happens on backend to protect client secret

### src/config.ts

Configuration for backend URL and URL scheme.

```typescript
export const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  URL_SCHEME: 'workosauthdemo',
  REDIRECT_URI: 'workosauthdemo://callback'
};
```

**Important:** Update `BACKEND_URL` for different environments:
- iOS Simulator: `http://localhost:3001`
- Android Emulator: `http://10.0.2.2:3001`
- Real Device: `http://YOUR_IP:3001` or ngrok URL

### capacitor.config.ts

Registers the custom URL scheme with iOS and Android.

```typescript
const config: CapacitorConfig = {
  appId: 'com.workos.authdemo',
  appName: 'WorkOS Auth Demo',
  webDir: 'dist',
  ios: {
    scheme: 'workosauthdemo'
  },
  android: {
    scheme: 'workosauthdemo'
  }
};
```

When you run `cap sync`, Capacitor automatically:
- Adds URL scheme to iOS `Info.plist`
- Adds intent filter to Android `AndroidManifest.xml`

### Platform-Specific Configuration

**iOS** (`ios-url-scheme.xml`):

This shows what gets added to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.workos.authdemo</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>workosauthdemo</string>
    </array>
  </dict>
</array>
```

**Android** (`android-intent-filter.xml`):

This shows what gets added to `AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="workosauthdemo" android:host="callback" />
</intent-filter>
```

## Running

From workspace root:

```bash
# Build web assets
pnpm -F capacitor-app build

# Sync to platforms
pnpm sync:ios     # iOS only
pnpm sync:android # Android only
pnpm sync         # Both

# Run on device
pnpm -F capacitor-app run:ios
pnpm -F capacitor-app run:android
```

## Development Workflow

### Making Code Changes

1. Edit files in `src/`
2. Build: `pnpm build`
3. Sync: `pnpm sync`
4. Run from Xcode/Android Studio

### Live Reload (Web Only)

For faster development of UI:

```bash
pnpm dev
```

This runs Vite dev server with hot reload. Test OAuth flow on native devices after.

### Testing on Real Devices

Update `src/config.ts` with your machine's IP or ngrok URL:

```typescript
export const CONFIG = {
  BACKEND_URL: 'https://abc123.ngrok.io',  // ngrok URL
  // or
  BACKEND_URL: 'http://192.168.1.100:3001',  // Your IP
};
```

Then rebuild and sync:

```bash
pnpm build
pnpm sync
```

## Capacitor Plugins Used

### @capacitor/app

Handles URL callbacks from OAuth redirect.

```typescript
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', (event) => {
  // event.url = "workosauthdemo://callback?code=..."
  console.log('Received URL:', event.url);
});
```

### @capacitor/browser

Opens system browser for authentication.

```typescript
import { Browser } from '@capacitor/browser';

await Browser.open({
  url: 'https://api.workos.com/user_management/authorize?...'
});
```

Browser automatically closes when redirect occurs.

### @capacitor/preferences

Stores tokens on device.

```typescript
import { Preferences } from '@capacitor/preferences';

// Store
await Preferences.set({
  key: 'access_token',
  value: token
});

// Retrieve
const { value } = await Preferences.get({ key: 'access_token' });

// Delete
await Preferences.remove({ key: 'access_token' });
```

**Production Note:** For production apps, use secure storage:
- iOS: `@capacitor-community/secure-storage-plugin` (Keychain)
- Android: `@capacitor-community/secure-storage-plugin` (Keystore)

## Authentication Flow Walkthrough

### 1. User Clicks "Sign In"

```typescript
// main.ts
document.getElementById('login').addEventListener('click', async () => {
  await login();
});
```

### 2. Get Authorization URL from Backend

```typescript
// auth.ts
async function getAuthorizationUrl() {
  const response = await fetch(`${CONFIG.BACKEND_URL}/auth/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirectUri: CONFIG.REDIRECT_URI
    })
  });
  const { authorizationUrl } = await response.json();
  return authorizationUrl;
}
```

### 3. Open System Browser

```typescript
await Browser.open({ url: authorizationUrl });
```

iOS uses Safari, Android uses Chrome.

### 4. User Authenticates

User completes authentication in WorkOS AuthKit (running in the browser).

### 5. WorkOS Redirects

After successful authentication, WorkOS redirects to:
```
workosauthdemo://callback?code=01ABCDEF...&state=xyz
```

### 6. App Receives Callback

```typescript
App.addListener('appUrlOpen', async (event) => {
  if (event.url.includes('callback')) {
    const url = new URL(event.url);
    const code = url.searchParams.get('code');
    await exchangeCodeForTokens(code);
  }
});
```

### 7. Exchange Code for Tokens

```typescript
async function exchangeCodeForTokens(code: string) {
  const response = await fetch(`${CONFIG.BACKEND_URL}/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  const { accessToken, refreshToken, user } = await response.json();

  // Store tokens
  await Preferences.set({ key: 'access_token', value: accessToken });
  await Preferences.set({ key: 'refresh_token', value: refreshToken });

  // Update UI
  displayUserInfo(user);
}
```

### 8. Use Access Token

```typescript
async function callProtectedAPI() {
  const { value: token } = await Preferences.get({ key: 'access_token' });

  const response = await fetch(`${CONFIG.BACKEND_URL}/api/protected`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}
```

## Common Issues

### Callback Not Received

**Problem:** URL listener doesn't fire after authentication.

**Solutions:**
1. Ensure `App.addListener` is called before opening browser
2. Check URL scheme is registered: `cap sync`
3. Verify WorkOS Dashboard has correct redirect URI
4. Check iOS/Android configuration files

### "Invalid redirect_uri"

**Problem:** WorkOS rejects the redirect URI.

**Solution:** Add `workosauthdemo://callback` to WorkOS Dashboard → Redirect URIs

### Backend Connection Fails

**Problem:** Cannot reach backend from device.

**Solutions:**
- iOS Simulator: Use `localhost`
- Android Emulator: Use `10.0.2.2` instead of `localhost`
- Real Device: Use ngrok or your machine's IP

### Browser Doesn't Close

**Expected behavior.** The browser may stay open, but your app comes to foreground and handles the callback. You can close the browser manually if desired.

## Security Best Practices

1. **Never store client secret in app** - Keep it on backend
2. **Use state parameter** - Prevent CSRF attacks
3. **Implement token refresh** - Don't force re-authentication
4. **Use secure storage in production** - Not Preferences
5. **Validate tokens on backend** - Don't trust client tokens
6. **Use HTTPS in production** - Protect token transmission

## Adapting for Your App

To use this in your own Capacitor app:

1. **Install Capacitor plugins:**
   ```bash
   npm install @capacitor/app @capacitor/browser @capacitor/preferences
   ```

2. **Copy `src/auth.ts` and `src/config.ts`**

3. **Update `capacitor.config.ts`:**
   ```typescript
   {
     ios: { scheme: 'myapp' },
     android: { scheme: 'myapp' }
   }
   ```

4. **Update WorkOS redirect URI:** `myapp://callback`

5. **Register listener in your app:**
   ```typescript
   import { setupAuthListener } from './auth';
   setupAuthListener();
   ```

6. **Sync and run:**
   ```bash
   npx cap sync
   ```

## File Structure

```
capacitor-app/
├── src/
│   ├── auth.ts          # OAuth implementation
│   ├── config.ts        # Configuration
│   └── main.ts          # App entry point
├── capacitor.config.ts  # Capacitor configuration
├── ios/                 # iOS native project
├── android/             # Android native project
└── dist/                # Built web assets
```

## Testing Checklist

- [ ] Backend is running and accessible
- [ ] WorkOS credentials are configured
- [ ] Redirect URI added to WorkOS Dashboard
- [ ] URL scheme matches in all configurations
- [ ] Web assets built (`pnpm build`)
- [ ] Native platforms synced (`pnpm sync`)
- [ ] Can open browser and see WorkOS AuthKit
- [ ] Can authenticate and receive callback
- [ ] Tokens are stored correctly
- [ ] Can use tokens with protected endpoints

## Resources

- [Capacitor App API](https://capacitorjs.com/docs/apis/app) - URL handling
- [Capacitor Browser API](https://capacitorjs.com/docs/apis/browser) - Opening browser
- [Capacitor Preferences API](https://capacitorjs.com/docs/apis/preferences) - Storage
- [WorkOS AuthKit](https://workos.com/docs/user-management/authkit) - Authentication
- [RFC 8252: OAuth for Native Apps](https://www.rfc-editor.org/rfc/rfc8252) - OAuth specification
