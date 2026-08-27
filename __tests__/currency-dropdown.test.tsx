import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientCurrencyProvider } from "@/components/ClientCurrencyProvider";
import { CurrencyDropdownAdvanced } from "@/components/CurrencyDropdownAdvanced";
import GlobalPrice from "@/components/public/GlobalPrice";
import { useCurrency } from "@/contexts/CurrencyContext";
import { FALLBACK_EXCHANGE_RATES } from "@/lib/currency";

function ConnectedCurrencyFixture() {
  const { currency, setCurrency, loading } = useCurrency();

  return (
    <>
      <CurrencyDropdownAdvanced
        value={currency}
        onChange={setCurrency}
        loading={loading}
        variant="compact"
        showName={false}
      />
      <div data-testid="promotion-price">
        <GlobalPrice usd={375} idr={6_000_000} />
      </div>
    </>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ rates: FALLBACK_EXCHANGE_RATES }),
  }) as jest.Mock;
});

test("currency options remain selectable while live rates are loading", async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  render(
    <CurrencyDropdownAdvanced
      value="USD"
      onChange={onChange}
      loading
      variant="compact"
      showName={false}
    />
  );

  const trigger = screen.getByRole("button", { name: "Select currency" });
  expect(trigger).toBeEnabled();
  await user.click(trigger);
  await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: /IDR/ }));

  expect(onChange).toHaveBeenCalledWith("IDR");
});

test("changing currency updates global prices immediately and persists the choice", async () => {
  const user = userEvent.setup();
  render(
    <ClientCurrencyProvider>
      <ConnectedCurrencyFixture />
    </ClientCurrencyProvider>
  );

  await user.click(screen.getByRole("button", { name: "Select currency" }));
  await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: /IDR/ }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Select currency" })).toHaveTextContent("IDR");
    expect(screen.getByTestId("promotion-price")).toHaveTextContent(/Rp\s*6\.000\.000/);
  });
  expect(window.localStorage.getItem("fmg-currency")).toBe("IDR");
});
