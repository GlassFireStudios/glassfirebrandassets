function CtaRibbon({ onCtaClick }) {
  return (
    <section id="contact" style={{
      background: '#000',
      padding: '120px 64px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(238,39,80,0.22) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}/>
      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase',
          fontSize: 'clamp(64px, 11vw, 200px)', lineHeight: 0.88, letterSpacing: '-0.03em' }}>
          <span className="gf-text-spark">LET'S TALK!</span>
        </h2>
        <p style={{ marginTop: 24, fontSize: 18, color: '#B8B8BE', maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
          Tell us about your project — a commercial, a broadcast, a brand film,
          or something we haven't done yet.
        </p>
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button className="gf-btn gf-btn-fire" onClick={onCtaClick}>Start a Project
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <a className="gf-btn gf-btn-ghost" href="mailto:hello@glassfire.co">hello@glassfire.co</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#000', padding: '64px 64px 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container" style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56,
      }}>
        <div>
          <img src="../../assets/logos/Logo Color.png" alt="GlassFire" style={{ height: 34, width: 'auto', marginBottom: 20 }}/>
          <p style={{ margin: 0, color: '#B8B8BE', fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
            Crafting visual experiences that inspire. Cinematic content, branded films,
            and live broadcasts.
          </p>
        </div>
        <FooterCol title="Studio" links={['Cinematic Video', 'Live & Events', 'Post Production', 'Rentals & Stage']} />
        <FooterCol title="Company" links={['Work', 'Team', 'Journal', 'Careers']} />
        <FooterCol title="Visit" links={['Raleigh', 'Lexington', 'Bentonville', 'hello@glassfire.co']} />
      </div>
      <div className="rule"/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#6E6E76', letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} GlassFire Productions · 919.867.4547
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {['Instagram', 'Vimeo', 'LinkedIn'].map(s => (
            <a key={s} style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B8B8BE',
            }}>{s}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em',
        color: '#6E6E76', marginBottom: 18,
      }}>{title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(l => (
          <li key={l}>
            <a style={{ fontSize: 14, color: '#fff', transition: 'color 200ms' }}
               onMouseEnter={e => e.currentTarget.style.color = '#EE2750'}
               onMouseLeave={e => e.currentTarget.style.color = '#fff'}>{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactModal({ open, onClose }) {
  const [sent, setSent] = React.useState(false);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0A0A0C', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
        maxWidth: 560, width: '100%', padding: 40, position: 'relative',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none',
          color: '#B8B8BE', cursor: 'pointer', padding: 8,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        {!sent ? <>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Start a Project</div>
          <h3 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', fontSize: 36, lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 8 }}>
            Tell us about it.
          </h3>
          <p style={{ color: '#B8B8BE', fontSize: 14, lineHeight: 1.55, marginTop: 4, marginBottom: 24 }}>
            We'll be in touch within one business day.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Your name" required defaultValue=""/>
            <FormField label="Email" required type="email"/>
            <FormField label="Company / brand" wide/>
            <FormField label="What are you making?" wide textarea/>
            <button type="submit" className="gf-btn gf-btn-fire" style={{ gridColumn: '1 / -1', marginTop: 8, justifyContent: 'center' }}>Send
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </form>
        </> : <>
          <div className="eyebrow glass" style={{ marginBottom: 12 }}>Message Received</div>
          <h3 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', fontSize: 36, lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 16 }}>
            <span className="gf-text-glass">We'll be in touch.</span>
          </h3>
          <p style={{ color: '#B8B8BE', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Thanks for reaching out. A producer will reply within one business day.
          </p>
          <button onClick={onClose} className="gf-btn gf-btn-ghost" style={{ marginTop: 24 }}>Close</button>
        </>}
      </div>
    </div>
  );
}

function FormField({ label, type = 'text', wide, textarea, required, defaultValue }) {
  const inputStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 14, color: '#fff',
    background: '#000', border: '1px solid #2A2A30', borderRadius: 4,
    padding: '12px 14px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  return (
    <label style={{
      gridColumn: wide ? '1 / -1' : 'auto',
      display: 'flex', flexDirection: 'column', gap: 6,
      fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B8B8BE',
    }}>
      {label}{required && <span style={{ color: '#EE2750' }}> *</span>}
      {textarea
        ? <textarea required={required} rows={3} style={inputStyle} defaultValue={defaultValue}/>
        : <input required={required} type={type} style={inputStyle} defaultValue={defaultValue}/>
      }
    </label>
  );
}

window.CtaRibbon = CtaRibbon;
window.Footer = Footer;
window.ContactModal = ContactModal;
