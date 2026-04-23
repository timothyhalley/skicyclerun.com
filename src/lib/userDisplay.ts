export interface UserDisplayOptions {
  email: string;
  groups: string[];
  compact?: boolean;
}

/**
 * Formats user information for display in the footer
 * @param options - User display configuration
 * @returns Formatted display string
 */
const GROUP_RANK: Record<string, number> = {
  SuperUsers: 3,
  PowerUsers: 2,
  GeneralUsers: 1,
};

/** Returns only the highest-ranked group from the list. */
function bestGroup(groups: string[]): string | null {
  if (!groups.length) return null;
  return groups.reduce((best, g) =>
    (GROUP_RANK[g] ?? 0) > (GROUP_RANK[best] ?? 0) ? g : best
  );
}

export function formatUserDisplay(options: UserDisplayOptions): string {
  const { email, groups, compact = false } = options;

  const topGroup = bestGroup(groups);

  if (compact) {
    // Extract username (left side of @)
    const username = email.split("@")[0];
    // Trim to 12 chars max
    const trimmedUsername =
      username.length > 12 ? username.substring(0, 12) : username;

    if (topGroup) {
      const label = topGroup.replace(/[-_]?users?$/i, "").trim();
      return `${trimmedUsername}★${label}`;
    }
    return trimmedUsername;
  }

  // Full format for larger screens
  const groupDisplay = topGroup ?? "none";
  return `${email} • ${groupDisplay}`;
}

/**
 * Formats copyright text responsively based on screen size
 * @param year - Current year
 * @param compact - Whether to use compact format
 * @returns Formatted copyright string
 */
export function formatCopyright(
  year: number,
  compact: boolean = false
): string {
  if (compact) {
    // Ultra-compact for small devices: © 2025
    return `© ${year}`;
  }
  // Full text for larger screens
  return `Copyright © ${year} • All rights reserved`;
}

/**
 * Detects if the current viewport is a small mobile device
 * @returns true if screen width is <= 640px (typical phone size)
 */
export function isSmallDevice(): boolean {
  // Use 650px as the compact breakpoint to match footer sizing requirements
  return window.innerWidth <= 650;
}
