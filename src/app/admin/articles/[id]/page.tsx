import type { Metadata } from "next";

import ArticleEditor from "@/components/admin/articles/ArticleEditor";

export const metadata: Metadata = {
  title: "Article Editor | FMG Universe",
  robots: { index: false, follow: false },
};

export default async function AdminArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleEditor articleId={id} />;
}
