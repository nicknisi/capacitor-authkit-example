import { NextRequest, NextResponse } from 'next/server';
import { workos, extractBearerToken, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { UserProfileResponse, ErrorResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const authHeader = request.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      const errorResponse: ErrorResponse = {
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 401 }),
        request
      );
    }

    // Verify the token and get user info
    const user = await workos.userManagement.getUser({
      accessToken,
    });

    // Decode JWT to extract additional claims
    let decodedToken: any = {};
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        decodedToken = JSON.parse(payload);
      }
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }

    const roles = decodedToken.roles || [];
    const role = roles.length > 0 ? roles[0] : null;
    const permissions = decodedToken.permissions || [];
    const entitlements = decodedToken.entitlements || [];
    const featureFlags = decodedToken.feature_flags || [];
    const organizationId = decodedToken.org_id || null;

    const response: UserProfileResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        profilePictureUrl: user.profilePictureUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organizationId,
      role,
      roles,
      permissions,
      entitlements,
      featureFlags,
      impersonator: null, // Impersonation info would need to be extracted from token if present
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error fetching user profile:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch user profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 401 }),
      request
    );
  }
}
