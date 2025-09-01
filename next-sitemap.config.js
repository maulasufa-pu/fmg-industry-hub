/** @type {import('next-sitemap').IConfig} */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://flemmomusic.com';
const isProdDomain = !/vercel\.app$/i.test(SITE_URL); // disallow crawling on preview domains

const IMPORTANT = new Set([
  '/', '/about', '/careers', '/publishing', '/media', '/talent', '/contact',
]);

module.exports = {
  siteUrl: SITE_URL,
  outDir: './public',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 45000,
  exclude: [
    '/admin/**','/client/**','/api/**','/debug/**','/profile/**','/ui/**',
    '/_next/**','/404','/500', '/auth/**'
  ],
  robotsTxtOptions: {
    policies: isProdDomain
      ? [{ userAgent: '*', allow: '/' }]
      : [{ userAgent: '*', disallow: '/' }], // block preview/staging
    additionalSitemaps: [
      // If later you add a server-generated sitemap, list it here:
      // `${SITE_URL}/server-sitemap.xml`
    ],
  },
  transform: async (config, path) => {
    let changefreq = 'monthly';
    let priority = 0.5;

    if (path === '/') { changefreq = 'weekly'; priority = 1.0; }
    if (IMPORTANT.has(path)) { changefreq = 'weekly'; priority = path === '/' ? 1.0 : 0.8; }
    if (path.startsWith('/legal')) { changefreq = 'yearly'; priority = 0.3; }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  additionalPaths: async () => ([
    { loc: '/legal/terms',   changefreq: 'yearly', priority: 0.3, lastmod: new Date().toISOString() },
    { loc: '/legal/privacy', changefreq: 'yearly', priority: 0.3, lastmod: new Date().toISOString() },
    { loc: '/legal/cookies', changefreq: 'yearly', priority: 0.3, lastmod: new Date().toISOString() },
    { loc: '/legal/dmca',    changefreq: 'yearly', priority: 0.3, lastmod: new Date().toISOString() },
  ]),
};
