# GlassFire Website UI Kit

A high-fidelity recreation of the GlassFire marketing website (www.glassfire.co), built from the brand's design system (`../../colors_and_type.css`) and the voice + content drawn from the Capabilities Deck.

## Components

| File | Component | Used for |
|---|---|---|
| `Header.jsx` | Site header w/ transparent-over-hero behavior | Top of every page |
| `Hero.jsx` | Full-bleed black hero with stacked gradient headline + marquee tagline | Home / landing |
| `MarqueeRow.jsx` | Infinite-scrolling "LET'S TALK!" or trusted-by row | Hero foot, CTA section |
| `ServicesGrid.jsx` | Three core-services tiles (Cinematic / Live / Post) | Home, services index |
| `CaseStudyCard.jsx` | Single case-study card (Volvo, Walton, Ineos, Ladder, Replacements) | Work index, home |
| `CaseStudyShowcase.jsx` | Editorial 2-up of the latest case study | Home |
| `TeamGrid.jsx` | Six-person team grid w/ pronouns + role | About |
| `CtaRibbon.jsx` | Full-width black call-to-action with fire gradient headline | Bottom of every page |
| `Footer.jsx` | Contact strip, locations, socials | All pages |

## Click-thru behavior

`index.html` loads all components into a single scrolling homepage. The "LET'S TALK!" buttons and the contact form in the CTA ribbon trigger a small modal flow that fakes a contact submission. Navigation items in the header smooth-scroll to each section.

## Caveats

- We did not have access to the live glassfire.co source code or Figma. Visual fidelity is derived from the **Capabilities Deck PDF** (which mirrors the website's voice and motifs) and the brand's confirmed color + logo + font system.
- Photography placeholders use `<image-slot>` from the starter set; drop real production stills into the slots.
- The full site has more service detail pages, a studio/rentals page, and a contact page; those are out of scope for this kit. The kit covers the homepage and the major reusable section primitives that compose every other page.
