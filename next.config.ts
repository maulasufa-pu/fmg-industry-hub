// next.config.ts
import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : "https://*.supabase.co";
const supabaseHost = supabaseUrl ? supabaseUrl.host : "*.supabase.co";
const supabaseWs = supabaseUrl ? supabaseUrl.origin.replace("https://", "wss://") : "wss://*.supabase.co";

const isDev = process.env.NODE_ENV !== "production";
// Ubah ke "1" bila ingin mode Report-Only di production untuk uji pelanggaran CSP.
const cspReportOnly = isDev || process.env.CSP_REPORT_ONLY === "1";

// Endpoint pelaporan CSP (ganti dengan endpoint milikmu)
const REPORT_TO_JSON = JSON.stringify({
  group: "csp-endpoint",
  max_age: 10886400,
  endpoints: [{ url: "https://your-report-collector.example.com/csp" }],
});

const devConnect =
  isDev
    ? " http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321"
    : "";

const scriptSrcParts = [
  "'self'",
  // Di dev, Next.js/React Refresh sering butuh eval
  ...(isDev ? ["'unsafe-eval'"] : []),
  // Pihak ketiga yang kamu gunakan
  "https://app.midtrans.com",
  "https://app.sandbox.midtrans.com",
  "https://hcaptcha.com",
  "https://*.hcaptcha.com",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
];

const cspParts = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",

  // Iframe embeds
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://w.soundcloud.com https://soundcloud.com https://open.spotify.com https://embed.spotify.com https://www.google.com https://maps.google.com https://calendar.google.com https://app.midtrans.com https://app.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com",

  // Scripts — pertahankan 'unsafe-inline' sementara (Next inject __NEXT_DATA__)
  `script-src ${scriptSrcParts.join(" ")} 'unsafe-inline'`,

  // XHR / WebSocket
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com${devConnect}`,

  // Images (OG, YouTube thumb, Unsplash, Supabase, Spotify/SoundCloud artwork)
  `img-src 'self' data: blob: ${supabaseOrigin} https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://source.unsplash.com https://images.unsplash.com https://i.scdn.co https://cdn.sndcdn.com`,

  // Styles & Fonts
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",

  // Media (audio/video)
  `media-src 'self' data: blob: ${supabaseOrigin} https://cdn.plyr.io https://storage.googleapis.com https://*.googlevideo.com https://audio-ssl.itunes.apple.com`,
  `audio-src 'self' data: blob: ${supabaseOrigin} https://*.googlevideo.com`,

  // Workers
  "worker-src 'self' blob:",

  // Lainnya
  "object-src 'none'",
  // Jika ada submit form yang keluar origin (mis. Midtrans), tambahkan domain di bawah ini.
  "form-action 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
  "manifest-src 'self'",
  "prefetch-src 'self'",
  "upgrade-insecure-requests",

  // Saat siap, bisa pertimbangkan Trusted Types (uji dulu di Report-Only):
  // "require-trusted-types-for 'script'",
];

// Gabungkan direktif CSP
const CSP_VALUE = cspParts.join("; ");

const nextConfig: NextConfig = {
  images: {
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "i.ytimg.com",
      "img.youtube.com",
      "i.vimeocdn.com",
      "i.scdn.co",
      "cdn.sndcdn.com",
      ...(supabaseHost ? [supabaseHost] : []),
    ],
  },
  webpack(config) {
    config.module.rules.push({ test: /\.svg$/, use: ["@svgr/webpack"] });
    return config;
  },
  async headers() {
    const headers: { source: string; headers: { key: string; value: string }[] }[] = [];

    // 1) Header khusus untuk file video statik di /public/videos/**
    headers.push({
      source: "/videos/:path*",
      headers: [
        { key: "Content-Disposition", value: "inline" },
        { key: "Accept-Ranges", value: "bytes" },
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        // Jika kamu embed lintas origin, atur sesuai kebutuhan
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ],
    });

    // 2) Header REPORT-ONLY (saat uji kebijakan)
    if (cspReportOnly) {
      headers.push({
        source: "/(.*)",
        headers: [
          // Report-To untuk "report-to" directive (Chrome masih mendukung)
          { key: "Report-To", value: REPORT_TO_JSON },
          // Reporting-Endpoints (opsional modern)
          // { key: "Reporting-Endpoints", value: 'csp-endpoint="https://your-report-collector.example.com/csp"' },
          { key: "Content-Security-Policy-Report-Only", value: `${CSP_VALUE}; report-to=csp-endpoint` },
        ],
      });
    } else {
      // 3) Enforce CSP di produksi
      headers.push({
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: CSP_VALUE }],
      });
    }

    return headers;
  },
};

export default nextConfig;
