import Link from "next/link";

const tools = [
  { href: "/intake", hover: "hover:border-glass", title: "Logo Intake", body: "Search Brandfetch / Clearbit / the web or upload a file. Remove the background, generate color / white / black variants & sizes, tag alt text, publish." },
  { href: "/grid", hover: "hover:border-fire", title: "Grid Builder", body: "Pick client logos, auto-optimize the layout, and export a transparent PNG or flattened JPEG — or a live HTML grid." },
  { href: "/carousel", hover: "hover:border-glass", title: "Carousel Builder", body: "Build an auto-scrolling “Trusted By” strip with hover styles and multiple rows. Live or static embed." },
  { href: "/embeds", hover: "hover:border-fire", title: "Saved Embeds", body: "Manage every live carousel, grid & testimonial. Edit and re-save and sites update automatically." },
  { href: "/testimonials", hover: "hover:border-glass", title: "Testimonials", body: "Send capture links, moderate submissions, and export testimonial walls for web or slide-ready cards for decks." },
  { href: "/manage", hover: "hover:border-fire", title: "Manage", body: "Review every client’s variants, backfill missing white/black, and remove logos." },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Brand Studio</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          The home for GlassFire client brand assets — intake logos, build
          embeddable carousels &amp; grids, capture testimonials, and ship
          SEO-tagged, CDN-served exports straight from the brand-assets repo.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className={`rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition ${t.hover}`}>
            <h2 className="text-lg font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
