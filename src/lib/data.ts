// Build-time view of the curriculum. All numbers on the site are computed here from site-data.json.
import raw from '../data/site-data.json';
import overrides from '../data/udemy-links.json';
import fs from 'node:fs';

export type Lesson = (typeof raw.tracks)[number]['modules'][number]['lessons'][number] & {
  live: boolean; track: string; trackN: number; module: string;
};

const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
export const buildDate = BUILD_DATE;
export const SITE = 'https://aditejus.com';
export const YT_CHANNEL = 'https://www.youtube.com/@aditejus';

// Status rule from curriculum.yaml: live = public video with publish_at on or before build date.
// 'scheduled' lessons flip to live once publish_at has passed. 'private' is never linked.
function isLive(l: any): boolean {
  if (!l.youtubeId) return false;
  if (l.youtubeVisibility === 'private') return false;
  if (l.publishAt && l.publishAt > BUILD_DATE) return false;
  return l.status === 'live' || l.youtubeVisibility === 'public' || l.youtubeVisibility === 'scheduled';
}

export const tracks = raw.tracks;
export const lessons: Lesson[] = raw.tracks.flatMap((t) =>
  t.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, live: isLive(l), track: t.id, trackN: t.n, module: m.title }))),
);
export const lessonById = new Map(lessons.map((l) => [l.id, l]));
export const trackById = new Map(raw.tracks.map((t) => [t.id, t]));

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const levelLabel = (l: string) => l[0].toUpperCase() + l.slice(1);

export type Course = {
  key: string; title: string; udemyStatus: string; udemyUrl: string | null; udemyReferral: string | null;
  udemyLink: string | null; premiere: string | null;
  lessons: Lesson[]; live: number; minutes: number; levels: string[]; tracks: string[]; primaryTrack: string | null;
  formats: string[]; availability: string;
};

export const courses: Course[] = Object.values(raw.courses).map((c0: any) => {
  // udemy-links.json overrides: udemy_referral (instructor referral link) wins over the plain URL.
  const o = (overrides as any)[c0.key] || {};
  const c = { ...c0, udemyUrl: o.url || c0.udemyUrl, udemyReferral: o.udemy_referral || c0.udemyReferral || null };
  c.udemyLink = c.udemyStatus === 'live' ? c.udemyReferral || c.udemyUrl || null : null;
  const ls = lessons.filter((l) => l.course === c.key);
  const trackCount = new Map<string, number>();
  ls.forEach((l) => trackCount.set(l.track, (trackCount.get(l.track) || 0) + 1));
  const tr = [...trackCount.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  const live = ls.filter((l) => l.live).length;
  const udemyLive = !!c.udemyLink;
  const formats = [live > 0 && 'youtube', udemyLive && 'udemy'].filter(Boolean) as string[];
  if (!formats.length) formats.push('soon');
  return {
    ...c, lessons: ls, live, minutes: ls.reduce((a, l) => a + (l.minutes || 0), 0),
    levels: LEVELS.filter((lv) => ls.some((l) => l.level === lv)),
    tracks: tr, primaryTrack: tr[0] || null, formats,
    availability: udemyLive ? 'Udemy certificate available' : c.udemyStatus === 'in_review' ? 'Udemy course in review' :
      c.udemyStatus === 'in_production' ? 'In production' : c.udemyStatus === 'planned' ? 'Planned' : 'Coming soon',
  };
}).sort((a, b) => order(a) - order(b) || (a.primaryTrack || 'z').localeCompare(b.primaryTrack || 'z'));

function order(c: any) {
  return { live: 0, in_review: 1, in_production: 2, planned: 3, conditional: 4, proposed: 5 }[c.udemyStatus as string] ?? 6;
}
export const courseByKey = new Map(courses.map((c) => [c.key, c]));

export const stats = {
  lessons: lessons.length,
  tracks: raw.tracks.length,
  live: lessons.filter((l) => l.live).length,
  udemyLive: courses.filter((c) => c.udemyLink).length,
  udemyReview: courses.filter((c) => c.udemyStatus === 'in_review').length,
  projects: lessons.filter((l) => l.format === 'project').length,
  version: raw.curriculumVersion,
  curriculumDate: raw.curriculumGenerated,
};

export const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() : `${m} min`);
export const ytUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const latestLive = () => [...lessons].filter((l) => l.live).sort((a, b) => (b.publishAt || '').localeCompare(a.publishAt || ''));

// Self-hosted YouTube thumbnail (public/thumbs/<id>.jpg, filled by scripts/fetch-thumbs.mjs), or null.
export const thumbFor = (id: string | null | undefined) =>
  id && fs.existsSync(new URL(`../../public/thumbs/${id}.jpg`, import.meta.url)) ? `/thumbs/${id}.jpg` : null;

// Udemy link shown for a lesson: its course's link when that course is live on Udemy.
export const udemyFor = (l: { course: string | null }) => {
  const c = l.course ? courseByKey.get(l.course) : null;
  return c && c.udemyLink ? { href: `/udemy/${c.key}`, title: c.title } : null;
};
export const lessonPath = (id: string) => `/lessons/${id}/`;

// Tools directory (from curriculum.yaml tools_directory) + how many lessons use each tool.
export type Tool = { key: string; name: string; tags: string[]; pricing: string | null; lessons: Lesson[] };
const toolNorm = (s: string) => s.toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim();
export const tools: Tool[] = ((raw as any).tools || []).map((t: any) => ({
  ...t, lessons: lessons.filter((l) => l.tools.some((x) => toolNorm(x.name) === toolNorm(t.name))),
})).sort((a: Tool, b: Tool) => b.lessons.length - a.lessons.length || a.name.localeCompare(b.name));
export const toolSlug = (name: string) => toolNorm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 'paid' when the lesson needs at least one paid-only tool; otherwise everything has a free option.
export const toolTier = (l: { tools: { tags: string[] }[] }) =>
  l.tools.some((t) => t.tags.includes('paid') && !t.tags.some((g) => g === 'free' || g === 'freemium' || g === 'open-source')) ? 'paid' : 'free';

// One status per lesson for badges and filters: live on YouTube, its course is on Udemy, or coming soon.
export const lessonStatus = (l: Lesson) => (l.live && l.youtubeId ? 'live' : udemyFor(l) ? 'udemy' : 'soon');
export const statusLabel = { live: 'Live on YouTube', udemy: 'On Udemy', soon: 'Coming soon' } as const;
export const formatLabel = (f: string) => (f === 'video' ? 'Video' : f[0].toUpperCase() + f.slice(1));
export const FORMATS = [...new Set(lessons.map((l) => l.format))];
