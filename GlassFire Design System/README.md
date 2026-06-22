# GlassFire Design System

> The clarity of glass + the spark of fire. Cinematic content. Bold storytelling.

GlassFire is a **full-service video production company** based in Raleigh, NC (with hubs in Lexington and Bentonville) that produces cinematic commercials, branded films, documentaries, and live-event broadcasts. Clients include **Volvo Trucks, the Walton Family Foundation, Replacements Ltd., INEOS, and Ladder Fitness**.

This folder is the working design system for the GlassFire brand — fonts, colors, motifs, components, and reference HTML for slides + website-style surfaces. Drop it into any design or prototype project to design *as GlassFire*.

---

## Index

| File / folder | What's inside |
|---|---|
| `README.md` | This file — context, content, visual + iconography rules |
| `SKILL.md` | Cross-compatible Agent Skill front-matter so this folder can be invoked from Claude Code |
| `colors_and_type.css` | All CSS custom properties — colors, gradients, type scale, spacing, radii, shadows, motion + semantic helper classes (`.gf-h1`, `.gf-display`, `.gf-text-fire`, etc.) |
| `fonts/` | Poppins family (all weights + italics, TTF) |
| `assets/` | Root logo trio (gradient color + white + icon) used by the kits, plus `assets/logos/` — the **full brand logo kit** (wordmark + icon in every color treatment, contact asset tag, favicon, web clip) and the source capabilities deck PDF |
| `preview/` | Small HTML cards that populate the Design System tab (type, colors, spacing, components, brand) |
| `ui_kits/website/` | High-fidelity recreation of glassfire.co — Header, Hero, Service tiles, Case studies, Footer, plus a click-thru `index.html` |
| `components/` | Live, reusable React components compiled into the design system. **`LogoGrid`** — the "Trusted By" client wall (the editable counterpart to the logo-studio export tool). |
| `client-logos.json` | Shared client roster. The logo-studio app and the `LogoGrid` component both read it, so design and exports never drift. |
| `slides/` | Slide templates matching the Capabilities Deck — 10 slides: cover, manifesto, team, trusted-by, services, three service details, case study, closer. Uses `deck-stage` so each slide is editable HTML. |

## Source materials

The following were provided by the user. Some are referenced but not re-distributed here:

- **`assets/capabilities-deck.pdf`** — 20-page GlassFire Capabilities Deck (the primary source of voice + visual reference; copy excerpts live in `slides/`)
- **`assets/logo-color.svg`** — full wordmark in brand gradients (fire flame + glass droplet)
- **`assets/logo-white.svg`** — monochrome white wordmark, for color and photo backgrounds
- **`assets/icon-color.svg`** — flame-only icon mark, brand gradients
- **`fonts/Poppins-*.ttf`** — full Poppins family (the brand's working face)
- **Website:** [www.glassfire.co](https://www.glassfire.co) — referenced for `ui_kits/website/`

**Brand colors confirmed by client:** `#00A8E4` (Glass cyan) and `#EE2750` (Fire magenta-red). The official `Blue.svg` / `Red.svg` swatch files in the logo kit confirm these exact values.

---

## LOGO SYSTEM

The complete logo kit lives in `assets/logos/` (SVG + hi-res PNG for each). The mark pairs a **glass droplet** (cyan) with a **flame** (fire red) — clarity meets spark, literally.

### The mark is always gradient
The **gradient build** (`Logo Color`, `Icon Color`) is the **preferred logo in every context** — the fire-warm and glass-cool gradients flowing through the mark are core to the brand. Use it on light backgrounds, on black, on photography (with adequate contrast), at every size. The gradient PNGs are transparent and read cleanly on both light and dark surfaces.

Reach for a non-gradient build **only** when the gradient cannot reproduce:
- **`White`** — reverse build for dark photography or busy backgrounds where the gradient loses contrast.
- **`Black`** — single-color print, stamps, faxes, engraving.
- **`2 Color` (flat cyan + fire)** — **functional/embroidery use only** (thread, screen-print, vinyl, cut media). Never use the flat two-color as a stylistic choice on screen — use the gradient.

### Wordmark vs. icon
- **Wordmark** (`Logo *`) — full "GlassFire" lockup with the mark. Default for most surfaces.
- **Icon** (`Icon *`) — droplet + flame only. Use as an app icon, avatar, favicon, or accent where the wordmark would be too wide. Minimum size 24px.
- `*NoPadding` variants trim the bounding box to the artwork for tight alignment; padded versions include safe clear-space.

### Color treatments (each available as wordmark and icon)
| Variant | When to use |
|---|---|
| `Color` | **Primary — always preferred.** Gradient mark, on light, dark, or photography |
| `White` | Reverse — only when gradient loses contrast on dark/busy backgrounds |
| `Black` | Single-color black — print, stamps, engraving |
| `2 Color` | Flat cyan + fire — **embroidery / screen-print / vinyl only**, never a screen choice |
| `Color Black` | Gradient mark pre-composed on a black field |

### Utility marks
- **`Asset Tag`** — a ready-made contact lockup (phone + email pills around the wordmark). Use on gear, signage, and stingers.
- **`Favicon`** / **`Webclip`** — pre-cropped icon for browser tabs and home-screen clips.

### Rules
- **Always use the gradient** unless a production constraint (embroidery, 1-color print, low-contrast photography) forces a fallback.
- **Never recolor the mark** outside the official treatments. The glass is always `#00A8E4` (or its gradient); the fire is always `#EE2750` (or its gradient).
- **Clear space:** keep at least the height of the droplet's width clear on all sides (use the padded variants, which bake this in).
- **Reverse on busy photography** with the `White` build, never the colored builds.
- **Don't** add shadows, outlines, or rotate the mark.

---

## COMPONENTS

Reusable components live in `components/` as `<Name>.jsx` + `<Name>.d.ts`, compiled into `_ds_bundle.js` and exposed on `window.GlassFireDesignSystem_019e1f`.

### LogoGrid — client "Trusted By" wall

The live design-system counterpart to the **logo-studio** app in the brand-assets repo (`tools/logo-studio/`). The studio *bakes* a flat PNG and commits it to `Grids/` for distribution; `LogoGrid` renders the same wall in HTML/CSS so it stays editable and re-themeable wherever it is placed (decks, website kit, one-pagers). Both read `client-logos.json`, so the roster is one source of truth.

```jsx
const { LogoGrid } = window.GlassFireDesignSystem_019e1f;
// zero-config: built-in roster, black background, auto columns
<LogoGrid basePath="assets/clients" />
// staggered editorial wall, fixed 5 columns, glass accent rule
<LogoGrid columns={5} stagger accent="glass" />
// on a light surface — logos invert to black automatically
<LogoGrid background="white" variant="black" />
```

Key props: `clients`/`names`/`basePath` (roster), `title`, `variant` (white|black), `background` (preset or CSS color), `columns` (n|auto), `gap`, `rowHeight`, `stagger`, `muted`, `align`, `accent` (fire|glass|none), `watermarkSrc`. Full types in `components/LogoGrid.d.ts`.

**Asset note:** the client logos currently in `assets/clients/` are **monochrome white** masters (built for dark backgrounds). On light surfaces `LogoGrid` inverts them to black via CSS filter — fine for true monochrome marks. When real full-color client logos are produced, add them to the roster's `variants` and pass `variant="color"`.

---

## CONTENT FUNDAMENTALS

GlassFire's voice is **confident, cinematic, and craft-forward**. Sentences are short and concrete. Verbs do the work. Adjectives are reserved for the actual product — "cinematic," "polished," "unforgettable" — not for hype.

### Voice traits
- **First-person plural.** "We craft," "Our team," "We partner with…" The brand is the team, not a faceless company. "I" never appears.
- **Speaks *to* clients, not *at* them.** Direct second-person ("you," "your event," "your brand") in conversational copy, but case studies stay third-person ("Volvo Trucks," "the Foundation").
- **Action verbs upfront.** "We craft cinematic content…", "We turn raw footage into refined stories.", "Our team handles everything from big-picture thinking to on-the-ground execution."
- **Balance + duality is the throughline.** The brand name itself encodes "clarity meets spark." Pair words come up everywhere: *the technical and the human, the clean and the raw, the frame and the flame.*

### Casing
- **DISPLAY HEADLINES ARE ALL-CAPS.** Always. Section openers, slide titles, eyebrows, button labels, navigation: uppercase.
- **Body copy is sentence case** with proper punctuation. Full sentences, end with periods.
- **Three-word stacked titles** are a recurring rhythm: `CINEMATIC / VIDEO / PRODUCTION`, `CLARITY MEETS SPARK`, `LET'S TALK!`.
- **Brand name:** `GlassFire` (single word, two capitals — never "Glassfire" or "Glass Fire").

### Tone examples (lifted verbatim from the deck)
- > "At GlassFire, we craft cinematic content and brand storytelling that ignites emotion and drives action."
- > "We hold both sides of the craft: the technical and the human, the clean and the raw, the frame and the flame."
- > "Where we elevate a project, not just finish it."
- > "On message, on budget, and built to perform."
- > "LET'S TALK!"

### What to avoid
- Marketing fluff ("synergy," "best-in-class," "world-class team"). The deck uses "world-class" sparingly and only about output.
- Buzzy AI/SaaS vocabulary ("seamless," "leverage," "unlock"). Replace with concrete verbs.
- Emoji. The brand never uses them.
- Exclamation marks, except in the single recurring call-to-action `LET'S TALK!`.
- Soft hedging ("we try to," "hopefully"). The brand is confident.

### Copywriting rhythm
- Lead with the **outcome**, then explain the **method**. *"We make cinematic, story-first video content that connects with audiences and delivers results. From commercials to branded films and original campaigns, we handle production from pitch to post."*
- **Tri-colon lists** are a signature: "on time, on brand, and on point" / "pacing, emotion, and narrative clarity" / "concepting, storyboarding, and strategic direction."
- Case studies open with a **single-sentence partnership summary** in italic-ish phrasing, then drop into specifics.

---

## VISUAL FOUNDATIONS

### Color
The system is **black-first**. Every deck page, every hero, every nav is set on pure black `#000` with white type — this is the cinematic frame the brand insists on. Color enters as **two saturated signal hues**: cyan-blue (`#00A8E4`) for "glass" and magenta-red (`#EE2750`) for "fire." They appear as flat color, but the logo and key surfaces use **directional brand gradients** that travel between fire-warm `#EF404E → #E50981` and glass-cool `#00A8E4 → #3C5BA9`. A "spark" gradient (cool→hot) is the showcase treatment for hero typography and accent shapes.

Neutrals are a tight 8-step grayscale from `#000` to `#FFF`. Warm off-white (`#F5F5F2`) is the only "light mode" surface; cool grays are avoided.

### Typography
**Poppins, exclusively.** Weights 300–900 are in active use, but the brand voice lives in **800/900 uppercase**. Display headlines are ALL-CAPS, tightly tracked (`-0.02em`), with line-heights pulled tight (0.92–1.0) so words stack like film title cards. Body is Poppins Regular at 16–18px with a 1.5–1.6 line-height. Eyebrows are small (12–14px) uppercase with wide tracking (~0.16–0.20em).

There is **no serif** in the system. There is no secondary face. Just Poppins, used with discipline.

### Spacing & layout
4-pt baseline grid. Major layout rhythm is **48 / 64 / 96 / 128**. Slides are letterboxed on full-bleed black, with type pushed to a single corner (top-left or bottom-left most often) so imagery can breathe. Pages are rarely "filled" — negative black space is part of the brand. Imagery is full-bleed; text is contained to a 50–60% column.

### Backgrounds
- **Pure black** is the default canvas. Pages, hero sections, deck slides — all default to `#000`.
- **Full-bleed cinematic imagery** is the primary alternative. Photography is treated like a film still — color-graded, contrasty, often with deep shadows.
- **Brand gradient** treatments appear sparingly: as logo wash, as a thin top-of-page accent bar, or behind hero typography.
- No textures, no repeating patterns, no hand-drawn illustration. No gradient meshes. No noise.

### Imagery vibe
Warm-saturated cinematic. **High contrast, deep blacks, rich shadows.** Color-graded toward teal-and-orange or magenta-and-cyan (echoing the brand pair). Frequent subjects: cameras, crews on set, live event stages, automotive, talent in motion. Real, never stock-looking. No black-and-white. No grain overlays.

### Animation
The deck implies a cinematic motion language — slow, intentional, not playful. The system reserves:
- **Fades** (300–600ms, ease-cinema) for content reveals
- **Slow upward translations** (24–32px, 600ms) paired with fades, for stacked-title entries
- **Marquee scrolls** for case-study client logos (linear, very slow, infinite — see the recurring `LET'S TALK!  LET'S TALK!` motif)
- **No bounces, no springs, no playful overshoots.** The brand is not playful — it is composed.

### Hover & press
- **Hover (dark surfaces):** lighten with `rgba(255,255,255,0.06)` overlay, or reveal a fire/glass-colored underline. Buttons swap to the inverse fill.
- **Hover (light surfaces):** darken background to `var(--gf-paper)` → `#EEE`, or set foreground to brand color.
- **Press:** `transform: scale(0.98)`, 120ms. No color change.
- **Focus:** 2px outline in `var(--gf-glass)` (cyan) at 2px offset on dark, or `var(--gf-fire)` on light.

### Borders & shadows
- Hairlines: **1px**, `rgba(255,255,255,0.08–0.16)` on dark; `rgba(0,0,0,0.08–0.14)` on light. The system prefers hairlines over thick borders.
- Shadows: rarely used on the dark surfaces. When needed, deep + soft (`0 20px 60px rgba(0,0,0,0.45)`). For brand-colored emphasis, a **spark glow** (`0 0 0 1px brand, 0 12px 40px brand@0.35`) on CTAs.
- No inner shadows. No "soft UI" / neumorphism.

### Cards & containers
Cards on the dark canvas are: **`#1A1A1F` fill, 1px `rgba(255,255,255,0.08)` border, `var(--r-md)` (8px) radius, no shadow**. When a card needs emphasis, the border switches to a **gradient stroke** (fire or glass) — never a colored fill.

### Corner radii
Tight radii. The brand is sharp. `8px` (cards), `4px` (chips/inputs), `999px` only for true pills (status chips, marquee chips). Never `16+px` rounding except on pills.

### Transparency & blur
Used sparingly — mostly on top navigation when scrolled over imagery (`backdrop-filter: blur(20px); background: rgba(0,0,0,0.6)`). No frosted-glass card patterns inside the body of pages.

### Fixed elements
- Top header is fixed on the website (transparent over hero, then solid black after scroll).
- The `LET'S TALK!` CTA can be a fixed-bottom ribbon on long pages.

### Composition rules
1. **Type is bigger than you'd expect.** Hero display is 88–160px on desktop. The deck's covers are visually 200px+ on a 1920 stage.
2. **Negative space is the design.** If you can remove an element and the layout still reads, remove it.
3. **One accent color per surface.** Fire OR glass, not both — unless you're using the full spark gradient.
4. **Anchor type to a corner.** Center-stacked titles are reserved for cover/closer slides only.

---

## ICONOGRAPHY

GlassFire's deck and brand assets use **photography, logos, and typography** to carry meaning — there is **no proprietary icon set** in the materials provided. The brand wordmark and the standalone droplet-flame icon (`assets/logos/Icon *`) are the only graphic marks. No icon font is shipped.

Where this design system needs icons (in the website kit, in slide chrome, in tweak panels), it standardizes on **Lucide** (https://lucide.dev) — a thin, geometric, open-source set whose 2px stroke weight and rounded line-caps pair cleanly with Poppins. Lucide is loaded via CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

**This is a substitution and should be flagged.** If GlassFire has an internal icon library, swap it in. Until then, Lucide is the chosen stand-in.

### Rules
- **Stroke width:** 2px (Lucide default). Never fill icons unless they're status badges.
- **Size:** Match the cap-height of adjacent type. Common: 16, 20, 24, 32, 48.
- **Color:** Inherit from text color (`currentColor`). Use brand color only for status or active states.
- **No emoji.** Anywhere. The brand does not use them.
- **No unicode characters as icons** (no ★, →, ✓). Use the Lucide equivalent.
- **No hand-rolled SVG.** If a needed icon isn't in Lucide, ask before drawing.

### Imagery vs. icons
For service tiles, case studies, and slide content, **always prefer real photography or video stills** over icons. Use `image-slot` placeholders when production imagery isn't available — never substitute a vector illustration.

---

## Font note

The complete Poppins family — all nine weights plus italics (Thin → Black) — is **self-hosted** in `fonts/` and wired via `@font-face` in `colors_and_type.css`. No CDN dependency; the system works fully offline.

---

## Quick start

```html
<link rel="stylesheet" href="colors_and_type.css">
<style>
  body { background: var(--bg-1); color: var(--fg-1); font-family: var(--font-sans); }
</style>

<h1 class="gf-h1">CRAFTING VISUAL <br>EXPERIENCES THAT <br><span class="gf-text-spark">INSPIRE</span></h1>
<p class="gf-lead">We make cinematic, story-first video content that connects with audiences and delivers results.</p>
<a class="gf-btn gf-btn-fire">LET'S TALK!</a>
```
