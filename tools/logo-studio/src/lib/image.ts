// Browser-side image processing for logo intake.
// All functions run on the client (they use <canvas>/Image). They are imported
// only by client components.

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Standard export sizes — a 3:1 transparent box at 1x / 2x / 3x. */
export const BASE_BOX = { width: 150, height: 50 };
export const SIZES: { label: string; scale: number }[] = [
  { label: "@1x", scale: 1 },
  { label: "@2x", scale: 2 },
  { label: "@3x", scale: 3 },
];

export const VARIANT_COLORS: Record<"white" | "black", [number, number, number]> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
};

/** Load an image from a (possibly remote) URL, routed through our proxy so the
 *  canvas is never tainted by cross-origin pixels. */
export function loadImage(src: string, proxy = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    if (proxy && /^https?:\/\//i.test(src)) {
      img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    } else {
      img.src = src;
    }
  });
}

/** Draw an image onto a fresh canvas, capping the longest edge to maxEdge so
 *  background-removal work stays bounded. SVGs with no intrinsic size are
 *  rendered onto a large square and trimmed later. */
export function imageToCanvas(img: HTMLImageElement, maxEdge = 1200): HTMLCanvasElement {
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (!w || !h) {
    // SVG without explicit dimensions.
    w = h = 1024;
  }
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const cv = document.createElement("canvas");
  cv.width = cw;
  cv.height = ch;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, cw, ch);
  return cv;
}

function colorDist(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db); // 0..441
}

/** Does the image have a meaningful alpha channel (any transparent pixels)? */
export function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

/** Are the four corners roughly the same color (i.e. a solid background we can
 *  safely flood-fill away)? Used to auto-enable removal for JPEGs. */
export function looksLikeSolidBackground(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const corners = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
  ];
  const cols = corners.map(([x, y]) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return [d[0], d[1], d[2]] as [number, number, number];
  });
  for (let i = 1; i < cols.length; i++) {
    if (colorDist(...cols[0], ...cols[i]) > 24) return false;
  }
  return true;
}

/** Remove a solid background by flood-filling inward from the border, keying on
 *  the average corner color. Tolerance is 0..100 (% of max color distance).
 *  Interior shapes of the same color are preserved because they are not
 *  connected to the border. Works on JPEGs and PNGs alike. */
export function removeBackground(canvas: HTMLCanvasElement, tolerancePct = 10): void {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const tol = (tolerancePct / 100) * 441;

  // Reference = average of four corners.
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  let rr = 0, gg = 0, bb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    rr += data[i]; gg += data[i + 1]; bb += data[i + 2];
  }
  rr /= 4; gg /= 4; bb /= 4;

  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    const d = colorDist(data[i], data[i + 1], data[i + 2], rr, gg, bb);
    if (d > tol) continue; // hit the logo — stop.
    // Feather: fully transparent at center of tolerance, partial near the edge.
    data[i + 3] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Recolor every non-transparent pixel to a flat color, preserving alpha (and
 *  therefore anti-aliased edges). Produces clean white/black silhouettes. */
export function toSilhouette(canvas: HTMLCanvasElement, color: [number, number, number]): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const sctx = canvas.getContext("2d")!;
  const octx = out.getContext("2d")!;
  const img = sctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = img;
  const [r, g, b] = color;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 8) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/** Bounding box of all pixels with alpha above threshold. */
export function trimBounds(canvas: HTMLCanvasElement, alphaThreshold = 8): Bounds | null {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Scale the trimmed content of src to fit centered inside a boxW×boxH
 *  transparent canvas, with proportional padding on all sides. */
export function normalizeToBox(
  src: HTMLCanvasElement,
  bounds: Bounds,
  boxW: number,
  boxH: number,
  paddingRatio = 0.08,
): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = boxW;
  cv.height = boxH;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const availW = boxW * (1 - paddingRatio * 2);
  const availH = boxH * (1 - paddingRatio * 2);
  const scale = Math.min(availW / bounds.w, availH / bounds.h);
  const dw = bounds.w * scale;
  const dh = bounds.h * scale;
  const dx = (boxW - dw) / 2;
  const dy = (boxH - dh) / 2;
  ctx.drawImage(src, bounds.x, bounds.y, bounds.w, bounds.h, dx, dy, dw, dh);
  return cv;
}

/** Canvas → base64 (no data: prefix), ready for the GitHub publish API. */
export function canvasToBase64(canvas: HTMLCanvasElement, type = "image/png", quality = 0.92): string {
  return canvas.toDataURL(type, quality).split(",")[1];
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, type = "image/png", quality = 0.92): string {
  return canvas.toDataURL(type, quality);
}
