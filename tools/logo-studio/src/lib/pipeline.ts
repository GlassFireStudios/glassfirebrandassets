// Client-side orchestration: turn one source image into the full set of
// variant × size canvases, ready for preview and publishing.

import {
  BASE_BOX,
  SIZES,
  VARIANT_COLORS,
  normalizeToBox,
  toMono,
  trimBounds,
  type Bounds,
} from "./image";
import type { VariantName } from "./types";

export interface BuildOptions {
  variants: VariantName[];
  /** Subset of SIZES labels to produce, e.g. ["@1x","@2x","@3x"]. */
  sizeLabels: string[];
  paddingRatio: number;
  boxWidth?: number;
  boxHeight?: number;
  /** When true, the box width adapts to the logo's aspect ratio (fixed height)
   *  so wide/tall logos fill the box without cropping or dead space. */
  fitToLogo?: boolean;
  /** White/black variants keep internal detail via luminance knockout instead
   *  of flattening to a solid blob. Defaults to true. */
  preserveDetail?: boolean;
  /** 0 = full detail knockout, 1 = fully solid fill. Lets you dial a logo to a
   *  clean solid silhouette when knockout leaves unwanted shades. */
  solidity?: number;
}

export interface SizeOutput {
  label: string;
  scale: number;
  canvas: HTMLCanvasElement;
}

export interface VariantOutput {
  variant: VariantName;
  sizes: SizeOutput[];
}

export interface BuildResult {
  bounds: Bounds | null;
  variants: VariantOutput[];
}

/** Build every requested variant at every requested size from a color master
 *  canvas (already background-removed, transparent). */
export function buildAll(master: HTMLCanvasElement, opts: BuildOptions): BuildResult {
  const bounds = trimBounds(master);
  const baseW = opts.boxWidth ?? BASE_BOX.width;
  const boxH = opts.boxHeight ?? BASE_BOX.height;
  const sizes = SIZES.filter((s) => opts.sizeLabels.includes(s.label));

  if (!bounds) return { bounds: null, variants: [] };

  // In "fit to logo" mode the box width tracks the logo's aspect (at the fixed
  // box height), inflated for padding so the content still fills edge-to-edge.
  const pad = opts.paddingRatio;
  const fitW = opts.fitToLogo
    ? Math.max(1, Math.round((boxH * (1 - pad * 2)) * (bounds.w / bounds.h) / (1 - pad * 2)))
    : baseW;

  const preserveDetail = opts.preserveDetail ?? true;
  const solidity = opts.solidity ?? 0;
  const variants: VariantOutput[] = opts.variants.map((v) => {
    const colored =
      v === "color" ? master : toMono(master, VARIANT_COLORS[v], preserveDetail, solidity);
    const sizeOut: SizeOutput[] = sizes.map((s) => ({
      label: s.label,
      scale: s.scale,
      canvas: normalizeToBox(
        colored,
        bounds,
        Math.round(fitW * s.scale),
        Math.round(boxH * s.scale),
        opts.paddingRatio,
      ),
    }));
    return { variant: v, sizes: sizeOut };
  });

  return { bounds, variants };
}
