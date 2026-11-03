# Profile audit and direction

November 2026. Reviewed against the live profile, masachidc.com, the portfolio's tokens and GitHub's own renderer.

## The five main problems

1. **The work was too small.** At 49% each, the covers rendered at 282px on a 1024px window, with phones about 45px wide. The product was the proof, and it was unreadable.
2. **Everything had the same weight.** Default Markdown from top to bottom. The name was the only moment of hierarchy.
3. **The name carried no identity.** It was set in GitHub's font, with nothing from Masachi DC.
4. **The stacks read like appended documentation.**
5. **The sidebar contradicts the README.** "Masachi Dev Circle" and "Product Architect | Design Engineer" sit beside "Nathan Masachi, product designer who ships". Pinned slots show forks. See [Outside the README](#outside-the-readme).

## What GitHub actually allows

- A profile README needs a public repo named after the user, with `README.md` at its root.
- `<picture>` is supported, and relative image paths are the documented approach.
- GitHub's sanitizer strips `style`, scripts and external fonts, so display type has to be outlined artwork.
- **Theme sources can't also test width.** GitHub wraps pictures in `themed-picture`. When a viewer forces a theme in their settings, it rewrites every source containing `prefers-color-scheme` and discards other conditions. A `(prefers-color-scheme: dark) and (max-width: 640px)` source then wins at any width. This came from reading GitHub's shipped script, and it's why the masthead has one file per theme.
- **Width-only sources are safe.** That script ignores them, so covers can have a phone crop.
- `<img>` outside a link gets wrapped in a link to the raw file, so every image here sits in a deliberate `<a>`.
- Browsers can break a line after an inline image even with a non-breaking space or word joiner (tested). `<kbd>` is `inline-block` in GitHub's CSS, so it holds an icon and its name together.

## References

| Reference | What works | What to take |
| --- | --- | --- |
| [antfu](https://github.com/antfu) | One row of `<samp>` links | `<samp>` as a native technical voice |
| [sindresorhus](https://github.com/sindresorhus) | Retro GIFs, unmistakably his | Being authored matters more than being tasteful by rule. The look itself isn't transferable |
| [raunofreiberg](https://github.com/raunofreiberg) | No README, one pin | Restraint. Silence only works with a famous pin |
| [joshwcomeau](https://github.com/joshwcomeau) | Pins with personality | Sidebar and pins are part of the design |
| [jh3y](https://github.com/jh3y) | One linked SVG | A single considered asset beats a dozen widgets |
| [tholman](https://github.com/tholman) | A `<pre>` skyline of linked projects | Invent within GitHub's limits. Narrow screens suffer |
| [mattpocock](https://github.com/mattpocock) | Theme-aware `<picture>` banner | The right mechanism, though the banner is the whole page |
| [kentcdodds](https://github.com/kentcdodds) | One linked image | Clear, but its message is locked in a picture |
| [mxstbr](https://github.com/mxstbr) | TL;DR with concrete facts | Lead with specifics |
| [tannerlinsley](https://github.com/tannerlinsley) | Plain, well-ordered sections | Good information architecture needs no decoration |
| [brianlovin](https://github.com/brianlovin) | Two lines from a product designer | Voice: plain and unbothered |
| [awesome-github-profile](https://github.com/beydemirfurkan/awesome-github-profile) | A catalogue of templates | A map of what to avoid: badge rows, stat skylines |

Across them, the profiles worth remembering make one or two strong decisions and then get out of the way. Most README tricks are visible as tricks.

## Directions considered

**A. Editorial minimalism.** Native text, one type-only masthead, no covers. Very credible and easy to maintain, but it hides the product work, which is the strongest thing here.

**B. Studio publication.** Issue numbers, a contents list, a magazine cover. It has character, but it pretends to be something it isn't, and multi-column layouts collapse badly in GitHub's markup.

**C. Star chart.** The portfolio's own constellation beside a large outlined name, with brand-colour covers and a `<samp>` metadata line. The futurism comes from real geometry: five project nodes, coordinates, a technical voice.

| | A | B | C |
| --- | --- | --- | --- |
| Elegance | High | Medium | High |
| Originality | Low | Medium | High |
| Legibility | High | Medium | High |
| GitHub compatibility | High | Low | High |
| Engineering credibility | High | Medium | High |
| Personal brand fit | Low | Low | High |
| Maintenance | High | Low | Medium |
| Mobile | High | Low | Medium, fixed by phone covers |

**Chosen: C**, with A's discipline on everything that isn't the masthead or a cover. It's the only one that couldn't belong to someone else, because the constellation, type and colours already belong to Masachi DC.

## Self-critique and what changed

From rendered screenshots at the profile's real width, beside the sidebar:

- **Double rule and a weak statement.** With the name in `<h1>`, "Product designer who ships" was a small `h3` under two rules. It is now the page's `h1`, and the name is a linked image above it.
- **Three small stacked lines per project** (label, title, tagline). Merged into your original "Tembo — ..." heading.
- **Capitals made "IOS" wrong.** Labels moved to sentence case.
- **Forced themes broke the phone masthead.** Removed the width-based theme variants.
- **Phone name too small.** Tightened the masthead's frame so it's larger everywhere.
- **Phones 87px wide on mobile.** Added two-screen covers for narrow windows, about 130px wide per phone on a phone. They also apply up to 900px, where GitHub's sidebar squeezes the README.
- **Labels and links broke mid-item, and icons were orphaned from names.** Non-breaking text inside items, `<kbd>` for stacks.
- **Web lines crossed masthead labels.** The web now routes around them, as on the site.
- **Removed:** the old side-by-side cards, a planned footer mesh and a planned supporting-work image strip. Neither of the last two added anything the text doesn't already do.

After launch, on review:

- **Name too large.** Reduced from about 118px to 76px, and the figure given the room.
- **Project titles nearly body size.** Moved up to `h2`, with section names as quiet labels.
- **Grey tool icons.** Now in each project's colour.
- **Hand-placed constellation.** Replaced with a port of the site's own.
- **Stale covers.** Reusing filenames left the old image in caches, so covers now have new names. Don't reuse an image's filename with different art.

## Outside the README

These are account settings. Nothing here has been changed.

**Name:** `Nathan Masachi`

**Bio:** `Product designer who ships. Building Tembo.`

**Company:** leave blank, or `Tembo`

**Location:** `San Diego, California`

**Website:** `masachidc.com`

**Social links:** keep LinkedIn and X. Replace the `heykesho` Instagram and `heykesho.com` with `https://heytembo.com`, since KESHO is decommissioned.

**Pins:** pinned slots show public repos only, and most of yours are forks.

1. Pin `masachidc`. Its file tree is real evidence: a documented, deterministic asset build.
2. Pin `else-landing-page` only after adding a description. It still carries the pre-Tembo name, so making it private is also reasonable.
3. Don't pin forks. They read as padding. Consider deleting forks you don't use, which also removes them from "Popular repositories".

**Contribution graph:** turn on "Private contributions" in profile settings, so the private Tembo work shows as activity without exposing anything.

**Optional, separately:** a small public repo of real work, such as a technical write-up or an extracted utility, would give engineers code to read. Tembo and the portfolio stay private either way.

## Limitations

- Branches can't appear on github.com/masachidc until merged. Review used GitHub's real render of the branch, placed into the live profile page.
- The GitHub mobile app and forced-theme accounts couldn't be opened directly. Forced themes were reasoned from GitHub's shipped script.
- Masthead labels shrink to texture on phones (about 5px). Most of the same names appear in real text below. STEM Xposure appears only in the constellation, as on the site's homepage.
- The constellation can't respond to hover or link each node, because GitHub shows SVGs as images. The whole masthead links to the portfolio.
- The KESHO cover shows beta players' display names on its leaderboard, as the portfolio's cover already does.
- Technology marks belong to their owners and are used only to identify the tools.
