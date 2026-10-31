// Reads the ADITEJUS curriculum (+ status data where available) and writes src/data/site-data.json.
// Run locally where the newsdesk repo exists: `npm run sync`. CI builds from the committed JSON.
// Paths can be overridden with CURRICULUM, STATUS and GUIDELINES env vars.
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const ROOT = process.env.NEWSDESK || '/home/claude/aditejus-newsdesk';
const CURRICULUM = process.env.CURRICULUM || path.join(ROOT, 'briefs/curriculum/curriculum.yaml');
const STATUS = process.env.STATUS || path.join(ROOT, 'status.json');
const GUIDELINES = process.env.GUIDELINES || path.join(ROOT, 'CHANNEL_GUIDELINES.md');
const OUT = new URL('../src/data/site-data.json', import.meta.url);

if (!fs.existsSync(CURRICULUM)) {
  console.log(`[sync] ${CURRICULUM} not found; keeping the committed src/data/site-data.json`);
  process.exit(0);
}
const cur = yaml.load(fs.readFileSync(CURRICULUM, 'utf8'));

// Status board: only used to pick up YouTube ids that went public after the curriculum was generated.
let status = {};
try { status = JSON.parse(fs.readFileSync(STATUS, 'utf8')).videos || {}; } catch { console.log('[sync] no status.json, skipping'); }

// Public Udemy URLs live in CHANNEL_GUIDELINES.md section 1 (curriculum says: resolve there, never retype).
const udemyUrls = {};
try {
  const g = fs.readFileSync(GUIDELINES, 'utf8');
  const sec1 = g.split(/\n## /).find((s) => s.startsWith('1. Links')) || '';
  for (const m of sec1.matchAll(/\|\s*Udemy:\s*([^|]+?)\s*\|\s*(https:\/\/www\.udemy\.com\/course\/[^\s|]+)\s*\|/g)) {
    const label = m[1].toLowerCase();
    if (label.includes('deepeval')) udemyUrls['deepeval-testing'] = m[2];
    else if (label.includes('zero to production')) udemyUrls['agents-rag-z2p'] = m[2];
    else udemyUrls['slug:' + m[2].split('/course/')[1].split('/')[0]] = m[2];
  }
} catch { console.log('[sync] no CHANNEL_GUIDELINES.md, Udemy links stay empty'); }

const ytFromStatus = (src) => {
  if (!src) return null;
  const key = String(src).replace(/^status\.json\s+/, '').split(/\s/)[0];
  const v = status[key];
  const m = v && /youtu\.be\/([\w-]{11})/.exec(v.note || '');
  return m ? m[1] : null;
};

// Strip internal production notes like "(prices: verify at build)" from public text.
const clean = (s) => String(s || '').replace(/\s*\((?:[^()]*:\s*)?verify[^()]*at build\)/gi, '').trim();

const courses = {};
for (const [key, c] of Object.entries(cur.udemy_courses)) {
  // Guideline links carry the instructor referral code; keep the plain course URL separately.
  // A course whose public link is in guidelines section 1 is published, whatever the yaml status says.
  const titleSlug = String(c.title || '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ref = c.udemy_referral || udemyUrls[key] || udemyUrls['slug:' + titleSlug] || null;
  const plain = c.udemy_url || c.url || (ref ? ref.split('?')[0] : null);
  const live = c.udemy_status === 'live' || !!ref;
  courses[key] = {
    key, title: c.title, udemyStatus: live ? 'live' : c.udemy_status,
    udemyUrl: live ? plain : null,
    udemyReferral: live && ref && ref !== plain ? ref : null,
    premiere: c.premiere ? String(c.premiere) : null,
  };
}

const tracks = cur.tracks.map((t) => ({
  id: t.id, n: t.number, title: t.title, description: t.description,
  modules: t.modules.map((m) => ({
    id: m.id, title: m.title, course: m.udemy_course_key || null,
    lessons: m.lessons.map((l) => ({
      id: l.id, title: clean(l.title), level: l.level, outcome: clean(l.outcome), format: l.format,
      minutes: l.est_minutes, prerequisites: l.prerequisites || [],
      tools: (l.tools || []).map((x) => ({ name: x.name, tags: x.tags || [] })),
      status: l.status,
      youtubeId: l.youtube_id || ytFromStatus(l.source) || null,
      youtubeVisibility: l.youtube_visibility || null,
      publishAt: l.publish_at ? String(l.publish_at) : null,
      premiere: l.premiere ? String(l.premiere) : null,
      course: l.udemy_course_key || null,
    })),
  })),
}));

// Tools directory: name, licence/pricing tags and the India pricing note (internal 'verify' notes dropped).
const tools = Object.entries(cur.tools_directory || {}).map(([key, t]) => ({
  key, name: clean(t.name), tags: t.tags || [],
  pricing: /verify/i.test(String(t.india_pricing || '')) ? null : (t.india_pricing || null),
}));

const data = {
  generated: new Date().toISOString().slice(0, 10),
  curriculumVersion: String(cur.meta.version),
  curriculumGenerated: String(cur.meta.generated),
  courses, tracks, tools,
};
fs.mkdirSync(new URL('.', OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 1));
const n = tracks.reduce((a, t) => a + t.modules.reduce((b, m) => b + m.lessons.length, 0), 0);
console.log(`[sync] wrote ${n} lessons, ${tracks.length} tracks, ${Object.keys(courses).length} courses; Udemy URLs: ${Object.keys(udemyUrls).join(', ') || 'none'}`);
