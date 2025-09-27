// src/app/admin/projects/[id]/components/access-control.ts
import type { UserRole } from '@/lib/roles';

export interface UserAccess {
  main_role: string | null;
  staff_role: string[] | null;
}

export function hasAccess(userAccess: UserAccess | null, requiredRoles: readonly string[]): boolean {
  if (!userAccess) return false;

  const allRoles: string[] = [];
  
  if (userAccess.main_role) {
    allRoles.push(userAccess.main_role);
  }
  
  if (userAccess.staff_role && Array.isArray(userAccess.staff_role)) {
    allRoles.push(...userAccess.staff_role);
  }

  return requiredRoles.some(role => allRoles.includes(role));
}

export const ACCESS_RULES = {
  HERO_SECTION: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  
  RIGHT_ACTIONS: ['owner', 'admin'],
  
  TEAM_ASSIGNMENTS: ['owner', 'admin'],
  
  // Project controls tabs
  OVERVIEW_DETAILS: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  REFERENCES: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  DISCUSSION: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  MEETINGS: ['owner', 'admin', 'anr', 'composer', 'producer', 'engineer', 'publisher'],
  DRAFTS: ['anr', 'composer', 'producer', 'engineer'],
  PUBLISHING_DISTRIBUTION: ['owner', 'admin', 'publisher'],
} as const;

export function getEffectiveDisplayRole(userAccess: UserAccess | null): string {
  if (!userAccess) return 'guest';

  const allRoles: string[] = [];
  if (userAccess.main_role) allRoles.push(userAccess.main_role);
  if (userAccess.staff_role && Array.isArray(userAccess.staff_role)) {
    allRoles.push(...userAccess.staff_role);
  }

  const priority = ['owner', 'admin', 'anr', 'producer', 'composer', 'engineer', 'publisher', 'client'];
  
  for (const role of priority) {
    if (allRoles.includes(role)) {
      return role;
    }
  }
  return 'client';
}
