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
  const step = 58;
  for (let gy = box.y; gy <= box.y + box.h; gy += step) {
    for (let gx = box.x; gx <= box.x + box.w; gx += step) {
      const p = { x: gx + (random() - 0.5) * step * 0.9, y: gy + (random() - 0.5) * step * 0.9 };
      if (fade(p.x, p.y) > 0.04) points.push(p);
    }
  }

  const labelBoxes = Object.values(stars).map((s) => {
    const width = mono.getAdvanceWidth(s.name, 22, { letterSpacing: 0.06 });
    const x = s.x + (s.anchor === 'end' ? -16 - width : 16);
    const y = s.y + (s.dy ?? 8);
    return { left: x - 10, right: x + width + 10, top: y - 26, bottom: y + 10 };
  });
  const inLabel = (x, y) => labelBoxes.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom);
  const crossesLabel = (p, q) =>
    Array.from({ length: 21 }, (_, i) => i / 20).some((f) => inLabel(p.x + (q.x - p.x) * f, p.y + (q.y - p.y) * f));

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
        if (crossesLabel(p, q)) return;
        const o = fade((p.x + q.x) / 2, (p.y + q.y) / 2) * 0.3;
        web.push(`<path d="M${n(p.x)} ${n(p.y)}L${n(q.x)} ${n(q.y)}" stroke-opacity="${o.toFixed(2)}"/>`);
      });
  });
  const dots = points.filter((p) => !inLabel(p.x, p.y)).map((p) => {
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
  const W = 1400;
  const H = 520;
  const size = 196;
  const leading = size * 0.92;
  const base = H - 26;
  const stars = {
    tembo: { x: 770, y: 250, name: 'TEMBO', anchor: 'end', dy: -14 },
    kesho: { x: 910, y: 150, name: 'KESHO', dy: 34 },
    amuse: { x: 1120, y: 112, name: 'AMUSE', dy: -18 },
    inline: { x: 1330, y: 290, name: 'INLINE', anchor: 'end', dy: 38 },
    seeds: { x: 1020, y: 430, name: 'PROJECT SEEDS', dy: 38 },
  };
  const chains = [
    ['tembo', { x: 830, y: 190 }, 'kesho', { x: 1020, y: 92 }, 'amuse'],
    ['seeds', { x: 880, y: 350 }, 'tembo'],
  ];
  const tails = [
    { from: 'inline', x: 1250, y: 200 },
    { from: 'inline', x: 1380, y: 190 },
    { from: 'inline', x: 1385, y: 400 },
    { from: 'amuse', x: 1260, y: 150 },
    { from: 'seeds', x: 1170, y: 400 },
  ];
  const box = { x: 690, y: 30, w: 710, h: 470 };
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

/**
 * A project cover: the brand's own colour, its name, and real screens running off the bottom edge. Wide shows three
 * screens; narrow shows two, larger, for phones.
 */
async function cover({ file, name, ground, ink, screens, tops, W, H, margin, width, nameSize, nameY }) {
  const gap = (W - margin * 2 - width * screens.length) / (screens.length - 1);
  const type = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${outline(display, name, margin - 6, nameY, nameSize, {
      fill: ink,
      tracking: -0.02,
    })}</svg>`,
  );
  const layers = [{ input: type, left: 0, top: 0 }];
  for (const [i, screen] of screens.entries()) {
    const shot = await phone(screen, width);
    const top = tops[i];
    const visible = await sharp(shot)
      .extract({ left: 0, top: 0, width, height: H - top })
      .toBuffer();
    layers.push({ input: visible, left: Math.round(margin + i * (width + gap)), top });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: ground } })
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(join(out, file));
}

const WIDE = { W: 1660, H: 920, margin: 60, width: 470, nameSize: 190, nameY: 170, tops: [310, 220, 310] };
const NARROW = { W: 1200, H: 1180, margin: 60, width: 510, nameSize: 190, nameY: 180, tops: [350, 260] };

const TEMBO = { name: 'TEMBO', ground: '#FFC829', ink: '#0a0a0b' };
await cover({ ...TEMBO, ...WIDE, file: 'tembo.jpg', screens: ['onboarding-2-480.webp', 'hero-persona-poster.webp', 'hero-circle-poster.webp'] });
await cover({ ...TEMBO, ...NARROW, file: 'tembo-narrow.jpg', screens: ['onboarding-2-480.webp', 'hero-persona-poster.webp'] });

const KESHO = { name: 'KESHO', ground: '#0B7A3B', ink: '#ffffff' };
await cover({ ...KESHO, ...WIDE, file: 'kesho.jpg', screens: ['hero-feed.webp', 'hero-leaderboard.webp', 'hero-profile.webp'] });
await cover({ ...KESHO, ...NARROW, file: 'kesho-narrow.jpg', screens: ['hero-feed.webp', 'hero-leaderboard.webp'] });

// Technology marks (Simple Icons, CC0), one mid grey that holds at least 3:1 on both GitHub canvases, so one file
// serves both themes.
const ICONS = ['react', 'expo', 'typescript', 'supabase', 'cloudflare', 'nextdotjs', 'capacitor'];
for (const icon of ICONS) {
  const svg = readFileSync(require.resolve(`simple-icons/icons/${icon}.svg`), 'utf8');
  writeFileSync(join(out, 'icons', `${icon}.svg`), svg.replace('<svg ', '<svg fill="#768390" width="24" height="24" ').trim() + '\n');
}
