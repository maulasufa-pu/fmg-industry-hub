// next.config.ts
import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseOrigin = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "https://*.supabase.co";
const supabaseWs = supabaseOrigin.replace("https://", "wss://");
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "source.unsplash.com",
      ...(SUPABASE_URL ? [new URL(SUPABASE_URL).host] : []),
      "images.unsplash.com",
    ],
  },
  webpack(config) {
    config.module.rules.push({ test: /\.svg$/, use: ["@svgr/webpack"] });
    return config;
  },
  async headers() {
    const devConnect = isDev
      ? " http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321"
      : "";

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",

      // Iframe embed populer
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://w.soundcloud.com https://soundcloud.com https://open.spotify.com https://embed.spotify.com https://www.google.com https://maps.google.com https://calendar.google.com https://app.midtrans.com https://app.sandbox.midtrans.com",

      // Script: batasi ke self + midtrans (tambah kalau benar-benar perlu)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com",

      // Fetch/WebSocket: Supabase + Midtrans (tambah lainnya bila kamu fetch HLS/M3U8 dari origin lain)
      `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com`,

      // Gambar (thumbnail YouTube/Vimeo/OG)
      "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://source.unsplash.com https://images.unsplash.com",

      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",

      // Media (audio/video file langsung)
      `media-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co https://cdn.plyr.io https://storage.googleapis.com https://*.googlevideo.com https://audio-ssl.itunes.apple.com`,
      "audio-src 'self' data: blob: https://*.supabase.co https://*.googlevideo.com",

      "worker-src 'self' blob:",
      "object-src 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
