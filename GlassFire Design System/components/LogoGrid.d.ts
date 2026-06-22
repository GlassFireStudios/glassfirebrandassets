import * as React from "react";

export interface LogoGridClient {
  /** Display name (used for alt text + tooltip). */
  name: string;
  /** Resolved image URL for this client's logo. */
  src: string;
}

export interface LogoGridProps {
  /**
   * Explicit client list. When omitted, the built-in GlassFire roster is used,
   * with each logo resolved as `${basePath}/${file}`.
   */
  clients?: LogoGridClient[] | null;
  /** Subset/ordering by name, applied to whichever roster is in use. */
  names?: string[] | null;
  /** Folder the built-in roster's files live in, relative to the page. */
  basePath?: string;
  /** Section title. Empty string hides it. */
  title?: string;
  /** "white" keeps the monochrome art; "black" inverts it for light backgrounds. */
  variant?: "white" | "black";
  /** Preset key ("black"|"ink"|"white"|"fire"|"glass"|"transparent") or any CSS color. */
  background?: string;
  /** Fixed column count, or "auto" to fit a pleasing aspect ratio. */
  columns?: number | "auto";
  /** Gap between cells, px. */
  gap?: number;
  /** Logo cell height, px. */
  rowHeight?: number;
  /** Nominal cell width used for auto-column math, px. */
  cellWidth?: number;
  /** Offset alternating columns for an editorial staggered wall. */
  stagger?: boolean;
  /** Resting logo opacity (0–1); animates to 1 on hover. */
  muted?: number;
  /** Block alignment. */
  align?: "center" | "left";
  /** Override the title color (defaults to contrast with the background). */
  titleColor?: string | null;
  /** Accent rule under the title. */
  accent?: "fire" | "glass" | "none";
  /** GlassFire mark URL shown bottom-right; omit to hide. */
  watermarkSrc?: string | null;
  /** Target width:height ratio for auto-column selection. */
  targetAspect?: number;
  /** Extra styles merged onto the outer container. */
  style?: React.CSSProperties;
}

/** GlassFire "Trusted By" client logo wall — the live counterpart to logo-studio. */
export declare function LogoGrid(props: LogoGridProps): React.ReactElement;
export default LogoGrid;
