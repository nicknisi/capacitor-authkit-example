import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { AuthUrlRequest, AuthUrlResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: AuthUrlRequest = await request.json();
    console.log('📝 Received auth URL request:', body);

    const { redirectUri, state, organizationId } = body;

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri: redirectUri || 'http://localhost:3000/callback',
      responseType: 'code',
      state,
      provider: 'authkit',
      ...(organizationId && { organizationId }),
    });

    console.log('✅ Generated URL:', authorizationUrl);

    const response: AuthUrlResponse = {
      authorizationUrl,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error generating authorization URL:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
