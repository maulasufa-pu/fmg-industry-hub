import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const dir = path.join(process.cwd(), "public/img/artwork");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
    .map((f) => `/img/artwork/${f}`);

  return NextResponse.json(files);
}