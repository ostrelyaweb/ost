# OSTRELYA Website Redesign Plan

## Goal
Create a new OSTRELYA website inspired by dock.hr's clean, professional web studio aesthetic while maintaining OSTRELYA's dark theme identity.

---

## Design System

### Color Palette (Purple + Black + Off-White)
```
--bg-primary: #0a0a0f        (main background - deep black)
--bg-secondary: #111118      (alternating sections)
--bg-card: #16161f           (card backgrounds)
--text-primary: #f5f5f7      (main text - off-white)
--text-muted: #8a8a95        (labels, secondary text)
--accent-purple: #514dfd     (primary accent - from logo)
--accent-purple-light: #7a78ff (hover/lighter shade)
--accent-purple-glow: rgba(81, 77, 253, 0.15) (subtle glow)
--border-subtle: rgba(245, 245, 247, 0.06)
--border-medium: rgba(245, 245, 247, 0.12)
--shadow-card: rgba(0, 0, 0, 0.5) 0px 10px 30px -10px
```

### Typography Scale (Space Grotesk Only)
```
--font-display: "Space Grotesk", system-ui, sans-serif
--font-body: "Space Grotesk", system-ui, sans-serif
--font-mono: "Space Grotesk", ui-monospace, monospace

--text-hero: clamp(3.5rem, 10vw, 6rem)    (hero display)
--text-display: clamp(2.5rem, 6vw, 4rem)   (section headings)
--text-xl: clamp(1.75rem, 4vw, 2.5rem)     (subheadings)
--text-lg: 1.25rem                          (card titles)
--text-base: 1rem                           (body text)
--text-sm: 0.8125rem                        (13px - nav, labels)
--text-xs: 0.6875rem                        (11px - small labels)
```

### Spacing System
```
--space-xs: 0.5rem
--space-sm: 1rem
--space-md: 1.5rem
--space-lg: 2.5rem
--space-xl: 4rem
--space-2xl: 6rem
--space-3xl: 8rem
```

### Border Radius
```
--radius-sm: 8px
--radius-md: 16px
--radius-lg: 24px
--radius-xl: 32px
--radius-pill: 999px
```

---

## Section-by-Section Design

### 1. Hero Section
**Layout**: Clean left-aligned, single column
**Content**:
- Small label: "WEB STUDIO — EST. 2026" (11px, uppercase, muted)
- Display heading: "Websites that work." (6rem, weight 600)
  - "work." in accent purple (#514dfd)
- Subheading: "Modern, mobile-first websites for small businesses" (1.25rem, muted)
- Country list: HR · BA · RS · EU · CA · US (small caps)
- Stats row: ~10 DAYS | 100% YOURS | 0 LOCK-IN
- CTA buttons: "START A PROJECT" (pill, solid purple) + "SEE THE METHOD" (pill, outline)

**Remove**: Folio number, watermark, orb background, rotating badge

### 2. Marquee Banner
**Keep existing** but simplify:
- Remove decorative elements (✦)
- Clean text-only scrolling
- Purple text on dark background

### 3. Services Section
**Layout**: 3-column grid on desktop, stack on mobile
**Cards**:
- Border-radius: 24px
- Background: #16161f
- Subtle border: 1px solid rgba(245, 245, 247, 0.06)
- Content:
  - Small label: "BUILD" / "KEEP" / "GROW" (11px, uppercase, purple)
  - Title: "Your website" (1.25rem, weight 600)
  - Description: Clean paragraph text
  - List: 3 bullet points (11px, uppercase, muted)
  - CTA: "START HERE →" (13px, purple, weight 500)

**Remove**: Watermark numbers, index labels, pull-quote card

### 4. Work Section
**Layout**: Horizontal scroll (keep pinned mechanism)
**Cards**:
- Border-radius: 24px
- Background: Gradient compositions (keep current approach)
- Content overlay at bottom:
  - Tag: "V01 — WARM EDITORIAL" (11px, uppercase, muted)
  - Title: "Boutique hotel & spa" (1.25rem, weight 600)
  - CTA: "VIEW CONCEPT →" (13px, purple)

**Remove**: FIG labels, index numbers

### 5. Process Section
**Layout**: 4-column grid on desktop, stack on mobile
**Cards**:
- Border-radius: 24px
- Background: #16161f
- Content:
  - Number: "01" (2.5rem, weight 600, purple)
  - Day range: "DAY 0–1" (11px, uppercase, muted)
  - Title: "Kickoff" (1.25rem, weight 600)
  - Description: Clean paragraph

**Remove**: Chapter labels, progress line

### 6. Stats Section
**Layout**: 4-column grid (definition list structure like dock.hr)
**Structure** (per stat):
```html
<dl class="stat">
  <dd class="stat-value">10</dd>
  <dt class="stat-label">DAYS TO LAUNCH</dt>
</dl>
```
**Styles**:
- Value: 2.5rem, weight 600
- Label: 11px, uppercase, muted, weight 500
- Clean, understated design

### 7. Pricing Section
**Layout**: 3-column grid on desktop
**Cards**:
- Border-radius: 24px
- Background: #16161f
- Featured card: Slightly elevated with purple border
- Content:
  - Label: "WEBSITE BUILD" (11px, uppercase, muted)
  - Amount: "€600–1,200" (2.5rem, weight 600)
  - Alt currencies: Smaller, muted text
  - Features: 3 bullet points (11px, uppercase)
- CTA: "REQUEST QUOTE →" (13px, purple)

### 8. Testimonial Section
**Layout**: Single column, centered
**Content**:
- Large quote: "We finally have a website we're proud to send people to" (2rem, italic)
- Attribution: "— SMALL-BUSINESS OWNER · CLIENT 004" (11px, uppercase, muted)
- Clean, minimal design

### 9. Contact Section
**Layout**: Split - intro left, form right
**Left side**:
- Label: "05 — START HERE" (11px, uppercase, muted)
- Heading: "Let's build your website." (3.5rem, weight 600)
- Subtext: Clean paragraph
- Email: "hello@ostrelya.com" (large, purple)

**Right side (form)**:
- Clean, minimal fields
- Underline-only styling (no card border)
- Labels: 11px, uppercase, muted
- Inputs: Clean, minimal, purple focus state
- Submit button: Pill-shaped, solid purple

### 10. Footer
**Layout**: Minimal, clean
**Content**:
- Large email: "hello@ostrelya.com" (3rem, weight 600)
- Meta: "HR · BA · RS · EU · CA · US / RESPONSE < 24H"
- Nav links: Clean, minimal
- Colophon: "© 2026 OSTRELYA™ WEB STUDIO. ALL RIGHTS RESERVED."

---

## Key Design Principles (from dock.hr)

1. **Simplicity over complexity** - Remove editorial clutter
2. **Clean typography hierarchy** - Large headings, small labels
3. **Soft, rounded cards** - 24px border-radius, subtle shadows
4. **Understated stats** - Small labels, definition list structure
5. **Pill-shaped buttons** - 999px radius, subtle shadows
6. **Minimal navigation** - Clean, 13px text
7. **Generous spacing** - Let content breathe
8. **Professional polish** - Every detail refined
9. **Purple accent** - Consistent use of #514dfd from logo

---

## Files to Modify

1. **css/styles.css** - Complete redesign
2. **index.html** - Simplify structure, remove editorial elements
3. **js/main.js** - Update interactions (keep GSAP, remove editorial animations)

---

## Implementation Order

1. Create new CSS with design system variables
2. Update HTML structure (remove editorial elements)
3. Style each section bottom-up
4. Add responsive breakpoints
5. Test interactions and animations
6. Final polish and refinement

---

## What to Keep
- WebGL shader background (ambient orbs) - **adjust colors to purple**
- GSAP ScrollTrigger for horizontal sections
- Custom cursor - **adjust colors to purple**
- Marquee banners
- Form functionality
- Mobile menu

## What to Remove
- Editorial watermarks
- Chapter labels
- Folio numbers
- Rotating badge
- Complex card compositions (replace with cleaner gradients)
- Progress line in process section
- Quotation mark decoration in testimonial
