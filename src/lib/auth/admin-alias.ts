export const ADMINFMG_USERNAME = "adminfmg";
export const ADMINFMG_INTERNAL_EMAIL = "adminfmg@auth.flemmomusic.com";

export function resolveLoginIdentifier(value: string): { email: string; usernameLogin: boolean } {
  const normalized = value.trim().toLowerCase();
  if (normalized === ADMINFMG_USERNAME) {
    return { email: ADMINFMG_INTERNAL_EMAIL, usernameLogin: true };
  }
  return { email: normalized, usernameLogin: false };
}
