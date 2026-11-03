// Generates every image in ../assets. Deterministic: same inputs, same files.
// Usage and the rules behind these numbers: ../docs/DESIGN.md

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import woff2 from 'wawoff2';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'assets');
const source = join(here, 'source');
const require = createRequire(import.meta.url);
mkdirSync(join(out, 'icons'), { recursive: true });

// Fonts are read at build time and only their outlines reach the output. No font file lives in this repo.
const FONT_DIR = process.env.FONT_DIR ?? join(here, '..', '..', 'masachi-dc-portfolio', 'public', 'fonts');
const load = async (path) => {
  const bytes = await woff2.decompress(readFileSync(path));
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};
const display = await load(join(FONT_DIR, 'cabinet-grotesk-800.woff2'));
const mono = await load(require.resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'));

const outline = (font, text, x, y, size, { fill, tracking = 0, anchor = 'start', opacity = 1 }) => {
  const width = font.getAdvanceWidth(text, size, { letterSpacing: tracking });
  const left = anchor === 'end' ? x - width : x;
  const d = font.getPath(text, left, y, size, { letterSpacing: tracking }).toPathData(1);
  return `<path d="${d}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
};

// Masachi DC tokens (portfolio theme.css). Node colours are the projects' own brand colours: the portfolio's card
// overlay on light, and on dark the brand colour that stays visible.
const THEME = {
  light: {
    ink: '#0a0a0b',
    muted: '#55555a',
    web: '#0a0a0b',
    nodes: { tembo: '#E0A800', kesho: '#03401F', amuse: '#260101', inline: '#004B66', seeds: '#001047' },
  },
  dark: {
    ink: '#f5f5f7',
    muted: '#a1a1a6',
    web: '#f5f5f7',
    nodes: { tembo: '#FFC829', kesho: '#0B7A3B', amuse: '#943B00', inline: '#007BA8', seeds: '#BF8400' },
  },
};

const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const n = (v) => Math.round(v * 10) / 10;

/** The portfolio's star chart, redrawn for a fixed frame: a fading web with the projects as its brightest nodes. */
function constellation({ box, stars, chains, tails, theme, seed = 7 }) {
  const t = THEME[theme];
  const random = seeded(seed);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const fade = (x, y) => Math.max(0, 1 - Math.hypot((x - cx) / (box.w * 0.54), (y - cy) / (box.h * 0.62)) ** 2.2);

  const points = [];
  const step = 62;
  for (let gy = box.y; gy <= box.y + box.h; gy += step) {
    for (let gx = box.x; gx <= box.x + box.w; gx += step) {
      const p = { x: gx + (random() - 0.5) * step * 0.9, y: gy + (random() - 0.5) * step * 0.9 };
      if (fade(p.x, p.y) > 0.04) points.push(p);
    }
  }

  const seen = new Set();
  const web = [];
  points.forEach((p, i) => {
    points
      .map((q, j) => ({ j, d: Math.hypot(q.x - p.x, q.y - p.y) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = [Math.min(i, j), Math.max(i, j)].join();
        if (seen.has(key)) return;
        seen.add(key);
        const q = points[j];
        const o = fade((p.x + q.x) / 2, (p.y + q.y) / 2) * 0.3;
        web.push(`<path d="M${n(p.x)} ${n(p.y)}L${n(q.x)} ${n(q.y)}" stroke-opacity="${o.toFixed(2)}"/>`);
      });
  });
  const dots = points.map((p) => {
    const o = fade(p.x, p.y) * 0.6;
    return `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="2" fill-opacity="${o.toFixed(2)}"/>`;
  });

  const figure = chains.map((chain) => {
    const path = chain.map((key, i) => `${i ? 'L' : 'M'}${stars[key]?.x ?? key.x} ${stars[key]?.y ?? key.y}`).join('');
    return `<path d="${path}" stroke-opacity="0.72" stroke-width="2"/>`;
  });
  const joints = chains
    .flat()
    .filter((key) => typeof key !== 'string')
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5"/>`);
  const loose = tails.map(({ from, x, y }) => {
    const s = stars[from];
    return `<path d="M${s.x} ${s.y}L${x} ${y}" stroke-opacity="0.34"/>`;
  });
  const nodes = Object.entries(stars).map(
    ([key, s]) => `<circle cx="${s.x}" cy="${s.y}" r="9" fill="${t.nodes[key]}"/>`,
  );
  const names = Object.values(stars).map((s) =>
    outline(mono, s.name, s.x + (s.anchor === 'end' ? -16 : 16), s.y + (s.dy ?? 8), 22, {
      fill: t.ink,
      tracking: 0.06,
      anchor: s.anchor ?? 'start',
    }),
  );

  return [
    `<g fill="none" stroke="${t.web}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${web.join('')}${loose.join('')}${figure.join('')}</g>`,
    `<g fill="${t.web}">${dots.join('')}<g fill-opacity="0.75">${joints.join('')}</g></g>`,
    nodes.join(''),
    names.join(''),
  ].join('');
}

function masthead(theme) {
  const t = THEME[theme];
  const W = 1660;
  const H = 560;
  const size = 208;
  const leading = size * 0.92;
  const base = H - 30;
  const stars = {
    tembo: { x: 930, y: 268, name: 'TEMBO', anchor: 'end', dy: -14 },
    kesho: { x: 1110, y: 156, name: 'KESHO', dy: -18 },
    amuse: { x: 1352, y: 122, name: 'AMUSE', dy: -18 },
    inline: { x: 1560, y: 310, name: 'INLINE', anchor: 'end', dy: 38 },
    seeds: { x: 1220, y: 452, name: 'PROJECT SEEDS', dy: 38 },
  };
  const chains = [
    ['tembo', { x: 1006, y: 196 }, 'kesho', { x: 1236, y: 104 }, 'amuse'],
    ['seeds', { x: 1056, y: 372 }, 'tembo'],
  ];
  const tails = [
    { from: 'inline', x: 1470, y: 216 },
    { from: 'inline', x: 1612, y: 200 },
    { from: 'inline', x: 1460, y: 410 },
    { from: 'amuse', x: 1480, y: 60 },
    { from: 'seeds', x: 1380, y: 500 },
  ];
  const box = { x: 800, y: 40, w: 860, h: 500 };
  const body = [
    constellation({ box, stars, chains, tails, theme }),
    outline(mono, 'MASACHI DC', 0, 34, 22, { fill: t.muted, tracking: 0.08 }),
    outline(mono, '32.72N 117.16W', W, 34, 22, { fill: t.muted, tracking: 0.08, anchor: 'end' }),
    outline(display, 'Nathan', -4, base - leading, size, { fill: t.ink, tracking: -0.02 }),
    outline(display, 'Masachi', -4, base, size, { fill: t.ink, tracking: -0.02 }),
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W / 2}" height="${H / 2}" role="img" aria-label="Nathan Masachi">${body}</svg>\n`;
}

for (const theme of ['light', 'dark']) writeFileSync(join(out, `masthead-${theme}.svg`), masthead(theme));

/** A real screen in a thin device frame. Screens are never redrawn, only placed and cropped by the cover's edge. */
async function phone(file, width) {
  const height = Math.round((width * 1280) / 590);
  const rim = Math.round(width * 0.018);
  const radius = Math.round(width * 0.135);
  const screen = await sharp(join(source, file))
    .resize(width - rim * 2, height - rim * 2, { fit: 'fill' })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width - rim * 2}" height="${height - rim * 2}"><rect width="100%" height="100%" rx="${radius - rim}"/></svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
  const body = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#050506"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius - 1}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/></svg>`,
  );
  return sharp(body)
    .composite([{ input: screen, left: rim, top: rim }])
    .png()
    .toBuffer();
}

/** A project cover: the brand's own colour, its name, and three real screens running off the bottom edge. */
async function cover({ slug, name, ground, ink, screens, tops }) {
  const W = 1660;
  const H = 920;
  const margin = 60;
  const width = 470;
  const gap = (W - margin * 2 - width * 3) / 2;
  const type = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${outline(display, name, margin - 6, 170, 190, {
      fill: ink,
      tracking: -0.02,
    })}</svg>`,
  );
  const layers = [{ input: type, left: 0, top: 0 }];
  for (const [i, file] of screens.entries()) {
    const shot = await phone(file, width);
    const top = tops[i];
    const visible = await sharp(shot)
      .extract({ left: 0, top: 0, width, height: H - top })
      .toBuffer();
    layers.push({ input: visible, left: Math.round(margin + i * (width + gap)), top });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: ground } })
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(join(out, `${slug}.jpg`));
}

await cover({
  slug: 'tembo',
  name: 'TEMBO',
  ground: '#FFC829',
  ink: '#0a0a0b',
  screens: ['onboarding-2-480.webp', 'hero-persona-poster.webp', 'hero-circle-poster.webp'],
  tops: [310, 220, 310],
});
await cover({
  slug: 'kesho',
  name: 'KESHO',
  ground: '#0B7A3B',
  ink: '#ffffff',
  screens: ['hero-feed.webp', 'hero-leaderboard.webp', 'hero-profile.webp'],
  tops: [310, 220, 310],
});

// Technology marks (Simple Icons, CC0), one mid grey that holds at least 3:1 on both GitHub canvases, so one file
// serves both themes.
const ICONS = ['react', 'expo', 'typescript', 'supabase', 'cloudflare', 'nextdotjs', 'capacitor'];
for (const icon of ICONS) {
  const svg = readFileSync(require.resolve(`simple-icons/icons/${icon}.svg`), 'utf8');
  writeFileSync(join(out, 'icons', `${icon}.svg`), svg.replace('<svg ', '<svg fill="#768390" width="24" height="24" ').trim() + '\n');
}
