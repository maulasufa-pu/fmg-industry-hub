import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  apiAuthErrorResponse,
  requireAdminRequest,
} from "@/lib/auth/server";
import { articleInputSchema, slugifyArticleTitle, validateArticleForPublishing } from "@/lib/articles/schema";
import { ARTICLE_IMPORT_LIMIT } from "@/lib/articles/transfer";
import type { ArticleDraft } from "@/lib/articles/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  articles: z.array(z.unknown()).min(1).max(ARTICLE_IMPORT_LIMIT),
  conflict: z.enum(["copy", "replace", "skip"]).default("copy"),
  preserveStatus: z.boolean().default(false),
});

type ImportResult = { index: number; title: string; status: "created" | "replaced" | "skipped" | "failed"; message?: string; id?: string };

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json({ error: "Invalid import request", issues: body.error.issues }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return Response.json({ error: "Article database is not configured" }, { status: 503 });

    const results: ImportResult[] = [];
    const changedPaths = new Set<string>();

    for (const [index, candidate] of body.data.articles.entries()) {
      const parsed = articleInputSchema.safeParse(candidate);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        results.push({ index, title: candidate && typeof candidate === "object" && "title" in candidate ? String(candidate.title) : `Article ${index + 1}`, status: "failed", message: `${issue.path.join(".") || "article"}: ${issue.message}` });
        continue;
      }

      let article: ArticleDraft = {
        ...parsed.data,
        slug: slugifyArticleTitle(parsed.data.slug || parsed.data.title),
        status: body.data.preserveStatus ? parsed.data.status : "draft",
        published_at: body.data.preserveStatus && parsed.data.status === "published"
          ? parsed.data.published_at ?? new Date().toISOString()
          : null,
      };

      if (article.status === "published") {
        const issues = validateArticleForPublishing(article);
        if (issues.length > 0) {
          results.push({ index, title: article.title, status: "failed", message: issues.join(". ") });
          continue;
        }
      }

      try {
        const { data: existing, error: lookupError } = await admin
          .from("articles")
          .select("id, path")
          .eq("locale", article.locale)
          .eq("slug", article.slug)
          .maybeSingle();
        if (lookupError) throw lookupError;

        if (existing && body.data.conflict === "skip") {
          results.push({ index, title: article.title, status: "skipped", id: existing.id, message: "Slug already exists" });
          continue;
        }

        if (existing && body.data.conflict === "copy") {
          const baseSlug = article.slug;
          let suffix = 2;
          while (true) {
            const suffixText = `-${suffix}`;
            const nextSlug = `${baseSlug.slice(0, 160 - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
            const { data: duplicate, error: duplicateError } = await admin.from("articles").select("id").eq("locale", article.locale).eq("slug", nextSlug).maybeSingle();
            if (duplicateError) throw duplicateError;
            if (!duplicate) {
              article = { ...article, slug: nextSlug };
              break;
            }
            suffix += 1;
          }
        }

        const payload = {
          ...article,
          cover_image_url: article.cover_image_url || null,
          cover_image_alt: article.cover_image_alt || null,
          updated_by: auth.user.id,
        };

        if (existing && body.data.conflict === "replace") {
          const { data, error } = await admin.from("articles").update(payload).eq("id", existing.id).select("id, path").single();
          if (error) throw error;
          changedPaths.add(data.path);
          results.push({ index, title: article.title, status: "replaced", id: data.id });
        } else {
          const { data, error } = await admin.from("articles").insert({ ...payload, created_by: auth.user.id }).select("id, path").single();
          if (error) throw error;
          changedPaths.add(data.path);
          results.push({ index, title: article.title, status: "created", id: data.id });
        }
      } catch (databaseError) {
        const message = databaseError instanceof Error ? databaseError.message : "Database rejected this article";
        results.push({ index, title: article.title, status: "failed", message });
      }
    }

    for (const path of changedPaths) revalidatePath(path);
    revalidatePath("/articles");
    revalidatePath("/id/artikel");
    revalidatePath("/sitemap.xml");

    const summary = {
      total: results.length,
      created: results.filter((item) => item.status === "created").length,
      replaced: results.filter((item) => item.status === "replaced").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      failed: results.filter((item) => item.status === "failed").length,
    };
    return Response.json({ summary, results });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] import failed", error);
    return Response.json({ error: "Unable to import articles" }, { status: 500 });
  }
}
