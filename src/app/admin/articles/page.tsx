import type { Metadata } from "next";

import ArticleManager from "@/components/admin/articles/ArticleManager";

export const metadata: Metadata = { title: "Article Studio" };

export default function Page() {
  return <ArticleManager />;
}
