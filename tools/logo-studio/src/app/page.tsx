import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Logo Studio</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Land a client, drop in their logo, and get consistent, SEO-tagged
          color / white / black variants committed straight into the brand-assets
          repo — then build an optimized &ldquo;Trusted By&rdquo; grid in one click.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/intake"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-glass"
        >
          <h2 className="text-lg font-semibold">1 · Logo Intake</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Search Brandfetch / Clearbit / the web, or upload a file. Remove the
            background, generate variants &amp; sizes, tag alt text, publish.
          </p>
        </Link>
        <Link
          href="/grid"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-fire"
        >
          <h2 className="text-lg font-semibold">2 · Grid Builder</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pick which client logos to include, auto-optimize the layout, and
            export a transparent PNG or a flattened JPEG.
          </p>
        </Link>
      </div>
    </div>
  );
}
