import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SEO_DB } from "@/seo/metadata.generated";
import type { SeoDoc } from "@/lib/seo-types";

export function seoFromDB(path: `/${string}`): Metadata {
  const doc: SeoDoc | undefined = SEO_DB[path];
  if (!doc) return seo({ path });
  return seo({ title: doc.title, description: doc.description, image: doc.image, path: doc.path });
}