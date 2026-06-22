function Marquee({ children, dir = 'left', speed = 28 }) {
  const items = Array.isArray(children) ? children : [children];
  // Duplicate for seamless scroll
  const doubled = [...items, ...items];
  return (
    <div className="marquee" style={{ direction: dir === 'right' ? 'rtl' : 'ltr' }}>
      <div className="marquee-track" style={{ animationDuration: `${speed}s`, direction: 'ltr' }}>
        {doubled.map((c, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 64 }}>{c}</div>)}
      </div>
    </div>
  );
}

function Hero({ onCtaClick }) {
  return (
    <section id="top" style={{
      position: 'relative', minHeight: '100vh',
      background: 'radial-gradient(ellipse at 70% 30%, rgba(238,39,80,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(0,168,228,0.14) 0%, transparent 55%), #000',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '160px 64px 64px',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 32 }}>Full-Service Production</div>
        <h1 style={{
          margin: 0, fontWeight: 800, textTransform: 'uppercase',
          fontSize: 'clamp(56px, 9vw, 168px)', lineHeight: 0.92, letterSpacing: '-0.025em',
        }}>
          CRAFTING<br/>
          VISUAL<br/>
          EXPERIENCES<br/>
          <span className="gf-text-spark">THAT INSPIRE</span>
        </h1>
        <p style={{
          marginTop: 40, maxWidth: 620, fontSize: 20, lineHeight: 1.45,
          color: '#B8B8BE', fontWeight: 400,
        }}>
          At GlassFire, we craft cinematic content and brand storytelling that ignites emotion
          and drives action. From commercials to live broadcasts, we turn bold ideas into
          unforgettable visual experiences.
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button className="gf-btn gf-btn-fire" onClick={onCtaClick}>Start a Project
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <a className="gf-btn gf-btn-ghost" href="#work">View Our Work</a>
        </div>
      </div>

      <div style={{ marginTop: 64, opacity: 0.9 }}>
        <Marquee speed={32}>
          {[1, 2, 3, 4].map(i => (
            <span key={i} className="marquee-item">
              LET'S TALK!
              <span className="marquee-star">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.39 7.36H22l-6.18 4.49L18.18 19 12 14.51 5.82 19l2.36-7.15L2 7.36h7.61L12 0z"/></svg>
              </span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

window.Hero = Hero;
window.Marquee = Marquee;
