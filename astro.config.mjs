// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// Short links used in every description, bio and post (CHANNEL_GUIDELINES §42).
// /courses/<key> is the real course page, so it needs no redirect.
const data = JSON.parse(fs.readFileSync(new URL('./src/data/site-data.json', import.meta.url), 'utf8'));
// /udemy/<key>: instructor referral link (udemy_referral) when set, else the plain course URL.
const overrides = JSON.parse(fs.readFileSync(new URL('./src/data/udemy-links.json', import.meta.url), 'utf8'));
const udemy = Object.fromEntries(
  Object.values(data.courses)
    .filter((c) => c.udemyStatus === 'live')
    .map((c) => {
      const o = overrides[c.key] || {};
      return [`/udemy/${c.key}`, o.udemy_referral || c.udemyReferral || o.url || c.udemyUrl];
    })
    .filter(([, url]) => url),
);

export default defineConfig({
  site: 'https://aditejus.com',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  redirects: {
    '/start': '/roadmaps/#beginner',
    '/roadmap': '/roadmaps/',
    '/learn': '/courses/',
    '/syllabus': '/courses/syllabus/',
    '/youtube': 'https://www.youtube.com/@aditejus?sub_confirmation=1',
    ...udemy,
  },
});
