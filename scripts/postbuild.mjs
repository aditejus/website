// After `astro build`: write sitemap.xml and run the budget checks (fails the build on a breach).
import fs from 'node:fs';
import path from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://aditejus.com';
const JS_BUDGET = 200 * 1024;      // per page: inline + external JS
const IMG_BUDGET = 200 * 1024;     // per image file

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
let fail = 0;
const urls = [];

for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const isRedirect = /http-equiv="refresh"/i.test(s);
  const noindex = /<meta name="robots" content="noindex"/i.test(s);
  if (!isRedirect && !noindex && !rel.startsWith('/404')) urls.push(rel);
  if (isRedirect) continue;
  // JS weight: inline scripts (excluding JSON-LD) + referenced script files.
  let js = 0;
  for (const m of s.matchAll(/<script(?![^>]*application\/ld\+json)([^>]*)>([\s\S]*?)<\/script>/g)) {
    js += Buffer.byteLength(m[2]);
    const src = /src="([^"]+)"/.exec(m[1]);
    if (src && src[1].startsWith('/')) { try { js += fs.statSync(path.join(DIST, src[1])).size; } catch {} }
  }
  if (js > JS_BUDGET) { console.error(`[budget] ${rel}: ${(js / 1024).toFixed(1)} KB JS > 200 KB`); fail++; }
  if (/\b(google-analytics|googletagmanager|gtag\(|facebook\.net|hotjar|document\.cookie)/.test(s)) { console.error(`[privacy] ${rel}: tracker or cookie code found`); fail++; }
  if (/fonts\.googleapis|fonts\.gstatic/.test(s)) { console.error(`[privacy] ${rel}: third-party font request`); fail++; }
}
for (const f of files.filter((f) => /\.(png|jpe?g|webp|avif|gif)$/i.test(f))) {
  const sz = fs.statSync(f).size;
  if (sz > IMG_BUDGET) { console.error(`[budget] image ${path.relative(DIST, f)} is ${(sz / 1024).toFixed(0)} KB > 200 KB`); fail++; }
}

urls.sort();
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`);

const maxJs = Math.max(...html.map((f) => { const s = fs.readFileSync(f, 'utf8'); return [...s.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].reduce((a, m) => a + Buffer.byteLength(m[1]), 0); }));
console.log(`[postbuild] ${html.length} HTML files, ${urls.length} in sitemap, max inline JS per page ${(maxJs / 1024).toFixed(1)} KB, ${fail} problems`);
process.exit(fail ? 1 : 0);
