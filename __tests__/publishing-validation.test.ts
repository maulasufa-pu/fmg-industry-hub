jest.mock("server-only", () => ({}));

import { validatePublishingMetadata } from "@/lib/publishing/validation";

const valid = { title: "Song", artist_name: "Artist", isrc: "IDABC2600001", release_date: "2099-01-01", label_name: "FMG", copyright_c: "2026 Writer", copyright_p: "2026 FMG", language: "id", primary_genre: "Pop", artwork_url: "https://example.com/art.jpg", royalty_splits: [{ party: "Writer", percentage: 100 }] };

test("accepts complete distributor metadata", () => expect(validatePublishingMetadata(valid)).toEqual([]));
test("rejects invalid ISRC, missing artwork, past date, and bad royalty total", () => {
  const errors = validatePublishingMetadata({ ...valid, isrc: "bad", artwork_url: "", release_date: "2020-01-01", royalty_splits: [{ party: "", percentage: 80 }] });
  expect(errors).toEqual(expect.arrayContaining([expect.stringContaining("ISRC"), expect.stringContaining("artwork"), expect.stringContaining("past"), expect.stringContaining("100%"), expect.stringContaining("party name")]));
});
