import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { parseJWT, extractSessionData } from '@/lib/jwt-utils';
import type { AuthCallbackRequest, AuthCallbackResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthCallbackRequest = await request.json();
    const { code } = body;

    if (!code) {
      return addCorsHeaders(
        NextResponse.json({
          error: 'Missing authorization code',
          message: 'The "code" parameter is required'
        } as ErrorResponse, { status: 400 }),
        request
      );
    }

    console.log('Exchanging authorization code for tokens...');

    const authResult = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    console.log('Authentication successful for user:', authResult.user.email);

    const decodedToken = parseJWT(authResult.accessToken);
    const sessionData = extractSessionData(decodedToken);

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
      ...sessionData,
      impersonator: authResult.impersonator || null,
      authenticationMethod: authResult.authenticationMethod,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error during authentication:', error);

    return addCorsHeaders(
      NextResponse.json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as any).rawData || (error as any).response?.data,
      } as ErrorResponse, { status: 500 }),
      request
    );
  }
}