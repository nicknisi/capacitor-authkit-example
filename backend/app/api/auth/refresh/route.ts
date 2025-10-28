import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { AuthRefreshRequest, AuthRefreshResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthRefreshRequest = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      const errorResponse: ErrorResponse = {
        error: 'Missing refresh token',
        message: 'The "refreshToken" parameter is required',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 400 }),
        request
      );
    }

    console.log('Refreshing access token...');

    // Exchange refresh token for new tokens
    const authResult = await workos.userManagement.authenticateWithRefreshToken({
      clientId,
      refreshToken,
    });

    console.log('Token refresh successful for user:', authResult.user.email);

    // Decode JWT to extract roles, permissions, etc.
    let decodedToken: any = {};
    try {
      const parts = authResult.accessToken.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        decodedToken = JSON.parse(payload);
      }
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }

    // Extract data from JWT claims
    // Note: JWT claims can be strings or objects, normalize to objects
    const rawRoles = decodedToken.roles || [];
    const roles = rawRoles.map((r: any) =>
      typeof r === 'string' ? { slug: r, name: r } : r
    );
    const role = roles.length > 0 ? roles[0] : null;

    const rawPermissions = decodedToken.permissions || [];
    const permissions = rawPermissions.map((p: any) =>
      typeof p === 'string' ? { id: p, name: p } : p
    );

    const rawEntitlements = decodedToken.entitlements || [];
    const entitlements = rawEntitlements.map((e: any) =>
      typeof e === 'string' ? { id: e, name: e, value: true } : e
    );

    const rawFeatureFlags = decodedToken.feature_flags || [];
    const featureFlags = rawFeatureFlags.map((f: any) =>
      typeof f === 'string' ? { id: f, name: f, enabled: true } : f
    );

    const response: AuthRefreshResponse = {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        emailVerified: authResult.user.emailVerified,
        profilePictureUrl: authResult.user.profilePictureUrl,
        createdAt: authResult.user.createdAt,
        updatedAt: authResult.user.updatedAt,
      },
      organizationId: authResult.organizationId || null,
      role,
      roles,
      permissions,
      entitlements,
      featureFlags,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error refreshing token:', error);

    const errorResponse: ErrorResponse = {
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: (error as any).rawData || (error as any).response?.data,
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
