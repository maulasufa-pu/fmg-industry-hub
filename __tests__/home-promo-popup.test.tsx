import { act, fireEvent, render, screen } from "@testing-library/react";

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
    jest.useFakeTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => jest.useRealTimers());

  it("opens once after a short delay and reveals package details", () => {
    const { unmount } = render(<HomePromoPopup />);

    expect(screen.getByRole("button", { name: "Buka promo pelanggan baru" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(3500));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Rp.*6\.000\.000/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ambil promo ini/ })).toHaveAttribute("href", "/order/arrangement");

    fireEvent.click(screen.getByRole("button", { name: "Apa saja yang termasuk?" }));
    expect(screen.getByText("Komposisi & aransemen")).toBeInTheDocument();

    unmount();
    jest.clearAllTimers();
  });
});
