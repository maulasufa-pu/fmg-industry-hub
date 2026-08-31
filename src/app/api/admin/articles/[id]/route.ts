import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  apiAuthErrorResponse,
  requireAdminRequest,
} from "@/lib/auth/server";
import { articleInputSchema, validateArticleForPublishing } from "@/lib/articles/schema";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ArticleRouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: ArticleRouteContext) {
  try {
    await requireAdminRequest(request);
    const { id } = await context.params;
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const { data, error } = await admin.from("articles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    return NextResponse.json({ article: data });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] detail failed", error);
    return NextResponse.json({ error: "Unable to load article" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: ArticleRouteContext) {
  try {
    const auth = await requireAdminRequest(request);
    const { id } = await context.params;
    const parsed = articleInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Article validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    if (parsed.data.status === "published") {
      const publishIssues = validateArticleForPublishing(parsed.data);
      if (publishIssues.length > 0) {
        return NextResponse.json({ error: publishIssues.join(". "), issues: publishIssues }, { status: 400 });
      }
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const payload = {
      ...parsed.data,
      cover_image_url: parsed.data.cover_image_url || null,
      cover_image_alt: parsed.data.cover_image_alt || null,
      published_at:
        parsed.data.status === "published"
          ? parsed.data.published_at ?? new Date().toISOString()
          : parsed.data.published_at,
      updated_by: auth.user.id,
    };

    const { data, error } = await admin
      .from("articles")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json({ error: "Slug already exists for this language" }, { status: 409 });
    }
    if (error) throw error;

    revalidatePath(data.path);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ article: data });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] update failed", error);
    return NextResponse.json({ error: "Unable to save article" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: ArticleRouteContext) {
  try {
    await requireAdminRequest(request);
    const { id } = await context.params;
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const { data: article } = await admin.from("articles").select("path").eq("id", id).maybeSingle();
    const { error } = await admin.from("articles").delete().eq("id", id);
    if (error) throw error;

    if (article?.path) revalidatePath(article.path);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] delete failed", error);
    return NextResponse.json({ error: "Unable to delete article" }, { status: 500 });
  }
}
