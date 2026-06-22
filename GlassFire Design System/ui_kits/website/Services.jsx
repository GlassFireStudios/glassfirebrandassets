function TrustedBy() {
  // Real clients from the capabilities deck
  const clients = ['VOLVO', 'WALTON FAMILY FDN.', 'INEOS', 'REPLACEMENTS, LTD.', 'LADDER', 'TFCU', 'CARGILL', 'CISCO'];
  return (
    <section className="section-tight" style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container">
        <div className="eyebrow muted" style={{ textAlign: 'center', marginBottom: 24 }}>Trusted By</div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
          gap: '32px 72px',
        }}>
          {clients.map(c => (
            <span key={c} style={{
              fontWeight: 700, fontSize: 18, letterSpacing: '0.18em', color: '#6E6E76',
              transition: 'color 240ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#6E6E76'}
            >{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesGrid() {
  const services = [
    {
      key: 'cinematic',
      eyebrow: '01',
      title: ['Cinematic', 'Video', 'Production'],
      body: 'Story-first commercials, branded films, and original campaigns — handled from pitch to post.',
      tags: ['Commercial', 'Interview', 'XR Volume', 'Music Video'],
      accent: 'fire',
    },
    {
      key: 'live',
      eyebrow: '02',
      title: ['Live Stream', '& Event', 'Production'],
      body: 'High-production-value broadcasts with expert AV support, showcalling, and remote connectivity.',
      tags: ['Conference', 'Concert', 'News Studio', 'Product Launch'],
      accent: 'glass',
    },
    {
      key: 'post',
      eyebrow: '03',
      title: ['Post', 'Production', '& Editing'],
      body: 'Editing, color grading in DaVinci Resolve, sound mix, and platform-optimized social cutdowns.',
      tags: ['Editing', 'Color', 'Sound Mix', 'Social Cutdowns'],
      accent: 'fire',
    },
  ];

  return (
    <section id="services" className="section">
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 16 }}>Core Services</div>
        <h2 style={{
          margin: 0, fontWeight: 800, textTransform: 'uppercase',
          fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.02em',
          maxWidth: 900,
        }}>
          We hold both sides<br/>of the craft —<br/>
          <span className="gf-text-fire">the frame</span> and <span className="gf-text-glass">the flame</span>.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 64 }}>
          {services.map(s => (
            <article key={s.key} style={{
              background: '#0A0A0C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16,
              minHeight: 380, transition: 'border-color 240ms, transform 240ms',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.accent === 'fire' ? 'rgba(238,39,80,0.6)' : 'rgba(0,168,228,0.6)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: s.accent === 'fire' ? '#EE2750' : '#00A8E4',
                letterSpacing: '0.12em',
              }}>{s.eyebrow} / 03</div>
              <h3 style={{
                margin: 0, fontWeight: 800, textTransform: 'uppercase',
                fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.01em', flex: 1,
              }}>
                {s.title.map((line, i) => <div key={i}>{line}</div>)}
              </h3>
              <p style={{ margin: 0, color: '#B8B8BE', fontSize: 14, lineHeight: 1.55 }}>{s.body}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {s.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '6px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)',
                    color: '#E6E6E8',
                  }}>{t}</span>
                ))}
              </div>
              <a href={`#${s.key}`} style={{
                marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 8,
                fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: s.accent === 'fire' ? '#EE2750' : '#00A8E4',
              }}>
                Learn more
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.TrustedBy = TrustedBy;
window.ServicesGrid = ServicesGrid;
