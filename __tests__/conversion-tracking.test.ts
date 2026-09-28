import { trackConversion, trackLeadSubmission } from "@/lib/conversion-tracking";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/privacy-consent";

describe("conversion consent", () => {
  const gtag = jest.fn();
  beforeEach(() => {
    localStorage.clear();
    Object.assign(window, { gtag });
    gtag.mockClear();
  });
  it("does not send analytics without current consent", () => {
    for (const value of [null, "broken", JSON.stringify({ version: "old", analytics: true }), JSON.stringify({ version: CONSENT_VERSION, analytics: false })]) {
      if (value) localStorage.setItem(CONSENT_STORAGE_KEY, value);
      trackConversion("click_whatsapp");
      trackLeadSubmission("submit_contact");
    }
    expect(gtag).not.toHaveBeenCalled();
  });
  it("sends only page and non-personal event context after opt-in", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, analytics: true }));
    trackConversion("submit_project", { service: "arrangement" });
    expect(gtag).toHaveBeenCalledWith("event", "submit_project", { page_path: "/", service: "arrangement" });
  });
  it("never throws if analytics fails", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, analytics: true }));
    gtag.mockImplementationOnce(() => { throw new Error("offline"); });
    expect(() => trackConversion("submit_contact")).not.toThrow();
  });
  it("routes successful public leads to the supplied Ads conversion", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, analytics: true }));
    trackLeadSubmission("submit_contact");
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenLastCalledWith("event", "conversion", {
      send_to: "AW-18459548993/hyf2CJDsgvwcEMG6meJE",
      value: 1,
      currency: "IDR",
    });
  });
  it("does not treat WhatsApp clicks or dashboard project events as Ads form leads", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, analytics: true }));
    trackConversion("click_whatsapp");
    trackConversion("submit_project");
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["click_whatsapp", "submit_project"]);
  });
});
