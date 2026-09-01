import { safeInternalPath, withNext } from "@/lib/safe-next";

describe("safe redirect handling", () => {
  test.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", ""])("rejects external or invalid target %s", (value) => expect(safeInternalPath(value)).toBe("/client/dashboard"));
  test("keeps internal paths and encodes nested next values", () => {
    expect(safeInternalPath("/client/projects?id=1")).toBe("/client/projects?id=1");
    expect(withNext("/login", "/client/projects?id=1")).toBe("/login?next=%2Fclient%2Fprojects%3Fid%3D1");
  });
});
