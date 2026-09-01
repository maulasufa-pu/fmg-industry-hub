import { ADMINFMG_INTERNAL_EMAIL, resolveLoginIdentifier } from "@/lib/auth/admin-alias";

describe("adminfmg login alias", () => {
  it("resolves the admin username to its internal Supabase identity", () => {
    expect(resolveLoginIdentifier(" AdminFMG ")).toEqual({ email: ADMINFMG_INTERNAL_EMAIL, usernameLogin: true });
  });

  it("keeps regular email login unchanged", () => {
    expect(resolveLoginIdentifier("USER@EXAMPLE.COM")).toEqual({ email: "user@example.com", usernameLogin: false });
  });
});
