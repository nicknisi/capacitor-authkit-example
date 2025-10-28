import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { parseJWT, extractSessionData } from '@/lib/jwt-utils';
import type { AuthRefreshRequest, AuthRefreshResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthRefreshRequest = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return addCorsHeaders(
        NextResponse.json({
          error: 'Missing refresh token',
          message: 'The "refreshToken" parameter is required'
        } as ErrorResponse, { status: 400 }),
        request
      );
    }

    console.log('Refreshing access token...');

    const authResult = await workos.userManagement.authenticateWithRefreshToken({
      clientId,
      refreshToken,
    });

    console.log('Token refresh successful for user:', authResult.user.email);

    const decodedToken = parseJWT(authResult.accessToken);
    const sessionData = extractSessionData(decodedToken);

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
      ...sessionData,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error refreshing token:', error);

    return addCorsHeaders(
      NextResponse.json({
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as any).rawData || (error as any).response?.data,
      } as ErrorResponse, { status: 500 }),
      request
    );
  }
}