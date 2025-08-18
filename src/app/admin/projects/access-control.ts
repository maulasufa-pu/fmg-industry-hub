// src/app/admin/projects/[id]/components/access-control.ts
import type { UserRole } from '@/lib/roles';

export interface UserAccess {
  main_role: string | null;
  staff_role: string[] | null;
}

/**
 * Check if user has access to a specific feature based on their roles
 */
export function hasAccess(userAccess: UserAccess | null, requiredRoles: readonly string[]): boolean {
  if (!userAccess) return false;

  const allRoles: string[] = [];
  
  // Add main_role (special roles like owner, admin)
  if (userAccess.main_role) {
    allRoles.push(userAccess.main_role);
  }
  
  // Add staff_role array (functional roles)
  if (userAccess.staff_role && Array.isArray(userAccess.staff_role)) {
    allRoles.push(...userAccess.staff_role);
  }

  // Check if user has any of the required roles
  return requiredRoles.some(role => allRoles.includes(role));
}

/**
 * Access control definitions for project sections
 */
export const ACCESS_RULES = {
  // Hero section - visible to all authenticated users
  HERO_SECTION: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  
  // Right actions (Accept/Hold) - only admin and owner
  RIGHT_ACTIONS: ['owner', 'admin'],
  
  // Team assignments - only admin and owner
  TEAM_ASSIGNMENTS: ['owner', 'admin'],
  
  // Project controls tabs
  OVERVIEW_DETAILS: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  REFERENCES: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  DISCUSSION: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  MEETINGS: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  DRAFTS: ['anr', 'composer', 'producer', 'engineer'],
  PUBLISHING_DISTRIBUTION: ['owner', 'admin', 'publisher'],
} as const;

/**
 * Get effective role priority for display purposes
 */
export function getEffectiveDisplayRole(userAccess: UserAccess | null): string {
  if (!userAccess) return 'guest';

  const allRoles: string[] = [];
  if (userAccess.main_role) allRoles.push(userAccess.main_role);
  if (userAccess.staff_role && Array.isArray(userAccess.staff_role)) {
    allRoles.push(...userAccess.staff_role);
  }

  // Priority order: owner > admin > staff roles
  const priority = ['owner', 'admin', 'anr', 'producer', 'composer', 'engineer', 'publisher', 'client'];
  
  for (const role of priority) {
    if (allRoles.includes(role)) {
      return role;
    }
  }

  return 'client';
}
