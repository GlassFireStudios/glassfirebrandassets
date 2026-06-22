"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cdnUrl } from "@/lib/embed";

const LOGO = cdnUrl("GlassFireStudios/glassfirebrandassets", "main", "Logos/Variant White/GlassFire Logo White.png");

const NAV = [
  { href: "/intake", label: "Intake" },
  { href: "/grid", label: "Grid" },
  { href: "/carousel", label: "Carousel" },
  { href: "/embeds", label: "Embeds" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/brand", label: "Brand" },
  { href: "/manage", label: "Manage" },
];

function cdnLabel(): { text: string; custom: boolean } {
  const base = process.env.NEXT_PUBLIC_CDN_BASE;
  if (!base) return { text: "jsDelivr", custom: false };
  try { return { text: new URL(base).host, custom: true }; } catch { return { text: "jsDelivr", custom: false }; }
}

// App chrome for the internal tool. Hidden on the public testimonial capture
// pages (/r/*) so clients see a clean, unbranded-with-tooling form.
export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/r/")) return null;
  const cdn = cdnLabel();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="GlassFire" className="h-6 w-auto" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-fog sm:inline">Brand Studio</span>
        </Link>
        <nav className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`transition-colors hover:text-white ${active ? "text-white" : ""}`}>{n.label}</Link>
            );
          })}
          <span
            title={cdn.custom ? "Embed images served from your custom CDN (Bunny)" : "Embed images served from the default jsDelivr CDN. Set NEXT_PUBLIC_CDN_BASE to use your own domain."}
            className={`hidden items-center gap-1.5 rounded-sm border px-2 py-0.5 normal-case tracking-normal lg:inline-flex ${cdn.custom ? "border-glass/40 text-glass" : "border-white/15 text-steel"}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cdn.custom ? "bg-glass" : "bg-steel"}`} />
            {cdn.text}
          </span>
        </nav>
      </div>
    </header>
  );
}
