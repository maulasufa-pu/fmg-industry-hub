import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GlobalWebsiteTranslator from "@/components/GlobalWebsiteTranslator";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function Fixture() {
  const { setLanguage } = useLanguage();
  return (
    <>
      <button data-no-translate onClick={() => setLanguage("en")}>English</button>
      <button data-no-translate onClick={() => setLanguage("id")}>Indonesia</button>
      <p data-testid="order-copy">Order New Arrangement</p>
      <p data-testid="editorial-copy">Professional Music Arrangement for Your Song.</p>
      <p data-testid="brand-copy">Global Universe Solution</p>
    </>
  );
}

test("language changes update the existing page without a refresh", async () => {
  window.localStorage.clear();
  render(<LanguageProvider><GlobalWebsiteTranslator /><Fixture /></LanguageProvider>);

  expect(screen.getByTestId("order-copy")).toHaveTextContent("Order New Arrangement");
  expect(screen.getByTestId("brand-copy")).toHaveTextContent("Global Universe Solution");

  fireEvent.click(screen.getByText("Indonesia"));
  await waitFor(() => expect(screen.getByTestId("order-copy")).toHaveTextContent("Pesan Aransemen Baru"));
  expect(screen.getByTestId("editorial-copy")).toHaveTextContent("Jasa Aransemen Profesional untuk Lagumu.");
  expect(screen.getByTestId("brand-copy")).toHaveTextContent("Global Universe Solution");

  fireEvent.click(screen.getByText("English"));
  await waitFor(() => expect(screen.getByTestId("order-copy")).toHaveTextContent("Order New Arrangement"));
  expect(screen.getByTestId("editorial-copy")).toHaveTextContent("Professional Music Arrangement for Your Song.");
});
