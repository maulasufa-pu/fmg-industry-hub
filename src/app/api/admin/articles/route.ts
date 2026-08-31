import { NextResponse } from "next/server";

import {
  apiAuthErrorResponse,
  requireAdminRequest,
} from "@/lib/auth/server";
import { createArticleSchema, slugifyArticleTitle } from "@/lib/articles/schema";
import { DEFAULT_ARTICLE_BLOCKS, DEFAULT_ARTICLE_DESIGN } from "@/lib/articles/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const { data, error } = await admin
      .from("articles")
      .select("id, slug, locale, path, title, excerpt, status, is_featured, published_at, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ articles: data ?? [] });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] list failed", error);
    return NextResponse.json({ error: "Unable to load articles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    const parsed = createArticleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid article details", issues: parsed.error.issues }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Article database is not configured" }, { status: 503 });

    const baseSlug = slugifyArticleTitle(parsed.data.title);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const { data: existing } = await admin
        .from("articles")
        .select("id")
        .eq("locale", parsed.data.locale)
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const { data, error } = await admin
      .from("articles")
      .insert({
        slug,
        locale: parsed.data.locale,
        title: parsed.data.title,
        excerpt: "",
        seo_title: parsed.data.title,
        seo_description: "",
        keywords: [],
        content: DEFAULT_ARTICLE_BLOCKS,
        design: DEFAULT_ARTICLE_DESIGN,
        status: "draft",
        created_by: auth.user.id,
        updated_by: auth.user.id,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[articles] create failed", error);
    return NextResponse.json({ error: "Unable to create article" }, { status: 500 });
  }
}
