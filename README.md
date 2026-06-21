# GlassFire Brand Assets

Central store for GlassFire and client brand assets.

- **`Logos/`** — GlassFire's own brand kit (color / black / white / 2-color
  variants, brand colors, favicons, SVGs).
- **`Client Logos/`** — logos of the clients GlassFire works with, used for
  "Trusted By" grids. New clients are added with `color` / `white` / `black`
  variants at multiple sizes; older entries may be white-only.
- **`Grids/`** — exported logo grids.
- **`client-logos.json`** — manifest of client logos (name, slug, alt text,
  variants) for downstream sites.

## Brand Studio

[`tools/logo-studio/`](tools/logo-studio) is an internal Next.js app (deployable
on Vercel) for getting client logos into this repo: search for a client's logo,
auto-generate background-removed `color` / `white` / `black` variants with
SEO alt tags, publish straight to this repo via the GitHub API, and build
optimized "Trusted By" grids. See its [README](tools/logo-studio/README.md).
