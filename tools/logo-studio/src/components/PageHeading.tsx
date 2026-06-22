// Consistent page title block: a fire eyebrow, the uppercase display title, and
// an optional subtitle — used across the studio for a cohesive branded header.
export default function PageHeading({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5">
        {eyebrow && <p className="gf-eyebrow">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {sub && <p className="max-w-2xl text-sm text-fog">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
