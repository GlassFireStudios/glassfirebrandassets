function Manifesto() {
  return (
    <section className="section" style={{
      background: '#000',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Clarity Meets Spark</div>
          <h2 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase',
            fontSize: 'clamp(40px, 4.5vw, 64px)', lineHeight: 0.94, letterSpacing: '-0.02em' }}>
            The technical<br/>and the human.
          </h2>
        </div>
        <div style={{ color: '#E6E6E8', fontSize: 18, lineHeight: 1.6, maxWidth: 720 }}>
          <p style={{ marginTop: 0 }}>
            Our name reflects the balance at the core of our work: the clarity and precision
            of glass combined with the raw spark and emotion of fire.
          </p>
          <p>
            We bring rigorous technical expertise, the sharp focus of a lens, the polish of detail,
            and the composure to perform under pressure. We match that with an instinct for
            storytelling — bold narratives, vibrant emotion, and creative ignition forging genuine
            connection.
          </p>
          <p style={{ fontWeight: 600, color: '#fff' }}>
            We hold both sides of the craft: <span className="gf-text-glass">the clean</span> and <span className="gf-text-fire">the raw</span>,
            the frame and the flame.
          </p>
        </div>
      </div>
    </section>
  );
}

function TeamGrid() {
  const team = [
    { name: 'Nate Glass',        pronouns: 'he/him',    role: 'Founder, Producer, Cinematographer' },
    { name: 'Laura MacFie Glass',pronouns: 'she/her',   role: 'Executive Producer' },
    { name: 'Zaq Brewer',        pronouns: 'they/she',  role: 'Creative Director' },
    { name: 'Hannah Keener',     pronouns: 'she/her',   role: 'Senior Producer' },
    { name: 'Brinson Langley',   pronouns: 'he/him',    role: 'Technical Producer' },
    { name: 'Dan MacFie',        pronouns: 'he/him',    role: 'Production Technician' },
  ];
  return (
    <section id="about" className="section" style={{ background: '#000' }}>
      <div className="container">
        <div className="eyebrow glass" style={{ marginBottom: 16 }}>Our Team</div>
        <h2 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase',
            fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.02em', marginBottom: 56 }}>
          Six humans.<br/>One craft.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {team.map(p => (
            <article key={p.name} style={{
              background: '#0A0A0C', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ aspectRatio: '4 / 5', background: '#1A1A1F', position: 'relative' }}>
                <image-slot id={`team-${p.name.split(' ')[0].toLowerCase()}`} placeholder={`${p.name} portrait`} style={{ width: '100%', height: '100%' }}></image-slot>
              </div>
              <div style={{ padding: '20px 22px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', fontSize: 20, letterSpacing: '-0.005em' }}>{p.name}</h3>
                  <span style={{ fontSize: 11, color: '#6E6E76', fontWeight: 500 }}>({p.pronouns})</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#B8B8BE', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{p.role}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Manifesto = Manifesto;
window.TeamGrid = TeamGrid;
