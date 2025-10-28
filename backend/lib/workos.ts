import { WorkOS } from '@workos-inc/node';

// Initialize WorkOS client
export const workos = new WorkOS(process.env.WORKOS_API_KEY);
export const clientId = process.env.WORKOS_CLIENT_ID!;

// Validate environment variables
export function validateEnvVariables() {
  if (!process.env.WORKOS_API_KEY) {
    throw new Error('WORKOS_API_KEY environment variable is not set');
  }
  if (!process.env.WORKOS_CLIENT_ID) {
    throw new Error('WORKOS_CLIENT_ID environment variable is not set');
  }
}

// Helper to extract Bearer token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}
