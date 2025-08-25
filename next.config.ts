// next.config.ts
import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseOrigin = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "https://*.supabase.co";
const supabaseWs = SUPABASE_URL ? new URL(SUPABASE_URL).origin.replace("https://", "wss://") : "wss://*.supabase.co";
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

      // Iframe embeds
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://w.soundcloud.com https://soundcloud.com https://open.spotify.com https://embed.spotify.com https://www.google.com https://maps.google.com https://calendar.google.com https://app.midtrans.com https://app.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com",

      // Scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com https://www.youtube.com",

      // XHR/WebSocket (hls.js juga pakai jalur ini)
      `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com${devConnect}`,

      // Images (OG, YouTube thumb, Unsplash, Supabase)
      "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://source.unsplash.com https://images.unsplash.com",

      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",

      // Media (audio/video) — untuk <video> tag & source HLS/MP4
      `media-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co https://cdn.plyr.io https://storage.googleapis.com https://*.googlevideo.com https://audio-ssl.itunes.apple.com`,
      "audio-src 'self' data: blob: https://*.supabase.co https://*.googlevideo.com",

      "worker-src 'self' blob:",
      "object-src 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      // 1) Header khusus untuk file di /public/videos/** → inline streaming + range
      {
        source: "/videos/:path*",
        headers: [
          { key: "Content-Disposition", value: "inline" },
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          // Boleh dipakai jika kamu embed lintas-origin; kalau satu origin, biarkan same-origin
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      // 2) CSP global (letakkan SETELAH rule spesifik videos supaya precedence tetap benar)
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
