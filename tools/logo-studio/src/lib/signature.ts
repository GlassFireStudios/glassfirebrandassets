// Builds a Gmail/Outlook-safe HTML email signature: table layout, inline styles
// only, web-safe fonts (email clients strip custom webfonts like Poppins), and
// brand colors. The logo loads from jsDelivr so it renders in any inbox.

export interface SignatureFields {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string; // display, e.g. www.glassfire.co
  social: string; // display, e.g. @glassfirestudios
  socialUrl: string; // full link
  logo: "icon" | "wordmark" | "both" | "none";
  logoSize: "s" | "m" | "l";
  accent: "glass" | "fire";
}

const ICON_PX = { s: 54, m: 66, l: 84 };
const WORD_PX = { s: 30, m: 42, l: 56 };

const CDN = "https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main";
const ICON = `${CDN}/Logos/Official%20Gradient%20Logo/GlassFire%20Icon%20Color.png`;
const WORDMARK = `${CDN}/Logos/Official%20Gradient%20Logo/GlassFire%20Logo%20Color.png`;

const GLASS = "#00A8E4";
const FIRE = "#EE2750";
const INK = "#1A1A1F";
const STEEL = "#6E6E76";
const FOG = "#B8B8BE";
const FONT = "Arial, Helvetica, sans-serif";

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const tel = (p: string) => p.replace(/[^\d+]/g, "");
const httpify = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`);

export function buildSignatureHtml(f: SignatureFields): string {
  const accent = f.accent === "fire" ? FIRE : GLASS;
  const link = f.accent === "fire" ? GLASS : FIRE; // alternate accent for web/social

  const contactBits: string[] = [];
  if (f.phone) contactBits.push(`<span style="font-weight:bold;color:${INK};">Mobile</span> <a href="tel:${esc(tel(f.phone))}" style="color:${accent};text-decoration:none;">${esc(f.phone)}</a>`);
  if (f.email) contactBits.push(`<span style="font-weight:bold;color:${INK};">Email</span> <a href="mailto:${esc(f.email)}" style="color:${accent};text-decoration:none;">${esc(f.email)}</a>`);
  const contactRow = contactBits.length
    ? `<div style="font-size:13px;line-height:1.7;color:${INK};padding-top:6px;">${contactBits.join('<span style="color:' + FOG + ';">&nbsp;&nbsp;</span>')}</div>`
    : "";

  const linkBits: string[] = [];
  if (f.website) linkBits.push(`<a href="${esc(httpify(f.website))}" style="color:${link};text-decoration:none;font-weight:bold;">${esc(f.website)}</a>`);
  if (f.social) linkBits.push(`<a href="${esc(httpify(f.socialUrl || f.social))}" style="color:${link};text-decoration:none;font-weight:bold;">${esc(f.social)}</a>`);
  const linkRow = linkBits.length
    ? `<div style="font-size:13px;line-height:1.7;">${linkBits.join('<span style="color:' + FOG + ';">&nbsp;|&nbsp;</span>')}</div>`
    : "";

  const nameBlock = `<div style="font-size:20px;font-weight:bold;color:${accent};line-height:1.1;">${esc(f.name)}</div>` +
    (f.title ? `<div style="font-size:13px;color:${STEEL};padding:3px 0 2px;">${esc(f.title)}</div>` : "");

  const iconPx = ICON_PX[f.logoSize] ?? ICON_PX.m;
  const wordPx = WORD_PX[f.logoSize] ?? WORD_PX.m;
  const showIcon = f.logo === "icon" || f.logo === "both";
  const showWordmark = f.logo === "wordmark" || f.logo === "both";

  const wordmarkBlock = showWordmark ? `<div style="padding-top:13px;"><img src="${WORDMARK}" alt="GlassFire" height="${wordPx}" style="display:block;border:0;height:${wordPx}px;width:auto;" /></div>` : "";
  const details = `${nameBlock}${contactRow}${linkRow}${wordmarkBlock}`;

  if (showIcon) {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};color:${INK};border-collapse:collapse;">
  <tr>
    <td style="padding:0 18px 0 0;border-right:2px solid ${GLASS};vertical-align:middle;">
      <img src="${ICON}" alt="GlassFire" width="${iconPx}" style="display:block;border:0;width:${iconPx}px;height:auto;" />
    </td>
    <td style="padding:0 0 0 18px;vertical-align:middle;">${details}</td>
  </tr>
</table>`;
  }
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};color:${INK};border-collapse:collapse;">
  <tr><td style="vertical-align:top;">${details}</td></tr>
</table>`;
}

export function signaturePlainText(f: SignatureFields): string {
  return [
    f.name,
    f.title,
    [f.phone && `Mobile ${f.phone}`, f.email && `Email ${f.email}`].filter(Boolean).join("   "),
    [f.website, f.social].filter(Boolean).join(" | "),
  ].filter(Boolean).join("\n");
}
