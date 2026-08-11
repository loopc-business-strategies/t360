# Tharagai Design System — Phase 2

**Brand:** Tharagai Readymades  
**Product:** Tharagai Digital (t360)  
**Tone:** Premium Indian family fashion retail — trustworthy, elegant, high-end but accessible.

## Principles

1. Brand first — **THARAGAI** is a hero-level signal on customer surfaces.
2. Not generic SaaS clothing UI.
3. Accessible components (keyboard, focus rings, contrast).
4. One composition per section; avoid dashboard clutter on customer hero.
5. Shared components only — no one-off duplicates.
6. English + Tamil via message catalogues; no hardcoded UI copy for shared strings.

## Colour tokens

| Token | Hex | Usage |
|-------|-----|--------|
| `--tharagai-wine` | `#6E1B28` | Primary brand / CTAs |
| `--tharagai-brass` | `#B8952A` | Accent, highlights |
| `--tharagai-ink` | `#14110F` | Body text |
| `--tharagai-linen` | `#F5F2EC` | Page surface |
| `--tharagai-teal` | `#1F4D4A` | Secondary actions, trust |
| `--tharagai-muted` | `#6B6560` | Secondary text |
| `--tharagai-border` | `#DDD6CB` | Borders / dividers |
| `--tharagai-surface-elevated` | `#FFFcf8` | Cards / elevated panels |
| `--tharagai-danger` | `#9B1C1C` | Errors |
| `--tharagai-success` | `#1F6B4A` | Success states |

Surface uses cool linen plus a subtle woven-noise texture (CSS), not flat white.

## Typography

| Role | Family | Notes |
|------|--------|-------|
| Display / brand | Newsreader | Headlines, wordmark companion |
| UI / body | Figtree | Controls, body, admin density |

### Scale (rem)

- Display: 2.5–3.5  
- H1: 2  
- H2: 1.5  
- H3: 1.25  
- Body: 1  
- Small: 0.875  
- Caption: 0.75  

## Spacing

Base unit **4px**; prefer **8px** rhythm for layout (8, 16, 24, 32, 48, 64).

## Radius

- `--radius-sm`: 4px  
- `--radius-md`: 8px  
- `--radius-lg`: 12px  

Avoid pill (`rounded-full`) primary CTAs.

## Elevation

Soft single-layer shadows only — no multi-layer glow stacks.

## Motion

1. Product media hover lift (~150ms) + shadow lift.  
2. Gallery image crossfade / slide (~250ms).  
3. Drawer / modal slide-in with backdrop blur (~200ms ease-out).  
4. **Phase 3+:** scroll-reveal sections, staggered cards, hero entrance (framer-motion), subtle Ken Burns on hero atmosphere, brass underline on brand wordmark.  
5. Admin: glass sticky header (`backdrop-blur`), sidebar active indicator, skeleton shimmer on loading.  
6. Flutter: fade-in gallery, button scale feedback, card elevation animation.

Respect `prefers-reduced-motion` (CSS media query + reduced motion variants in motion library).

**Do not:** purple glow stacks, excessive full-page scroll-snap spam, motion that blocks interaction.

## Component inventory (web — `packages/ui`)

Button, Input, Select, Modal, Drawer, Card, Table, Tabs, Badge, Toast, Dropdown, Pagination, ProductCard, ProductGallery, Price, OrderStatus, EmptyState, LoadingState, ErrorState.

## Component inventory (Flutter)

TharagaiButton, TharagaiCard, TharagaiProductCard, TharagaiInput, TharagaiAppBar, TharagaiPrice, TharagaiOrderStatus, TharagaiBottomNavigation.

## Do / Don’t

| Do | Don’t |
|----|--------|
| Lead with THARAGAI on customer hero | Generic Inter/Roboto/Arial stacks |
| Wine + brass + teal palette | Purple SaaS gradients |
| Real photography slots for products | Fake stock claims in UI |
| Shared package components | Copy-paste one-off buttons |
| EN/TA message keys | Hardcoded bilingual strings in components |

## Preview apps

- `apps/web` — customer design gallery  
- `apps/admin` — dense admin shell preview  
- `apps/mobile` — Flutter widget gallery  

No live catalogue or payments in Phase 2.
