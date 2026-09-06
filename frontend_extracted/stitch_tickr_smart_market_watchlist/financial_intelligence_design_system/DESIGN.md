---
name: Financial Intelligence Design System
colors:
  surface: '#f6f9ff'
  surface-dim: '#d4dbe2'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fc'
  surface-container: '#e8eef6'
  surface-container-high: '#e3e9f1'
  surface-container-highest: '#dde3eb'
  on-surface: '#161c22'
  on-surface-variant: '#45464d'
  inverse-surface: '#2b3137'
  inverse-on-surface: '#ebf1f9'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f6f9ff'
  on-background: '#161c22'
  surface-variant: '#dde3eb'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  data-metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  data-metric-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-metric-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  gutter-desktop: 1.5rem
  margin-desktop: 2rem
  gutter-mobile: 0.75rem
  margin-mobile: 1rem
---

## Brand & Style
The design system establishes a disciplined, editorial-grade financial intelligence interface. Drawing from modern financial press and institutional research terminals, it balances archival authority with razor-sharp modern analytical clarity. 

The aesthetic eschews retail trading gimmicks—there are no decorative badges, rounded pill chips, pulsing status dots, or saturated accent colors. Instead, value is communicated through typographic contrast, deliberate tabular structure, hairline dividers, and disciplined restraint. The emotional response is one of institutional trust, quiet confidence, and uncompromised focus on high-density information.

## Colors
The palette adheres to a strict three-color discipline:

- **Primary (Deep Navy - `#0F172A`):** Dominates high-priority text, primary interaction triggers, active state markers, key data metrics, and structural emphasis.
- **Background & Surfaces (`#FFFFFF` and `#F8F9FA`):** Crisp pure white serves as the default page base, while `#F8F9FA` is applied to nested data matrices, table headers, and structural card fills.
- **Secondary & Structural Neutral (`#64748B` and `#E2E8F0`):** `#64748B` handles secondary labels, metadata, captions, and non-active states. `#E2E8F0` is strictly allocated for crisp 1px hairline rules, boundaries, and subtle input borders.

Decorative gradients, neon alert fills, warm browns, and retail-oriented color coding are excluded. Semantic positive and negative delta metrics rely on tonal values, subtle directional indicators (such as `+` or `-`), and minimal tonal variants rather than loud, disruptive fields of color.

## Typography
Typographic treatment utilizes three complementary families:

1. **Headlines (`Newsreader`):** An authoritative, editorial serif that grounds the platform with journalistic pedigree and calm dignity. Headlines convey analytical synthesis rather than urgent speculation.
2. **Body & Interface (`Geist`):** An austere, neutral sans-serif chosen for high technical legibility at small point sizes across compact tables and dense layouts.
3. **Data Figures & Tickers (`JetBrains Mono`):** Applied to all market values, delta rates, price arrays, and financial timestamps. Tabular lining numbers (`tnum`) must be enforced across all quantitative outputs to ensure strict vertical alignment across columns.

## Layout & Spacing
The layout follows a 12-column structural grid system built on an 8px base unit (with a 4px sub-grid for data alignments). 

- **Desktop (1024px and above):** 12-column layout with 24px gutters and 32px external margins. Watchlists use tight, dense vertical padding (8px to 12px) to maximize row density per viewport.
- **Tablet (768px – 1023px):** 8-column layout with 16px gutters and 24px margins. Data tables enable horizontal scrolling or prioritize ticker, last price, and net change columns while collapsing extended volume data.
- **Mobile (Below 768px):** 4-column layout with 12px gutters and 16px page margins. Typography scales down systematically to prevent column wrapping. Multi-column tables collapse into dual-row analytical cells bounded by clean horizontal dividers.

## Elevation & Depth
Elevation is rendered strictly flat. To eliminate visual clutter and maintain high terminal clarity:

- **Zero Shadows:** Drop shadows, ambient blur effects, and diffuse glow filters are entirely prohibited.
- **Hairline Outlines:** Depth and component separation are accomplished via precise 1px solid borders using `#E2E8F0`.
- **Tonal Layering:** Visual hierarchy between the canvas and nested modules uses subtle surface shifting: `#FFFFFF` for primary cards set against `#F8F9FA` backgrounds, or `#F8F9FA` fills within data tables to indicate grouping and headers.
- **Focus & Selection:** Active or selected elements are marked with a solid 1px `#0F172A` outline or a solid `#0F172A` fill with contrasting white text.

## Shapes
The design system adopts a crisp, zero-radius architectural profile (`roundedness: 0`). 

Corners are razor-sharp across all interface components: cards, input boxes, list items, action triggers, and segmented controls. This sharp geometric baseline reinforces institutional structure, aligns naturally with tabular grid systems, and maintains continuous hairline border intersections without distorting corner pixels.

## Components

### Buttons & Action Triggers
- **Primary:** Solid `#0F172A` background, `#FFFFFF` text (`Geist`, Medium, 13px), 0px corner radius. Padding: 8px 16px. No shadows. Hover state shifts background to `#1E293B`.
- **Secondary:** Flat `#FFFFFF` background, 1px solid `#E2E8F0` border, `#0F172A` text. Hover state shifts border to `#0F172A`.
- **Text Action:** Clean `#0F172A` text with a static or hover 1px underline. No border or background fill.

### Watchlist & Data Tables
- **Header:** Background `#F8F9FA`, bottom border 1px solid `#0F172A`. Typography is uppercase `Geist`, 11px, `#64748B` with `letter-spacing: 0.05em`.
- **Rows:** Background `#FFFFFF`, alternating hover state to `#F8F9FA`. Bottom border 1px solid `#E2E8F0`. Row heights are fixed at 40px for dense viewports.
- **Data Cells:** Price, volume, and percentage deltas render in `JetBrains Mono` with tabular lining figures. Deltas are represented with leading signs (`+` / `-`).

### Market Cards & Containers
- Flat white surface (`#FFFFFF`), bounded by a continuous 1px solid `#E2E8F0` border.
- Headers are separated from card bodies by a 1px solid `#E2E8F0` horizontal divider. No drop shadows.
- Inner card padding: 16px to 20px uniform.

### Inputs & Search Bars
- Background: `#FFFFFF`.
- Border: 1px solid `#E2E8F0`. On focus: 1px solid `#0F172A` with zero ring offset or halo blur.
- Typography: `Geist` 13px for input entry, `#64748B` for placeholder text. Monospace numbers populate when numeric ticker symbols are recognized.

### Ticker Metadata & Chips
- Replaces retail badges and soft pills with sharp rectangular tags.
- Background: `#F8F9FA`, 1px solid `#E2E8F0` border, text `#0F172A` in `JetBrains Mono` 11px.
- Zero border radius, no decorative icons, no status dots.

### Checkboxes & Segmented Selectors
- **Checkboxes:** 14px square boxes with a 1px solid `#64748B` border. When checked: solid `#0F172A` fill with a crisp white check glyph.
- **Segmented Selectors:** A contiguous horizontal container with a 1px solid `#E2E8F0` border. Divided by 1px vertical borders. Active segments feature a `#0F172A` background with `#FFFFFF` text; inactive segments feature `#FFFFFF` with `#64748B` text.