/*! GlassFire embed loader — renders saved logo carousels & grids from this repo.
 *  Usage on any site:
 *    <div class="gf-embed" data-embed="your-saved-slug"></div>
 *    <script src="https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/embed.js" defer></script>
 *  Reads Embeds/<slug>.json from the repo, so re-saving the embed (or adding a
 *  logo) updates every site automatically — no HTML change needed.
 */
(function () {
  var REPO = "GlassFireStudios/glassfirebrandassets";
  var BRANCH = "main";
  var RAW = "https://raw.githubusercontent.com/";

  function rawUrl(repo, branch, path) {
    return RAW + repo + "/" + branch + "/" + path.split("/").map(encodeURIComponent).join("/");
  }
  // Image URLs. A custom CDN base (Bunny pull zone, set via data-cdn or the saved
  // config's cdnBase) serves repo-relative paths; otherwise fall back to jsDelivr.
  function cdnUrl(repo, branch, path, base) {
    var enc = path.split("/").map(encodeURIComponent).join("/");
    if (base) return base.replace(/\/$/, "") + "/" + enc;
    return "https://cdn.jsdelivr.net/gh/" + repo + "@" + branch + "/" + enc;
  }

  var CSS =
    ".gf-logos{overflow:hidden;width:100%;box-sizing:border-box;padding:var(--gf-pad,24px) 0}" +
    ".gf-logos[data-fade=true]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}" +
    ".gf-logos__row+.gf-logos__row{margin-top:var(--gf-rowgap,24px)}" +
    ".gf-logos__track{display:flex;align-items:center;width:max-content;animation:gf-marquee var(--gf-dur,40s) linear infinite}" +
    ".gf-logos__row[data-dir=right] .gf-logos__track{animation-direction:reverse}" +
    ".gf-logos[data-pause=true]:hover .gf-logos__track{animation-play-state:paused}" +
    ".gf-logos img,.gf-grid img{height:var(--gf-h,44px);width:auto;flex:0 0 auto;object-fit:contain;display:block}" +
    ".gf-logos img{margin-right:var(--gf-gap,72px)}" +
    "@media(prefers-reduced-motion:reduce){.gf-logos__track{animation:none}}" +
    "@keyframes gf-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
    ".gf-grid{display:grid;gap:var(--gf-gap,40px);box-sizing:border-box;padding:var(--gf-pad,32px);grid-template-columns:repeat(var(--gf-cols,5),1fr)}" +
    ".gf-grid__cell{display:flex;align-items:center;justify-content:center}" +
    ".gf-grid img{max-width:100%}" +
    // Hover styles (apply to both carousel + grid)
    ".gf-fx img{transition:filter .35s ease,opacity .35s ease}" +
    ".gf-fx[data-hover=grayscale] img{filter:grayscale(1);opacity:.7}" +
    ".gf-fx[data-hover=white] img{filter:brightness(0) invert(1)}" +
    ".gf-fx[data-hover=black] img{filter:brightness(0)}" +
    ".gf-fx[data-hover=grayscale] img:hover,.gf-fx[data-hover=white] img:hover,.gf-fx[data-hover=black] img:hover{filter:none;opacity:1}" +
    // Testimonials
    ".gft{box-sizing:border-box;width:100%;padding:24px;background:var(--gft-bg,transparent)}" +
    ".gft *{box-sizing:border-box}" +
    ".gft-wall{display:grid;gap:20px;grid-template-columns:repeat(var(--gft-cols,3),1fr)}" +
    ".gft-carousel{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:8px}" +
    ".gft-carousel .gft-card{flex:0 0 min(360px,80%);scroll-snap-align:start}" +
    ".gft-single{max-width:680px;margin:0 auto}" +
    ".gft-card{display:flex;flex-direction:column;gap:14px;background:var(--gft-card,#111114);border-radius:16px;padding:24px}" +
    ".gft-stars{font-size:15px;letter-spacing:2px;color:#3f3f46}" +
    ".gft-quote{margin:0;font-size:17px;line-height:1.55;color:var(--gft-text,#f4f4f5);font-weight:450}" +
    ".gft-quote::before{content:'\\201C'}.gft-quote::after{content:'\\201D'}" +
    ".gft-cap{display:flex;align-items:center;gap:12px;margin-top:auto}" +
    ".gft-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:0 0 auto}" +
    ".gft-id{display:flex;flex-direction:column;min-width:0}" +
    ".gft-name{font-weight:600;color:var(--gft-text,#f4f4f5);font-size:14px}" +
    ".gft-role{color:var(--gft-muted,#a1a1aa);font-size:13px}" +
    ".gft-logo{height:24px;width:auto;margin-left:auto;object-fit:contain;opacity:.9;flex:0 0 auto}" +
    "@media(max-width:720px){.gft-wall{grid-template-columns:1fr}}";

  function injectCss() {
    if (document.getElementById("gf-embed-css")) return;
    var s = document.createElement("style");
    s.id = "gf-embed-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function imgSrc(logo, o, repo, branch, base) {
    // Hover styles reveal color, so use the color image + a CSS filter at rest.
    var path = o.hoverStyle && o.hoverStyle !== "none" && logo.colorUrl ? logo.colorUrl : logo.url;
    return cdnUrl(repo, branch, path, base);
  }

  // Per-logo inline style: optical scale + (carousel) side trim.
  function logoStyle(l, withTrim) {
    var parts = [];
    if (l.scale && l.scale !== 1) parts.push("height:calc(var(--gf-h) * " + l.scale + ")");
    if (withTrim && l.sideTrim) parts.push("margin-left:-" + l.sideTrim + "px;margin-right:calc(var(--gf-gap) - " + l.sideTrim + "px)");
    return parts.length ? ' style="' + parts.join(";") + '"' : "";
  }

  function carousel(el, cfg, repo, branch, base) {
    var o = cfg.options || {};
    var dir = o.direction || "left";
    var rows = Math.max(1, Math.min(3, o.rows || 1));
    var rowsHtml = "";
    for (var r = 0; r < rows; r++) {
      var imgs = "";
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < cfg.logos.length; i++) {
          if (i % rows !== r) continue;
          var l = cfg.logos[i];
          imgs += '<img src="' + esc(imgSrc(l, o, repo, branch, base)) + '" alt="' + esc(l.alt) + '" loading="lazy" decoding="async"' + (pass ? ' aria-hidden="true"' : "") + logoStyle(l, true) + ">";
        }
      }
      var rdir = o.mirrorRows && r % 2 === 1 ? (dir === "left" ? "right" : "left") : dir;
      rowsHtml += '<div class="gf-logos__row" data-dir="' + rdir + '"><div class="gf-logos__track">' + imgs + "</div></div>";
    }
    var style = "--gf-h:" + (o.height || 44) + "px;--gf-gap:" + (o.gap || 72) + "px;--gf-dur:" + (o.duration || 40) + "s;--gf-pad:" + (o.padding || 24) + "px;--gf-rowgap:" + (o.rowGap == null ? 24 : o.rowGap) + "px;background:" + (o.background || "transparent");
    el.innerHTML =
      '<div class="gf-logos gf-fx" style="' + style + '" data-fade="' + !!o.edgeFade + '" data-pause="' + (o.pauseOnHover !== false) + '" data-hover="' + (o.hoverStyle || "none") + '" aria-label="' + esc(cfg.name || "Logos") + '">' + rowsHtml + "</div>";
  }

  function grid(el, cfg, repo, branch, base) {
    var o = cfg.options || {};
    var cells = "";
    for (var i = 0; i < cfg.logos.length; i++) {
      var l = cfg.logos[i];
      cells += '<div class="gf-grid__cell"><img src="' + esc(imgSrc(l, o, repo, branch, base)) + '" alt="' + esc(l.alt) + '" loading="lazy" decoding="async"' + logoStyle(l, false) + "></div>";
    }
    var style = "--gf-cols:" + (o.columns || 5) + ";--gf-gap:" + (o.gap || 40) + "px;--gf-pad:" + (o.padding || 32) + "px;--gf-h:" + (o.cellHeight || 56) + "px;background:" + (o.background || "transparent");
    el.innerHTML = '<div class="gf-grid gf-fx" style="' + style + '" data-hover="' + (o.hoverStyle || "none") + '" aria-label="' + esc(cfg.name || "Logos") + '">' + cells + "</div>";
  }

  function tstars(rating, accent) {
    var n = Math.max(0, Math.min(5, Math.round(rating || 0))), out = "";
    for (var i = 0; i < 5; i++) out += "<span" + (i < n ? ' style="color:' + accent + '"' : "") + ">★</span>";
    return '<div class="gft-stars">' + out + "</div>";
  }

  function tcard(t, o, repo, branch, base) {
    var rating = o.showRating !== false && t.rating ? tstars(t.rating, o.accent || "#EE2750") : "";
    var avatar = t.headshotUrl ? '<img class="gft-avatar" src="' + esc(cdnUrl(repo, branch, t.headshotUrl, base)) + '" alt="' + esc(t.name) + '" loading="lazy" decoding="async">' : "";
    var logo = o.showLogo !== false && t.logoUrl ? '<img class="gft-logo" src="' + esc(cdnUrl(repo, branch, t.logoUrl, base)) + '" alt="' + esc(t.company) + ' logo" loading="lazy" decoding="async">' : "";
    var roleLine = [t.role, t.company].filter(Boolean).join(", ");
    return '<figure class="gft-card">' + rating + '<blockquote class="gft-quote">' + esc(t.quote) + '</blockquote><figcaption class="gft-cap">' + avatar + '<div class="gft-id"><span class="gft-name">' + esc(t.name) + '</span><span class="gft-role">' + esc(roleLine) + "</span></div>" + logo + "</figcaption></figure>";
  }

  function testimonial(el, cfg, repo, branch, base) {
    var o = cfg.options || {};
    var items = cfg.items || [];
    var cards = items.map(function (t) { return tcard(t, o, repo, branch, base); }).join("");
    var layout = o.layout || "wall";
    var cls = layout === "carousel" ? "gft-carousel" : layout === "card" ? "gft-single" : "gft-wall";
    var inner = layout === "card" ? '<div class="gft-single">' + cards + "</div>" : '<div class="' + cls + '" style="--gft-cols:' + (o.columns || 3) + '">' + cards + "</div>";
    var style = "--gft-bg:" + (o.background || "transparent") + ";--gft-card:" + (o.cardBg || "#111114") + ";--gft-text:" + (o.textColor || "#f4f4f5") + ";--gft-muted:" + (o.mutedColor || "#a1a1aa");
    el.innerHTML = '<div class="gft" style="' + style + '" aria-label="Client testimonials">' + inner + "</div>";
  }

  function load(el) {
    var slug = el.getAttribute("data-embed");
    if (!slug) return;
    var repo = el.getAttribute("data-repo") || REPO;
    var branch = el.getAttribute("data-branch") || BRANCH;
    fetch(rawUrl(repo, branch, "Embeds/" + slug + ".json") + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("config " + r.status); return r.json(); })
      .then(function (cfg) {
        injectCss();
        var base = el.getAttribute("data-cdn") || cfg.cdnBase || "";
        if (cfg.type === "grid") grid(el, cfg, repo, branch, base);
        else if (cfg.type === "testimonial") testimonial(el, cfg, repo, branch, base);
        else carousel(el, cfg, repo, branch, base);
      })
      .catch(function (e) { console.error("[gf-embed]", slug, e); });
  }

  function init() {
    var els = document.querySelectorAll("[data-embed]");
    for (var i = 0; i < els.length; i++) load(els[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
