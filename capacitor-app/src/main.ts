import { WorkOSAuth, type SessionData } from './auth';

// Initialize the auth service
const auth = new WorkOSAuth();

// Current session state
let currentSession: SessionData | null = null;

// DOM elements
const statusMessage = document.getElementById('statusMessage')!;
const mainContent = document.getElementById('mainContent')!;

// Listen for auth events
window.addEventListener('auth-success', handleAuthSuccess);
window.addEventListener('auth-error', handleAuthError);

// Initialize app
init();

async function init() {
  await checkExistingSession();
}

async function handleAuthSuccess(event: Event) {
  const customEvent = event as CustomEvent;
  console.log('Auth success event:', customEvent.detail);

  // Give the token exchange a moment to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  const session = await auth.getSession();
  if (session) {
    currentSession = session;
    showStatus('✅ Authentication successful!', 'success');
    renderLoggedInState();
  }
}

function handleAuthError(event: Event) {
  const customEvent = event as CustomEvent;
  console.error('Auth error event:', customEvent.detail);
  showStatus(`Error: ${customEvent.detail.error}`, 'error');
}

async function checkExistingSession() {
  const session = await auth.getSession();
  if (session) {
    console.log('Found existing session');
    currentSession = session;

    // Check if token is expired or about to expire (within 5 minutes)
    try {
      const tokenPayload = JSON.parse(atob(session.accessToken.split('.')[1]));
      const expiresAt = tokenPayload.exp * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes) {
        console.log('Token expired or expiring soon, refreshing...');
        showStatus('Refreshing session...', 'info');

        try {
          currentSession = await auth.refreshToken();
          renderLoggedInState();
          console.log('✅ Session refreshed on app start');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          currentSession = null;
          renderLoginState();
          showStatus('Session expired, please sign in again', 'info');
          return;
        }
      } else {
        renderLoggedInState();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      renderLoggedInState();
    }
  } else {
    renderLoginState();
  }
}

function renderLoginState() {
  mainContent.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>🔐 WorkOS AuthKit</h1>
        <p class="subtitle">Capacitor Mobile OAuth Demo</p>
      </div>

      <div class="info-card">
        <h3>📱 Mobile OAuth Flow</h3>
        <p>This demo shows WorkOS AuthKit in a Capacitor mobile app with:</p>
        <ul>
          <li><strong>Custom URL Scheme:</strong> workosauthdemo://</li>
          <li><strong>System Browser OAuth:</strong> Secure authentication flow</li>
          <li><strong>Next.js Backend:</strong> Token exchange with roles & permissions</li>
          <li><strong>Enhanced Session:</strong> RBAC, organizations, entitlements</li>
        </ul>
      </div>

      <button id="loginBtn" class="primary-btn">
        Sign In with WorkOS
      </button>

      <div class="info-card">
        <h4>What happens when you sign in:</h4>
        <ol>
          <li>App opens system browser with WorkOS AuthKit</li>
          <li>You authenticate using WorkOS</li>
          <li>WorkOS redirects to: <code>workosauthdemo://callback?code=...</code></li>
          <li>iOS/Android intercepts URL and returns to app</li>
          <li>App sends code to Next.js backend</li>
          <li>Backend exchanges code for tokens with full user data</li>
        </ol>
      </div>
    </div>
  `;

  // Add login button handler
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
}

function renderLoggedInState() {
  if (!currentSession) return;

  const { user, organizationId, role, roles, permissions, entitlements, featureFlags } = currentSession;

  // Build profile section
  const profileHtml = `
    <div class="section">
      <h3>👤 Profile Information</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Name</span>
          <span class="value">${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</span>
        </div>
        <div class="info-item">
          <span class="label">Email</span>
          <span class="value">${user.email} ${user.emailVerified ? '✅' : '⚠️'}</span>
        </div>
        <div class="info-item">
          <span class="label">User ID</span>
          <span class="value code">${user.id}</span>
        </div>
        ${user.profilePictureUrl ? `
        <div class="info-item">
          <span class="label">Avatar</span>
          <img src="${user.profilePictureUrl}" alt="Profile" class="avatar-small">
        </div>` : ''}
      </div>
    </div>
  `;

  // Build organization section
  const orgHtml = organizationId ? `
    <div class="section">
      <h3>🏢 Organization</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Organization ID</span>
          <span class="value code">${organizationId}</span>
        </div>
        ${role ? `
        <div class="info-item">
          <span class="label">Current Role</span>
          <span class="value">${role.name || role.slug}</span>
        </div>` : ''}
      </div>
      <div id="orgSwitcher" class="org-switcher-section"></div>
    </div>
  ` : '';

  // Build roles and permissions section
  let rolesHtml = '';
  if (roles && roles.length > 0) {
    rolesHtml = `
    <div class="section">
      <h3>🛡️ Roles & Permissions</h3>
      <div class="roles-grid">
        ${roles.map(r => `
          <div class="role-card">
            <span class="role-name">${r.name || r.slug}</span>
          </div>
        `).join('')}
      </div>
      ${permissions && permissions.length > 0 ? `
        <div class="permissions-list">
          <h4>Permissions (${permissions.length})</h4>
          <div class="permissions-grid">
            ${permissions.map(p => `
              <span class="permission-badge">${p.name || p.id}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    `;
  }

  // Build entitlements and feature flags section
  let entitlementsHtml = '';
  if ((entitlements && entitlements.length > 0) || (featureFlags && featureFlags.length > 0)) {
    entitlementsHtml = '<div class="section"><h3>⚡ Entitlements & Features</h3><div class="features-grid">';

    if (entitlements && entitlements.length > 0) {
      entitlementsHtml += entitlements.map(e => `
        <div class="feature-card">
          <span class="feature-name">${e.name}</span>
          <span class="feature-value">${e.value}</span>
        </div>
      `).join('');
    }

    if (featureFlags && featureFlags.length > 0) {
      entitlementsHtml += featureFlags.map(f => `
        <div class="feature-card ${f.enabled ? 'enabled' : 'disabled'}">
          <span class="feature-name">${f.name}</span>
          <span class="feature-status">${f.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
        </div>
      `).join('');
    }

    entitlementsHtml += '</div></div>';
  }

  // Render the main content
  mainContent.innerHTML = `
    <div class="container logged-in">
      <div class="header">
        <h1>🔐 WorkOS AuthKit</h1>
        <p class="subtitle">Welcome back!</p>
      </div>

      <div class="user-card main-card">
        ${profileHtml}
        ${orgHtml}
        ${rolesHtml}
        ${entitlementsHtml}

        <div class="section actions">
          <div class="button-group">
            <button id="refreshBtn" class="secondary-btn">
              🔄 Refresh Session
            </button>
            <button id="signOutBtn" class="danger-btn">
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event handlers
  const refreshBtn = document.getElementById('refreshBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }

  // Load organization switcher if applicable
  if (organizationId) {
    loadOrganizationSwitcher();
  }
}

async function loadOrganizationSwitcher() {
  const orgSwitcher = document.getElementById('orgSwitcher');
  if (!orgSwitcher || !currentSession) return;

  try {
    const organizations = await auth.getUserOrganizations();

    if (organizations.length <= 1) {
      return; // No need for switcher if only one org
    }

    let html = '<h4>Switch Organization</h4><div class="org-list">';

    for (const { organization, membership } of organizations) {
      const isActive = currentSession.organizationId === organization.id;
      html += `
        <div class="org-item ${isActive ? 'active' : ''}" data-org-id="${organization.id}">
          <div class="org-info">
            <span class="org-name">${organization.name}</span>
            ${isActive ? '<span class="badge active">Current</span>' : ''}
          </div>
          <span class="org-role">${membership.role.name || membership.role.slug}</span>
        </div>
      `;
    }

    html += '</div>';
    orgSwitcher.innerHTML = html;

    // Add click handlers
    const orgItems = orgSwitcher.querySelectorAll('.org-item:not(.active)');
    orgItems.forEach(item => {
      item.addEventListener('click', async () => {
        const orgId = item.getAttribute('data-org-id');
        if (orgId) {
          await handleOrganizationSwitch(orgId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading organizations:', error);
  }
}

async function handleLogin() {
  try {
    showStatus('Opening browser for authentication...', 'info');
    const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    if (loginBtn) {
      loginBtn.disabled = true;
    }

    await auth.signIn();
  } catch (error) {
    console.error('Login error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    if (loginBtn) {
      loginBtn.disabled = false;
    }
  }
}

async function handleRefresh() {
  try {
    showStatus('Refreshing session...', 'info');
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    if (refreshBtn) {
      refreshBtn.disabled = true;
    }

    const session = await auth.refreshToken();
    currentSession = session;

    showStatus('✅ Session refreshed successfully!', 'success');
    renderLoggedInState();
  } catch (error) {
    console.error('Refresh error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  } finally {
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    if (refreshBtn) {
      refreshBtn.disabled = false;
    }
  }
}

async function handleSignOut() {
  try {
    await auth.signOut();
    currentSession = null;
    renderLoginState();
    showStatus('Signed out successfully', 'info');
  } catch (error) {
    console.error('Sign out error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

async function handleOrganizationSwitch(organizationId: string) {
  try {
    showStatus('Switching organization...', 'info');
    await auth.switchOrganization(organizationId);

    // Get updated session
    currentSession = await auth.getSession();

    showStatus('✅ Organization switched successfully!', 'success');
    renderLoggedInState();
  } catch (error) {
    console.error('Error switching organization:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

function showStatus(message: string, type: 'success' | 'error' | 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 5000);
  }
}