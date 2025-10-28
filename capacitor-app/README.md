# Capacitor App

WorkOS AuthKit mobile OAuth demo using custom URL schemes.

## How It Works

1. App opens system browser with WorkOS
2. User authenticates
3. WorkOS redirects to `workosauthdemo://callback?code=...`
4. OS returns to app with URL
5. App exchanges code for tokens via backend

## Key Files

- `src/auth.ts` - OAuth implementation
- `src/config.ts` - Backend URL configuration
- `capacitor.config.ts` - App configuration
- `ios/App/App/Info.plist` - iOS URL scheme config
- `android/app/src/main/AndroidManifest.xml` - Android URL scheme config

## Running

```bash
# Build web assets
pnpm build

# Sync to platforms
pnpm sync:ios     # iOS
pnpm sync:android # Android

# Open in IDE
pnpm open:ios     # Xcode
pnpm open:android # Android Studio

# Or run directly
pnpm run:ios
pnpm run:android
```

## Configuration

Update `src/config.ts` for different environments:

- iOS Simulator: `http://localhost:3001`
- Android Emulator: `http://10.0.2.2:3001`
- Real Device: Your IP or ngrok URL

## OAuth Flow

```typescript
// 1. Listen for callback
App.addListener('appUrlOpen', async (event) => {
  const code = new URL(event.url).searchParams.get('code');
  await exchangeCodeForTokens(code);
});

// 2. Open browser
await Browser.open({ url: authorizationUrl });

// 3. Exchange code on backend
const response = await fetch('/api/auth/callback', {
  body: JSON.stringify({ code })
});
```

## Plugins

- `@capacitor/app` - URL callback handling
- `@capacitor/browser` - System browser
- `@capacitor/preferences` - Token storage

## Troubleshooting

**Callback not received**: Check that `workosauthdemo://` is configured in Info.plist (iOS) or AndroidManifest.xml (Android)

**Invalid redirect_uri**: Add `workosauthdemo://callback` to WorkOS Dashboard

**Backend connection fails**: Use ngrok or machine IP for real devices

## Adapting for Your App

1. Install Capacitor plugins
2. Copy `src/auth.ts` and `src/config.ts`
3. Update URL scheme in Info.plist (iOS) and AndroidManifest.xml (Android)
4. Add redirect URI to WorkOS Dashboard
5. Run `cap sync`