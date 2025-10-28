import { NextRequest, NextResponse } from 'next/server';
import { workos, validateEnvVariables } from '@/lib/workos';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import type { UserOrganizationsResponse, ErrorResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    validateEnvVariables();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required parameter',
        message: 'userId query parameter is required',
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, { status: 400 }),
        request
      );
    }

    console.log(`Fetching organizations for user ${userId}...`);

    // Get all organization memberships for the user
    const { data: memberships } = await workos.userManagement.listOrganizationMemberships({
      userId,
    });

    // Fetch organization details for each membership
    const organizationsData = await Promise.all(
      memberships.map(async (membership) => {
        const organization = await workos.organizations.getOrganization(
          membership.organizationId
        );
        return {
          organization: {
            id: organization.id,
            name: organization.name,
            domainData: organization.domainData,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
          },
          membership: {
            id: membership.id,
            userId: membership.userId,
            organizationId: membership.organizationId,
            role: membership.role,
            status: membership.status,
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt,
          },
        };
      })
    );

    const response: UserOrganizationsResponse = {
      organizations: organizationsData,
    };

    return addCorsHeaders(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error fetching user organizations:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch user organizations',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: (error as any).rawData || (error as any).response?.data,
    };

    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 }),
      request
    );
  }
}
