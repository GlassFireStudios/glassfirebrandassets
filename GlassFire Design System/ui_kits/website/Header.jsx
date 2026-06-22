const { useState, useEffect } = React;

function Header({ scrolled, onCtaClick }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '20px 40px',
      background: scrolled ? 'rgba(0,0,0,0.78)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'background 220ms var(--ease-out), border-color 220ms, padding 220ms',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto',
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="../../assets/logos/Logo Color.png" alt="GlassFire" style={{ height: 30, width: 'auto' }}/>
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {['Work', 'Services', 'Studio', 'About', 'Journal'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
               style={{
                 fontWeight: 600, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.14em',
                 color: '#fff', transition: 'color 200ms',
               }}
               onMouseEnter={e => e.currentTarget.style.color = '#EE2750'}
               onMouseLeave={e => e.currentTarget.style.color = '#fff'}
            >{item}</a>
          ))}
          <button className="gf-btn gf-btn-fire" onClick={onCtaClick}>Let's Talk!</button>
        </nav>
      </div>
    </header>
  );
}

window.Header = Header;
