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

  var CSS =
    ".gf-logos{overflow:hidden;width:100%;box-sizing:border-box;padding:var(--gf-pad,24px) 0}" +
    ".gf-logos[data-fade=true]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}" +
    ".gf-logos__track{display:flex;align-items:center;width:max-content;animation:gf-marquee var(--gf-dur,40s) linear infinite}" +
    ".gf-logos[data-dir=right] .gf-logos__track{animation-direction:reverse}" +
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
    ".gf-fx[data-hover=grayscale] img:hover,.gf-fx[data-hover=white] img:hover,.gf-fx[data-hover=black] img:hover{filter:none;opacity:1}";

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

  function imgSrc(logo, o, repo, branch) {
    // Hover styles reveal color, so use the color image + a CSS filter at rest.
    var path = o.hoverStyle && o.hoverStyle !== "none" && logo.colorUrl ? logo.colorUrl : logo.url;
    return rawUrl(repo, branch, path);
  }

  function carousel(el, cfg, repo, branch) {
    var o = cfg.options || {};
    var imgs = "";
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < cfg.logos.length; i++) {
        var l = cfg.logos[i];
        imgs += '<img src="' + esc(imgSrc(l, o, repo, branch)) + '" alt="' + esc(l.alt) + '"' + (pass ? ' aria-hidden="true"' : "") + ">";
      }
    }
    var style = "--gf-h:" + (o.height || 44) + "px;--gf-gap:" + (o.gap || 72) + "px;--gf-dur:" + (o.duration || 40) + "s;--gf-pad:" + (o.padding || 24) + "px;background:" + (o.background || "transparent");
    el.innerHTML =
      '<div class="gf-logos gf-fx" style="' + style + '" data-fade="' + !!o.edgeFade + '" data-dir="' + (o.direction || "left") + '" data-pause="' + (o.pauseOnHover !== false) + '" data-hover="' + (o.hoverStyle || "none") + '" aria-label="' + esc(cfg.name || "Logos") + '"><div class="gf-logos__track">' + imgs + "</div></div>";
  }

  function grid(el, cfg, repo, branch) {
    var o = cfg.options || {};
    var cells = "";
    for (var i = 0; i < cfg.logos.length; i++) {
      var l = cfg.logos[i];
      cells += '<div class="gf-grid__cell"><img src="' + esc(imgSrc(l, o, repo, branch)) + '" alt="' + esc(l.alt) + '"></div>';
    }
    var style = "--gf-cols:" + (o.columns || 5) + ";--gf-gap:" + (o.gap || 40) + "px;--gf-pad:" + (o.padding || 32) + "px;--gf-h:" + (o.cellHeight || 56) + "px;background:" + (o.background || "transparent");
    el.innerHTML = '<div class="gf-grid gf-fx" style="' + style + '" data-hover="' + (o.hoverStyle || "none") + '" aria-label="' + esc(cfg.name || "Logos") + '">' + cells + "</div>";
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
        if (cfg.type === "grid") grid(el, cfg, repo, branch);
        else carousel(el, cfg, repo, branch);
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
