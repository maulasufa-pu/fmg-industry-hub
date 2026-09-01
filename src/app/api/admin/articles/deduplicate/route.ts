import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { findPublishedArticleDuplicates, type DuplicateArticleCandidate } from "@/lib/articles/deduplicate";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DEDUPLICATION_COLUMNS = "id, slug, locale, path, title, excerpt, seo_title, seo_description, cover_image_url, content, status, is_featured, published_at, created_at, updated_at";

async function loadDuplicateGroups() {
  const admin = getSupabaseAdminClient();
  if (!admin) return { admin: null, groups: [] };
  const { data, error } = await admin
    .from("articles")
    .select(DEDUPLICATION_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: true });
  if (error) throw error;
  return { admin, groups: findPublishedArticleDuplicates((data ?? []) as DuplicateArticleCandidate[]) };
}

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const { admin, groups } = await loadDuplicateGroups();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });
    return NextResponse.json({
      groups,
      duplicateCount: groups.reduce((total, group) => total + group.duplicates.length, 0),
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] duplicate scan failed", error);
    return NextResponse.json({ error: "Unable to scan published articles" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminRequest(request);
    const { admin, groups } = await loadDuplicateGroups();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const duplicateArticles = groups.flatMap((group) => group.duplicates);
    const duplicateIds = duplicateArticles.map((article) => article.id);
    if (duplicateIds.length === 0) return NextResponse.json({ deleted: 0, groups: 0 });

    const { data: deleted, error } = await admin
      .from("articles")
      .delete()
      .in("id", duplicateIds)
      .eq("status", "published")
      .select("id");
    if (error) throw error;
    if ((deleted?.length ?? 0) !== duplicateIds.length) {
      throw new Error("Not all duplicate articles were deleted; please scan again.");
    }

    duplicateArticles.forEach((article) => revalidatePath(article.path));
    revalidatePath("/articles");
    revalidatePath("/id/artikel");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ deleted: duplicateIds.length, groups: groups.length });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] duplicate cleanup failed", error);
    return NextResponse.json({ error: "Unable to remove duplicate articles" }, { status: 500 });
  }
}
