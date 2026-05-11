---
version: alpha
name: Torque Dark
description: Torque presents itself as a powerful AI agent workflow builder through a confident, dark-first brand voice — anchored by a deep gray-950 canvas ({colors.brand-navy}) decorated with brand-colored sticky-note dots and mesh wire illustrations, a signature purple pill primary CTA ({colors.primary}), and a rich palette of pastel-tinted feature cards that echo the colorful database properties of the live product. The system uses a Notion-Sans (Inter-based) typeface across every UI surface, anchors a 4-tier pricing comparison (Free / Plus / Business / Enterprise), and presents the live workspace UI mockup directly inside the hero band. Coverage spans homepage, Enterprise, Product AI, Product Agents, Startups, and Pricing surfaces.

colors:
  primary: "#0c8ee9"
  primary-pressed: "#0070c7"
  primary-deep: "#0159a1"
  on-primary: "#ffffff"
  brand-navy: "#030712"
  brand-navy-deep: "#02050e"
  brand-navy-mid: "#111827"
  link-blue: "#36a9f8"
  link-blue-pressed: "#0c8ee9"
  brand-orange: "#f97316"
  brand-orange-deep: "#c2410c"
  brand-pink: "#ec4899"
  brand-pink-deep: "#be185d"
  brand-purple: "#a855f7"
  brand-purple-300: "#d8b4fe"
  brand-purple-800: "#3b0764"
  brand-teal: "#14b8a6"
  brand-green: "#22c55e"
  brand-yellow: "#facc15"
  brand-brown: "#92400e"
  card-tint-peach: "#7c2d12"
  card-tint-rose: "#831843"
  card-tint-mint: "#064e3b"
  card-tint-lavender: "#3b0764"
  card-tint-sky: "#0c4a6e"
  card-tint-yellow: "#713f12"
  card-tint-yellow-bold: "#854d0e"
  card-tint-cream: "#292524"
  card-tint-gray: "#1c1917"
  canvas: "#030712"
  surface: "#111827"
  surface-soft: "#1f2937"
  hairline: "#1f2937"
  hairline-soft: "#374151"
  hairline-strong: "#4b5563"
  ink-deep: "#ffffff"
  ink: "#f3f4f6"
  charcoal: "#e5e7eb"
  slate: "#9ca3af"
  steel: "#6b7280"
  stone: "#4b5563"
  muted: "#374151"
  on-dark: "#ffffff"
  on-dark-muted: "#9ca3af"
  semantic-success: "#22c55e"
  semantic-warning: "#f97316"
  semantic-error: "#ef4444"

typography:
  hero-display:
    fontFamily: Notion Sans
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2px
  display-lg:
    fontFamily: Notion Sans
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: -1px
  heading-1:
    fontFamily: Notion Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.5px
  heading-2:
    fontFamily: Notion Sans
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.5px
  heading-3:
    fontFamily: Notion Sans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.25
  heading-4:
    fontFamily: Notion Sans
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.30
  heading-5:
    fontFamily: Notion Sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.40
  subtitle:
    fontFamily: Notion Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
  body-md:
    fontFamily: Notion Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-md-medium:
    fontFamily: Notion Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.55
  body-sm:
    fontFamily: Notion Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
  body-sm-medium:
    fontFamily: Notion Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.50
  caption:
    fontFamily: Notion Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.40
  caption-bold:
    fontFamily: Notion Sans
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.40
  micro:
    fontFamily: Notion Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
  micro-uppercase:
    fontFamily: Notion Sans
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: 1px
  button-md:
    fontFamily: Notion Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.30

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  xxxl: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section-sm: 48px
  section: 64px
  section-lg: 96px
  hero: 120px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.muted}"
  button-dark:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    border: "1px solid {colors.hairline-strong}"
  button-on-dark:
    backgroundColor: "{colors.on-dark}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary-on-dark:
    backgroundColor: "transparent"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    border: "1px solid {colors.on-dark-muted}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.link-blue}"
    typography: "{typography.body-sm-medium}"
    padding: "0"
  card-base:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  card-feature:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px solid {colors.hairline}"
  card-feature-yellow-bold:
    backgroundColor: "{colors.card-tint-yellow-bold}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-peach:
    backgroundColor: "{colors.card-tint-peach}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-rose:
    backgroundColor: "{colors.card-tint-rose}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-mint:
    backgroundColor: "{colors.card-tint-mint}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-sky:
    backgroundColor: "{colors.card-tint-sky}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-lavender:
    backgroundColor: "{colors.card-tint-lavender}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-yellow:
    backgroundColor: "{colors.card-tint-yellow}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-feature-cream:
    backgroundColor: "{colors.card-tint-cream}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  card-agent-tile:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  card-template:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
  card-startup-perk:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  pricing-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px solid {colors.hairline}"
  pricing-card-featured:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "2px solid {colors.primary}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.hairline-strong}"
    height: 44px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary}"
  search-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.steel}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: 44px
    border: "1px solid {colors.hairline}"
  pill-tab:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
    border: "1px solid {colors.hairline}"
  pill-tab-active:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.full}"
    border: "1px solid {colors.ink-deep}"
  segmented-tab:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.body-sm-medium}"
    padding: "{spacing.sm} {spacing.md}"
    border: "0 0 2px transparent solid"
  segmented-tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-medium}"
    border: "0 0 2px {colors.ink} solid"
  badge-purple:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-pink:
    backgroundColor: "{colors.brand-pink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-orange:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-tag-purple:
    backgroundColor: "{colors.card-tint-lavender}"
    textColor: "{colors.brand-purple-800}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-tag-orange:
    backgroundColor: "{colors.card-tint-peach}"
    textColor: "{colors.brand-orange-deep}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-tag-green:
    backgroundColor: "{colors.card-tint-mint}"
    textColor: "{colors.brand-green}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-popular:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  promo-banner:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-medium}"
    padding: "{spacing.sm} {spacing.md}"
  hero-band-dark:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.on-dark}"
    rounded: "0"
    padding: "{spacing.hero}"
  workspace-mockup-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "0"
    border: "1px solid {colors.hairline}"
    shadow: "rgba(15, 15, 15, 0.2) 0px 24px 48px -8px"
  cta-banner-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.section}"
  comparison-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline}"
  comparison-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "{spacing.md} {spacing.lg}"
    border: "0 0 1px {colors.hairline-soft} solid"
  testimonial-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px solid {colors.hairline}"
  logo-wall-item:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.body-md-medium}"
    padding: "{spacing.lg}"
  faq-accordion-item:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
    border: "0 0 1px {colors.hairline} solid"
  stat-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.section-sm}"
  footer-region:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.charcoal}"
    typography: "{typography.body-sm}"
    padding: "{spacing.section} {spacing.xxl}"
    border: "1px solid {colors.hairline}"
  footer-link:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.body-sm}"
    padding: "{spacing.xxs} 0"
---

## Overview

Torque presents itself as a powerful AI agent workflow builder through a confident, dark-first brand voice. The interface opens with a **gray-950 canvas** ({colors.canvas}) and a dark sidebar ({colors.surface}) containing a searchable node palette. The signature **torque-blue primary CTA** ({colors.primary}) "Run" sits in the top toolbar alongside Save and Export buttons. Below the toolbar, a React Flow canvas renders the visual DAG with dark-themed nodes and animated edges on a dot-grid background. The bottom panel streams real-time execution logs with color-coded source tags.

The system uses Inter (system-ui) across every UI surface. Buttons use `{rounded.md}` (8px) with subtle hover scaling at 95%. Cards use `{rounded.lg}` (12px) consistently. Every surface respects the dark theme — gray-950 canvas, gray-900 panels, gray-800 borders.

**Key Characteristics:**
- Dark canvas ({colors.canvas}) with dot-grid background at 24px spacing
- **Torque blue** ({colors.primary}) Run button — the primary action across the toolbar
- Real-time log streaming in bottom panel with color-coded source indicators
- 20+ custom node types with individual accent colors and status states
- MCP resource browser with live content preview
- 31+ app connectors with permission controls (read-only / read-write / confirm-destructive)
- LLM provider marketplace with 14+ providers (OpenAI, Anthropic, Google, Groq, Ollama, etc.)
- TypeScript code export for every workflow
- Onboarding tour with driver.js

## Colors

> Source pages: notion.com/ (homepage), /enterprise, /product/ai, /product/agents, /startups, /pricing. Token coverage was identical across all six pages.

### Brand & Primary
- **Torque Blue** ({colors.primary}): Signature primary CTA color — the unmistakable blue Run button. Reserved for the dominant action only.
- **Blue Pressed** ({colors.primary-pressed}): Pressed-state variant
- **Blue Deep** ({colors.primary-deep}): Deeper variant for emphasis
- **Canvas** ({colors.brand-navy}): Base canvas background — near-black
- **Surface Deep** ({colors.brand-navy-deep}): Deeper surface for modals
- **Surface Mid** ({colors.brand-navy-mid}): Mid-tone surface for panels
- **Link Blue** ({colors.link-blue}): Inline text link blue
- **Link Blue Pressed** ({colors.link-blue-pressed}): Pressed-state link blue

### Brand Color Spectrum (accent colors for node types)
- **Brand Pink** ({colors.brand-pink}): Loop/AI node accent
- **Brand Pink Deep** ({colors.brand-pink-deep}): Deeper pink
- **Brand Orange** ({colors.brand-orange}): Switch/webhook node accent
- **Brand Orange Deep** ({colors.brand-orange-deep}): Deeper orange
- **Brand Purple** ({colors.brand-purple}): LLM node accent
- **Brand Purple 300** ({colors.brand-purple-300}): Light purple for badges
- **Brand Purple 800** ({colors.brand-purple-800}): Deep purple for tag text
- **Brand Teal** ({colors.brand-teal}): Split/merge node accent
- **Brand Green** ({colors.brand-green}): Output node accent
- **Brand Yellow** ({colors.brand-yellow}): Trigger/wait node accent
- **Brand Brown** ({colors.brand-brown}): Database/earthy node tints

### Card Tints (Dark Surface Variants)
- **Tint Peach** ({colors.card-tint-peach}): Deep burnt-orange
- **Tint Rose** ({colors.card-tint-rose}): Deep rose-magenta
- **Tint Mint** ({colors.card-tint-mint}): Deep teal-green
- **Tint Lavender** ({colors.card-tint-lavender}): Deep purple
- **Tint Sky** ({colors.card-tint-sky}): Deep sky-blue
- **Tint Yellow** ({colors.card-tint-yellow}): Deep amber
- **Tint Yellow Bold** ({colors.card-tint-yellow-bold}): Deep goldenrod for emphasis
- **Tint Cream** ({colors.card-tint-cream}): Warm stone
- **Tint Gray** ({colors.card-tint-gray}): Dark neutral surface

### Surface
- **Canvas** ({colors.canvas}): Page background and primary card surface — dark base
- **Surface** ({colors.surface}): Panel backgrounds, sidebar, modal surfaces
- **Surface Soft** ({colors.surface-soft}): Hover states, elevated surfaces
- **Hairline** ({colors.hairline}): 1px borders and primary dividers — subtle
- **Hairline Soft** ({colors.hairline-soft}): Quieter dividers
- **Hairline Strong** ({colors.hairline-strong}): Stronger 1px border for inputs and focus states

### Text
- **Ink Deep** ({colors.ink-deep}): Pure white for primary emphasis
- **Ink** ({colors.ink}): Primary headlines and body text — light gray
- **Charcoal** ({colors.charcoal}): Body emphasis — warm gray
- **Slate** ({colors.slate}): Secondary text
- **Steel** ({colors.steel}): Tertiary, muted labels, footers
- **Stone** ({colors.stone}): Disabled, muted borders
- **Muted** ({colors.muted}): Disabled backgrounds, placeholder
- **On Dark** ({colors.on-dark}): White text on dark surfaces
- **On Dark Muted** ({colors.on-dark-muted}): Reduced-opacity white on dark

### Semantic
- **Success** ({colors.semantic-success}): Confirmation green
- **Warning** ({colors.semantic-warning}): Mid-priority alerts (orange)
- **Error** ({colors.semantic-error}): Validation errors (red)

## Typography

### Font Family
**Inter / system-ui** (primary): System-native stack for crisp rendering at all weights. Fallbacks: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif. Used across every UI surface.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 80px | 600 | 1.05 | -2px | Hero ("Meet the night shift") |
| `{typography.display-lg}` | 56px | 600 | 1.10 | -1px | Section openers |
| `{typography.heading-1}` | 48px | 600 | 1.15 | -0.5px | Page-level headlines ("Try for free") |
| `{typography.heading-2}` | 36px | 600 | 1.20 | -0.5px | Subsection headlines ("Keep work moving 24/7") |
| `{typography.heading-3}` | 28px | 600 | 1.25 | 0 | Card titles |
| `{typography.heading-4}` | 22px | 600 | 1.30 | 0 | Feature tile titles |
| `{typography.heading-5}` | 18px | 600 | 1.40 | 0 | FAQ questions |
| `{typography.subtitle}` | 18px | 400 | 1.50 | 0 | Hero subtitle |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Primary body text |
| `{typography.body-md-medium}` | 16px | 500 | 1.55 | 0 | Body emphasis |
| `{typography.body-sm}` | 14px | 400 | 1.50 | 0 | Secondary body |
| `{typography.body-sm-medium}` | 14px | 500 | 1.50 | 0 | Active sidebar, button labels |
| `{typography.caption-bold}` | 13px | 600 | 1.40 | 0 | Badge labels |
| `{typography.button-md}` | 14px | 500 | 1.30 | 0 | Button labels |

### Principles
- Tight hero leading (1.05) on 80px display
- Negative letter-spacing on display sizes (-2px to -0.5px)
- Generous body leading (1.55) for documentation readability
- 600 weight for headlines + 500 for buttons; 400 body

## Layout

### Spacing System
- **Base unit**: 4px (8px primary increment)
- **Tokens**: `{spacing.xxs}` (4px) through `{spacing.hero}` (120px)
- **Application layout**: Fixed toolbar (48px) + flexible canvas + resizable log panel (192px)

### Grid & Container
- Full-viewport application with left sidebar (224px), center canvas, optional right config panel (320px)
- Canvas uses React Flow with dot-grid background at 24px spacing
- Canvas empty state shows centered drag-to-build prompt

### Whitespace Philosophy
Toolbar uses compact 8px padding with 4px gaps between actions. Canvas nodes use generous padding (16px internal) with 12px spacing between elements. Log entries are tightly packed (4px gap) for maximum information density.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow; `{colors.hairline}` border | Sidebar, toolbar, default surfaces |
| 1 (subtle) | `rgba(0, 0, 0, 0.4) 0px 4px 12px` | Hover-elevated tiles, node hover |
| 2 (card) | `rgba(0, 0, 0, 0.5) 0px 8px 24px` | Modals, dropdowns, panels |
| 3 (mockup) | `rgba(0, 0, 0, 0.6) 0px 16px 48px` | Export modal, full-screen overlays |
| 4 (tooltip) | `rgba(0, 0, 0, 0.7) 0px 4px 8px` | Tooltips, popovers |

### Decorative Depth
- Canvas nodes use shadow-lg (`{rounded.lg}`) with colored top accent borders
- Log panel uses backdrop-blur for depth while maintaining content scannability
- Modals use heavy backdrop-blur with 60% black overlay for focused interaction

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|---|
| `{rounded.xs}` | 4px | Micro badges, color dots |
| `{rounded.sm}` | 6px | Status indicators |
| `{rounded.md}` | 8px | Buttons, inputs, toolbar items |
| `{rounded.lg}` | 12px | Cards, node bodies, modals |
| `{rounded.xl}` | 16px | Larger panels, resource browser |
| `{rounded.xxl}` | 20px | Featured modals |
| `{rounded.xxxl}` | 24px | Export code preview |
| `{rounded.full}` | 9999px | Badges, status pills |

Torque uses sober rectangular geometry — `{rounded.md}` (8px) buttons and inputs, `{rounded.lg}` (12px) cards and modals.

## Components

> Per the reduced-motion policy, animations default to 150–200ms ease.

### Buttons

**`button-primary`** — Torque blue primary CTA, the dominant action (e.g. "Run").
- Background `{colors.primary}`, text `{colors.on-primary}`, typography `{typography.button-md}`, padding `8px 12px`, rounded `{rounded.md}`.
- Pressed state: `active:scale-95` transform.
- Disabled: `opacity-40 cursor-not-allowed`.

**`button-ghost`** — Toolbar action button.
- Background transparent, text `{colors.steel}`, typography `{typography.button-md}`, padding `8px 10px`, rounded `{rounded.md}`.
- Hover: background `{colors.surface}`, text `{colors.ink}`.

**`button-danger`** — Destructive action (delete).
- Background transparent, text `{colors.steel}`, hover text `{colors.semantic-error}`.

### Cards & Containers

**`node-card`** — Canvas node body.
- Background `{colors.surface}`, rounded `{rounded.lg}`, border `1px solid {colors.hairline}`, shadow-lg.
- Header has colored accent bar matching node type.

**`panel-sidebar`** — Left node palette panel.
- Background `{colors.canvas}`, width 224px, border-right `1px solid {colors.hairline}`, flex column.

**`panel-config`** — Right node configuration panel.
- Background `{colors.canvas}`, width 320px, border-left `1px solid {colors.hairline}`.

**`panel-logs`** — Bottom execution log panel.
- Background `{colors.surface}`, backdrop-blur, height 192px, border-top `1px solid {colors.hairline}`.

### Inputs & Forms

**`text-input`** — Dark text field.
- Background `{colors.surface-soft}`, text `{colors.ink}`, border `1px solid {colors.hairline-soft}`, rounded `{rounded.md}`, padding `6px 12px`.
- Focus: border `{colors.primary}` with 50% opacity.

**`select-input`** — Dark select dropdown.
- Same as text-input, used for model/provider/destination selectors.

**`textarea`** — Dark multi-line input.
- Same as text-input, used for code, JSON, and goal descriptions.

### Tabs

**`underline-tab`** — Underline-style tab navigation (config panel: Configure / Code / MCP / Env).
- Inactive: text `{colors.steel}`, border-bottom `2px solid transparent`.
- Active: text `{colors.primary}`, border-bottom `2px solid {colors.primary}`.

**`segmented-tab`** — Category filter pills (connector modal).
- Inactive: background `{colors.surface-soft}`, text `{colors.steel}`, rounded `{rounded.md}`.
- Active: background `{colors.primary}`, text `{colors.on-primary}`.

### Badges & Status

**`badge-connected`** — Connected/configured status.
- Background `{colors.card-tint-mint}`, text `{colors.brand-green}`, typography `{typography.caption-bold}`, rounded `{rounded.full}`, padding `2px 8px`.

**`badge-disconnected`** — Not configured status.
- Background `{colors.surface}`, text `{colors.stone}`, rounded `{rounded.full}`, padding `2px 8px`.

**`badge-node-status`** — Node execution status dot.
- Running: `bg-amber-500`, Completed: `bg-emerald-500`, Failed: `bg-red-500`, Idle: `bg-gray-700`.
- Size: 8px circle.

**`node-handle`** — React Flow connection handle.
- Size: 8px circle, colored by node accent.

### Navigation

**`toolbar`** — Fixed top bar.
- Background `{colors.canvas}`, backdrop-blur, height 48px, border-bottom `1px solid {colors.hairline}`.
- Left: Logo (T icon), workflow name input, status badge.
- Right: Actions (Workflows dropdown, New, Save, Export, Run).

**`status-bar`** — Fixed bottom bar.
- Background `{colors.canvas}`, height 28px, border-top `1px solid {colors.hairline}`, text `{colors.stone}` 10px.
- Content: node count, edge count, API status dot, version, help button.

### Special Components

**`node-palette-item`** — Draggable palette entry.
- Padding `8px 10px`, rounded `{rounded.md}`, icon + label + description layout.
- Hover: border `{colors.hairline}`, background `{colors.surface}`.

**`log-entry`** — Individual log line in the bottom panel.
- Height 20px, font-mono 11px, flex with timestamp + source badge + message.
- Color coding: System (gray), Workflow (torque-blue), Agent (amber), Error (red).

**`export-modal`** — TypeScript code export modal.
- Width 800px, max-height 600px, gray-900 bg with code preview in gray-950.
- Includes filename bar with macOS-style traffic light dots.
- Download + Copy buttons in header.

**`onboarding-tour`** — driver.js step popover.
- Dark surface with primary blue accent.
- 10-step tour covering palette, canvas, toolbar, run, logs, providers, connectors, MCP.

## Do's and Don'ts

### Do
- Use `{colors.primary}` (torque-blue) as the dominant CTA across the toolbar
- Use 8px rounded buttons and 12px rounded cards consistently
- Apply backdrop-blur for panels overlaid on the canvas
- Use color-coded source tags in log entries (gray/blue/amber/red)
- Use `{rounded.md}` (8px) for buttons consistently
- Apply `{rounded.lg}` (12px) to all node cards and modals
- Use the grayscale palette (950/900/800/700) for dark surfaces
- Reserve accent colors for node type indicators and status

### Don't
- Don't use light surfaces for primary UI panels — the app is dark-first
- Don't use pill-shaped buttons; geometry is rectangular-sober
- Don't apply heavy shadows on flat documentation cards
- Don't use bright colors for body text against dark backgrounds
- Don't overuse accent colors — gray-950 canvas should dominate

## Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Left sidebar collapses. Node palette becomes bottom sheet. |
| Tablet | 768 – 1023px | Full layout with collapsible right panel. |
| Desktop | 1024 – 1279px | Full 3-panel layout. |
| Wide Desktop | ≥ 1280px | Full layout with maximized canvas. |

### Touch Targets
- Toolbar buttons render at 32px effective height
- Form inputs render at 32px height
- Node palette items: 40px height

### Collapsing Strategy
- **Left palette**: fixed at 224px on desktop, collapses below 1024px
- **Right config panel**: renders conditionally when a node is selected, 320px
- **Bottom log panel**: togglable, 192px open / 0px collapsed
- **Canvas**: fills remaining space, empty state shows centered prompt
- **Modals**: centered overlay with max-width constraints (720px–840px)

### Image Behavior
- Provider/connector icons from SimpleIcons CDN at 20x20–32x32px
- Node type icons use lucide-react at 13x13px
- Loading state: graceful error fallback on icon CDN failures

## Iteration Guide

1. Focus on ONE component at a time
2. Reference component names and tokens directly
3. Keep dark theme consistent — never introduce light surfaces for primary UI
4. Add new variants as separate `components:` entries
5. Default to `{typography.body-sm}` (14px) for most UI, `{typography.body-md}` (16px) for text content
6. Keep `{colors.primary}` (torque-blue) as the primary CTA color
7. Use `{rounded.md}` for buttons, `{rounded.lg}` for cards

## Known Gaps

- Animation/transition timings at 150–200ms ease
- Node drag-and-drop visual feedback not fully captured
- Specific color assignments for all 20+ node types documented in component code
- MCP tool/resource discovery UI is reactive — token coverage depends on connected servers
