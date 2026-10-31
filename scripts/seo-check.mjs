// Fails (exit 1) when an indexable page lacks a title, meta description or canonical URL,
// when two indexable pages share a title or description, or when Open Graph/Twitter tags are missing.
import fs from 'node:fs';
import path from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
if (!fs.existsSync(DIST)) { console.error('[seo] dist/ missing: run the build first'); process.exit(1); }
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pick = (s, re) => { const m = re.exec(s); return m ? m[1].trim() : ''; };
const problems = [];
const titles = new Map(), descs = new Map();
let pages = 0, long = 0;

for (const f of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(DIST, f).replace(/index\.html$/, '');
  if (/http-equiv="refresh"/i.test(s)) continue;               // short-link redirect pages
  const noindex = /<meta name="robots" content="noindex"/i.test(s);
  const title = pick(s, /<title>([^<]*)<\/title>/i);
  const desc = pick(s, /<meta name="description" content="([^"]*)"/i);
  const canon = pick(s, /<link rel="canonical" href="([^"]*)"/i);
  if (!title) problems.push(`${rel}: missing <title>`);
  if (!desc) problems.push(`${rel}: missing meta description`);
  if (!canon) problems.push(`${rel}: missing canonical`);
  if (noindex) continue;
  pages++;
  if (title.length > 70) long++;
  if (canon && !canon.startsWith('https://aditejus.com/')) problems.push(`${rel}: canonical not on aditejus.com (${canon})`);
  for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) if (!s.includes(`property="${tag}"`)) problems.push(`${rel}: missing ${tag}`);
  for (const tag of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) if (!s.includes(`name="${tag}"`)) problems.push(`${rel}: missing ${tag}`);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { problems.push(`${rel}: invalid JSON-LD`); } }
  if (title) { if (titles.has(title)) problems.push(`${rel}: duplicate title with ${titles.get(title)} ("${title}")`); else titles.set(title, rel); }
  if (desc) { if (descs.has(desc)) problems.push(`${rel}: duplicate description with ${descs.get(desc)}`); else descs.set(desc, rel); }
}
for (const p of problems) console.error('[seo] ' + p);
console.log(`[seo] ${pages} indexable pages checked, ${problems.length} problems${long ? `, ${long} titles over 70 chars (search engines may shorten them)` : ''}`);
process.exit(problems.length ? 1 : 0);
