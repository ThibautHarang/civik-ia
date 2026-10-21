// Impression A4 des CGV en flux : marges par @page dans le HTML, pied de page avec le titre et la pagination.
// Repris de 02-Demos/tarare/.../outils/print-pdf-flux.mjs, avec le puppeteer de Civik-ia/tools/chatbot-qa.
// Usage : node imprimer.mjs <entree.html> <sortie.pdf> "<texte du pied>"
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ici, '../../../tools/chatbot-qa/package.json'));
const puppeteer = require('puppeteer');
const [,, entree, sortie, pied = ''] = process.argv;
if (!entree || !sortie) { console.error('usage: node imprimer.mjs entree.html sortie.pdf "pied"'); process.exit(2); }
const echappe = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const footerTemplate = `<div style="width:100%;margin:0 20mm;padding-top:2mm;border-top:.5pt solid rgba(32,48,74,.16);font-family:Inter,Helvetica,Arial,sans-serif;font-size:7.5pt;color:#5f6879;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact"><span>${echappe(pied)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file://' + path.resolve(entree), { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluateHandle('document.fonts.ready');
await page.pdf({ path: sortie, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate });
await browser.close();
console.log('ok', sortie);
