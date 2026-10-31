// RSS 2.0 feed for Insights (industry insights + Friday Wrap articles).
const SITE = 'https://aditejus.com';
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const posts = Object.values(import.meta.glob<any>('../../content/insights/[!_]*.md', { eager: true }))
    .map((p) => ({ ...p.frontmatter, slug: p.file.split('/').pop().replace(/\.md$/, '') }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/insights/${p.slug}/</link>
      <guid isPermaLink="true">${SITE}/insights/${p.slug}/</guid>
      <pubDate>${new Date(String(p.date)).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ADITEJUS Insights</title>
    <link>${SITE}/insights/</link>
    <atom:link href="${SITE}/insights/rss.xml" rel="self" type="application/rss+xml"/>
    <description>How real companies run AI in production, and the weekly Friday Wrap. Every claim sourced and dated.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
