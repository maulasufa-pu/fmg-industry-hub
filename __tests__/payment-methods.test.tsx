import { render, screen } from "@testing-library/react";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";
import { LanguageProvider } from "@/contexts/LanguageContext";

test("shows the complete Midtrans payment-method logo collection", () => {
  window.localStorage.clear();
  render(
    <LanguageProvider>
      <PaymentMethodsShowcase />
    </LanguageProvider>
  );

  expect(screen.getAllByRole("img")).toHaveLength(31);
  for (const name of [
    "Midtrans",
    "BCA",
    "QRIS",
    "Visa",
    "Google Pay",
    "Indomaret",
    "Alfamidi",
    "Akulaku PayLater",
    "Kredivo",
  ]) {
    expect(screen.getByRole("img", { name })).toBeInTheDocument();
  }
});
