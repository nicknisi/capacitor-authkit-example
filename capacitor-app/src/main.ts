import { WorkOSAuth, type SessionData, type OrganizationWithMembership } from './auth';

// Initialize the auth service
const auth = new WorkOSAuth();

// Current page state
let currentPage = 'home';
let currentSession: SessionData | null = null;

// DOM elements - Navigation
const navbar = document.getElementById('navbar')!;
const navLinks = document.querySelectorAll('.nav-link');

// DOM elements - Views
const loginView = document.getElementById('loginView')!;
const homeView = document.getElementById('homeView')!;
const accountView = document.getElementById('accountView')!;
const settingsView = document.getElementById('settingsView')!;

// DOM elements - Status
const statusMessage = document.getElementById('statusMessage')!;

// DOM elements - Login page
const loginBtn = document.getElementById('loginBtn')!;

// DOM elements - Home page
const homeUserInfo = document.getElementById('homeUserInfo')!;
const homeRefreshBtn = document.getElementById('homeRefreshBtn')!;
const homeSignOutBtn = document.getElementById('homeSignOutBtn')!;

// DOM elements - Account page
const accountUserInfo = document.getElementById('accountUserInfo')!;
const accountRolesInfo = document.getElementById('accountRolesInfo')!;
const accountOrgInfo = document.getElementById('accountOrgInfo')!;
const accountEntitlementsInfo = document.getElementById('accountEntitlementsInfo')!;

// DOM elements - Settings page
const orgSwitcherContainer = document.getElementById('orgSwitcherContainer')!;
const settingsRefreshBtn = document.getElementById('settingsRefreshBtn')!;
const settingsSignOutBtn = document.getElementById('settingsSignOutBtn')!;
const sessionDebugInfo = document.getElementById('sessionDebugInfo')!;
const tokenClaimsInfo = document.getElementById('tokenClaimsInfo')!;

// Event Handlers - Login
loginBtn.addEventListener('click', handleLogin);

// Event Handlers - Home
homeRefreshBtn.addEventListener('click', handleRefresh);
homeSignOutBtn.addEventListener('click', handleSignOut);

// Event Handlers - Settings
settingsRefreshBtn.addEventListener('click', handleRefresh);
settingsSignOutBtn.addEventListener('click', handleSignOut);

// Event Handlers - Navigation
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = (e.target as HTMLElement).getAttribute('data-page');
    if (page) {
      navigateTo(page);
    }
  });
});

// Listen for auth events
window.addEventListener('auth-success', handleAuthSuccess);
window.addEventListener('auth-error', handleAuthError);

// Handle hash navigation
window.addEventListener('hashchange', handleHashChange);

// Initialize app
init();

async function init() {
  // Check for hash-based navigation
  handleHashChange();

  // Check for existing session
  await checkExistingSession();
}

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  if (hash && currentSession) {
    navigateTo(hash);
  }
}

async function handleLogin() {
  try {
    showStatus('Opening browser for authentication...', 'info');
    loginBtn.setAttribute('disabled', 'true');

    await auth.signIn();
  } catch (error) {
    console.error('Login error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    loginBtn.removeAttribute('disabled');
  }
}

async function handleRefresh() {
  try {
    showStatus('Refreshing session...', 'info');
    homeRefreshBtn.setAttribute('disabled', 'true');
    settingsRefreshBtn.setAttribute('disabled', 'true');

    const session = await auth.refreshToken();
    currentSession = session;

    showStatus('✅ Session refreshed successfully!', 'success');

    // Refresh current page data
    await refreshCurrentPage();
  } catch (error) {
    console.error('Refresh error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  } finally {
    homeRefreshBtn.removeAttribute('disabled');
    settingsRefreshBtn.removeAttribute('disabled');
  }
}

async function handleSignOut() {
  try {
    await auth.signOut();
    currentSession = null;
    showLoginView();
    showStatus('Signed out successfully', 'info');
  } catch (error) {
    console.error('Sign out error:', error);
    showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  }
}

async function handleAuthSuccess(event: Event) {
  const customEvent = event as CustomEvent;
  console.log('Auth success event:', customEvent.detail);

  // Give the token exchange a moment to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  const session = await auth.getSession();
  if (session) {
    currentSession = session;
    showStatus('✅ Authentication successful!', 'success');
    showAuthenticatedView();
  }

  loginBtn.removeAttribute('disabled');
}

function handleAuthError(event: Event) {
  const customEvent = event as CustomEvent;
  console.error('Auth error event:', customEvent.detail);

  showStatus(`Error: ${customEvent.detail.error}`, 'error');
  loginBtn.removeAttribute('disabled');
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
          showAuthenticatedView();
          console.log('✅ Session refreshed on app start');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          showLoginView();
          showStatus('Session expired, please sign in again', 'info');
          return;
        }
      } else {
        showAuthenticatedView();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      showAuthenticatedView();
    }
  }
}

function navigateTo(page: string) {
  currentPage = page;
  window.location.hash = page;

  // Hide all views
  homeView.classList.add('hidden');
  accountView.classList.add('hidden');
  settingsView.classList.add('hidden');

  // Show selected view
  switch (page) {
    case 'home':
      homeView.classList.remove('hidden');
      renderHomePage();
      break;
    case 'account':
      accountView.classList.remove('hidden');
      renderAccountPage();
      break;
    case 'settings':
      settingsView.classList.remove('hidden');
      renderSettingsPage();
      break;
  }

  // Update navigation active state
  navLinks.forEach(link => {
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function refreshCurrentPage() {
  if (currentPage === 'home') {
    renderHomePage();
  } else if (currentPage === 'account') {
    renderAccountPage();
  } else if (currentPage === 'settings') {
    await renderSettingsPage();
  }
}

function showLoginView() {
  navbar.classList.add('hidden');
  loginView.classList.remove('hidden');
  homeView.classList.add('hidden');
  accountView.classList.add('hidden');
  settingsView.classList.add('hidden');
}

function showAuthenticatedView() {
  navbar.classList.remove('hidden');
  loginView.classList.add('hidden');

  // Navigate to home by default
  const hash = window.location.hash.slice(1);
  navigateTo(hash || 'home');
}

function renderHomePage() {
  if (!currentSession) return;

  const { user, organizationId, roles, permissions } = currentSession;

  homeUserInfo.innerHTML = `
    <h3>Welcome, ${user.firstName || user.email}! 👋</h3>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Email Verified:</strong> ${user.emailVerified ? '✅ Yes' : '❌ No'}</p>
    ${organizationId ? `<p><strong>Organization ID:</strong> ${organizationId}</p>` : ''}
    ${roles && roles.length > 0 ? `<p><strong>Roles:</strong> ${roles.map(r => r.name || r.slug).join(', ')}</p>` : ''}
    ${permissions && permissions.length > 0 ? `<p><strong>Permissions:</strong> ${permissions.length} permission(s)</p>` : ''}
  `;
}

function renderAccountPage() {
  if (!currentSession) return;

  const { user, organizationId, role, roles, permissions, entitlements, featureFlags } = currentSession;

  // User Info
  accountUserInfo.innerHTML = `
    <p><strong>ID:</strong> ${user.id}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>First Name:</strong> ${user.firstName || 'N/A'}</p>
    <p><strong>Last Name:</strong> ${user.lastName || 'N/A'}</p>
    <p><strong>Email Verified:</strong> ${user.emailVerified ? '✅ Yes' : '❌ No'}</p>
    ${user.profilePictureUrl ? `<p><strong>Profile Picture:</strong> <a href="${user.profilePictureUrl}" target="_blank">View</a></p>` : ''}
    <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
    <p><strong>Updated:</strong> ${new Date(user.updatedAt).toLocaleDateString()}</p>
  `;

  // Roles & Permissions
  if (roles && roles.length > 0) {
    accountRolesInfo.innerHTML = `
      <h4>Roles</h4>
      <ul>
        ${roles.map(r => `<li><strong>${r.name || r.slug}</strong> <span class="badge">Role</span></li>`).join('')}
      </ul>
      ${permissions && permissions.length > 0 ? `
        <h4 style="margin-top: 16px;">Permissions (${permissions.length})</h4>
        <ul>
          ${permissions.map(p => `<li>${p.name || p.id}</li>`).join('')}
        </ul>
      ` : ''}
    `;
  } else {
    accountRolesInfo.innerHTML = '<p class="text-muted">No roles assigned</p>';
  }

  // Organization
  if (organizationId) {
    accountOrgInfo.innerHTML = `
      <p><strong>Organization ID:</strong> ${organizationId}</p>
      ${role ? `<p><strong>Current Role:</strong> ${role.name || role.slug}</p>` : ''}
    `;
  } else {
    accountOrgInfo.innerHTML = '<p class="text-muted">Not part of an organization</p>';
  }

  // Entitlements & Feature Flags
  if ((entitlements && entitlements.length > 0) || (featureFlags && featureFlags.length > 0)) {
    let html = '';

    if (entitlements && entitlements.length > 0) {
      html += `
        <h4>Entitlements (${entitlements.length})</h4>
        <ul>
          ${entitlements.map(e => `<li><strong>${e.name}</strong>: ${e.value}</li>`).join('')}
        </ul>
      `;
    }

    if (featureFlags && featureFlags.length > 0) {
      html += `
        <h4 style="margin-top: 16px;">Feature Flags (${featureFlags.length})</h4>
        <ul>
          ${featureFlags.map(f => `<li>${f.name}: ${f.enabled ? '✅ Enabled' : '❌ Disabled'}</li>`).join('')}
        </ul>
      `;
    }

    accountEntitlementsInfo.innerHTML = html;
  } else {
    accountEntitlementsInfo.innerHTML = '<p class="text-muted">No entitlements or feature flags</p>';
  }
}

async function renderSettingsPage() {
  if (!currentSession) return;

  // Render organization switcher
  await renderOrganizationSwitcher();

  // Render session debug info
  sessionDebugInfo.textContent = JSON.stringify({
    userId: currentSession.user.id,
    email: currentSession.user.email,
    organizationId: currentSession.organizationId,
    hasAccessToken: !!currentSession.accessToken,
    hasRefreshToken: !!currentSession.refreshToken,
    rolesCount: currentSession.roles?.length || 0,
    permissionsCount: currentSession.permissions?.length || 0,
    entitlementsCount: currentSession.entitlements?.length || 0,
    featureFlagsCount: currentSession.featureFlags?.length || 0,
  }, null, 2);

  // Render token claims
  try {
    const parts = currentSession.accessToken.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
      const claims = JSON.parse(payload);
      tokenClaimsInfo.textContent = JSON.stringify(claims, null, 2);
    }
  } catch (e) {
    tokenClaimsInfo.textContent = 'Unable to decode token claims';
  }
}

async function renderOrganizationSwitcher() {
  if (!currentSession) return;

  orgSwitcherContainer.innerHTML = '<div class="loading">Loading organizations...</div>';

  try {
    const organizations = await auth.getUserOrganizations();

    if (organizations.length === 0) {
      orgSwitcherContainer.innerHTML = '<p class="text-muted">You are not part of any organizations</p>';
      return;
    }

    let html = '<div class="org-list">';

    for (const { organization, membership } of organizations) {
      const isActive = currentSession.organizationId === organization.id;
      html += `
        <div class="org-item ${isActive ? 'active' : ''}" data-org-id="${organization.id}">
          <div class="org-name">${organization.name}${isActive ? ' <span class="badge">Current</span>' : ''}</div>
          <div class="org-role">Role: ${membership.role.name || membership.role.slug} • Status: ${membership.status}</div>
        </div>
      `;
    }

    html += '</div>';
    orgSwitcherContainer.innerHTML = html;

    // Add click handlers for org switching
    const orgItems = orgSwitcherContainer.querySelectorAll('.org-item');
    orgItems.forEach(item => {
      item.addEventListener('click', async () => {
        const orgId = item.getAttribute('data-org-id');
        if (orgId && orgId !== currentSession?.organizationId) {
          await handleOrganizationSwitch(orgId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading organizations:', error);
    orgSwitcherContainer.innerHTML = '<p class="text-muted">Failed to load organizations</p>';
  }
}

async function handleOrganizationSwitch(organizationId: string) {
  try {
    showStatus('Switching organization...', 'info');
    await auth.switchOrganization(organizationId);

    // Get updated session
    currentSession = await auth.getSession();

    showStatus('✅ Organization switched successfully!', 'success');

    // Refresh settings page
    await renderSettingsPage();

    // Refresh other pages if needed
    if (currentPage === 'home') {
      renderHomePage();
    } else if (currentPage === 'account') {
      renderAccountPage();
    }
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
