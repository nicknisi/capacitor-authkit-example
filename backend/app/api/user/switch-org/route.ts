import { NextRequest, NextResponse } from 'next/server';
import { workos, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { SwitchOrganizationRequest, SwitchOrganizationResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const body: SwitchOrganizationRequest = await request.json();
    const { userId, organizationId, accessToken } = body;

    if (!userId || !organizationId || !accessToken) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required parameters',
        message: 'userId, organizationId, and accessToken are required',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 400 }),
        request
      );
    }

    console.log(`Switching user ${userId} to organization ${organizationId}...`);

    // Get the organization membership to verify access and get role
    const membership = await workos.userManagement.getOrganizationMembership({
      userId,
      organizationId,
    });

    if (!membership) {
      const errorResponse: ErrorResponse = {
        error: 'Not a member',
        message: 'User is not a member of this organization',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 403 }),
        request
      );
    }

    const response: SwitchOrganizationResponse = {
      success: true,
      organizationId,
      role: membership.role,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error switching organization:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to switch organization',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: (error as any).rawData || (error as any).response?.data,
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
