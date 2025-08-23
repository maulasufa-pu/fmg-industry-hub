/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://fmg-industry-hub.vercel.app',
  generateRobotsTxt: true,
  exclude: ['/admin/**','/client/**','/api/**','/debug/**','/profile/**','/ui/**'],
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path === '/' ? 'weekly' : 'yearly',
      priority: path === '/' ? 0.9 : 0.5,
      lastmod: new Date().toISOString(),
      // alternateRefs: [{ href: 'https://.../id', hreflang: 'id' }],
    };
  },
};