import { fireEvent, render, screen } from "@testing-library/react";

import HomePromoPopup from "@/components/public/HomePromoPopup";

jest.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "IDR", rates: { IDR: 15750 } }),
}));

jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "id",
    pick: (indonesian: string) => indonesian,
  }),
}));

jest.mock("@/components/privacy/ConsentManager", () => ({
  useConsent: () => ({ preferences: { version: "test", updatedAt: "now", analytics: false, embeds: false } }),
}));

describe("home sales promo", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("opens immediately on the first visit and reveals package details", async () => {
    render(<HomePromoPopup />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Rp.*6\.000\.000/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ambil promo ini/ })).toHaveAttribute("href", "/order/arrangement");

    fireEvent.click(screen.getByRole("button", { name: "Apa saja yang termasuk?" }));
    expect(screen.getByText("Komposisi & aransemen")).toBeInTheDocument();
  });
});
