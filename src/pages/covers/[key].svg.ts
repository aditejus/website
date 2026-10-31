// Generated course cover art (static SVG per course): the course's own lessons drawn as cells on an
// ink field, live lessons bright, with a two-tone glow from the brand gradient. No stock imagery, no text.
import { courses } from '../../lib/data';

export function getStaticPaths() {
  return courses.map((c) => ({ params: { key: c.key } }));
}

const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function GET({ params }: { params: { key: string } }) {
  const c = courses.find((x) => x.key === params.key)!;
  const W = 640, H = 360, h = hash(c.key);
  const n = Math.max(c.lessons.length, 6);
  const cols = n > 40 ? 14 : n > 20 ? 10 : 8;
  const size = n > 40 ? 18 : 22, gap = 7;
  const gx = 48, gy = H - 48 - Math.ceil(n / cols) * (size + gap) + gap;
  const g1x = 380 + (h % 200), g1y = 40 + ((h >> 3) % 120), g2x = 120 + ((h >> 5) % 220), g2y = 260 + ((h >> 7) % 80);
  const cells = Array.from({ length: n }, (_, i) => {
    const l = c.lessons[i];
    const x = gx + (i % cols) * (size + gap), y = gy + Math.floor(i / cols) * (size + gap);
    if (l?.live) return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="#EBC56A" filter="url(#b)"/>`;
    const op = !l ? 0.35 : l.level === 'beginner' ? 1 : l.level === 'intermediate' ? 0.8 : 0.62;
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="#2A3A68" opacity="${op}"/>`;
  }).join('');
  const lines = Array.from({ length: 15 }, (_, i) => `<path d="M${i * 48} 0V${H}" />`).join('') + Array.from({ length: 8 }, (_, i) => `<path d="M0 ${i * 48}H${W}" />`).join('');
  const arcs = [0, 1, 2].map((k) => `<circle cx="${g1x}" cy="${g1y}" r="${70 + k * 46 + (h % 20)}" fill="none" stroke="url(#ln)" stroke-width="1" opacity="${0.5 - k * 0.14}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<radialGradient id="g1" cx="${g1x}" cy="${g1y}" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E6B954" stop-opacity=".42"/><stop offset="1" stop-color="#E6B954" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx="${g2x}" cy="${g2y}" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6E86D8" stop-opacity=".22"/><stop offset="1" stop-color="#6E86D8" stop-opacity="0"/></radialGradient>
<linearGradient id="ln" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7DC8F"/><stop offset="1" stop-color="#C8932E"/></linearGradient>
<filter id="b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${W}" height="${H}" fill="#0A1022"/>
<rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>
<g stroke="#D6C496" stroke-opacity=".05" stroke-width="1">${lines}</g>
${arcs}
${cells}
</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
