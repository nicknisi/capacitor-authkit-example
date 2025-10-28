import { NextRequest, NextResponse } from 'next/server';
import { workos, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { SignOutRequest, SignOutResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: SignOutRequest = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      // If no session ID provided, just return success
      // The client will handle clearing local storage
      const response: SignOutResponse = {
        success: true,
      };
      return addCorsHeaders(NextResponse.json(response), request);
    }

    console.log(`Signing out session ${sessionId}...`);

    // Get the logout URL from WorkOS
    const logoutUrl = workos.userManagement.getLogoutUrl({ sessionId });

    console.log('Logout URL generated:', logoutUrl);
    console.log('Session will be revoked when user navigates to logout URL');

    const response: SignOutResponse = {
      success: true,
      logoutUrl,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error during sign out:', error);

    const errorResponse: ErrorResponse = {
      error: 'Sign out failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
