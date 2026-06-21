"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-fire to-glass" />
          GlassFire Logo Studio
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-400">
          <Link href="/intake" className="hover:text-white">Intake</Link>
          <Link href="/grid" className="hover:text-white">Grid</Link>
          <Link href="/carousel" className="hover:text-white">Carousel</Link>
          <Link href="/embeds" className="hover:text-white">Embeds</Link>
          <Link href="/testimonials" className="hover:text-white">Testimonials</Link>
          <Link href="/manage" className="hover:text-white">Manage</Link>
          <span
            title={cdn.custom ? "Embed images served from your custom CDN (Bunny)" : "Embed images served from the default jsDelivr CDN. Set NEXT_PUBLIC_CDN_BASE to use your own domain."}
            className={`hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs sm:inline-flex ${cdn.custom ? "border-glass/40 text-glass" : "border-zinc-700 text-zinc-500"}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cdn.custom ? "bg-glass" : "bg-zinc-500"}`} />
            CDN: {cdn.text}
          </span>
        </nav>
      </div>
    </header>
  );
}
