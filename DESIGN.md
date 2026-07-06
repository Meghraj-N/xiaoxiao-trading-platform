# Project Design System

This document outlines the design system for the new React/Next.js frontend, derived from the provided theme tokens and Anthropic brand guidelines.

## 1. Aesthetic
- **Glassmorphism & Gradients**: Using blurred backdrops and subtle borders to create depth.
- **Vibrant & Dark Modes**: Rich, warm color palettes utilizing oranges, ambers, and dark charcoals.
- **Animations**: Using Framer Motion for micro-interactions, pulse effects, and smooth layout transitions.

## 2. Typography
- **Headings**: `Ubuntu Mono, monospace` & `Montserrat, sans-serif`
- **Body**: `Montserrat, sans-serif`
- **Serif (Accents)**: `Merriweather, serif`

*(Note: Per Anthropic guidelines, Poppins and Lora are fallbacks for corporate styling if requested, but the CSS variables explicitly request Ubuntu Mono, Montserrat, and Merriweather).*

## 3. Color Palette

### Light Mode (`:root`)
- **Background**: `#fff9f5` (Warm off-white)
- **Card/Popover**: `#ffffff`
- **Foreground (Text)**: `#3d3436` (Deep charcoal)
- **Primary / Ring**: `#ff7e5f` (Vibrant coral/orange)
- **Secondary**: `#ffedea` (Soft blush)
- **Accent**: `#feb47b` (Warm peach)
- **Muted**: `#fff0eb`

### Dark Mode (`.dark`)
- **Background / Sidebar**: `#2a2024` (Deep warm dark)
- **Card/Popover**: `#392f35`
- **Foreground (Text)**: `#f2e9e4` (Warm light gray)
- **Primary / Ring**: `#ff7e5f`
- **Secondary / Muted / Border**: `#463a41`
- **Accent**: `#feb47b`

### Chart Colors
1. `#ff7e5f`
2. `#feb47b`
3. `#ffcaa7`
4. `#ffad8f`
5. `#ce6a57`

## 4. Spacing & Layout
- **Radius**: `0.625rem` (10px) for cards, buttons, and inputs.
- **Shadows**: Soft, downward shadows with slight spread (`0px 6px 12px hsl(0 0% 0% / 0.09)`).
- **Layout**: Centered constraints for content (max-w-2xl, max-w-5xl) with full-bleed backgrounds.

## 5. Motion
- **Fade & Slide**: Using `animate-fade-in-up` and `animate-fade-in-down`.
- **Interactive**: Hover scales (`scale-105`), active tap shrinks (`scale-98`).
- **Backgrounds**: Slow pulsing and gradient shifting for shader backgrounds.
