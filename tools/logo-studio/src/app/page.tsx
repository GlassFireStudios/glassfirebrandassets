import Link from "next/link";

const tools = [
  { href: "/intake", hover: "hover:border-glass", title: "Logo Intake", body: "Search Brandfetch / Clearbit / the web or upload a file. Remove the background, generate color / white / black variants & sizes, tag alt text, publish." },
  { href: "/grid", hover: "hover:border-fire", title: "Grid Builder", body: "Pick client logos, auto-optimize the layout, and export a transparent PNG or flattened JPEG — or a live HTML grid." },
  { href: "/carousel", hover: "hover:border-glass", title: "Carousel Builder", body: "Build an auto-scrolling “Trusted By” strip with hover styles and multiple rows. Live or static embed." },
  { href: "/embeds", hover: "hover:border-fire", title: "Saved Embeds", body: "Manage every live carousel, grid & testimonial. Edit and re-save and sites update automatically." },
  { href: "/testimonials", hover: "hover:border-glass", title: "Testimonials", body: "Send capture links, moderate submissions, and export testimonial walls for web or slide-ready cards for decks." },
  { href: "/brand", hover: "hover:border-fire", title: "Brand Guide", body: "The GlassFire design system — logos, colors, and backgrounds with usage guidance, all downloadable." },
  { href: "/signature", hover: "hover:border-glass", title: "Email Signature", body: "Build a Gmail-ready HTML signature with the GlassFire logo and brand colors — copy &amp; paste." },
  { href: "/machines", hover: "hover:border-fire", title: "Machine Tracker", body: "A presence board for the editing workstations — share a public link so the team sees who's on which machine." },
  { href: "/manage", hover: "hover:border-glass", title: "Manage", body: "Review every client’s variants, backfill missing white/black, and remove logos." },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="gf-eyebrow">GlassFire</p>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Brand <span className="gf-text-spark">Studio</span></h1>
        <p className="mt-2 max-w-2xl text-fog">
          The home for GlassFire client brand assets — intake logos, build
          embeddable carousels &amp; grids, capture testimonials, and ship
          SEO-tagged, CDN-served exports straight from the brand-assets repo.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="gf-card gf-card-hover block p-6">
            <h2 className="text-base font-bold uppercase tracking-wide">{t.title}</h2>
            <p className="mt-1.5 text-sm text-fog">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
