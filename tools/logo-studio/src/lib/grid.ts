// Client-side grid composition — renders a "Trusted By" style logo grid to a
// canvas for export (transparent PNG or flattened JPEG/PNG).

export interface GridItem {
  canvas: HTMLCanvasElement; // a normalized logo cell (transparent)
  name: string;
}

export interface GridOptions {
  columns: number | "auto";
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
  outerPadding: number;
  background: string | "transparent";
  title?: string;
  titleColor: string;
  titleSize: number;
  stagger: boolean;
  staggerAmount: number; // px
  watermark?: HTMLCanvasElement | HTMLImageElement | null;
  targetAspect: number; // e.g. 16/9
}

/** Pick a column count that yields an overall aspect closest to the target. */
export function autoColumns(n: number, opt: Pick<GridOptions, "cellWidth" | "cellHeight" | "gapX" | "gapY" | "targetAspect">): number {
  if (n <= 1) return 1;
  let best = 1;
  let bestDelta = Infinity;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = cols * opt.cellWidth + (cols - 1) * opt.gapX;
    const h = rows * opt.cellHeight + (rows - 1) * opt.gapY;
    const delta = Math.abs(w / h - opt.targetAspect);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = cols;
    }
  }
  return best;
}

export function renderGrid(items: GridItem[], opts: GridOptions): HTMLCanvasElement {
  const n = items.length;
  const cols = opts.columns === "auto" ? autoColumns(n, opts) : Math.max(1, opts.columns);
  const rows = Math.ceil(n / cols);

  const titleH = opts.title ? opts.titleSize * 2.4 : 0;
  const staggerPad = opts.stagger ? opts.staggerAmount : 0;
  const watermarkH = opts.watermark ? 56 : 0;

  const gridW = cols * opts.cellWidth + (cols - 1) * opts.gapX;
  const gridH = rows * opts.cellHeight + (rows - 1) * opts.gapY;

  const width = Math.round(gridW + opts.outerPadding * 2);
  const height = Math.round(
    gridH + opts.outerPadding * 2 + titleH + staggerPad + watermarkH,
  );

  const cv = document.createElement("canvas");
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (opts.background !== "transparent") {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }

  if (opts.title) {
    ctx.fillStyle = opts.titleColor;
    ctx.font = `800 ${opts.titleSize}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.title.toUpperCase(), width / 2, opts.outerPadding + titleH / 2);
  }

  const gridTop = opts.outerPadding + titleH;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;

    // Center the final, possibly-incomplete row.
    const itemsInRow = r === rows - 1 ? n - r * cols : cols;
    const rowWidth = itemsInRow * opts.cellWidth + (itemsInRow - 1) * opts.gapX;
    const rowLeft = (width - rowWidth) / 2;
    const colIndexInRow = i - r * cols;

    const x = rowLeft + colIndexInRow * (opts.cellWidth + opts.gapX);
    const yOffset = opts.stagger ? (c % 2) * opts.staggerAmount : 0;
    const y = gridTop + r * (opts.cellHeight + opts.gapY) + yOffset;

    ctx.drawImage(items[i].canvas, x, y, opts.cellWidth, opts.cellHeight);
  }

  if (opts.watermark) {
    const wmH = 36;
    const wm = opts.watermark;
    const wmW = (("width" in wm ? wm.width : 0) / ("height" in wm ? wm.height : 1)) * wmH || wmH * 4;
    ctx.drawImage(wm, width - opts.outerPadding - wmW, height - opts.outerPadding - wmH, wmW, wmH);
  }

  return cv;
}
