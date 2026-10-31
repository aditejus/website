// Downloads YouTube thumbnails for live lessons into public/thumbs/<videoId>.jpg so the site
// serves them itself (no third-party requests from visitors). Runs in CI before the build;
// skips files that already exist and never fails the build (the site falls back to a drawn poster).
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/site-data.json', import.meta.url), 'utf8'));
const dir = new URL('../public/thumbs/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const ids = data.tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons))
  .filter((l) => l.youtubeId && l.youtubeVisibility !== 'private' && (!l.publishAt || l.publishAt <= today))
  .map((l) => l.youtubeId);
let ok = 0; const failed = [];
for (const id of ids) {
  const out = new URL(`${id}.jpg`, dir);
  if (fs.existsSync(out)) { ok++; continue; }
  try {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
    if (!r.ok) throw new Error(String(r.status));
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 200 * 1024) throw new Error('over 200 KB');
    fs.writeFileSync(out, buf); ok++;
  } catch (e) { failed.push(`${id} (${e.message})`); }
}
console.log(`[thumbs] ${ok}/${ids.length} thumbnails present${failed.length ? `; could not fetch ${failed.length}, drawn posters used instead` : ''}`);
