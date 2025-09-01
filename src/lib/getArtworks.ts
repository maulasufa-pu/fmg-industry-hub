// lib/getArtworks.ts
import fs from "fs";
import path from "path";

export function getArtworks() {
  const dir = path.join(process.cwd(), "public/img/artwork");
  return fs.readdirSync(dir)
    .filter(file => /\.(jpe?g|png|gif|webp|svg)$/i.test(file))
    .map(file => `/img/artwork/${file}`);
}