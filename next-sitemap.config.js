/** @type {import('next-sitemap').IConfig} */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://flemmomusic.com").replace(/\/+$/, "");
const isPreviewDomain = /vercel\.app$/i.test(new URL(SITE_URL).hostname);

const IMPORTANT_ROUTES = new Set([
  "/arrangement",
  "/id/jasa-aransemen-lagu",
  "/song-creation-service",
  "/id/jasa-pembuatan-lagu",
  "/learn/how-to-make-a-song",
  "/id/cara-bikin-lagu",
  "/portfolio",
  "/pricing",
  "/services",
]);

const LANGUAGE_PAIRS = {
  "/arrangement": { en: "/arrangement", id: "/id/jasa-aransemen-lagu" },
  "/id/jasa-aransemen-lagu": { en: "/arrangement", id: "/id/jasa-aransemen-lagu" },
  "/song-creation-service": { en: "/song-creation-service", id: "/id/jasa-pembuatan-lagu" },
  "/id/jasa-pembuatan-lagu": { en: "/song-creation-service", id: "/id/jasa-pembuatan-lagu" },
  "/learn/how-to-make-a-song": { en: "/learn/how-to-make-a-song", id: "/id/cara-bikin-lagu" },
  "/id/cara-bikin-lagu": { en: "/learn/how-to-make-a-song", id: "/id/cara-bikin-lagu" },
};

const UTILITY_ROUTES = [
  "/academy/apply",
  "/apple-icon.png",
  "/careers/apply",
  "/events/deck",
  "/events/inquiry",
  "/icon.png",
  "/labs/beta",
  "/media/inquiry",
  "/opengraph-image",
  "/portfolio/opengraph-image",
  "/publishing/inquiry",
  "/publishing/proposal",
  "/services/inquiry",
];

module.exports = {
  siteUrl: SITE_URL,
  outDir: "./public",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 45000,
  autoLastmod: false,
  additionalPaths: async (config) =>
    Promise.all(
      [...IMPORTANT_ROUTES].map((path) =>
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
    ...UTILITY_ROUTES,
  ],
  robotsTxtOptions: {
    policies: isPreviewDomain
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/" }],
  },
  transform: async (config, path) => {
    const isLegal = path.startsWith("/legal");
    const isImportant = IMPORTANT_ROUTES.has(path);
    const pair = LANGUAGE_PAIRS[path];
    const salesPriority = path === "/arrangement" || path === "/id/jasa-aransemen-lagu"
      ? 1
      : path === "/song-creation-service" || path === "/id/jasa-pembuatan-lagu"
        ? 0.9
        : path === "/learn/how-to-make-a-song" || path === "/id/cara-bikin-lagu"
          ? 0.8
          : isImportant ? 0.75 : path === "/" ? 0.7 : isLegal ? 0.3 : 0.5;

    return {
      loc: path,
      changefreq: isLegal ? "yearly" : isImportant ? "weekly" : "monthly",
      priority: salesPriority,
      alternateRefs: pair ? [
        { href: `${SITE_URL}${pair.en}`, hreflang: "en-US", hrefIsAbsolute: true },
        { href: `${SITE_URL}${pair.id}`, hreflang: "id-ID", hrefIsAbsolute: true },
        { href: `${SITE_URL}${pair.en}`, hreflang: "x-default", hrefIsAbsolute: true },
      ] : [],
    };
  },
};
