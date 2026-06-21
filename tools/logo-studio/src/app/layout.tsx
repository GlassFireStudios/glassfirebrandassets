import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlassFire Logo Studio",
  description: "Internal tool for client logo intake, variants, and grids.",
};

function cdnLabel(): { text: string; custom: boolean } {
  const base = process.env.NEXT_PUBLIC_CDN_BASE;
  if (!base) return { text: "jsDelivr", custom: false };
  try { return { text: new URL(base).host, custom: true }; } catch { return { text: "jsDelivr", custom: false }; }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cdn = cdnLabel();
  return (
    <html lang="en">
      <body>
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
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
