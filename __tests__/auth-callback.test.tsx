import { render, waitFor } from "@testing-library/react";
import CallbackClient from "@/app/auth/callback/CallbackClient";

const mockExchangeCodeForSession = jest.fn(
  () => new Promise<never>(() => undefined),
);

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  }),
}));

describe("OAuth callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockClear();
    window.history.replaceState(
      {},
      "",
      "/auth/callback?code=authorization-code&next=%2Fadmin%2Fdashboard",
    );
  });

  it("exchanges only the authorization code, not the complete callback URL", async () => {
    render(<CallbackClient />);

    await waitFor(() => {
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("authorization-code");
    });
  });
});
