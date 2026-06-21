// Client-side orchestration: turn one source image into the full set of
// variant × size canvases, ready for preview and publishing.

import {
  BASE_BOX,
  SIZES,
  VARIANT_COLORS,
  normalizeToBox,
  toSilhouette,
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
  const boxW = opts.boxWidth ?? BASE_BOX.width;
  const boxH = opts.boxHeight ?? BASE_BOX.height;
  const sizes = SIZES.filter((s) => opts.sizeLabels.includes(s.label));

  if (!bounds) return { bounds: null, variants: [] };

  const variants: VariantOutput[] = opts.variants.map((v) => {
    const colored =
      v === "color" ? master : toSilhouette(master, VARIANT_COLORS[v]);
    const sizeOut: SizeOutput[] = sizes.map((s) => ({
      label: s.label,
      scale: s.scale,
      canvas: normalizeToBox(
        colored,
        bounds,
        Math.round(boxW * s.scale),
        Math.round(boxH * s.scale),
        opts.paddingRatio,
      ),
    }));
    return { variant: v, sizes: sizeOut };
  });

  return { bounds, variants };
}
