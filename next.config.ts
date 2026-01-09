// next.config.ts
import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : "https://*.supabase.co";
const supabaseHost = supabaseUrl ? supabaseUrl.host : "*.supabase.co";
const supabaseWs = supabaseUrl ? supabaseUrl.origin.replace("https://", "wss://") : "wss://*.supabase.co";

const isDev = process.env.NODE_ENV !== "production";
const cspReportOnly = isDev || process.env.CSP_REPORT_ONLY === "1";

const REPORT_TO_JSON = JSON.stringify({
  group: "csp-endpoint",
  max_age: 10886400,
  endpoints: [{ url: "https://your-report-collector.example.com/csp" }],
});

const devConnect = isDev
  ? " http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321"
  : "";

const scriptSrcParts = [
  "'self'",
  ...(isDev ? ["'unsafe-eval'"] : []),
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
  `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://w.soundcloud.com https://soundcloud.com https://open.spotify.com https://embed.spotify.com https://www.google.com https://maps.google.com https://calendar.google.com https://app.midtrans.com https://app.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com`,
  `script-src ${scriptSrcParts.join(" ")} 'unsafe-inline'`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com https://hcaptcha.com https://*.hcaptcha.com${devConnect}`,
  `img-src 'self' data: blob: ${supabaseOrigin} https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://source.unsplash.com https://images.unsplash.com https://i.scdn.co https://cdn.sndcdn.com https://is1-ssl.mzstatic.com https://is2-ssl.mzstatic.com https://is3-ssl.mzstatic.com https://is4-ssl.mzstatic.com https://is5-ssl.mzstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `media-src 'self' data: blob: ${supabaseOrigin} https://cdn.plyr.io https://storage.googleapis.com https://*.googlevideo.com https://audio-ssl.itunes.apple.com`,
  `audio-src 'self' data: blob: ${supabaseOrigin} https://*.googlevideo.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "form-action 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
  "manifest-src 'self'",
  "prefetch-src 'self'",
  "upgrade-insecure-requests",
];

const CSP_VALUE = cspParts.join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "cdn.sndcdn.com" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is2-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is3-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is4-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is5-ssl.mzstatic.com" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost.replace("*.", ""),
              pathname: "**",
            },
          ]
        : []),
    ],
  },

  experimental: {
    forceSwcTransforms: true, // pakai SWC sesuai target browserslist
  },

  webpack(config) {
    config.module.rules.push({ test: /\.svg$/, use: ["@svgr/webpack"] });
    return config;
  },

  // ✅ REDIRECT DOMAIN VERCEL → CUSTOM DOMAIN
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "fmg-industry-hub.vercel.app",
          },
        ],
        destination: "https://flemmomusic.com/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },

  async headers() {
    const headers: {
      source: string;
      headers: { key: string; value: string }[];
    }[] = [];

    // Cache immutable untuk file static Next.js
    headers.push({
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    });

    // Cache untuk file video
    headers.push({
      source: "/videos/:path*",
      headers: [
        { key: "Content-Disposition", value: "inline" },
        { key: "Accept-Ranges", value: "bytes" },
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ],
    });

    // CSP
    if (cspReportOnly) {
      headers.push({
        source: "/(.*)",
        headers: [
          { key: "Report-To", value: REPORT_TO_JSON },
          {
            key: "Content-Security-Policy-Report-Only",
            value: `${CSP_VALUE}; report-to=csp-endpoint`,
          },
        ],
      });
    } else {
      headers.push({
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: CSP_VALUE }],
      });
    }

    return headers;
  },
};

export default nextConfig;
