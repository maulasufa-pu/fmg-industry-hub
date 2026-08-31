import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, MoveRight } from "lucide-react";

import type { ArticleBlock, ArticleDesign } from "@/lib/articles/types";

const ACCENTS: Record<ArticleDesign["accent"], string> = {
  violet: "from-violet-600 to-fuchsia-500",
  blue: "from-blue-600 to-cyan-500",
  emerald: "from-emerald-600 to-teal-500",
  rose: "from-rose-600 to-orange-500",
  amber: "from-amber-500 to-orange-500",
};

const WIDTHS: Record<ArticleDesign["bodyWidth"], string> = {
  compact: "max-w-2xl",
  comfortable: "max-w-3xl",
  wide: "max-w-5xl",
};

export function headingAnchor(text: string, index: number): string {
  const anchor = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return anchor || `section-${index + 1}`;
}

function SmartLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  }
  return <Link href={href || "#"} className={className}>{children}</Link>;
}

export default function ArticleRenderer({
  blocks,
  design,
}: {
  blocks: ArticleBlock[];
  design: ArticleDesign;
}) {
  const accent = ACCENTS[design.accent];
  return (
    <div className={`mx-auto w-full ${WIDTHS[design.bodyWidth]} space-y-7 text-slate-700 dark:text-slate-200`}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const id = headingAnchor(block.text, index);
          return block.level === 2 ? (
            <h2 key={block.id} id={id} className="scroll-mt-24 pt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {block.text}
            </h2>
          ) : (
            <h3 key={block.id} id={id} className="scroll-mt-24 pt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {block.text}
            </h3>
          );
        }
        if (block.type === "paragraph") {
          return <p key={block.id} className={`text-lg leading-8 ${block.align === "center" ? "text-center" : "text-left"}`}>{block.text}</p>;
        }
        if (block.type === "image") {
          const width = block.width === "full" ? "xl:-mx-28" : block.width === "wide" ? "lg:-mx-12" : "";
          return (
            <figure key={block.id} className={width}>
              <div className="overflow-hidden rounded-3xl border border-black/10 bg-slate-100 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-slate-900">
                {/* Admin-provided URLs are validated by the CMS API and rendered as content, not HTML. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.url} alt={block.alt} loading="lazy" className="h-auto max-h-[720px] w-full object-cover" />
              </div>
              {block.caption ? <figcaption className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption> : null}
            </figure>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={block.id} className="relative overflow-hidden rounded-3xl border border-black/10 bg-slate-50 p-7 dark:border-white/10 dark:bg-white/5 sm:p-9">
              <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${accent}`} />
              <p className="text-2xl font-semibold leading-relaxed text-slate-950 dark:text-white">“{block.text}”</p>
              {block.attribution ? <footer className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">— {block.attribution}</footer> : null}
            </blockquote>
          );
        }
        if (block.type === "list") {
          const Tag = block.style === "number" ? "ol" : "ul";
          return (
            <Tag key={block.id} className={`space-y-3 pl-7 text-lg leading-8 ${block.style === "number" ? "list-decimal" : "list-disc"}`}>
              {block.items.map((item, itemIndex) => <li key={`${block.id}-${itemIndex}`} className="pl-2 marker:font-bold">{item}</li>)}
            </Tag>
          );
        }
        if (block.type === "callout") {
          const tone = {
            info: { Icon: Info, box: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100" },
            tip: { Icon: Lightbulb, box: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100" },
            warning: { Icon: AlertTriangle, box: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100" },
          }[block.tone];
          const ToneIcon = tone.Icon;
          return (
            <aside key={block.id} className={`rounded-3xl border p-6 sm:p-7 ${tone.box}`}>
              <div className="flex gap-4">
                <ToneIcon className="mt-0.5 h-6 w-6 shrink-0" />
                <div><h4 className="font-bold">{block.title}</h4><p className="mt-2 leading-7 opacity-90">{block.text}</p></div>
              </div>
            </aside>
          );
        }
        if (block.type === "cta") {
          return (
            <aside key={block.id} className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl dark:bg-white dark:text-slate-950 sm:p-10">
              <div className={`absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-3xl`} />
              <div className="relative"><h3 className="text-2xl font-black sm:text-3xl">{block.heading}</h3><p className="mt-3 max-w-2xl leading-7 opacity-75">{block.text}</p>
                <SmartLink href={block.href} className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold transition hover:-translate-y-0.5 ${block.style === "primary" ? `bg-gradient-to-r ${accent} text-white` : "border border-current/20"}`}>
                  {block.label}<MoveRight className="h-4 w-4" />
                </SmartLink>
              </div>
            </aside>
          );
        }
        return <div key={block.id} className="flex items-center gap-3 py-3" aria-hidden="true"><span className="h-px flex-1 bg-black/10 dark:bg-white/10" /><CheckCircle2 className="h-4 w-4 text-slate-400" /><span className="h-px flex-1 bg-black/10 dark:bg-white/10" /></div>;
      })}
    </div>
  );
}
