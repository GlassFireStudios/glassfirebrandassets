// Shared types for the GlassFire Logo Studio.

export type VariantName = "color" | "white" | "black";

export type LogoSource = "brandfetch" | "clearbit" | "google" | "upload" | "url";

/** A candidate logo returned from a search, shown in the picker gallery. */
export interface LogoCandidate {
  id: string;
  source: LogoSource;
  /** Display name of the brand/company. */
  name: string;
  /** Best-known primary domain, when available. */
  domain?: string;
  /** Fetchable image URL (proxied client-side to avoid CORS taint). */
  imageUrl: string;
  /** brandfetch: "logo" | "icon" | "symbol". */
  kind?: string;
  /** brandfetch theme hint: "light" | "dark". */
  theme?: string;
  /** File format hint: png | svg | jpeg | webp. */
  format?: string;
  /** Whether the source is known to be on a transparent background. */
  transparent?: boolean;
}

/** A single rendered file ready to publish (base64, no data: prefix). */
export interface RenderedFile {
  path: string;
  base64: string;
}

/** The per-client metadata sidecar + manifest entry. */
export interface ClientLogoMeta {
  name: string;
  slug: string;
  domain?: string;
  alt: string;
  title: string;
  source: string;
  sourceUrl?: string;
  variants: VariantName[];
  /** e.g. ["@1x", "@2x", "@3x"] */
  sizes: string[];
  box: { width: number; height: number };
  addedBy?: string;
  addedAt: string;
}

export interface ClientManifest {
  generator: string;
  updatedAt: string;
  clients: ClientLogoMeta[];
}

/** A client discovered in the repo, with the repo paths of its available
 *  variants. Shared by the Grid Builder, Carousel Builder, and Manage tab. */
export interface ClientEntry {
  name: string;
  slug?: string;
  alt?: string;
  variants: Partial<Record<VariantName, string>>;
  legacy?: boolean;
}

/** Per-logo display tweaks (optical sizing / side-spacing) keyed by client name. */
export interface LogoAdjust {
  scale?: number; // 0.5–1.5 multiplier on the shared logo height
  sideTrim?: number; // px pulled off each side to tighten spacing (carousel)
}

/** A saved embed config (carousel or grid) stored at Embeds/<slug>.json and
 *  rendered live on external sites by embed.js. */
export interface EmbedConfig {
  type: "carousel" | "grid";
  name: string;
  slug: string;
  logos: { name: string; url: string; colorUrl?: string; alt: string; scale?: number; sideTrim?: number }[];
  options: Record<string, unknown>;
  // Optional custom image CDN base (Bunny pull zone). embed.js uses it for
  // image URLs when present, else falls back to jsDelivr.
  cdnBase?: string;
  updatedAt: string;
}

/** A captured client testimonial. Pending ones live at
 *  Testimonials/pending/<slug>.json; approved ones at Testimonials/<slug>.json. */
export interface Testimonial {
  slug: string;
  name: string;
  role?: string;
  company: string;
  /** Name of the client in the logo library, to attach their logo. */
  clientName?: string;
  quote: string;
  rating?: number; // 1–5
  headshot?: string; // repo path to uploaded headshot, if any
  consent: boolean;
  status: "pending" | "approved";
  submittedAt: string;
  approvedAt?: string;
}

/** A tokenized capture invite (Testimonials/_invites/<token>.json) that
 *  pre-fills and authorizes a client's submission. A "universal" invite
 *  (open: true) lets anyone submit and enter their own company. */
export interface TestimonialInvite {
  token: string;
  company?: string; // omitted for universal links
  clientName?: string;
  role?: string;
  open?: boolean;
  createdAt: string;
}

/** One testimonial baked into a web embed config. */
export interface TestimonialItem {
  quote: string;
  name: string;
  role?: string;
  company: string;
  rating?: number;
  headshotUrl?: string; // repo path (resolved to CDN by embed.js)
  logoUrl?: string; // repo path to the company logo variant
}

/** A saved testimonial embed (stored in Embeds/<slug>.json, rendered by embed.js). */
export interface TestimonialEmbedConfig {
  type: "testimonial";
  name: string;
  slug: string;
  items: TestimonialItem[];
  options: Record<string, unknown>;
  cdnBase?: string;
  updatedAt: string;
}

export interface PublishRequest {
  files: RenderedFile[];
  /** Repo paths to delete in the same commit. */
  deletes?: string[];
  message: string;
  /** Target branch. If createBranch is true and it does not exist, it is created from the base branch. */
  branch: string;
  createBranch?: boolean;
}
