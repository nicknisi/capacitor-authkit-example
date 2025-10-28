import type { Role, Permission, Entitlement, FeatureFlag } from './types';

interface JWTPayload {
  roles?: any[];
  permissions?: any[];
  entitlements?: any[];
  feature_flags?: any[];
  [key: string]: any;
}

export function parseJWT(accessToken: string): JWTPayload {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return {};

    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return {};
  }
}

export function extractSessionData(decodedToken: JWTPayload) {
  const rawRoles = decodedToken.roles || [];
  const roles: Role[] = rawRoles.map((r: any) =>
    typeof r === 'string' ? { slug: r, name: r } : r
  );

  const rawPermissions = decodedToken.permissions || [];
  const permissions: Permission[] = rawPermissions.map((p: any) =>
    typeof p === 'string' ? { id: p, name: p } : p
  );

  const rawEntitlements = decodedToken.entitlements || [];
  const entitlements: Entitlement[] = rawEntitlements.map((e: any) =>
    typeof e === 'string' ? { id: e, name: e, value: true } : e
  );

  const rawFeatureFlags = decodedToken.feature_flags || [];
  const featureFlags: FeatureFlag[] = rawFeatureFlags.map((f: any) =>
    typeof f === 'string' ? { id: f, name: f, enabled: true } : f
  );

  return {
    role: roles.length > 0 ? roles[0] : null,
    roles,
    permissions,
    entitlements,
    featureFlags
  };
}