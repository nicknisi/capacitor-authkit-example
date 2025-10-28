import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { AuthCallbackRequest, AuthCallbackResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthCallbackRequest = await request.json();
    const { code } = body;

    if (!code) {
      const errorResponse: ErrorResponse = {
        error: 'Missing authorization code',
        message: 'The "code" parameter is required',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 400 }),
        request
      );
    }

    console.log('Exchanging authorization code for tokens...');

    // Exchange code for tokens with WorkOS
    const authResult = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    console.log('Authentication successful for user:', authResult.user.email);

    // Decode JWT to extract roles, permissions, etc.
    // The access token is a JWT that contains additional claims
    let decodedToken: any = {};
    try {
      // JWT is base64url encoded, split by '.' and decode the payload
      const parts = authResult.accessToken.split('.');
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        decodedToken = JSON.parse(payload);
      }
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }

    // Extract data from JWT claims
    const roles = decodedToken.roles || [];
    const role = roles.length > 0 ? roles[0] : null;
    const permissions = decodedToken.permissions || [];
    const entitlements = decodedToken.entitlements || [];
    const featureFlags = decodedToken.feature_flags || [];

    const response: AuthCallbackResponse = {
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
      impersonator: authResult.impersonator || null,
      authenticationMethod: authResult.authenticationMethod,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error during authentication:', error);

    const errorResponse: ErrorResponse = {
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: (error as any).rawData || (error as any).response?.data,
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
