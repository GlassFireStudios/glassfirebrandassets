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

export interface PublishRequest {
  files: RenderedFile[];
  /** Repo paths to delete in the same commit. */
  deletes?: string[];
  message: string;
  /** Target branch. If createBranch is true and it does not exist, it is created from the base branch. */
  branch: string;
  createBranch?: boolean;
}
