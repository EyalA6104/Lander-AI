---
trigger: model_decision
description: when designing frontend components, Prioritize the Tailwind classes and layout structures defined below.
---

### Design System Specification: The Celestial Interface

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Astral Navigator."** We are moving away from the "flat dashboard" trope and toward an immersive, cockpit-inspired experience that feels like peering through a high-tech viewport into deep space.

To achieve a premium, high-end editorial feel, we reject rigid, boxed-in grids. Instead, we utilize **intentional asymmetry, overlapping translucent layers, and high-contrast typography scales.** By treating the UI as a series of floating HUD (Heads-Up Display) elements, we create a sense of depth and vastness. Every interaction should feel like a light-speed command—precise, glowing, and effortless.

---

## 2. Colors: The Deep Space Palette

The color strategy mimics the physics of light in a vacuum: absolute blacks, luminous nebulas, and sharp, piercing starlight.

### Core Tones

- **Background (`#0c0e18`)**: Our "Deep Space" base. All layouts start here.
- **Primary (`#c1fffe`)**: A "Cyan Nova" used for critical actions and high-energy states.
- **Secondary (`#c37fff`)**: An "Electric Violet" used for brand expression and nebula-inspired accents.
- **Tertiary (`#d873ff`)**: A "Deep Nebula" purple for supplementary information and depth.

### The "No-Line" Rule

Standard 1px solid borders are strictly prohibited for sectioning. They shatter the illusion of a boundless galaxy. Boundaries must be defined through:

1. **Tonal Shifts**: A `surface-container-low` section sitting directly on a `surface` background.
2. **Luminous Transitions**: Using subtle radial gradients of `secondary_container` to define the edges of a zone.

### Surface Hierarchy & Nesting

Treat the UI as a series of nested frosted glass panels.

- Use `surface_container_lowest` for the deepest background layers.
- Use `surface_container_highest` for active, foreground panels.
- **Nesting**: An inner container should always be at least one tier higher than its parent to create a natural "lift" without relying on archaic shadows.

### The "Glass & Gradient" Rule

To achieve a signature look, all floating containers must utilize **Glassmorphism**. Combine `surface_variant` at 40-60% opacity with a `backdrop-blur` (20px-40px).
**Signature Textures:** Main CTAs should not be flat. Use a linear gradient from `primary` to `primary_dim` at a 135-degree angle to simulate a glowing light source.

---

## 3. Typography: The High-Tech Script

We pair the geometric precision of **Space Grotesk** for display with the functional clarity of **Inter** for data.

- **Display & Headlines (Space Grotesk)**: Use wide tracking (0.1em to 0.15em) for all `display-lg` through `headline-sm`. This creates an "interstellar" breathability and a high-tech, cinematic feel.
- **Body & Titles (Inter)**: These are the "readouts." Keep tracking tight and legible.
- **Hierarchy as Identity**: Large `display-lg` elements should be used sparingly as "anchor points" in the layout, often overlapping the edge of a glass container to break the "contained" feel of standard web design.

---

## 4. Elevation & Depth: Tonal Layering

In space, there is no "up" or "down," only proximity. We convey hierarchy through **Tonal Layering** rather than traditional structural lines.

- **The Layering Principle**: Stack surface tiers to create depth. A `surface_container` card on a `surface_dim` background provides a soft, sophisticated lift.
- **Ambient Shadows**: Shadows are rarely used. When required for "floating" modals, use a large blur (64px) at 6% opacity, tinted with `surface_tint`. This mimics the way light refracts through a nebula.
- **The "Ghost Border" Fallback**: If a divider is mandatory for accessibility, use the `outline_variant` token at **15% opacity**. 100% opaque borders are considered a design failure.
- **Optical Glow**: Interactive elements (like buttons) should have a soft outer glow using the `primary` color at 20% opacity to simulate a light-emitting diode (LED).

---

## 5. Components: The Cockpit Interface

### Buttons

- **Primary**: Gradient of `primary` to `primary_dim`. Roundedness at `md` (0.75rem). Text in `on_primary_fixed`.
- **Secondary**: Glassmorphism base (`surface_variant` at 20% opacity) with a `Ghost Border` of `primary`.
- **Tertiary**: Text-only using `primary_fixed`, with a subtle underline appearing only on hover.

### Cards & Lists

- **The Divider Ban**: Forbid the use of divider lines in lists. Use `spacing-4` (1.4rem) of vertical white space or a subtle background shift to `surface_container_low` on hover.
- **Card Geometry**: Use `rounded-xl` (1.5rem) for main containers to mimic the ergonomic curves of a spacecraft cockpit.

### Chips & Tags

- **Selection Chips**: Use `secondary_container` with `on_secondary_container` text. The glow should intensify when selected.

### Input Fields

- **State Styling**: Inputs should be `surface_container_highest` with a `Ghost Border`. On focus, the border opacity jumps to 80% using the `primary` token, creating a "system wake-up" effect.

### Additional Signature Components

- **The "Data Stream"**: A custom progress bar using a `primary` to `secondary` gradient, with a trailing "comet" glow at the tip of the progress.
- **The "Nebula Overlay"**: A non-interactive background element using blurred spheres of `secondary_dim` and `tertiary_dim` that slowly drift, providing "visual soul" to empty states.

---

## 6. Do’s and Don’ts

### Do:

- **Use Intentional Asymmetry**: Align text to the left but allow imagery or glass panels to bleed off the right edge of the screen.
- **Embrace Negative Space**: Space is vast. Use the `spacing-16` and `spacing-24` tokens to let elements breathe.
- **Layer Textures**: Place a subtle starfield (using `on_background` dots at 5% opacity) behind glass panels to enhance the depth effect.

### Don’t:

- **Don’t use 100% White**: Use `on_surface` (`#ededfc`) for body text. Pure #FFFFFF is too harsh against deep navy and causes eye strain.
- **Don’t use Sharp Corners**: Avoid `none` or `sm` rounding unless it's for technical data readouts. High-tech should feel sleek and engineered, not aggressive.
- **Don’t Over-Glow**: If everything glows, nothing is important. Reserve the `primary` glow for interactive elements and critical alerts.
