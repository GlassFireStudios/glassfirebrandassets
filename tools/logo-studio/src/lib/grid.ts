// Client-side grid composition — renders a "Trusted By" style logo grid into a
// fixed-resolution canvas (e.g. 1920×1080) for export as transparent PNG or
// flattened JPEG/PNG.

export interface GridItem {
  /** Tight (trimmed) logo canvas, transparent edges removed. */
  canvas: HTMLCanvasElement;
  name: string;
}

export interface GridOptions {
  /** Output canvas resolution. */
  width: number;
  height: number;
  columns: number | "auto";
  gapX: number;
  gapY: number;
  outerPadding: number;
  /** Padding inside each cell slot, 0..1 of the slot; negative enlarges. */
  logoPadding: number;
  background: string | "transparent";
  backgroundImage?: HTMLImageElement | HTMLCanvasElement | null;
  title?: string;
  titleColor: string;
  titleSize: number;
  /** Per-column vertical offset in px. 0 = no stagger. */
  staggerAmount: number;
  watermark?: HTMLImageElement | HTMLCanvasElement | null;
}

function avgAspect(items: GridItem[]): number {
  if (!items.length) return 3;
  const sum = items.reduce((a, it) => a + it.canvas.width / it.canvas.height, 0);
  return sum / items.length;
}

/** Pick the column count that lets the logos render as large as possible within
 *  the content region, given their average aspect ratio. */
export function autoColumns(n: number, regionW: number, regionH: number, gapX: number, gapY: number, aspect: number): number {
  if (n <= 1) return 1;
  let best = 1;
  let bestScore = -Infinity;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const slotW = (regionW - (cols - 1) * gapX) / cols;
    const slotH = (regionH - (rows - 1) * gapY) / rows;
    if (slotW <= 0 || slotH <= 0) continue;
    // Limiting display width of an average logo in this slot.
    const display = Math.min(slotW, slotH * aspect);
    if (display > bestScore) {
      bestScore = display;
      best = cols;
    }
  }
  return best;
}

export function renderGrid(items: GridItem[], opts: GridOptions): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = Math.round(opts.width);
  cv.height = Math.round(opts.height);
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background.
  if (opts.backgroundImage) {
    drawCover(ctx, opts.backgroundImage, cv.width, cv.height);
  } else if (opts.background !== "transparent") {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, cv.width, cv.height);
  }

  const n = items.length;
  if (!n) return cv;

  const titleH = opts.title ? opts.titleSize * 2.2 : 0;
  const watermarkH = opts.watermark ? 44 : 0;

  if (opts.title) {
    ctx.fillStyle = opts.titleColor;
    ctx.font = `800 ${opts.titleSize}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.title.toUpperCase(), cv.width / 2, opts.outerPadding + titleH / 2);
  }

  // Content region the logos are laid out within.
  const left = opts.outerPadding;
  const top = opts.outerPadding + titleH;
  const regionW = cv.width - opts.outerPadding * 2;
  const regionH = cv.height - opts.outerPadding * 2 - titleH - watermarkH;

  const aspect = avgAspect(items);
  const cols = opts.columns === "auto"
    ? autoColumns(n, regionW, regionH, opts.gapX, opts.gapY, aspect)
    : Math.max(1, opts.columns);
  const rows = Math.ceil(n / cols);

  // Reserve room for the stagger so it never spills out of the region.
  const usableH = regionH - opts.staggerAmount;
  const slotW = (regionW - (cols - 1) * opts.gapX) / cols;
  const slotH = (usableH - (rows - 1) * opts.gapY) / rows;

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;

    // Center an incomplete final row.
    const itemsInRow = r === rows - 1 ? n - r * cols : cols;
    const rowWidth = itemsInRow * slotW + (itemsInRow - 1) * opts.gapX;
    const rowLeft = left + (regionW - rowWidth) / 2;
    const colInRow = i - r * cols;

    const slotX = rowLeft + colInRow * (slotW + opts.gapX);
    const slotY = top + r * (slotH + opts.gapY) + (c % 2) * opts.staggerAmount;

    drawInSlot(ctx, items[i].canvas, slotX, slotY, slotW, slotH, opts.logoPadding);
  }

  if (opts.watermark) {
    const wm = opts.watermark;
    const wmH = 32;
    const wmW = (wm.width / wm.height) * wmH;
    ctx.drawImage(wm, cv.width - opts.outerPadding - wmW, cv.height - opts.outerPadding - wmH, wmW, wmH);
  }

  return cv;
}

/** Fit a tight logo into a slot, horizontally + vertically centered. */
function drawInSlot(
  ctx: CanvasRenderingContext2D,
  logo: HTMLCanvasElement,
  slotX: number, slotY: number, slotW: number, slotH: number,
  padding: number,
) {
  const availW = slotW * (1 - padding * 2);
  const availH = slotH * (1 - padding * 2);
  const scale = Math.min(availW / logo.width, availH / logo.height);
  const dw = logo.width * scale;
  const dh = logo.height * scale;
  const dx = slotX + (slotW - dw) / 2;
  const dy = slotY + (slotH - dh) / 2; // vertical middle
  ctx.drawImage(logo, dx, dy, dw, dh);
}

/** Draw an image to fill a region (object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  w: number, h: number,
) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
