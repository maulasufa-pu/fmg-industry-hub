/** @type {import('next-sitemap').IConfig} */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://flemmomusic.com").replace(/\/+$/, "");
const isPreviewDomain = /vercel\.app$/i.test(new URL(SITE_URL).hostname);

const IMPORTANT_ROUTES = new Set([
  "/",
  "/about",
  "/contact",
  "/creative",
  "/portfolio",
  "/pricing",
  "/services",
  "/arrangement",
]);

module.exports = {
  siteUrl: SITE_URL,
  outDir: "./public",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 45000,
  autoLastmod: false,
  additionalPaths: async (config) =>
    Promise.all(
      ["/arrangement", "/pricing", "/services"].map((path) =>
        config.transform(config, path),
      ),
    ),
  exclude: [
    "/admin/**",
    "/api/**",
    "/auth/**",
    "/client/**",
    "/debug/**",
    "/forgot-password",
    "/login",
    "/payments/**",
    "/profile/**",
    "/reset-password",
    "/signup",
    "/ui/**",
  ],
  robotsTxtOptions: {
    policies: isPreviewDomain
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/" }],
  },
  transform: async (config, path) => {
    const isLegal = path.startsWith("/legal");
    const isImportant = IMPORTANT_ROUTES.has(path);

    return {
      loc: path,
      changefreq: isLegal ? "yearly" : isImportant ? "weekly" : "monthly",
      priority: path === "/" ? 1 : isImportant ? 0.8 : isLegal ? 0.3 : 0.5,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
