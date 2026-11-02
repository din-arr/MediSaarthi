# MediSaarthi Design Direction

## Product intent

MediSaarthi is an educational demo of a pharmacist-led medicine reordering experience for Indian families. The interface should feel like a calm guide: clear enough for elderly parents, efficient enough for busy adult children, and honest about what the demo does and does not support.

## Design principles

1. **Guide, do not overwhelm** — one obvious primary action per section, short supporting copy, and predictable navigation.
2. **Trust through clarity** — keep the educational-demo banner, prescription-review explanations, catalogue disclaimers, and privacy warnings visible and easy to understand.
3. **Readable by default** — body text is at least 17px, contrast is WCAG AA, controls have 44px minimum touch targets, and headings use balanced wrapping.
4. **Quietly premium** — generous 8px-grid spacing, warm white surfaces, soft teal-tinted depth, restrained motion, and no visual noise.
5. **Warm Indian context** — natural-light imagery, a restrained saffron accent, and faint jaali-inspired geometry used as atmosphere rather than decoration.
6. **Progressive disclosure** — show a small featured medicine set first; search, filters, and browsing reveal the full 150-entry dataset without clutter.
7. **Honest affordances** — no implied live inventory, prices, orders, pharmacist approvals, patient-record handling, ratings, or delivery promises.
8. **Accessible motion** — animate opacity and transform only, respect reduced-motion preferences, and never rely on animation to reveal essential content.

## Design tokens

All product UI colours should use these tokens rather than one-off colours.

| Token | Hex | Use |
|---|---|---|
| `primary` | `#0F766E` | Primary actions, links, focus accents |
| `primary-deep` | `#134E4A` | Hover states, dark panels, footer |
| `ink` | `#0B2B26` | Headings and high-emphasis text |
| `body` | `#475569` | Main readable body copy |
| `muted` | `#64748B` | Supporting and metadata text |
| `background` | `#F4FAF8` | Page and soft section backgrounds |
| `surface` | `#FFFFFF` | Cards, fields, panels |
| `border` | `#E3EFEB` | Dividers, card and input borders |
| `saffron` | `#F59E0B` | Reminders and small warm highlights |
| `success` | `#059669` | Positive/status states |
| `warning` | `#D97706` | Rx and caution states |
| `info` | `#0284C7` | Informational states |

Use no more than two accent/status colours in one section. Shadows should be teal-tinted:

```text
soft: 0 8px 30px rgba(19, 78, 74, 0.08)
lift: 0 18px 50px rgba(19, 78, 74, 0.12)
float: 0 20px 60px rgba(19, 78, 74, 0.16)
```

## Typography

- **Display/headings:** Plus Jakarta Sans, weights 700–800, `letter-spacing: -0.02em`, line-height 1.1, `text-wrap: balance`.
- **Body/UI:** Inter, weights 400–600, line-height 1.65.
- **Body target:** `1.0625rem` / 17px for primary explanatory copy.
- **Hero h1:** `clamp(2.5rem, 4vw + 1rem, 4.5rem)`.
- **Section h2:** `clamp(2rem, 2.5vw + 1rem, 3.25rem)`.
- **Card h3:** `1.25rem`.
- **Eyebrow:** 12px, uppercase, 0.16em letter spacing, primary teal.
- Keep paragraphs to approximately 65 characters per line.

## Shape and spacing

- Base spacing unit: 8px.
- Inputs and buttons: 12px radius.
- Cards: 20px radius.
- Large panels and photo frames: 28–32px radius.
- Main container: `max-w-7xl` with `px-5 sm:px-6 lg:px-8`.
- Standard section rhythm: `py-20 md:py-28`.
- Minimum interactive target: 44px by 44px.
- Floating glass cards: white at 80% opacity with backdrop blur; use only for hero overlays.

## Component inventory

- `Container` — max-width and responsive horizontal padding.
- `Section` — vertical rhythm and optional background treatment.
- `Eyebrow` — consistent section label.
- `Button` — primary, secondary, ghost, loading, disabled, hover, active, and focus states.
- `Badge` — Rx, local-rules, status, and informational variants with text plus visual treatment.
- `Card` — shared border, radius, surface, and teal-tinted shadow.
- `IconTile` — Lucide icon inside a soft tinted rounded square.
- `AnnouncementBar` — demo status with info icon.
- `Header` / `MobileMenu` — sticky navigation, scroll shadow, accessible Escape handling.
- `Hero` — headline, CTAs, trust chips, photo, phone mockup, floating cards, jaali atmosphere.
- `TrustStrip` — three principle cards overlapping the hero.
- `MedicineCatalogue` — full-dataset search/filtering with featured-first results and empty state.
- `MedicineCard` — category art, name/strength, Rx badge, details affordance.
- `PrescriptionDropzone` — client-only file validation and preview.
- `ProgressStepper` — Upload → AI draft → Pharmacist review.
- `HowItWorksTimeline` — three connected steps.
- `PharmacistBand` — dark reassurance panel with one CTA.
- `FaqAccordion` — keyboard-friendly expandable answers.
- `FinalCta` — short warm closing statement.
- `Footer` — educational disclaimers and anchor links.
- `MobileStickyBar` — post-hero mobile actions for Upload Rx and Explore medicines.

## Section wireframes

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ℹ Independent educational demo · Not accepting real orders or records       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Logo                 Medicines  Upload Rx  How it works  FAQs   [Upload] [Explore] │
├──────────────────────────────────────────────────────────────────────────────┤
│ HERO                                                                        │
│ ┌───────────────────────────────┐   ┌────────────────────────────────────┐ │
│ │ नमस्ते · Healthcare, ...      │   │ Rounded healthcare photo             │ │
│ │ Your medicines. Our care.     │   │   ┌──────────────────────────────┐   │ │
│ │ Made simple.                  │   │   │ Phone: Refill due in 3 days │   │ │
│ │ Supporting copy              │   │   │ Uploaded → Reviewing → Ready│   │ │
│ │ [Explore medicines] [Upload] │   │   └──────────────────────────────┘   │ │
│ │ trust chips                  │   │ floating review / reminder cards    │ │
│ └───────────────────────────────┘   └────────────────────────────────────┘ │
│        ┌──────────────┬──────────────┬──────────────┐                       │
│        │ Safety first │ Local network│ Family care  │  TRUST STRIP          │
│        └──────────────┴──────────────┴──────────────┘                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ FEATURED MEDICINES                                                           │
│ eyebrow → heading → supporting copy                                           │
│ [🔍 Search medicines.................................×] [category chips] [type] │
│ Showing 8 of 150                                                            │
│ [card] [card] [card] [card]                                                   │
│ [card] [card] [card] [card]                                                   │
│ info callout                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ PRESCRIPTION                                                                    │
│ ┌─────────────────────────────┐   ┌───────────────────────────────────────┐ │
│ │ natural-light photo         │   │ eyebrow / heading / explanation       │ │
│ │ review card overlap          │   │ ① Upload → ② AI draft → ③ Review      │ │
│ └─────────────────────────────┘   │ dashed dropzone + preview             │ │
│                                   └───────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS: ①────────②────────③                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ DARK PHARMACIST BAND: copy + CTA                         optional photo       │
├──────────────────────────────────────────────────────────────────────────────┤
│ FAQ: heading / family visual                         accordion list          │
├──────────────────────────────────────────────────────────────────────────────┤
│ FINAL CTA: Your family's medicines, in good hands. [Explore medicines]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: brand | Explore | Information | educational disclaimer               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```text
┌──────────────────────────────┐
│ ℹ Demo message               │
├──────────────────────────────┤
│ Logo                    [☰] │
├──────────────────────────────┤
│ HERO photo / phone stack     │
│ नमस्ते · Healthcare ...      │
│ Your medicines. Our care.   │
│ Made simple.                │
│ supporting copy             │
│ [Explore medicines]         │
│ [Upload prescription]       │
│ trust chips                 │
├──────────────────────────────┤
│ Safety first                 │
│ Local pharmacy network       │
│ Care for the family          │
├──────────────────────────────┤
│ Featured medicines           │
│ [🔍 Search................×] │
│ [horizontal category chips]  │
│ [type filter]               │
│ [card]                      │
│ [card]                      │
│ [Browse all 150]            │
├──────────────────────────────┤
│ Prescription photo           │
│ heading / stepper / dropzone │
├──────────────────────────────┤
│ Connected 1 → 2 → 3 steps    │
├──────────────────────────────┤
│ Pharmacist band              │
├──────────────────────────────┤
│ FAQ heading / accordion      │
├──────────────────────────────┤
│ Final CTA                    │
├──────────────────────────────┤
│ Footer                       │
├──────────────────────────────┤
│ [Upload Rx] [Explore meds]  │  mobile sticky bar after hero
└──────────────────────────────┘
```

## Hero alternatives

### Option A — Photo + care companion phone (recommended)

Use the existing natural-light healthcare photo as the emotional anchor on the right. Place a compact HTML/CSS phone mockup partly in front of the photo with a refill reminder and three-state review timeline. Keep the text column narrow and calm, with two CTAs and three trust chips. This communicates human care plus product usefulness without inventing operational claims.

### Option B — Editorial split with family-care checklist

Use the existing photo in a wide rounded frame on the left and place the headline, CTAs, and a vertically stacked “Designed for family routines” checklist on the right. Add a small saffron reminder tile and faint jaali geometry behind the frame. This is simpler and more spacious, but less product-specific than Option A.
