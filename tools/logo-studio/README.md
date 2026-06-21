# GlassFire Brand Studio

A lightweight internal tool for client brand assets — logos, embeds, and
testimonials — committed straight into this brand-assets repo.

**Land a client → find their logo → get clean `color` / `white` / `black`
variants at multiple sizes, SEO alt-tagged → publish straight into the repo →
build an optimized "Trusted By" grid.**

It runs as a Next.js app (deploy on Vercel) and writes to GitHub using a private
PAT, so it never touches `git` locally.

---

## What it does

### 1. Logo Intake (`/intake`)
- **Search** a client by name or domain across **Brandfetch** (multiple brand
  matches × color/light/dark × logo/symbol/icon), **Clearbit** (domain → logo),
  and an optional **Google Programmable Search** "whole web" layer. Pick the
  right one from a gallery — or **upload a file / paste a URL**.
- **Background removal** — for JPEGs or logos on a solid background, a border
  flood-fill strips the background (auto-enabled, tolerance slider) so clean
  silhouettes can be generated.
- **Variants** — `color` (original), `white`, and `black` silhouettes
  (alpha-preserving, so edges stay crisp).
- **Sizes** — normalized into the repo's 3:1 box at `@1x` (150×50), `@2x`
  (300×100), `@3x` (450×150).
- **SEO** — editable alt text (default `"<Client> logo — GlassFire client"`),
  title, kebab-case filenames, a per-client JSON sidecar, and a root
  `client-logos.json` manifest.
- **Publish** — one click commits the whole set via the GitHub API, to a review
  branch (`logo-intake/<client>`) or directly to `main`.

### 2. Grid Builder (`/grid`)
- Reads every client logo in the repo, lets you pick which to include and which
  variant to use.
- **Optimized layout** (auto column count for a balanced grid), staggered
  option, title, brand-color/transparent backgrounds, and a GlassFire
  watermark — matching the "Trusted By" deck style.
- **Export** as a transparent **PNG** or flattened **JPEG**, download or publish
  to `Grids/`.

---

## Repo output structure

```
Client Logos/
  Coca Cola/
    coca-cola-color.png   coca-cola-color@2x.png   coca-cola-color@3x.png
    coca-cola-white.png   coca-cola-white@2x.png   coca-cola-white@3x.png
    coca-cola-black.png   coca-cola-black@2x.png   coca-cola-black@3x.png
    coca-cola.json        # alt / title / domain / source / sizes
client-logos.json         # aggregate manifest
Grids/
  trusted-by-2026-06-21.png
```

Existing flat white logos (e.g. `Client Logos/Google.png`) are left untouched
and still appear in the Grid Builder as "white only".

---

## Local development

```bash
cd tools/logo-studio
cp .env.example .env.local   # fill in tokens
npm install
npm run dev                  # http://localhost:3000
```

With no env vars set the UI loads, but search and publishing are disabled until
you add the relevant keys.

## Deploy to Vercel

1. **Import** this GitHub repo into Vercel.
2. Set **Root Directory** to `tools/logo-studio`.
3. Add the environment variables from `.env.example` (Project → Settings →
   Environment Variables).
4. (Recommended) Turn on **Deployment Protection** and set `APP_PASSWORD` for a
   second internal-only gate.
5. Deploy.

### Required env vars
| Var | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Fine-grained PAT, **Contents: Read & write** on this repo only |
| `GITHUB_REPO` | `GlassFireStudios/glassfirebrandassets` |
| `GITHUB_BASE_BRANCH` | Branch to read from / base new branches on (`main`) |
| `BRANDFETCH_CLIENT_ID` / `BRANDFETCH_API_KEY` | Logo search + variants |
| `GOOGLE_CSE_KEY` / `GOOGLE_CSE_ID` | *(optional)* whole-web image search |
| `APP_PASSWORD` | *(recommended)* shared password gate |

---

## How background removal + silhouettes work
1. The source image is drawn to a canvas (proxied through `/api/image-proxy` to
   avoid CORS taint).
2. If it's a JPEG / solid background, a flood-fill from the border removes the
   background within a color tolerance — interior same-color shapes are kept.
3. The result is recolored to white or black while preserving alpha, then
   trimmed and centered in the standard box at each size.

All image processing happens in the browser; only finished PNGs are sent to the
server to commit.
