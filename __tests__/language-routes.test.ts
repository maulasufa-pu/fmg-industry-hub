import { localizedPathFor } from "@/i18n/language-routes";

describe("localized public routes", () => {
  test.each([
    ["/services", "id", "/id/layanan"],
    ["/id/layanan", "en", "/services"],
    ["/pricing", "id", "/id/harga"],
    ["/portfolio", "id", "/id/portofolio"],
    ["/id/kontak", "en", "/contact"],
    ["/arrangement", "id", "/id/jasa-aransemen-lagu"],
    ["/", "id", "/id"],
  ] as const)("maps %s to %s", (pathname, language, expected) => {
    expect(localizedPathFor(pathname, language)).toBe(expected);
  });

  it("keeps unpaired English company routes on the same URL", () => {
    expect(localizedPathFor("/media", "id")).toBeNull();
  });

  it("sends Indonesian-only articles to the nearest English hub", () => {
    expect(localizedPathFor("/id/jasa-produksi-musik", "en")).toBe("/song-creation-service");
  });
});
