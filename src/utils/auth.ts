// auth.ts - Utility functions for authentication and authorization

/**
 * Client-side only auth utilities for static builds
 * Note: Server-side auth functions removed for static build compatibility
 */

/**
 * Placeholder for compatibility - client-side auth handled in browser
 */
export async function getSession() {
  return null;
}

/**
 * Placeholder for compatibility - client-side auth handled in browser
 */
export async function getServerSession() {
  return { signedIn: false, user: null, groups: [], userGroups: [] } as const;
}

/**
 * Checks if a user has the required groups
 * @param userGroups - The user's groups
 * @param requiredGroups - The required groups
 * @returns True if the user has at least one of the required groups
 */
export function hasRequiredGroups(
  userGroups: string[],
  requiredGroups: string[]
): boolean {
  if (!requiredGroups || requiredGroups.length === 0) {
    return true; // No specific groups required
  }

  if (!userGroups || userGroups.length === 0) {
    return false; // User has no groups
  }

  return requiredGroups.some((group) => userGroups.includes(group));
}
