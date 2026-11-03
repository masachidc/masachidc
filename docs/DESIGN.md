# Design system

Small on purpose. Start from Masachi DC's tokens (`src/styles/theme.css` in the portfolio), and keep project colours to the projects.

## Palette

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| Ink | `#0a0a0b` | `#f5f5f7` | Name, node labels |
| Muted | `#55555a` | `#a1a1a6` | Masthead metadata |
| Web | Ink at up to 30% | Ink at up to 30% | Constellation lines |
| Marks | `#768390` | `#768390` | Tech icons. One file: 4.0:1 on white, 4.8:1 on `#0d1117` |

Text outside the artwork takes GitHub's own theme colours.

**Project colours** appear only as a project's own node or cover ground, and only colours from the portfolio's `brands.ts`.

| Project | Node, light | Node, dark | Cover |
| --- | --- | --- | --- |
| Tembo | `#E0A800` | `#FFC829` | `#FFC829` |
| KESHO | `#03401F` | `#0B7A3B` | `#0B7A3B` |
| AMUSE | `#260101` | `#943B00` | None |
| Inline | `#004B66` | `#007BA8` | None |
| Project SEEDS | `#001047` | `#BF8400` | None |

The site's sapphire accent stays out. In a README it would read as one more link colour.

## Type

| Voice | Face | Where |
| --- | --- | --- |
| Display | Cabinet Grotesk 800, outlined | The name, cover titles |
| Body | GitHub's own font | All reading copy, always real text |
| Technical | `<samp>` and `<kbd>` natively. IBM Plex Mono 500, outlined, inside artwork | Labels, links, stacks, masthead metadata |

Heading order is `h1` statement, `h2` section, `h3` project.

## Labels and links

- Project label: `N°01 / Founder / iOS + Android / Aug 2026–now`. Number, role, platform or discipline, then dates and status.
- Sentence case, so "iOS" stays correct. Numbers follow display order.
- Non-breaking inside an item (`&nbsp;`), a normal space after each slash, so lines break only between items.
- Link rows are `<samp>` with the same slash.

## Images

| Asset | Size | Ratio | Shown |
| --- | --- | --- | --- |
| `masthead-{light,dark}.svg` | 1400 × 520 viewBox | 2.69:1 | All widths |
| `{project}.jpg` | 1660 × 920 | 1.8:1 | Three screens, windows above 900px |
| `{project}-narrow.jpg` | 1200 × 1180 | 1.02:1 | Two larger screens, windows 900px and below |

- Covers: flat brand ground, 60px margin, name top left, middle screen raised, screens running off the bottom. Square corners, as on the site.
- Screens are real recordings or screenshots, never redrawn.
- Prefer screens showing your own account over other people's.

## Layout and rhythm

- One column. Full-width images, no layout tables. GitHub gives no reliable asymmetry, so contrast comes from scale: display name, full-bleed colour, small mono.
- A feature runs cover, label, heading, copy, stack, links.
- `<br>` between the two features. `h2` rules between sections. One `---` before the closing line.
- Supporting work is text only, which is what separates it from the features.

## Icons

Monochrome Simple Icons at 12px in a `<kbd>` chip with a real-text name. `alt=""`, because the name beside it says what it is. Each mark links to the tool's site, which also stops GitHub linking it to the raw file.

## Responsive and theme rules

- Theme: one `<source media="(prefers-color-scheme: dark)">` plus a light `<img>`. Never add another condition to a theme source (see `AUDIT.md`).
- Width: `<source media="(max-width: 900px)">` only on images with no theme variants.
- Cover art must not depend on the theme.

## Maintaining it

**Edit copy, a project's text or a link:** change `README.md` only.

**Add supporting work:** copy a `N°` block under "Other work". No assets needed.

**Add a feature, change a cover or add an icon:**

1. Put screens in `design/source/`.
2. Add `cover()` calls, or an entry in `ICONS`, in `design/build.mjs`.
3. Add a node to `stars` in `masthead()` if the project should be in the constellation.
4. Build:

```bash
cd design
npm ci
FONT_DIR=/path/to/masachi-dc-portfolio/public/fonts npm run build
```

`FONT_DIR` defaults to a sibling `masachi-dc-portfolio` checkout. Cabinet Grotesk (Fontshare, ITF Free Font License) comes from there because no font files live in this repo. IBM Plex Mono (OFL) comes from npm. Generated SVGs contain outlines only, with no scripts or external references. Same inputs, same files.
