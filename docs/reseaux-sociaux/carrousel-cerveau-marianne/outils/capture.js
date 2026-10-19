// Capture la scène "Le cerveau de Marianne" à chacun de ses 6 états, pour plusieurs tailles de table.
const { chromium } = require('playwright');
const fs = require('fs');
const SIZES = JSON.parse(process.argv[2] || '{"carre":[900,860]}');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.route('**/marianne/base.js*', async route => {
    const r = await route.fetch(); let js = await r.text();
    js += '\nwindow.__mb = { appliquer, calculer, arreter, sauter, table, legende, get G(){ return G; } };\n';
    await route.fulfill({ response: r, body: js, headers: { ...r.headers(), 'content-type': 'application/javascript' } });
  });
  await page.goto('https://civik-ia.fr/marianne/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'body * { visibility:hidden !important } .recit__scene, .recit__scene * { visibility:visible !important } html{background:#f7f4ed}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__mb && window.__mb.G);
  for (const [nom, [W, H]] of Object.entries(SIZES)) {
    await page.evaluate(([W, H]) => {
      const mb = window.__mb; mb.arreter();
      document.documentElement.classList.add('anim-non');
      const sc = document.querySelector('.recit__scene');
      sc.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:9999;background:#f7f4ed;padding:0;margin:0`;
      document.body.style.overflow = 'hidden';
      mb.calculer();
    }, [W, H]);
    await page.waitForTimeout(300);
    for (let e = 0; e <= 5; e++) {
      await page.evaluate(e => { window.__mb.arreter(); window.__mb.appliquer(e); }, e);
      await page.waitForTimeout(400);
      await page.locator('.recit__scene .table').screenshot({ path: `scenes3/${nom}-etat-${e + 1}.png`, omitBackground: true });
      const leg = await page.evaluate(() => window.__mb.legende.textContent);
      console.log(nom, e + 1, leg);
    }
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
