import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlassFire Logo Studio",
  description: "Internal tool for client logo intake, variants, and grids.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-fire to-glass" />
              GlassFire Logo Studio
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-400">
              <Link href="/intake" className="hover:text-white">Intake</Link>
              <Link href="/grid" className="hover:text-white">Grid</Link>
              <Link href="/carousel" className="hover:text-white">Carousel</Link>
              <Link href="/embeds" className="hover:text-white">Embeds</Link>
              <Link href="/manage" className="hover:text-white">Manage</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
