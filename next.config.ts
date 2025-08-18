import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

module.exports = {
  async rewrites() {
    return [
      // ADMIN - SIDE
      { source: "/admin/projects", destination: "/admin/projects" },
      { source: "/admin/dashboard", destination: "/ui/dashboard" },
      { source: "/admin/users", destination: "/ui/admin/users" },
      { source: "/admin/invoices", destination: "/ui/invoices" },
      // CLIENT - SIDE
      { source: "/client/projects", destination: "/client/projects" },
      { source: "/client/dashboard", destination: "/ui/dashboard" },
      { source: "/client/invoices", destination: "/ui/invoices" },
    ];
  },
};


export default nextConfig;
