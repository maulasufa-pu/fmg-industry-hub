// next.config.ts
import type { NextConfig } from "next";

// CSP yang mengizinkan snap.js & iframe Midtrans (sandbox + production)
const csp = [
  "default-src 'self'",
  // Snap loader + dev overlay biasanya butuh 'unsafe-inline' & kadang 'unsafe-eval'
  "script-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com 'unsafe-inline' 'unsafe-eval'",
  // Panggilan jaringan ke Midtrans API / Snap
  "connect-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com",
  // Modal Snap dirender dalam iframe
  "frame-src https://app.midtrans.com https://app.sandbox.midtrans.com",
  // Izin gambar umum
  "img-src 'self' data: blob: https://*.midtrans.com https://app.sandbox.midtrans.com https://app.midtrans.com",
  // Style inline aman untuk Tailwind + komponen
  "style-src 'self' 'unsafe-inline'",
  "base-uri 'self'",
  // Form action untuk redirect/submit pembayaran
  "form-action 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig = {
  images: {
    domains: ["source.unsplash.com"],
  },

  webpack(config) {
    // Supaya bisa import SVG sebagai React component
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*", // semua route
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Tambahan hardened headers (opsional tapi bagus)
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
