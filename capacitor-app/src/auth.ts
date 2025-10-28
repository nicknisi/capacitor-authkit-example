import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { CONFIG } from './config';
import type { SessionData, OrganizationWithMembership } from './types/auth';

export type { SessionData, UserProfile, OrganizationWithMembership } from './types/auth';

export class WorkOSAuth {
  private urlListenerRegistered = false;

  constructor() {
    this.setupUrlListener();
  }

  private setupUrlListener() {
    if (this.urlListenerRegistered) return;

    App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
      console.log('📱 App URL opened:', event.url);

      try {
        const url = new URL(event.url);

        if (url.protocol === `${CONFIG.URL_SCHEME}:` && url.host === CONFIG.CALLBACK_PATH) {
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');

          console.log('✅ OAuth callback received');
          console.log('  Code:', code?.substring(0, 10) + '...');
          console.log('  State:', state);

          if (!code) {
            throw new Error('No authorization code in callback URL');
          }

          await Browser.close();
          await this.exchangeCodeForTokens(code);

          window.dispatchEvent(
            new CustomEvent('auth-success', { detail: { code, state } })
          );
        }
      } catch (error) {
        console.error('❌ Error handling app URL:', error);
        window.dispatchEvent(
          new CustomEvent('auth-error', {
            detail: { error: error instanceof Error ? error.message : String(error) }
          })
        );
      }
    });

    this.urlListenerRegistered = true;
  }

  async signIn(): Promise<void> {
    console.log('🚀 Starting OAuth flow...');

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirectUri: CONFIG.REDIRECT_URI,
        state: this.generateState()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get authorization URL: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📝 Authorization URL generated');

    await Browser.open({ url: data.authorizationUrl });
    console.log('🌐 Browser opened with authorization URL');
  }

  private async exchangeCodeForTokens(code: string): Promise<void> {
    console.log('🔄 Exchanging authorization code for tokens...');

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data: SessionData = await response.json();
    console.log('✅ Tokens received');
    console.log('  User:', data.user.email);
    console.log('  Organization:', data.organizationId);
    console.log('  Roles:', data.roles);
    console.log('  Permissions:', data.permissions?.length || 0);

    await this.storeSession(data);
    console.log('💾 Session data stored');
  }

  async refreshToken(): Promise<SessionData> {
    const session = await this.getSession();
    if (!session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing access token...');

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data: SessionData = await response.json();
    await this.storeSession(data);

    console.log('✅ Token refreshed');
    return data;
  }

  async signOut(): Promise<void> {
    try {
      const session = await this.getSession();
      if (!session?.accessToken) {
        await this.clearSession();
        return;
      }

      // Extract session ID from token
      const tokenPayload = JSON.parse(atob(session.accessToken.split('.')[1]));
      const sessionId = tokenPayload.sid;

      if (sessionId) {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/signout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logoutUrl) {
            await Browser.open({ url: data.logoutUrl });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await Browser.close();
            console.log('🔒 Session revoked on WorkOS');
          }
        }
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }

    await this.clearSession();
    console.log('👋 Signed out locally');
  }

  async getSession(): Promise<SessionData | null> {
    const sessionData = await Preferences.get({ key: 'session_data' });
    if (!sessionData.value) return null;

    try {
      return JSON.parse(sessionData.value);
    } catch {
      return null;
    }
  }

  async getUserOrganizations(): Promise<OrganizationWithMembership[]> {
    const session = await this.getSession();
    if (!session) return [];

    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/user/organizations?userId=${session.user.id}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.organizations;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  async switchOrganization(organizationId: string): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/user/switch-org`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        organizationId,
        accessToken: session.accessToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    console.log('✅ Switched to organization:', organizationId);
    await this.refreshToken();
  }

  private async storeSession(session: SessionData): Promise<void> {
    await Preferences.set({
      key: 'session_data',
      value: JSON.stringify(session)
    });
  }

  private async clearSession(): Promise<void> {
    await Preferences.remove({ key: 'session_data' });
    // Clean up legacy keys
    await Preferences.remove({ key: 'access_token' });
    await Preferences.remove({ key: 'refresh_token' });
    await Preferences.remove({ key: 'user' });
    await Preferences.remove({ key: 'organization_id' });
  }

  private generateState(): string {
    return `state_${Math.random().toString(36).substring(2)}`;
  }
}