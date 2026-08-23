import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const WorkType = z.enum(["arrangement", "production", "mixing", "mastering", "songwriting", "publishing", "release"]);
const nullableText = z.string().trim().max(2000).nullable().optional();
const personList = z.array(z.string().trim().min(1).max(160)).max(30).default([]);
const optionalUrl = z.string().url().nullable().optional();
const PortfolioInput = z.object({
  genre:z.string().trim().min(1).max(120), song_title:z.string().trim().min(1).max(240), album_title:z.string().trim().max(240).nullable().optional(),
  singer:personList, arranger:personList, producer:personList, mixing_engineer:personList, mastering_engineer:personList, songwriter:personList, composer:personList, publisher:personList, aggregator:personList,
  release_date_aggregator:z.iso.date().nullable().optional(), spotify_link:optionalUrl, youtube_link:optionalUrl, apple_music_link:optionalUrl, artwork_link:optionalUrl,
  priority_order:z.number().int().min(0).max(1_000_000).nullable().optional(), is_featured:z.boolean().nullable().optional(), work_type:z.array(WorkType).min(1).max(7),
  client_brief:nullableText, challenge:nullableText, arrangement_solution:nullableText, before_url:optionalUrl, after_url:optionalUrl,
  turnaround_days:z.number().int().min(1).max(365).nullable().optional(), revision_count:z.number().int().min(0).max(50).nullable().optional(), deliverables:z.array(z.string().trim().min(1).max(240)).max(30).default([]),
  testimonial_quote:nullableText, testimonial_name:z.string().trim().max(160).nullable().optional(),
});
const cleanSearch = (value:string) => value.replace(/[,()%_.]/g," ").replace(/\s+/g," ").trim().slice(0,80);

export async function GET(request:NextRequest) {
  const admin=getSupabaseAdminClient();
  if(!admin) return NextResponse.json({error:"Portfolio service is not configured"},{status:503});
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page"))||1);
  const limit=Math.min(24,Math.max(1,Number(request.nextUrl.searchParams.get("limit"))||12));
  const work=request.nextUrl.searchParams.get("work")||"all";
  const q=cleanSearch(request.nextUrl.searchParams.get("q")||"");
  const genres=(request.nextUrl.searchParams.get("genres")||"").split("|").map(v=>v.trim()).filter(Boolean).slice(0,12);
  if(work!=="all"&&!WorkType.safeParse(work).success) return NextResponse.json({error:"Invalid work type"},{status:400});
  let query=admin.from("portfolio").select("*",{count:"exact"});
  if(work!=="all") query=query.contains("work_type",[work]);
  if(genres.length) query=query.in("genre",genres);
  if(q) query=query.or(`song_title.ilike.%${q}%,album_title.ilike.%${q}%,genre.ilike.%${q}%`);
  const from=(page-1)*limit;
  const [{data,error,count},{data:genreRows}]=await Promise.all([
    query.order("priority_order",{ascending:true,nullsFirst:false}).order("release_date_aggregator",{ascending:false,nullsFirst:false}).range(from,from+limit-1),
    admin.from("portfolio").select("genre").not("genre","is",null).order("genre"),
  ]);
  if(error) return NextResponse.json({error:"Unable to load portfolio",code:error.code},{status:500});
  const listKeys=["singer","arranger","producer","mixing_engineer","mastering_engineer","songwriter","composer","publisher","aggregator","deliverables"];
  const normalized=(data||[]).map(item=>{const next={...item,work_type:Array.isArray(item.work_type)?item.work_type:["release"]} as Record<string,unknown>; listKeys.forEach(key=>{if(!Array.isArray(next[key]))next[key]=[]}); return next;});
  const total=count||0;
  return NextResponse.json({data:normalized,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))},facets:{genres:Array.from(new Set((genreRows||[]).map(row=>row.genre).filter(Boolean)))}},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
}

export async function POST(request:NextRequest) {
  try {
    if(!isSameOriginRequest(request)) return NextResponse.json({error:"Invalid request origin"},{status:403});
    const auth=await requireAdminRequest(request); const rate=consumeRateLimit(request,"portfolio-write",30,60_000,auth.user.id);
    if(!rate.allowed) return NextResponse.json({error:"Too many portfolio changes"},{status:429});
    const parsed=PortfolioInput.safeParse(await request.json().catch(()=>null));
    if(!parsed.success) return NextResponse.json({error:"Check the portfolio fields",issues:parsed.error.issues},{status:400});
    const admin=getSupabaseAdminClient(); if(!admin) throw new Error("Portfolio service is not configured");
    const {data,error}=await admin.from("portfolio").insert(parsed.data).select("*").single(); if(error)throw error;
    return NextResponse.json({data},{status:201});
  } catch(error){return apiAuthErrorResponse(error)??NextResponse.json({error:"Unable to create portfolio item"},{status:500});}
}

export async function PUT(request:NextRequest) {
  try {
    if(!isSameOriginRequest(request)) return NextResponse.json({error:"Invalid request origin"},{status:403});
    const auth=await requireAdminRequest(request); const rate=consumeRateLimit(request,"portfolio-write",30,60_000,auth.user.id);
    if(!rate.allowed) return NextResponse.json({error:"Too many portfolio changes"},{status:429});
    const body=await request.json().catch(()=>null); const id=z.coerce.number().int().positive().safeParse(body?.id); const parsed=PortfolioInput.partial().safeParse(body);
    if(!id.success||!parsed.success) return NextResponse.json({error:"Check the portfolio fields"},{status:400});
    const input={...parsed.data}; delete (input as Record<string,unknown>).id;
    const admin=getSupabaseAdminClient(); if(!admin)throw new Error("Portfolio service is not configured");
    const {data,error}=await admin.from("portfolio").update(input).eq("id",id.data).select("*").single(); if(error)throw error;
    return NextResponse.json({data});
  } catch(error){return apiAuthErrorResponse(error)??NextResponse.json({error:"Unable to update portfolio item"},{status:500});}
}

export async function DELETE(request:NextRequest) {
  try {
    if(!isSameOriginRequest(request)) return NextResponse.json({error:"Invalid request origin"},{status:403});
    const auth=await requireAdminRequest(request); const rate=consumeRateLimit(request,"portfolio-write",30,60_000,auth.user.id);
    if(!rate.allowed) return NextResponse.json({error:"Too many portfolio changes"},{status:429});
    const id=z.coerce.number().int().positive().safeParse(request.nextUrl.searchParams.get("id")); if(!id.success)return NextResponse.json({error:"Portfolio ID is required"},{status:400});
    const admin=getSupabaseAdminClient(); if(!admin)throw new Error("Portfolio service is not configured"); const {error}=await admin.from("portfolio").delete().eq("id",id.data); if(error)throw error;
    return NextResponse.json({ok:true});
  } catch(error){return apiAuthErrorResponse(error)??NextResponse.json({error:"Unable to delete portfolio item"},{status:500});}
}
