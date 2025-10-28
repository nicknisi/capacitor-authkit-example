import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { AuthUrlRequest, AuthUrlResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthUrlRequest = await request.json();
    const { redirectUri, state, organizationId } = body;

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri: redirectUri || 'http://localhost:3000/callback',
      responseType: 'code',
      state,
      provider: 'authkit',
      ...(organizationId && { organizationId }),
    });

    return addCorsHeaders(
      NextResponse.json({ authorizationUrl } as AuthUrlResponse),
      request
    );
  } catch (error) {
    console.error('Error generating authorization URL:', error);

    return addCorsHeaders(
      NextResponse.json({
        error: 'Failed to generate authorization URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ErrorResponse, { status: 500 }),
      request
    );
  }
}