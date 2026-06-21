// SEO-friendly slug + alt-text helpers.

/** Convert a client name into a kebab-case, filesystem + URL safe slug. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Default alt text optimized for SEO when these logos are used online. */
export function defaultAlt(name: string): string {
  return `${name} logo — GlassFire client`;
}

/** Default image title attribute. */
export function defaultTitle(name: string): string {
  return `${name} logo`;
}

/** Build the file name for a given variant + size. */
export function variantFileName(
  slug: string,
  variant: string,
  sizeLabel: string,
  ext = "png",
): string {
  // @1x is the canonical file (no suffix); @2x / @3x get a suffix.
  const suffix = sizeLabel === "@1x" ? "" : sizeLabel;
  return `${slug}-${variant}${suffix}.${ext}`;
}
