import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional().default(""),
  reason: z.enum(["project", "partnership", "publishing", "press", "support", "other"]),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(20).max(2_000),
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof ContactSchema>;
