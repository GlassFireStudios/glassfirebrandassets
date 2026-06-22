const { useState, useEffect } = React;

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const open = () => setModalOpen(true);
  const close = () => setModalOpen(false);

  return (
    <>
      <Header scrolled={scrolled} onCtaClick={open}/>
      <Hero onCtaClick={open}/>
      <TrustedBy/>
      <ServicesGrid/>
      <Manifesto/>
      <CaseStudies/>
      <TeamGrid/>
      <CtaRibbon onCtaClick={open}/>
      <Footer/>
      <ContactModal open={modalOpen} onClose={close}/>
    </>
  );
}

const _gfRoot = typeof document !== 'undefined' && document.getElementById('root');
if (_gfRoot) ReactDOM.createRoot(_gfRoot).render(<App/>);
