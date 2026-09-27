const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const records = [];
  const failures = [];
  page.on('response', async response => {
    const url = new URL(response.url());
    if (!url.hostname.endsWith('google-analytics.com') || !url.pathname.endsWith('/collect')) return;
    const request = response.request();
    const body = request.postData() || '';
    const params = url.searchParams;
    const rows = body ? body.split('\n') : [''];
    for (const row of rows) {
      const payload = new URLSearchParams(row);
      records.push({ event: payload.get('en') || params.get('en'), measurementId: params.get('tid'), status: response.status(), debug: payload.get('_dbg') || params.get('_dbg') });
    }
  });
  page.on('requestfailed', request => {
    if (request.url().includes('google-analytics.com')) failures.push(request.failure()?.errorText);
  });
  await page.addInitScript(() => localStorage.setItem('fmg_cookie_consent', JSON.stringify({ version: '2026-08-23', analytics: true, embeds: false })));
  await page.goto('https://flemmomusic.com/id/jasa-aransemen-lagu', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.gtag === 'function', { timeout: 30000 });
  await page.evaluate(() => {
    window.gtag('set', 'debug_mode', true);
    // Prevent leaving the website or opening WhatsApp during this test.
    document.querySelector('main a[href^="https://wa.me"]').addEventListener('click', event => event.preventDefault(), { once: true });
  });
  await page.locator('main a[href^="https://wa.me"]').first().click();
  await page.waitForTimeout(3000);
  const output = { checkedAt: new Date().toISOString(), source: 'Production browser network; not GA4 dashboard', records, failures };
  fs.writeFileSync('docs/seo/production-ga4-network.json', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
  await browser.close();
  if (!records.some(record => record.event === 'click_whatsapp' && record.status >= 200 && record.status < 300)) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
