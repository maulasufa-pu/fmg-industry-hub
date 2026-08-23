import { ContactSchema } from "@/lib/contact";

const valid = {
  name: "Ari Client",
  email: "ari@example.com",
  reason: "project",
  subject: "Music arrangement inquiry",
  message: "I need an arrangement for an original pop song.",
};

test("accepts and normalizes a legitimate contact inquiry", () => {
  expect(ContactSchema.parse({ ...valid, email: "  ari@example.com " }).email).toBe("ari@example.com");
});

test("rejects bot honeypot, malformed email, and too-short messages", () => {
  expect(ContactSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
  expect(ContactSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  expect(ContactSchema.safeParse({ ...valid, message: "too short" }).success).toBe(false);
});
