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

// Session Types

export interface SessionData {
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
}

export interface UserProfile {
  user: User;
  organizationId: string | null;
  role: Role | null;
  roles: Role[];
  permissions: Permission[];
  entitlements: Entitlement[];
  featureFlags: FeatureFlag[];
  impersonator: Impersonator | null;
}

export interface OrganizationWithMembership {
  organization: Organization;
  membership: OrganizationMembership;
}
