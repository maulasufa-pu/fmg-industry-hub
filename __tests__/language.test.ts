import translations from "@/i18n/generated-translations.json";
import { translationOverrides } from "@/i18n/translation-overrides";
import { translateWebsiteText } from "@/components/GlobalWebsiteTranslator";

test("global language catalog covers the complete extracted interface", () => {
  expect(Object.keys(translations).length).toBeGreaterThanOrEqual(1600);
});

test("business-critical arrangement copy uses the FMG glossary", () => {
  expect(translationOverrides["Order New Arrangement"]?.id).toBe("Pesan Aransemen Baru");
  expect(translationOverrides["Loading projects…"]?.id).toBe("Memuat project…");
  expect(translationOverrides["Close"]?.id).toBe("Tutup");
});

test("global translator switches deep UI labels in both directions", () => {
  expect(translateWebsiteText("  Order New Arrangement  ", "id")).toBe("  Pesan Aransemen Baru  ");
  expect(translateWebsiteText("Pesan Aransemen Baru", "en")).toBe("Order New Arrangement");
  expect(translateWebsiteText("Belum ada draft.", "en")).toBe("No draft yet.");
  expect(translateWebsiteText("Step 2 of 4", "id")).toBe("Langkah 2 dari 4");
  expect(translateWebsiteText("Global Universe Solution", "id")).toBe("Global Universe Solution");
  expect(translateWebsiteText("Beyond Sound. Built-in Intelligence.", "id")).toBe("Beyond Sound. Built-in Intelligence.");
});
