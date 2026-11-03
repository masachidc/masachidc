// Generates every image in ../assets. Deterministic: same inputs, same files.
// Usage and the rules behind these numbers: ../docs/DESIGN.md

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import woff2 from 'wawoff2';
import { constellation, labelPlacement } from './constellation.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'assets');
const source = join(here, 'source');
const require = createRequire(import.meta.url);
mkdirSync(out, { recursive: true });

// Fonts are read at build time and only their outlines reach the output. No font file lives in this repo.
const FONT_DIR = process.env.FONT_DIR ?? join(here, '..', '..', 'masachi-dc-portfolio', 'public', 'fonts');
const load = async (path) => {
  const bytes = await woff2.decompress(readFileSync(path));
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};
const display = await load(join(FONT_DIR, 'cabinet-grotesk-800.woff2'));
const labelFace = await load(join(FONT_DIR, 'cabinet-grotesk-700.woff2'));
const mono = await load(require.resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'));

const outline = (font, text, x, y, size, { fill, tracking = 0, anchor = 'start', opacity = 1 }) => {
  const width = font.getAdvanceWidth(text, size, { letterSpacing: tracking });
  const left = anchor === 'end' ? x - width : x;
  const d = font.getPath(text, left, y, size, { letterSpacing: tracking }).toPathData(1);
  return `<path d="${d}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
};

// Masachi DC tokens (portfolio theme.css). `line` is the figure strokes: fg-subtle on light, its counterpart on dark.
const THEME = {
  light: { ink: '#0a0a0b', muted: '#55555a', line: '#6e6e73' },
  dark: { ink: '#f5f5f7', muted: '#a1a1a6', line: '#a1a1a6' },
};

function masthead(theme) {
  const t = THEME[theme];
  const W = 846;
  const H = 372;
  const scale = 0.92;
  const size = 76;
  const base = H - 10;
  const labelSize = 13;
  const capHeight = labelFace.charToGlyph('H').getMetrics().yMax * (labelSize / labelFace.unitsPerEm);
  const outlineLabel = (p) => {
    const width = labelFace.getAdvanceWidth(p.title, labelSize, { letterSpacing: 0.08 });
    const { x, y } = labelPlacement(p, width, capHeight);
    return outline(labelFace, p.title, x, y, labelSize, { fill: t.ink, tracking: 0.08 });
  };
  const figure = constellation({
    theme,
    ink: t.ink,
    line: t.line,
    place: `translate(330 40) scale(${scale})`,
    outlineLabel,
    // The web dissolves before the name and before the frame's right edge.
    mask: { cx: 260, cy: 180, rx: 300, ry: 216 },
  });
  const body = [
    figure.style,
    figure.body,
    outline(mono, 'MASACHI DC', 0, 14, 11, { fill: t.muted, tracking: 0.08 }),
    outline(mono, '32.72N 117.16W', W, 14, 11, { fill: t.muted, tracking: 0.08, anchor: 'end' }),
    outline(display, 'Nathan', -2, base - size * 0.92, size, { fill: t.ink, tracking: -0.02 }),
    outline(display, 'Masachi', -2, base, size, { fill: t.ink, tracking: -0.02 }),
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Nathan Masachi">${body}</svg>\n`;
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
await cover({ ...TEMBO, ...WIDE, file: 'tembo-cover.jpg', screens: ['onboarding-2-480.webp', 'hero-persona-poster.webp', 'hero-circle-poster.webp'] });
await cover({ ...TEMBO, ...NARROW, file: 'tembo-narrow.jpg', screens: ['onboarding-2-480.webp', 'hero-persona-poster.webp'] });

const KESHO = { name: 'KESHO', ground: '#0B7A3B', ink: '#ffffff' };
await cover({ ...KESHO, ...WIDE, file: 'kesho-cover.jpg', screens: ['hero-feed.webp', 'hero-leaderboard.webp', 'hero-profile.webp'] });
await cover({ ...KESHO, ...NARROW, file: 'kesho-narrow.jpg', screens: ['hero-feed.webp', 'hero-leaderboard.webp'] });

// Technology marks (Simple Icons, CC0) in each project's card overlay colour. KESHO's deep overlay would vanish on a
// dark page, so it uses its primary brand colour. The name beside each mark carries the meaning.
const STACKS = {
  tembo: { colour: '#E0A800', icons: ['react', 'expo', 'typescript', 'supabase', 'cloudflare'] },
  kesho: { colour: '#0B7A3B', icons: ['nextdotjs', 'typescript', 'supabase', 'capacitor'] },
};
for (const [project, { colour, icons }] of Object.entries(STACKS)) {
  mkdirSync(join(out, 'icons', project), { recursive: true });
  for (const icon of icons) {
    const svg = readFileSync(require.resolve(`simple-icons/icons/${icon}.svg`), 'utf8');
    writeFileSync(join(out, 'icons', project, `${icon}.svg`), svg.replace('<svg ', `<svg fill="${colour}" width="24" height="24" `).trim() + '\n');
  }
}
