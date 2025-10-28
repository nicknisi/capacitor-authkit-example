// User Management Types

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  slug: string;
  name: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Entitlement {
  id: string;
  name: string;
  value: string | number | boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  domainData?: Array<{
    domain: string;
    verified: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Impersonator {
  email: string;
  reason: string | null;
}

// API Request/Response Types

export interface AuthUrlRequest {
  redirectUri: string;
  state?: string;
  organizationId?: string;
}

export interface AuthUrlResponse {
  authorizationUrl: string;
}

export interface AuthCallbackRequest {
  code: string;
}

export interface AuthCallbackResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  organizationId: string | null;
  role: Role | null;
  roles: Role[];
  permissions: Permission[];
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
  impersonator: Impersonator | null;
  authenticationMethod: string;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  organizationId: string | null;
  role: Role | null;
  roles: Role[];
  permissions: Permission[];
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
}

export interface AuthVerifyRequest {
  accessToken: string;
}

export interface AuthVerifyResponse {
  valid: boolean;
  user: User;
  organizationId: string | null;
}

export interface UserProfileResponse {
  user: User;
  organizationId: string | null;
  role: Role | null;
  roles: Role[];
  permissions: Permission[];
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
  impersonator: Impersonator | null;
}

export interface SwitchOrganizationRequest {
  userId: string;
  organizationId: string;
  accessToken: string;
}

export interface SwitchOrganizationResponse {
  success: boolean;
  organizationId: string;
  role: Role | null;
}

export interface UserOrganizationsRequest {
  userId: string;
}

export interface UserOrganizationsResponse {
  organizations: Array<{
    organization: Organization;
    membership: OrganizationMembership;
  }>;
}

export interface SignOutRequest {
  sessionId?: string;
}

export interface SignOutResponse {
  success: boolean;
  logoutUrl?: string;
}

// Error Response Type

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}
