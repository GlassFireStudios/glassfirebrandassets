import React from "react";

/**
 * LogoGrid — GlassFire "Trusted By" client wall.
 *
 * The live, on-brand counterpart to the logo-studio export tool. Where the
 * studio bakes a flat PNG for distribution, this renders the same grid in
 * HTML/CSS so it stays editable and re-themeable everywhere it is dropped —
 * decks, the website kit, one-pagers. Both read the same client-logos.json
 * roster, so the design and the exports never drift.
 */

// Mirror of client-logos.json so the component works with zero configuration.
const DEFAULT_CLIENTS = [
  { name: "Chick-fil-A",            file: "ChickFilA.png" },
  { name: "Coca-Cola",             file: "Coca Cola.png" },
  { name: "DRL",                   file: "DRL.png" },
  { name: "Enhanced Games",        file: "Enhanced Games.png" },
  { name: "Google",                file: "Google.png" },
  { name: "High Point University", file: "High Point University.png" },
  { name: "Intuit",                file: "Intuit.png" },
  { name: "NFL",                   file: "NFL.png" },
  { name: "Paramount",             file: "Paramount.png" },
  { name: "Ronald McDonald House", file: "Ronald McDonald House.png" },
  { name: "Samsung",               file: "Samsung.png" },
  { name: "University of Kentucky",file: "University of Kentucky.png" },
  { name: "Volvo",                 file: "Volvo.png" },
  { name: "YouTube Music",         file: "YouTube Music.png" },
];

const BG_PRESETS = {
  black: "#000000",
  ink: "#0A0A0C",
  white: "#FFFFFF",
  fire: "#EE2750",
  glass: "#00A8E4",
  transparent: "transparent",
};

/** Pick the column count whose overall block is closest to targetAspect. */
function autoColumns(n, cellW, cellH, gap, targetAspect) {
  if (n <= 1) return 1;
  let best = 1;
  let bestDelta = Infinity;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = cols * cellW + (cols - 1) * gap;
    const h = rows * cellH + (rows - 1) * gap;
    const delta = Math.abs(w / h - targetAspect);
    if (delta < bestDelta) { bestDelta = delta; best = cols; }
  }
  return best;
}

export function LogoGrid({
  clients = null,
  names = null,
  basePath = "assets/clients",
  title = "TRUSTED BY",
  variant = "white",          // "white" (logos as-is) | "black" (inverted for light bg)
  background = "black",       // preset key or any CSS color
  columns = "auto",           // number | "auto"
  gap = 40,
  rowHeight = 56,
  cellWidth = 200,
  stagger = false,
  muted = 0.7,                // resting logo opacity (0–1)
  align = "center",           // "center" | "left"
  titleColor = null,
  accent = "fire",            // "fire" | "glass" | "none" — rule under the title
  watermarkSrc = null,        // GlassFire mark, bottom-right; null = off
  targetAspect = 2.4,
  style = {},
} = {}) {
  // Resolve roster -------------------------------------------------------
  let roster = clients
    ? clients
    : DEFAULT_CLIENTS.map((c) => ({ name: c.name, src: `${basePath}/${c.file}` }));
  if (names && names.length) {
    const want = names.map((s) => s.toLowerCase());
    roster = roster
      .filter((c) => want.includes(c.name.toLowerCase()))
      .sort((a, b) => want.indexOf(a.name.toLowerCase()) - want.indexOf(b.name.toLowerCase()));
  }

  const n = roster.length;
  const bg = BG_PRESETS[background] || background;
  const isLight = bg === "#FFFFFF" || bg === "#ffffff" || bg === "white";
  const cols = columns === "auto"
    ? autoColumns(n, cellWidth, rowHeight, gap, targetAspect)
    : Math.max(1, columns);

  const resolvedTitleColor = titleColor || (isLight ? "#0A0A0C" : "#FFFFFF");
  const accentColor = accent === "glass" ? "#00A8E4" : accent === "fire" ? "#EE2750" : null;

  // Monochrome handling: source art is white. Invert to black on light bg.
  const logoFilter = variant === "black" || isLight ? "invert(1)" : "none";

  return (
    <div
      style={{
        background: bg,
        padding: "clamp(40px, 6%, 96px) clamp(32px, 6%, 88px)",
        boxSizing: "border-box",
        width: "100%",
        fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
        ...style,
      }}
    >
      {title ? (
        <div style={{ textAlign: align, marginBottom: 48 }}>
          <div
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: 14,
              color: resolvedTitleColor,
            }}
          >
            {title}
          </div>
          {accentColor ? (
            <div
              style={{
                width: 44,
                height: 3,
                background: accentColor,
                marginTop: 14,
                marginLeft: align === "center" ? "auto" : 0,
                marginRight: align === "center" ? "auto" : 0,
                borderRadius: 999,
              }}
            />
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: gap,
          rowGap: gap + (stagger ? rowHeight * 0.5 : 0),
          alignItems: "center",
          justifyItems: "center",
          maxWidth: cols * (cellWidth + gap),
          marginLeft: align === "center" ? "auto" : 0,
          marginRight: align === "center" ? "auto" : 0,
        }}
      >
        {roster.map((c, i) => (
          <div
            key={c.name + i}
            title={c.name}
            style={{
              height: rowHeight,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: stagger && (i % cols) % 2 === 1 ? `translateY(${rowHeight * 0.5}px)` : "none",
            }}
          >
            <img
              src={c.src}
              alt={`${c.name} — GlassFire client`}
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                width: "auto",
                objectFit: "contain",
                opacity: muted,
                filter: logoFilter,
                transition: "opacity 220ms cubic-bezier(0.2,0.7,0.2,1)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = String(muted); }}
            />
          </div>
        ))}
      </div>

      {watermarkSrc ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
          <img src={watermarkSrc} alt="GlassFire" style={{ height: 26, opacity: 0.85, filter: isLight ? "invert(1)" : "none" }} />
        </div>
      ) : null}
    </div>
  );
}

export default LogoGrid;
