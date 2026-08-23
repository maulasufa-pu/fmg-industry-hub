"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Clock3, Edit3, Headphones, Quote, RefreshCw } from "lucide-react";
import { ARRANGEMENT_ORDER_PATH } from "@/lib/arrangement";
import type { PortfolioItem } from "./types";

function youtubeId(url:string|null){if(!url)return null; try{const u=new URL(url); if(u.hostname.includes("youtu.be"))return u.pathname.slice(1); return u.searchParams.get("v");}catch{return null;}}
function artwork(item:PortfolioItem){if(item.artwork_link)return item.artwork_link; const id=youtubeId(item.youtube_link); return id?`https://i.ytimg.com/vi/${id}/hqdefault.jpg`:"/og-default.jpg";}

export default function PortfolioGallery({items,isAdmin,onEdit}:{items:PortfolioItem[];isAdmin:boolean;onEdit:(item:PortfolioItem)=>void}){
  if(items.length===0)return <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/20"><h2 className="text-xl font-semibold">No explicitly classified work matches this filter.</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">Portfolio work is now classified by the service actually delivered, not inferred from credits. Admins can classify existing releases in the editor.</p></div>;
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(item=>{
    const arrangement=item.work_type.includes("arrangement");
    return <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-white/5"><Image src={artwork(item)} onError={(e)=>{e.currentTarget.src="/og-default.jpg"}} alt={`Artwork for ${item.song_title}`} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" unoptimized className="object-cover transition duration-500 hover:scale-[1.03]" />{isAdmin&&<button onClick={()=>onEdit(item)} className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur"><Edit3 className="h-3.5 w-3.5"/> Edit</button>}</div>
      <div className="p-6"><div className="flex flex-wrap gap-2">{item.work_type.map(type=><span key={type} className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-violet-700 dark:bg-violet-950 dark:text-violet-200">{type}</span>)}</div><h2 className="mt-4 text-2xl font-bold">{item.song_title}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.singer.join(", ")||item.album_title||"FMG project"} · {item.genre}</p>
      {arrangement&&<div className="mt-5 space-y-4 border-t border-slate-200 pt-5 text-sm dark:border-white/10">
        {item.client_brief&&<div><h3 className="font-semibold">Client brief</h3><p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{item.client_brief}</p></div>}
        {item.challenge&&<div><h3 className="font-semibold">Arrangement problem</h3><p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{item.challenge}</p></div>}
        {item.arrangement_solution&&<div><h3 className="font-semibold">What FMG changed</h3><p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{item.arrangement_solution}</p></div>}
        {(item.turnaround_days||item.revision_count!==null)&&<div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">{item.turnaround_days&&<span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4"/>{item.turnaround_days} days</span>}{item.revision_count!==null&&<span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4"/>{item.revision_count} revision rounds</span>}</div>}
        {item.deliverables.length>0&&<div><h3 className="font-semibold">Deliverables</h3><p className="mt-1 text-slate-600 dark:text-slate-300">{item.deliverables.join(" · ")}</p></div>}
        {(item.before_url||item.after_url)&&<div className="grid gap-3 sm:grid-cols-2">{item.before_url&&<a href={item.before_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"><Headphones className="h-4 w-4"/> Before</a>}{item.after_url&&<a href={item.after_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"><Headphones className="h-4 w-4"/> After</a>}</div>}
        {item.testimonial_quote&&<blockquote className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><Quote className="h-4 w-4 text-violet-600"/><p className="mt-2 leading-6">“{item.testimonial_quote}”</p>{item.testimonial_name&&<footer className="mt-2 text-xs text-slate-500">— {item.testimonial_name}</footer>}</blockquote>}
      </div>}
      <div className="mt-6 flex flex-wrap gap-2"><Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">{arrangement?"Order a similar arrangement":"Arrange my song"} <ArrowRight className="h-4 w-4"/></Link>{item.spotify_link&&<a href={item.spotify_link} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-white/20">Listen</a>}{item.release_date_aggregator&&<span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-4 w-4"/>{new Date(item.release_date_aggregator).toLocaleDateString()}</span>}</div>
      </div></article>})}</div>;
}
