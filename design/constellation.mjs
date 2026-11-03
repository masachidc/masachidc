// The homepage constellation for a README. buildWeb is a port of the portfolio's ProjectConstellation.tsx (same seed,
// positions and rules), so the web matches the site. A README can't run React and shows SVGs as images: no hover, no
// per-node links, no pointer drift. CSS keeps the rest: the entrance, the far plane's float, and the hover state,
// which plays as a slow cycle through the projects. Without CSS animation it renders complete and still.

const W = 520;
const H = 360;
const CHAR_W = 12.6;
const BLEED_X = 0.26;
const BLEED_Y = 0.18;
const FAR = 0.55;

// Order and colours from the portfolio's projects.ts and brands.ts: `light` is the card overlay used on the site,
// `dark` the project's own brand colour that stays visible on a dark page.
const PROJECTS = [
  { slug: 'tembo', title: 'TEMBO', x: 40, y: 160, label: 'below-start', light: '#E0A800', dark: '#FFC829' },
  { slug: 'kesho', title: 'KESHO', x: 160, y: 64, label: 'above', light: '#03401F', dark: '#0B7A3B' },
  { slug: 'amuse', title: 'AMUSE', x: 336, y: 48, label: 'above', light: '#260101', dark: '#943B00' },
  { slug: 'inline', title: 'INLINE', x: 468, y: 168, label: 'below-end', light: '#004B66', dark: '#007BA8' },
  { slug: 'seeds', title: 'PROJECT SEEDS', x: 196, y: 312, label: 'above', light: '#001047', dark: '#BF8400' },
  { slug: 'stem', title: 'STEM XPOSURE', x: 356, y: 300, label: 'below-start', light: '#B8360F', dark: '#E4010D' },
];
const CHAINS = [
  ['tembo', 'kesho', 'amuse'],
  ['seeds', 'stem'],
];
const LOOSE = [
  ['amuse', 'seeds'],
  ['tembo', 'seeds'],
];

const star = (slug) => PROJECTS.find((p) => p.slug === slug);
const chainOf = (slug) => CHAINS.find((c) => c.includes(slug)) ?? [];

function labelBox(p) {
  const half = (p.title.length * CHAR_W) / 2 + 4;
  const offset = {
    above: { x: 0, y: -22 },
    below: { x: 0, y: 22 },
    'below-start': { x: half - 8, y: 22 },
    'below-end': { x: -(half - 8), y: 22 },
  }[p.label];
  return { x: p.x + offset.x, y: p.y + offset.y, hw: half, hh: 12 };
}

const SEGMENT_MS = 420;
const TIMING = (() => {
  const stars = {};
  const route = {};
  CHAINS.forEach((chain, c) => {
    let t = 350 + c * 300;
    stars[chain[0]] = t;
    for (let i = 1; i < chain.length; i++) {
      route[`${chain[i - 1]}>${chain[i]}`] = t + 40;
      t += 40 + SEGMENT_MS;
      stars[chain[i]] = t - 80;
    }
  });
  return { stars, route };
})();

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const distanceToSegment = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};

function buildWeb() {
  const rand = seeded(W * 131 + H);
  const starPoints = PROJECTS;
  const centre = {
    x: starPoints.reduce((sum, s) => sum + s.x, 0) / starPoints.length,
    y: starPoints.reduce((sum, s) => sum + s.y, 0) / starPoints.length,
  };
  const boxes = PROJECTS.map(labelBox);
  const inLabel = (x, y, pad = 0) => boxes.some((b) => Math.abs(x - b.x) < b.hw + pad && Math.abs(y - b.y) < b.hh + pad);
  const crossesLabel = (a, b, pad = 3) => {
    for (let t = 0.05; t < 1; t += 0.05) if (inLabel(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, pad)) return true;
    return false;
  };
  const starNear = (q, ends) => starPoints.some((s) => !ends.includes(s) && Math.hypot(q.x - s.x, q.y - s.y) < 26);
  const clearPath = (pts) =>
    pts.every((q, i) => i === 0 || (!crossesLabel(pts[i - 1], q, 6) && starPoints.every((s) => pts.includes(s) || distanceToSegment(s, pts[i - 1], q) > 16)));

  const bend = (from, to, salt) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const joints = len > W * 0.42 ? 2 : 1;
    const flip = salt % 2 ? -1 : 1;
    const tries = [0.16, -0.16, 0.26, -0.26, 0.09, -0.09, 0.34, -0.34].flatMap((k) => [0.5, 0.36, 0.64].map((at) => ({ k, at })));
    for (const { k, at } of tries) {
      if (joints === 2 && at !== 0.5) continue;
      const pts = [from];
      for (let j = 1; j <= joints; j++) {
        const t = joints === 1 ? at : j / (joints + 1);
        const lean = joints === 2 && j === 2 ? 0.35 : 1;
        pts.push({ x: from.x + dx * t + nx * len * k * flip * lean, y: from.y + dy * t + ny * len * k * flip * lean });
      }
      pts.push(to);
      if (clearPath(pts) && pts.slice(1, -1).every((q) => !starNear(q, [from, to]) && !inLabel(q.x, q.y, 6))) return pts;
    }
    return null;
  };

  const highways = {};
  let salt = 0;
  for (const chain of CHAINS) {
    for (let i = 1; i < chain.length; i++) {
      const from = star(chain[i - 1]);
      const to = star(chain[i]);
      highways[`${chain[i - 1]}>${chain[i]}`] = bend(from, to, salt++) ?? [from, to];
    }
  }

  const placed = [];
  const segDistance = (a, b, p, q) =>
    Math.min(distanceToSegment(a, p, q), distanceToSegment(b, p, q), distanceToSegment(p, a, b), distanceToSegment(q, a, b));
  const clearOfPlaced = (pts) =>
    pts.every((q, k) => k === 0 || placed.every((r) => segDistance(pts[k - 1], q, r.from, r.to) > 22 || (k === 1 && (r.from === pts[0] || r.to === pts[0]))));
  const place = (pts) => pts.slice(1).forEach((q, k) => placed.push({ from: pts[k], to: q }));

  const tail = (from, to, salt) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const flip = salt % 2 ? -1 : 1;
    for (const k of [0.08, -0.08, 0.16, -0.16, 0.24, -0.24]) {
      const pts = [
        from,
        { x: from.x + dx * 0.2 + nx * len * k * flip, y: from.y + dy * 0.2 + ny * len * k * flip },
        { x: from.x + dx * 0.42 + nx * len * k * flip * 0.5, y: from.y + dy * 0.42 + ny * len * k * flip * 0.5 },
      ];
      const clearOfOthers = starPoints.every((q) => q === from || q === to || pts.every((_, n) => n === 0 || distanceToSegment(q, pts[n - 1], pts[n]) > 44));
      if (clearOfOthers && clearOfPlaced(pts) && clearPath(pts) && pts.slice(1).every((q) => !starNear(q, [from]) && !inLabel(q.x, q.y, 6))) {
        place(pts);
        return pts;
      }
    }
    return null;
  };

  const standalone = (slug) => !CHAINS.some((chain) => chain.includes(slug));
  const angleBetween = (x, y) => Math.abs(Math.atan2(Math.sin(x - y), Math.cos(x - y)));
  const figureAngles = (from) =>
    Object.values(highways).flatMap((pts) => {
      const next = pts[0] === from ? pts[1] : pts[pts.length - 1] === from ? pts[pts.length - 2] : null;
      return next ? [Math.atan2(next.y - from.y, next.x - from.x)] : [];
    });
  const reach = [...PROJECTS].sort((p, q) => Number(standalone(q.slug)) - Number(standalone(p.slug))).flatMap((p) => {
    const i = PROJECTS.indexOf(p);
    const from = p;
    const alone = standalone(p.slug);
    const base = Math.atan2(from.y - centre.y, from.x - centre.x);
    const taken = figureAngles(from);
    const found = [];
    const turns = [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57, 2.09, -2.09, 2.62, -2.62, 3.14];
    for (const turn of turns) {
      if (found.length === 3) break;
      const angle = base + turn;
      if (found.some((f) => angleBetween(angle, f.angle) < 1.1) || taken.some((t) => angleBetween(angle, t) < 0.6)) continue;
      const bold = alone && found.length < 2;
      const full = W * (bold ? 0.17 + rand() * 0.05 : 0.11 + rand() * 0.08);
      for (const length of [full, full * 0.65]) {
        const end = { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
        const bendBy = ((i + found.length) % 2 ? 1 : -1) * length * 0.12;
        const joint = {
          x: from.x + Math.cos(angle) * length * 0.5 - Math.sin(angle) * bendBy,
          y: from.y + Math.sin(angle) * length * 0.5 + Math.cos(angle) * bendBy,
        };
        const pts = [from, joint, end];
        const clearOfOthers = starPoints.every((q) => q === from || distanceToSegment(q, joint, end) > 36);
        if (clearOfOthers && clearOfPlaced(pts) && clearPath(pts) && pts.slice(1).every((q) => !starNear(q, [from]) && !inLabel(q.x, q.y, 6))) {
          place(pts);
          found.push({ a: p.slug, b: `open-${i}-${found.length}`, points: pts, bold, angle });
          break;
        }
      }
    }
    return found.map(({ a, b, points, bold }) => ({ a, b, points, bold }));
  });

  const loose = LOOSE.flatMap(([a, b]) =>
    [
      { a, b, points: tail(star(a), star(b), salt++) },
      { a: b, b: a, points: tail(star(b), star(a), salt++) },
    ].flatMap((t) => (t.points ? [{ a: t.a, b: t.b, points: t.points, bold: false }] : [])),
  );

  const nodes = PROJECTS.map((p) => ({ x: p.x, y: p.y, depth: 0, star: p.slug }));
  for (const pts of Object.values(highways)) for (const q of pts.slice(1, -1)) nodes.push({ ...q, depth: 0, road: true });
  for (const { points } of [...loose, ...reach]) nodes.push({ ...points[1], depth: 0.2 });
  const segmentsOf = (pts) => pts.slice(1).map((q, i) => ({ from: pts[i], to: q }));
  const allRoads = [
    ...Object.values(highways).flatMap(segmentsOf),
    ...loose.flatMap(({ points }) => segmentsOf(points)),
    ...reach.flatMap(({ points }) => segmentsOf(points)),
  ];

  const pockets = PROJECTS.map((p) => ({ x: p.x, y: p.y, weight: standalone(p.slug) ? 1 : 0.8 }));
  const density = (x, y) => {
    const u = (x - centre.x) / W;
    const v = (y - centre.y) / H;
    const body = Math.exp(-(u * u) / 0.2 - (v * v) / 0.22);
    const band = Math.exp(-((u + v * 0.6) ** 2) / 0.02);
    const pocket = pockets.reduce((sum, q) => sum + q.weight * Math.exp(-((x - q.x) ** 2 + (y - q.y) ** 2) / (2 * (W * 0.13) ** 2)), 0);
    return Math.min(1, body * 0.85 + band * 0.3 + pocket);
  };
  const target = Math.round((W * H * (1 + 2 * BLEED_X) * (1 + 2 * BLEED_Y)) / 1300) + 36;
  for (let tries = 0; nodes.length < target && tries < target * 40; tries++) {
    const x = (rand() * (1 + 2 * BLEED_X) - BLEED_X) * W;
    const y = (rand() * (1 + 2 * BLEED_Y) - BLEED_Y) * H;
    if (rand() > density(x, y) || inLabel(x, y, 6)) continue;
    if (starPoints.some((s) => Math.hypot(x - s.x, y - s.y) < 16)) continue;
    if (allRoads.some((r) => distanceToSegment({ x, y }, r.from, r.to) < 7)) continue;
    nodes.push({ x, y, depth: rand() });
  }

  const links = [];
  const seen = new Set();
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .filter(({ j, d }) => j !== i && d < W * (n.star ? 0.13 : 0.1) && !crossesLabel(n, nodes[j]))
      .sort((p, q) => p.d - q.d)
      .slice(0, n.star ? 4 : 3 + (i % 2));
    for (const { j } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const depth = Math.max(n.depth, nodes[j].depth);
      links.push({ a: i, b: j, o: 0.04 + (1 - depth) * 0.06, far: depth > FAR });
    }
  });

  return { nodes, links, highways, loose: [...loose, ...reach] };
}

const n1 = (v) => Math.round(v * 10) / 10;
const polyline = (points) => points.map((q) => `${n1(q.x)},${n1(q.y)}`).join(' ');

// The cycle: one project at a time takes the hover state, with a rest between, starting once the entrance is done.
const SLOT = 3.2;
const REST = 0.8;
const EDGE = 0.28;
const CYCLE = SLOT * PROJECTS.length;
const CYCLE_START = 2.6;
const pct = (s) => `${n1((s / CYCLE) * 1000) / 10}%`;

/** Keyframes for one property over the cycle: `value(active)` for each project's slot, `rest` between them. */
function cycleKeyframes(name, property, rest, value) {
  const stops = [`0%{${property}:${rest}}`];
  PROJECTS.forEach((p, i) => {
    const t = i * SLOT + REST / 2;
    const end = (i + 1) * SLOT - REST / 2;
    const v = value(p.slug);
    stops.push(`${pct(t)}{${property}:${rest}}`, `${pct(t + EDGE)}{${property}:${v}}`, `${pct(end - EDGE)}{${property}:${v}}`, `${pct(end)}{${property}:${rest}}`);
  });
  stops.push(`100%{${property}:${rest}}`);
  return `@keyframes ${name}{${stops.join('')}}`;
}

/**
 * The figure, in its own 520 x 360 space. `place` positions it, `outline` turns a label into paths, and `mask` is the
 * ellipse the web dissolves into, in figure units.
 */
export function constellation({ theme, ink, line, place, outlineLabel, mask }) {
  const { nodes, links, highways, loose } = buildWeb();
  const colour = (p) => p[theme];
  // The site's web is drawn for a light page. Thin ink needs more presence on a dark one.
  const webGain = theme === 'dark' ? 1.7 : 1;

  const field = (far) => {
    const buckets = new Map();
    for (const l of links.filter((k) => k.far === far)) {
      const o = (l.o * webGain).toFixed(3);
      const a = nodes[l.a];
      const b = nodes[l.b];
      buckets.set(o, `${buckets.get(o) ?? ''}M${n1(a.x)} ${n1(a.y)}L${n1(b.x)} ${n1(b.y)}`);
    }
    const lines = [...buckets].map(([o, d]) => `<path d="${d}" stroke-opacity="${o}"/>`).join('');
    const dots = nodes
      .filter((d) => !d.star && !d.road && d.depth > FAR === far)
      .map((d) => `<circle cx="${n1(d.x)}" cy="${n1(d.y)}" r="${n1(0.7 + (1 - d.depth) * 1.3)}" fill-opacity="${((0.08 + (1 - d.depth) * 0.22) * webGain).toFixed(2)}"/>`)
      .join('');
    return `<g fill="${ink}" stroke="none">${dots}</g><g fill="none" stroke="${ink}" stroke-width="0.5" vector-effect="non-scaling-stroke">${lines}</g>`;
  };

  const css = [];
  const gradients = [];
  const tails = loose
    .map(({ a, b, points, bold }, i) => {
      const end = points[points.length - 1];
      gradients.push(
        `<linearGradient id="t${i}" gradientUnits="userSpaceOnUse" x1="${n1(points[0].x)}" y1="${n1(points[0].y)}" x2="${n1(end.x)}" y2="${n1(end.y)}"><stop offset="0" stop-color="${line}" stop-opacity="${bold ? 1 : 0.8}"/><stop offset="1" stop-color="${line}" stop-opacity="0"/></linearGradient>`,
      );
      css.push(cycleKeyframes(`l${i}`, 'opacity', 1, (on) => (on === a || on === b ? 1 : 0.35)));
      css.push(`.l${i}{animation:f .9s cubic-bezier(.22,1,.36,1) 1.3s both,l${i} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
      return `<polyline class="l${i}" points="${polyline(points)}" fill="none" stroke="url(#t${i})" stroke-width="${bold ? 1.25 : 0.75}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    })
    .join('');

  CHAINS.forEach((chain, c) => {
    css.push(cycleKeyframes(`c${c}`, 'stroke-opacity', 0.9, (on) => (chain.includes(on) ? 1 : on ? 0.2 : 0.9)));
    css.push(cycleKeyframes(`j${c}`, 'fill-opacity', 0.9, (on) => (chain.includes(on) ? 0.95 : 0.22)));
  });
  const figures = Object.entries(highways)
    .map(([key, points], k) => {
      const c = CHAINS.findIndex((chain) => chain.includes(key.split('>')[0]));
      const start = TIMING.route[key];
      css.push(`.r${k}{stroke-dasharray:1;animation:d ${SEGMENT_MS}ms cubic-bezier(.45,0,.25,1) ${start}ms both,c${c} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
      const joints = points
        .slice(1, -1)
        .map((q, i) => {
          css.push(`.q${k}${i}{animation:f .3s cubic-bezier(.22,1,.36,1) ${Math.round(start + (SEGMENT_MS * (i + 1)) / points.length)}ms both,j${c} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
          return `<circle class="q${k}${i}" cx="${n1(q.x)}" cy="${n1(q.y)}" r="2" fill="${line}" fill-opacity="0.9"/>`;
        })
        .join('');
      return `<polyline class="r${k}" points="${polyline(points)}" pathLength="1" fill="none" stroke="${line}" stroke-opacity="0.9" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${joints}`;
    })
    .join('');

  const stars = PROJECTS.map((p, i) => {
    const chain = chainOf(p.slug);
    css.push(cycleKeyframes(`s${i}`, 'opacity', 1, (on) => (on === p.slug || chain.includes(on) ? 1 : 0.4)));
    css.push(cycleKeyframes(`h${i}`, 'opacity', 0, (on) => (on === p.slug ? 0.35 : 0)));
    css.push(cycleKeyframes(`k${i}`, 'transform', 'scale(1)', (on) => (on === p.slug ? 'scale(1.2)' : 'scale(1)')));
    const at = TIMING.stars[p.slug] ?? 350;
    css.push(`.n${i}{animation:g .52s cubic-bezier(.22,1,.36,1) ${at}ms both}`);
    css.push(`.s${i}{animation:s${i} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
    css.push(`.h${i}{animation:h${i} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
    css.push(`.k${i}{animation:k${i} ${CYCLE}s linear ${CYCLE_START}s infinite}`);
    css.push(`.t${i}{animation:f .36s cubic-bezier(.22,1,.36,1) ${at + 120}ms both}`);
    return `<g class="s${i}"><g transform="translate(${p.x} ${p.y})"><g class="n${i}"><circle class="h${i}" r="22" fill="url(#o${i})" opacity="0"/><circle class="k${i}" r="5" fill="${colour(p)}"/></g></g><g class="t${i}">${outlineLabel(p)}</g></g>`;
  }).join('');
  const halos = PROJECTS.map(
    (p, i) => `<radialGradient id="o${i}"><stop offset="0" stop-color="${colour(p)}"/><stop offset="1" stop-color="${colour(p)}" stop-opacity="0"/></radialGradient>`,
  ).join('');

  const style = `<style>@media (prefers-reduced-motion:no-preference){
@keyframes f{from{opacity:0}}
@keyframes d{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes g{from{opacity:0;transform:scale(.6)}}
@keyframes v{from{transform:translate(-3px,2px)}to{transform:translate(3px,-2px)}}
.w0{animation:f 1.2s cubic-bezier(.22,1,.36,1) both,v 24s ease-in-out 1.2s infinite alternate}
.w1{animation:f 1.2s cubic-bezier(.22,1,.36,1) .15s both}
${css.join('\n')}
}</style>`;

  const defs = `<defs>${gradients.join('')}${halos}<radialGradient id="m" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${mask.cx} ${mask.cy}) scale(${mask.rx} ${mask.ry})"><stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="e" maskUnits="userSpaceOnUse" x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}"><rect x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}" fill="url(#m)"/></mask></defs>`;

  return {
    style,
    body: `${defs}<g transform="${place}"><g mask="url(#e)"><g opacity="0.75"><g class="w0">${field(true)}</g></g><g class="w1">${field(false)}</g></g>${tails}${figures}${stars}</g>`,
  };
}

/** Where each label sits relative to its node, as on the site: 12px off the node, centred or aligned to its side. */
export const labelPlacement = (p, width, capHeight) => {
  const above = p.y - 12;
  const below = p.y + 12 + capHeight;
  return {
    above: { x: p.x - width / 2, y: above },
    'below-start': { x: p.x - 6, y: below },
    'below-end': { x: p.x + 6 - width, y: below },
  }[p.label];
};
