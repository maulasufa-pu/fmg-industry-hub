import {
  apiAuthErrorResponse,
  requireAdminRequest,
} from "@/lib/auth/server";
import { createArticleTransferDocument, toArticleDraft } from "@/lib/articles/transfer";
import type { ArticleRow } from "@/lib/articles/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const admin = getSupabaseAdminClient();
    if (!admin) return Response.json({ error: "Article database is not configured" }, { status: 503 });

    const ids = new URL(request.url).searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    if (ids.length > 500 || ids.some((id) => !UUID.test(id))) {
      return Response.json({ error: "Invalid article selection" }, { status: 400 });
    }

    const rows: ArticleRow[] = [];
    if (ids.length > 0) {
      const { data, error } = await admin.from("articles").select("*").in("id", ids).order("updated_at", { ascending: false });
      if (error) throw error;
      rows.push(...((data ?? []) as ArticleRow[]));
    } else {
      const pageSize = 500;
      for (let start = 0; start < 5000; start += pageSize) {
        const { data, error } = await admin.from("articles").select("*").order("updated_at", { ascending: false }).range(start, start + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as ArticleRow[];
        rows.push(...page);
        if (page.length < pageSize) break;
      }
    }

    const articles = rows.map(toArticleDraft);
    const document = createArticleTransferDocument(articles);
    const date = new Date().toISOString().slice(0, 10);
    const filename = articles.length === 1 ? `${articles[0].slug}.json` : `fmg-articles-${date}.json`;

    return new Response(JSON.stringify(document, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] export failed", error);
    return Response.json({ error: "Unable to export articles" }, { status: 500 });
  }
}
