# OSTRELYA — Editorial / Magazine Visual Overhaul

**Date:** 2026-08-25
**Scope:** Visual overhaul (keep section order + content, rework visual language)
**Direction:** Editorial / Magazine design aesthetic

---

## Design Principles

1. **Asymmetric composition** — Break centered layouts. Off-center alignment, mixed column widths, elements bleeding past grid boundaries.
2. **Typography as hero** — Oversized type (20vw+ display sizes), aggressive serif/sans contrast, type used as texture.
3. **Rhythm variation** — Dense sections next to airy ones. Not everything the same padding.
4. **Magazine folios** — Page numbers, section markers ("01 / 05", "FIG. 01").
5. **Pull quotes as design elements** — Key phrases become visual anchors.
6. **Grid breaks** — Elements intentionally crossing column boundaries.

---

## Section-by-Section Changes

### HERO
- Asymmetric split: giant *"work."* in serif italic at ~60-70vw, off-center
- Meta stats (10 days, 100%, 0 lock-in) move to right sidebar column
- CTAs offset to bottom-left
- Add folio number ("01") in corner
- Keep: shader, badge, split-text animation, watermark

### SERVICES (keep pinned horizontal)
- Cards: giant outline serif numbers (01/02/03) as full-card background watermark at ~15% opacity
- Kicker text (BUILD/KEEP/GROW) becomes vertical label on left edge
- Content shifts right with more generous whitespace
- "Skip the reading" card becomes pull-quote style: oversized italic text
- Add folio marker: "SERVICES — 01/03"

### WORK (keep pinned horizontal)
- Replace browser-mockup wireframes with abstract color compositions:
  - V01 warm editorial: ember-to-gold gradient
  - B01 swiss brutalist: geometric blocks, sharp angles
  - V16 dark OLED: deep purple-to-black with ember accent
  - V13 glass UI: blue-to-white frosted gradient
- Add "FIG. 01" labels like magazine figure captions
- Hover: composition shifts/expands, caption slides up

### PROCESS (keep pinned horizontal)
- Giant outline numbers bleed to card edges (already partially there)
- Add connecting horizontal progress line between cards that fills on scroll
- "CHAPTER ONE" / "CHAPTER TWO" labels

### STATS (gold band)
- Break 4-column grid: first stat takes ~40% width (giant number), other three stacked right
- Asymmetric spread layout

### PRICING
- Featured row: thick gold left border (3px), "EDITOR'S PICK" label
- Larger serif italic numbers
- Subtle row hover background shift

### TESTIMONIAL
- Remove quotation mark decoration entirely
- Giant serif italic pull-quote spanning full width
- Clean, editorial. Attribution in mono, left-aligned below

### CONTACT
- "Let's build your website" becomes massive display heading (~8vw+)
- Form loses card border — minimal line separators only
- Clean, publication-style layout

### FOOTER
- Add "COLOPHON" section (magazine credits/tech stack)
- Email stays as centerpiece, gets larger
- Clean minimal legal bar

---

## Technical Scope

### HTML Changes (minimal)
- Add folio/marker elements to sections
- Re-wrap some content for asymmetric grids
- Add FIG labels to work cards
- Add "EDITOR'S PICK" label to pricing
- Add COLOPHON section to footer

### CSS Changes (heavy)
- New custom properties: `--display-xl`, `--display-2xl`, editorial spacing tokens
- Asymmetric grid utilities
- Oversized type scale (clamp-based, up to 20vw)
- Editorial card styles with background watermark numbers
- Folio/running head styles
- Pull-quote styles
- Vertical kicker text styles
- Abstract composition backgrounds for work cards
- Updated responsive breakpoints for asymmetric layouts
- Stats asymmetric grid
- Minimal form styling (no card border)

### JS Changes (light)
- Update cursor labels for new interactive elements
- Add parallax to oversized display type elements
- Keep all existing: GSAP, ScrollTrigger, pinned strips, cursor, magnetic, shader, loader

---

## What Stays the Same
- WebGL shader background
- Custom cursor with label states
- GSAP pinned horizontal strips
- Magnetic buttons
- Split-text hero animation
- Marquee strips
- Loader sequence
- Netlify form
- All content/copy
- Mobile menu
- Scroll progress bar

---

## Implementation Order
1. CSS custom properties + typography scale
2. Hero asymmetric layout
3. Services card redesign
4. Work card compositions + FIG labels
5. Process chapter labels + progress line
6. Stats asymmetric grid
7. Pricing editorial treatment
8. Testimonial pull-quote
9. Contact massive heading + minimal form
10. Footer colophon
11. Responsive adjustments
12. JS parallax additions
