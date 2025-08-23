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
    // Opsi dev: izinkan Supabase lokal (jika pakai CLI)
    const devConnect =
      isDev
        ? " http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321"
        : "";

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",

      // Midtrans Snap iframe/redirect
      "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",

      // Script (Next + Midtrans Snap)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com",

      // XHR/fetch/WebSocket targets (Supabase + Midtrans + self)
      `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com${devConnect}`,

      // Gambar (termasuk Supabase Storage, data/blob, Unsplash)
      "img-src 'self' data: blob: https://*.supabase.co https://source.unsplash.com https://images.unsplash.com",

      // Style & font
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",

      // Media/workers
      "media-src 'self' data: blob:",
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
