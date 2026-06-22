function CaseStudyCard({ study, large }) {
  return (
    <article style={{
      gridColumn: large ? 'span 2' : 'span 1',
      background: '#0A0A0C', borderRadius: 8, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      border: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer', transition: 'transform 280ms var(--ease-cinema)',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ position: 'relative', aspectRatio: large ? '16 / 9' : '4 / 3', background: '#1A1A1F' }}>
        <image-slot id={`case-${study.id}`} placeholder={study.placeholder || study.client + " hero still"} style={{ width: '100%', height: '100%' }}></image-slot>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)',
        }}/>
        <div style={{ position: 'absolute', top: 16, left: 16,
          padding: '6px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          background: 'rgba(238,39,80,0.18)', color: '#EE2750', backdropFilter: 'blur(8px)',
        }}>Case Study</div>
      </div>
      <div style={{ padding: '24px 26px 26px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h3 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', fontSize: large ? 32 : 22, lineHeight: 1.0, letterSpacing: '-0.01em' }}>
          {study.client}
        </h3>
        <div className="eyebrow muted" style={{ fontSize: 10, letterSpacing: '0.18em' }}>{study.tags.join(' · ')}</div>
        {large && <p style={{ margin: '6px 0 0', color: '#B8B8BE', fontSize: 15, lineHeight: 1.55 }}>{study.summary}</p>}
        <a style={{
          marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
          fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff',
        }}>Read case
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
    </article>
  );
}

function CaseStudies() {
  const studies = [
    { id: 'volvo', client: 'Volvo Trucks',
      tags: ['Live Streaming', 'Virtual Engagement', 'Event AV'],
      summary: "Since 2023, GlassFire has partnered with Volvo Trucks to deliver virtual conferences, live stakeholder meetings, and large-scale product launches — on-site, in studio, and fully virtual.",
      placeholder: 'Volvo Trucks broadcast still' },
    { id: 'walton', client: 'Walton Family Foundation',
      tags: ['On-Location Film', 'Editing'],
      placeholder: 'Heartland Summit documentary still' },
    { id: 'replacements', client: 'Replacements, Ltd.',
      tags: ['Concepting', 'Production', 'Editing'],
      placeholder: 'Replacements commercial still' },
    { id: 'ineos', client: 'INEOS Grenadier',
      tags: ['Brand Storytelling', 'Automotive'],
      placeholder: 'INEOS Grenadier hangar still' },
    { id: 'ladder', client: 'Ladder Cares',
      tags: ['Commercial', 'Creative Direction'],
      placeholder: 'Ladder Fitness warehouse spot' },
  ];

  return (
    <section id="work" className="section" style={{ background: '#000' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <div>
            <div className="eyebrow glass" style={{ marginBottom: 16 }}>Selected Work</div>
            <h2 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase',
              fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.02em' }}>
              On message,<br/>on budget,<br/>built to perform.
            </h2>
          </div>
          <a className="gf-btn gf-btn-ghost" href="#work-all">All Case Studies
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <CaseStudyCard study={studies[0]} large />
          <CaseStudyCard study={studies[1]} />
          <CaseStudyCard study={studies[2]} />
          <CaseStudyCard study={studies[3]} />
          <CaseStudyCard study={studies[4]} />
          <CaseStudyCard study={{ id: 'more', client: '+ More', tags: ['View all 40+ projects'], placeholder: '' }} />
        </div>
      </div>
    </section>
  );
}

window.CaseStudyCard = CaseStudyCard;
window.CaseStudies = CaseStudies;
