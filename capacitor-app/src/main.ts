import { WorkOSAuth, type SessionData } from './auth';

const auth = new WorkOSAuth();
let currentSession: SessionData | null = null;

const statusMessage = document.getElementById('statusMessage')!;
const mainContent = document.getElementById('mainContent')!;

window.addEventListener('auth-success', handleAuthSuccess);
window.addEventListener('auth-error', handleAuthError);

init();

async function init() {
  await checkExistingSession();
}

async function handleAuthSuccess(event: Event) {
  const customEvent = event as CustomEvent;
  console.log('Auth success:', customEvent.detail);

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
  console.error('Auth error:', customEvent.detail);
  showStatus(`Error: ${customEvent.detail.error}`, 'error');
}

async function checkExistingSession() {
  const session = await auth.getSession();
  if (!session) {
    renderLoginState();
    return;
  }

  currentSession = session;

  // Check token expiration
  try {
    const tokenPayload = JSON.parse(atob(session.accessToken.split('.')[1]));
    const expiresAt = tokenPayload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - Date.now() < fiveMinutes) {
      console.log('Token expiring soon, refreshing...');
      showStatus('Refreshing session...', 'info');

      try {
        currentSession = await auth.refreshToken();
        console.log('✅ Session refreshed');
      } catch (error) {
        console.error('Failed to refresh:', error);
        currentSession = null;
        renderLoginState();
        showStatus('Session expired, please sign in again', 'info');
        return;
      }
    }
  } catch (error) {
    console.error('Error checking token:', error);
  }

  renderLoggedInState();
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

      <button id="loginBtn" class="primary-btn">Sign In with WorkOS</button>

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

  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
}

function renderLoggedInState() {
  if (!currentSession) return;

  const { user, organizationId, role, roles, permissions, entitlements, featureFlags } = currentSession;

  mainContent.innerHTML = `
    <div class="container logged-in">
      <div class="header">
        <h1>🔐 WorkOS AuthKit</h1>
        <p class="subtitle">Welcome back!</p>
      </div>

      <div class="user-card main-card">
        ${renderProfile(user)}
        ${organizationId ? renderOrganization(organizationId, role) : ''}
        ${renderRolesAndPermissions(roles, permissions)}
        ${renderEntitlementsAndFeatures(entitlements, featureFlags)}

        <div class="section actions">
          <div class="button-group">
            <button id="refreshBtn" class="secondary-btn">🔄 Refresh Session</button>
            <button id="signOutBtn" class="danger-btn">🚪 Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('refreshBtn')?.addEventListener('click', handleRefresh);
  document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);

  if (organizationId) {
    loadOrganizationSwitcher();
  }
}

function renderProfile(user: SessionData['user']) {
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user.email;

  return `
    <div class="section">
      <h3>👤 Profile Information</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Name</span>
          <span class="value">${displayName}</span>
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
}

function renderOrganization(organizationId: string, role: SessionData['role']) {
  return `
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
  `;
}

function renderRolesAndPermissions(roles: SessionData['roles'], permissions: SessionData['permissions']) {
  if (!roles?.length) return '';

  return `
    <div class="section">
      <h3>🛡️ Roles & Permissions</h3>
      <div class="roles-grid">
        ${roles.map(r => `
          <div class="role-card">
            <span class="role-name">${r.name || r.slug}</span>
          </div>
        `).join('')}
      </div>
      ${permissions?.length ? `
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

function renderEntitlementsAndFeatures(
  entitlements: SessionData['entitlements'],
  featureFlags: SessionData['featureFlags']
) {
  if (!entitlements?.length && !featureFlags?.length) return '';

  let html = '<div class="section"><h3>⚡ Entitlements & Features</h3><div class="features-grid">';

  if (entitlements?.length) {
    html += entitlements.map(e => `
      <div class="feature-card">
        <span class="feature-name">${e.name}</span>
        <span class="feature-value">${e.value}</span>
      </div>
    `).join('');
  }

  if (featureFlags?.length) {
    html += featureFlags.map(f => `
      <div class="feature-card ${f.enabled ? 'enabled' : 'disabled'}">
        <span class="feature-name">${f.name}</span>
        <span class="feature-status">${f.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
      </div>
    `).join('');
  }

  return html + '</div></div>';
}

async function loadOrganizationSwitcher() {
  const orgSwitcher = document.getElementById('orgSwitcher');
  if (!orgSwitcher || !currentSession) return;

  try {
    const organizations = await auth.getUserOrganizations();
    if (organizations.length <= 1) return;

    orgSwitcher.innerHTML = `
      <h4>Switch Organization</h4>
      <div class="org-list">
        ${organizations.map(({ organization, membership }) => {
          const isActive = currentSession!.organizationId === organization.id;
          return `
            <div class="org-item ${isActive ? 'active' : ''}" data-org-id="${organization.id}">
              <div class="org-info">
                <span class="org-name">${organization.name}</span>
                ${isActive ? '<span class="badge active">Current</span>' : ''}
              </div>
              <span class="org-role">${membership.role.name || membership.role.slug}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    orgSwitcher.querySelectorAll('.org-item:not(.active)').forEach(item => {
      item.addEventListener('click', async () => {
        const orgId = item.getAttribute('data-org-id');
        if (orgId) await handleOrganizationSwitch(orgId);
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
    if (loginBtn) loginBtn.disabled = true;

    await auth.signIn();
  } catch (error) {
    console.error('Login error:', error);
    showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    if (loginBtn) loginBtn.disabled = false;
  }
}

async function handleRefresh() {
  try {
    showStatus('Refreshing session...', 'info');
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    if (refreshBtn) refreshBtn.disabled = true;

    currentSession = await auth.refreshToken();
    showStatus('✅ Session refreshed successfully!', 'success');
    renderLoggedInState();
  } catch (error) {
    console.error('Refresh error:', error);
    showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    if (refreshBtn) refreshBtn.disabled = false;
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
    showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

async function handleOrganizationSwitch(organizationId: string) {
  try {
    showStatus('Switching organization...', 'info');
    await auth.switchOrganization(organizationId);
    currentSession = await auth.getSession();
    showStatus('✅ Organization switched successfully!', 'success');
    renderLoggedInState();
  } catch (error) {
    console.error('Error switching organization:', error);
    showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

function showStatus(message: string, type: 'success' | 'error' | 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');

  if (type === 'success' || type === 'error') {
    setTimeout(() => statusMessage.classList.add('hidden'), 5000);
  }
}