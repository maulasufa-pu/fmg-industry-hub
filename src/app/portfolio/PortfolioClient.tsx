"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";
import { ARRANGEMENT_ORDER_PATH } from "@/lib/arrangement";
import PortfolioAdminEditor from "./PortfolioAdminEditor";
import PortfolioGallery from "./PortfolioGallery";
import { WORK_TYPES, type PortfolioItem, type PortfolioResponse, type WorkType } from "./types";

type Props={initialWorkType?:WorkType|"all";title?:string;description?:string;lockedWorkType?:boolean};

export default function PortfolioClient({initialWorkType="all",title="Work classified by what FMG delivered.",description="Browse arrangement, production, mixing, publishing, and release work without confusing credits with the service provided.",lockedWorkType=false}:Props){
  const searchParams=useSearchParams();
  const requested=searchParams.get("work");
  const requestedWork=WORK_TYPES.includes(requested as WorkType)?requested as WorkType:initialWorkType;
  const [work,setWork]=useState<WorkType|"all">(requestedWork);
  const [query,setQuery]=useState(""); const [debounced,setDebounced]=useState(""); const [genre,setGenre]=useState(""); const [page,setPage]=useState(1);
  const [response,setResponse]=useState<PortfolioResponse>({data:[],pagination:{page:1,limit:12,total:0,totalPages:1},facets:{genres:[]}});
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [isAdmin,setIsAdmin]=useState(false); const [editing,setEditing]=useState<PortfolioItem|null|undefined>(undefined); const [refresh,setRefresh]=useState(0);
  useEffect(()=>{const timer=window.setTimeout(()=>setDebounced(query),300);return()=>window.clearTimeout(timer)},[query]);
  useEffect(()=>{setPage(1)},[work,debounced,genre]);
  useEffect(()=>{void getEffectiveRole().then(role=>setIsAdmin(role==="admin"||role==="owner"))},[]);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");const params=new URLSearchParams({page:String(page),limit:"12",work,q:debounced});if(genre)params.set("genres",genre);fetch(`/api/portfolio?${params}`,{signal:controller.signal}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||"Unable to load portfolio");setResponse(body)}).catch(err=>{if(err.name!=="AbortError")setError(err.message)}).finally(()=>setLoading(false));return()=>controller.abort()},[page,work,debounced,genre,refresh]);
  const heading=useMemo(()=>work==="arrangement"?"Arrangement case studies":title,[title,work]);
  return <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white"><section className="mx-auto max-w-7xl px-5 py-20 sm:py-28"><div className="max-w-4xl"><p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">FMG portfolio</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-6xl">{heading}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{work==="arrangement"?"Each case can show the client brief, arrangement problem, solution, before/after, timeline, revisions, deliverables, and project-specific feedback.":description}</p>{work==="arrangement"&&<Link href={ARRANGEMENT_ORDER_PATH} className="mt-7 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700">Order music arrangement</Link>}</div>
  <div className="mt-12 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_auto_auto_auto]"><label className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, album, or genre" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 dark:border-white/15 dark:bg-black"/></label>{!lockedWorkType&&<select aria-label="Work type" value={work} onChange={e=>setWork(e.target.value as WorkType|"all")} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 capitalize dark:border-white/15 dark:bg-black"><option value="all">All work</option>{WORK_TYPES.map(type=><option key={type} value={type}>{type}</option>)}</select>}<select aria-label="Genre" value={genre} onChange={e=>setGenre(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-black"><option value="">All genres</option>{response.facets.genres.map(value=><option key={value}>{value}</option>)}</select>{isAdmin&&<button onClick={()=>setEditing(null)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white dark:bg-white dark:text-black"><Plus className="h-4 w-4"/> Add case</button>}</div>
  <div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4"/>{response.pagination.total} classified projects</span><span>Page {response.pagination.page} of {response.pagination.totalPages}</span></div>
  <div className="mt-8">{loading?<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-slate-100 dark:bg-white/5"/>)}</div>:error?<div className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>:<PortfolioGallery items={response.data} isAdmin={isAdmin} onEdit={item=>setEditing(item)}/>}</div>
  {response.pagination.totalPages>1&&<nav aria-label="Portfolio pagination" className="mt-10 flex justify-center gap-3"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40 dark:border-white/20">Previous</button><button disabled={page>=response.pagination.totalPages} onClick={()=>setPage(p=>p+1)} className="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40 dark:border-white/20">Next</button></nav>}
  </section>{editing!==undefined&&<PortfolioAdminEditor item={editing} onClose={()=>setEditing(undefined)} onSaved={()=>{setEditing(undefined);setRefresh(v=>v+1)}}/>}</main>;
}
