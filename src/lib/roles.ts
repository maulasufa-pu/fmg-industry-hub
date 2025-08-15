// src/lib/roles.ts
export type Role = "owner" | "admin" | "client";
export const isAdminLike = (r: Role | null | undefined): boolean =>
  r === "owner" || r === "admin";
