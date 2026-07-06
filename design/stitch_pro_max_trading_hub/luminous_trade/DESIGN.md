---
name: Luminous Trade
colors:
  surface: '#151311'
  surface-dim: '#151311'
  surface-bright: '#3b3936'
  surface-container-lowest: '#0f0e0c'
  surface-container-low: '#1d1b19'
  surface-container: '#211f1d'
  surface-container-high: '#2c2a27'
  surface-container-highest: '#373432'
  on-surface: '#e7e1de'
  on-surface-variant: '#dec0b9'
  inverse-surface: '#e7e1de'
  inverse-on-surface: '#32302e'
  outline: '#a68b84'
  outline-variant: '#57423d'
  surface-tint: '#ffb4a3'
  primary: '#ffb4a3'
  on-primary: '#621000'
  primary-container: '#ff7e5f'
  on-primary-container: '#721702'
  inverse-primary: '#a53b22'
  secondary: '#ffb780'
  on-secondary: '#4e2600'
  secondary-container: '#6f3c0d'
  on-secondary-container: '#f1a971'
  tertiary: '#ccc5c6'
  on-tertiary: '#332f30'
  tertiary-container: '#a9a2a3'
  on-tertiary-container: '#3d393a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0700'
  on-primary-fixed-variant: '#84240d'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6c3a0a'
  tertiary-fixed: '#e9e1e2'
  tertiary-fixed-dim: '#ccc5c6'
  on-tertiary-fixed: '#1e1b1c'
  on-tertiary-fixed-variant: '#4a4647'
  background: '#151311'
  on-background: '#e7e1de'
  surface-variant: '#373432'
typography:
  display-lg:
    fontFamily: Merriweather
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-lg:
    fontFamily: Ubuntu Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
  data-sm:
    fontFamily: Ubuntu Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for a high-performance trading environment that balances technical precision with a warm, approachable atmosphere. It targets sophisticated investors who seek a platform that feels both cutting-edge and emotionally resonant.

The aesthetic follows a **Warm Glassmorphism** movement. It utilizes frosted-glass surfaces, vibrant background blurs, and "glowing" interactive elements to create a sense of depth and luminosity. Unlike traditional cold, clinical fintech interfaces, this design system uses soft peach and coral tones to reduce user fatigue during long trading sessions, while maintaining high-contrast zones for critical financial data. The emotional response is one of calm confidence, high-energy potential, and premium reliability.

## Colors

The palette is anchored by **Vibrant Coral (#FF7E5F)** for primary actions and **Soft Peach (#FEB47B)** for secondary accents and highlights. 

While the system supports a **Warm White (#FFF9F5)** light mode for reading-heavy editorial content, the default trading experience is set to a **Deep Charcoal (#141112)** dark mode. This provides the necessary contrast for the glassmorphic effects to shine. Backgrounds should utilize radial gradients of the primary and secondary colors at very low opacities (5-8%) to create a "glow" beneath the interface layers. Success and error states use high-vibrancy greens and reds, optimized for legibility against the dark charcoal base.

## Typography

This system employs a tri-font strategy to differentiate between narrative, interface, and data:

1.  **Merriweather (Serif):** Reserved for high-level headings and editorial insights. It provides an authoritative, "Wall Street Journal" feel to market analysis.
2.  **Montserrat (Sans-Serif):** The workhorse for UI labels, body text, and navigation. It offers a clean, modern contrast to the serif headings.
3.  **Ubuntu Mono (Monospace):** Strictly used for price tickers, trade volume, and any numerical data. The fixed character width ensures that numbers don't "jump" when values update rapidly in real-time.

All labels for data categories should use `label-caps` to distinguish metadata from actual values.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. Spacing is strictly based on an 8px rhythm to maintain mathematical harmony in data-dense environments.

For trading dashboards, the layout is "Modular-Fixed": the sidebar and order book remain fixed in position, while the central chart area expands to fill the remaining viewport. On mobile, the system reflows into a single-column vertical stack with a persistent bottom navigation bar and a condensed "floating" ticker at the top.

## Elevation & Depth

Hierarchy is established through **Glassmorphism and Glow**. Surfaces do not use traditional black shadows; instead, they use "Ambient Light" effects:

-   **Base Layer:** The Deep Charcoal background with subtle color blurs.
-   **Mid Layer (Cards/Panels):** 60% opacity of the background color with a 20px backdrop-blur. Each panel features a 1px inner border (stroke) at 20% opacity white to catch the "light."
-   **Top Layer (Modals/Popovers):** 80% opacity with a 40px backdrop-blur and a subtle outer glow using the primary color at 15% opacity.
-   **Glow States:** Active cards or high-priority alerts feature a "drop-glow" (a diffused shadow using the primary color hex instead of black).

## Shapes

The design system uses a **Rounded (2)** shape language to soften the intensity of financial data. 

Standard components (Inputs, Buttons, Cards) use a **0.5rem (8px)** radius. Larger structural containers like the main chart area or dashboard panels use a **1.5rem (24px)** radius. This curvature helps the glassmorphic panels feel like physical objects with polished edges.

## Components

### Buttons
Primary buttons use a linear gradient from Primary to Secondary colors. They feature a "hover-glow" where the button's shadow expands and intensifies in saturation. Text is always uppercase `label-caps` for maximum impact.

### Glass Cards
The core container. Must have a `backdrop-filter: blur(20px)` and a thin semi-transparent border. For "Pro Max" feel, add a subtle top-left to bottom-right linear gradient border to simulate light hitting the edge.

### Data Tickers
Use Ubuntu Mono. Positive changes are highlighted in a soft green glow; negative changes in a coral glow. Backgrounds of these badges should be 10% opacity of the respective color.

### Input Fields
Inputs are semi-transparent with a bottom-only border that glows and thickens when focused. Typography within inputs should be Montserrat for user-entered text and Ubuntu Mono for numerical amount entries.

### Charts & Sparklines
Sparklines should use a gradient stroke. The area under the line should have a vertical gradient fading from 30% opacity to 0% at the baseline, enhancing the luminous feel of the platform.