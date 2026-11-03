# Design system

Small on purpose. Start from Masachi DC's tokens (`src/styles/theme.css` in the portfolio), and keep project colours to the projects.

## Palette

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| Ink | `#0a0a0b` | `#f5f5f7` | Name, node labels |
| Muted | `#55555a` | `#a1a1a6` | Masthead metadata |
| Web | Ink at up to 30% | Ink at up to 30% | Constellation lines |

Text outside the artwork takes GitHub's own theme colours.

**Project colours** appear only on a project's own node, cover ground and tool icons, and only colours from the portfolio's `brands.ts`.

| Project | Node, light | Node, dark | Cover | Tool icons |
| --- | --- | --- | --- | --- |
| Tembo | `#E0A800` | `#FFC829` | `#FFC829` | `#E0A800` |
| KESHO | `#03401F` | `#0B7A3B` | `#0B7A3B` | `#0B7A3B` |
| AMUSE | `#260101` | `#943B00` | None | None |
| Inline | `#004B66` | `#007BA8` | None | None |
| Project SEEDS | `#001047` | `#BF8400` | None | None |
| STEM Xposure | `#B8360F` | `#E4010D` | None | None |

The site's sapphire accent stays out. In a README it would read as one more link colour.

## Type

| Voice | Face | Where |
| --- | --- | --- |
| Display | Cabinet Grotesk 800, outlined | The name, cover titles |
| Body | GitHub's own font | All reading copy, always real text |
| Technical | `<samp>` and `<kbd>` natively. IBM Plex Mono 500, outlined, inside artwork | Labels, links, stacks, masthead metadata |

A README can only set size through heading levels, so the scale is: `h1` statement 28px, `h2` project title 21px, body 14px. "Selected work" is a quiet bold `<samp>` label, so it doesn't compete with project titles.

## Labels and links

- Project label: `N°01 / Founder / iOS + Android / Aug 2026–Present`. Number, role, platform or discipline, then dates and status.
- Sentence case, so "iOS" stays correct. Numbers follow display order.
- Non-breaking inside an item (`&nbsp;`), a normal space after each slash, so lines break only between items.
- Link rows are `<samp>` with the same slash.

## Images

| Asset | Size | Ratio | Shown |
| --- | --- | --- | --- |
| `masthead-{light,dark}.svg` | 846 × 372 viewBox | 2.27:1 | All widths |
| `{project}-cover.jpg` | 1660 × 920 | 1.8:1 | Three screens, windows above 900px |
| `{project}-narrow.jpg` | 1200 × 1180 | 1.02:1 | Two larger screens, windows 900px and below |

- Covers: flat brand ground, 60px margin, name top left, middle screen raised, screens running off the bottom. Square corners, as on the site.
- Screens are real recordings or screenshots, never redrawn.
- Prefer screens showing your own account over other people's.

## Layout and rhythm

- One column. Full-width images, no layout tables. GitHub gives no reliable asymmetry, so contrast comes from scale: display name, full-bleed colour, small mono.
- A feature runs cover, label, heading, copy, stack, links.
- `<br>` between the two features. One `---` before the closing line.
- The README features Tembo and KESHO only. The constellation and the portfolio carry the rest.

## The constellation

`design/constellation.mjs` ports `ProjectConstellation.tsx` from the portfolio: same seed, positions, chains and rules, so the web matches the site. If the site's projects change, update `PROJECTS` there too.

An SVG shown as a README image can animate with CSS but can't respond to a pointer. So the entrance and the far plane's float carry over, the hover state plays as a slow cycle through the projects, and per-node links and pointer drift are left out. Reduced-motion viewers and anything without CSS animation get the complete, still figure.

## Icons

Simple Icons at 12px, in the project's colour, in a `<kbd>` chip with a real-text name. `alt=""`, because the name beside it says what it is. Each mark links to the tool's site, which also stops GitHub linking it to the raw file.

## Responsive and theme rules

- Theme: one `<source media="(prefers-color-scheme: dark)">` plus a light `<img>`. Never add another condition to a theme source (see `AUDIT.md`).
- Width: `<source media="(max-width: 900px)">` only on images with no theme variants.
- Cover art must not depend on the theme.

## Maintaining it

**Edit copy, a project's text or a link:** change `README.md` only.

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

`FONT_DIR` defaults to a sibling `masachi-dc-portfolio` checkout. Cabinet Grotesk (Fontshare, ITF Free Font License) comes from there because no font files live in this repo. IBM Plex Mono (OFL) comes from npm. Generated SVGs contain outlines and CSS only, with no scripts or external references. Same inputs, same files.
