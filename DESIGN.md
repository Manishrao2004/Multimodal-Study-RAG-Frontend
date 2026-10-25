---
name: "Verity Study"
description: "Focused study workspace in dark matte graphite."
colors:
  primary: "#e8ecf3"
  primary-foreground: "#17191e"
  cyan: "#8fb8ee"
  cyan-deep: "#aacafa"
  cyan-soft: "#243044"
  success: "#9ccbb0"
  success-surface: "#1c2d25"
  warning: "#ddbd7c"
  warning-surface: "#302b20"
  destructive: "#ef9098"
  danger-surface: "#342329"
  canvas: "#111214"
  card: "#191a1e"
  popover: "#22242a"
  secondary: "#27292f"
  secondary-foreground: "#e0e2e7"
  accent: "#2a2d35"
  ink: "#f1f2f4"
  ink-muted: "#a9adb7"
  ink-faint: "#9298a5"
  line: "#2c2e35"
  input: "#393c46"
  switch-off: "#484c56"
  composer: "#1e2025"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0"
  composer:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  interface:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0"
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  inline: "4px"
  control: "6px"
  menu: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "28px"
  column: "32px"
  wide: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  search-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "34px"
    padding: "0 10px"
  navigation-row:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 10px"
    typography: "{typography.label}"
  citation:
    backgroundColor: "{colors.cyan-soft}"
    textColor: "{colors.cyan-deep}"
    rounded: "{rounded.inline}"
    height: "22px"
    padding: "0 5px"
  composer:
    backgroundColor: "{colors.composer}"
    textColor: "{colors.ink}"
    rounded: "{rounded.menu}"
    padding: "16px 14px 12px"
    typography: "{typography.composer}"
  select-trigger:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "10px 12px"
    width: "100%"
    typography: "{typography.label}"
  select-menu:
    backgroundColor: "{colors.popover}"
    rounded: "{rounded.menu}"
    padding: "4px"
  select-option:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.inline}"
    padding: "10px 32px 10px 10px"
    typography: "{typography.label}"
  switch-off:
    backgroundColor: "{colors.switch-off}"
    rounded: "{rounded.pill}"
    width: "40px"
    height: "24px"
    padding: "3px"
  switch-on:
    backgroundColor: "{colors.cyan}"
    rounded: "{rounded.pill}"
    width: "40px"
    height: "24px"
    padding: "3px"
  switch-thumb:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    width: "18px"
    height: "18px"
---

# Design System: Verity Study

## Overview

**Creative North Star: "Focused study workspace"**

Focused study workspace gives reading and asking the strongest visual priority. Opaque matte graphite surfaces, system sans typography, compact rows, and quiet separators support repeated study work without decorative staging.

The user-approved direction is dark-only and code-led. Functional blue identifies focus, citations, model provenance, and enabled switches; green, amber, and rose describe meaningful states. Evidence and settings are disclosed on request. No new raster assets or design comp are owed.

**Key Characteristics:**

- Dark-only matte graphite with opaque surfaces.
- System sans typography with zero tracking.
- Aligned reading and composer columns; compact secondary controls.
- Functional color and progressively disclosed evidence.

Finish disposition: **ship**, closing the supplied reviewer handoff after settings scrolling, custom Radix selectors, and toggle styling were fixed. This documentation verifies the current source implementation; it does not claim a new browser review. No new raster assets or comp are owed.

Source authority: `app/globals.css`, `app/workspace.css`, `app/page.tsx`, the workbench views, `components/workbench/select-field.tsx`, and the shared select, switch, button, and sheet components. `PRODUCT.md` and `.impeccable/surfaces/app-page-tsx.md` supply the confirmed product constraints and direction.

## Colors

Graphite neutrals carry the workspace; pale actions and functional accents establish hierarchy. Frontmatter values are normative; the CSS names are retained where practical. Duplicate CSS aliases are consolidated, and unused chart colors are not promoted into the system.

### Primary

- **Pale action** (`primary`): filled action buttons with dark `primary-foreground` text.
- **Functional blue** (`cyan`): the source name denotes a pale blue, used for focus rings, selected navigation icons, model provenance, and enabled switches.
- **Citation blue** (`cyan-deep`, `cyan-soft`): readable citation text over a subdued blue surface.

### Functional States

- **Source green** (`success`, `success-surface`): connected status, source grounding, successful ingestion, and correct quiz answers.
- **Caution amber** (`warning`, `warning-surface`): connecting status, mixed provenance, conflicts, and partial grounding.
- **Destructive rose** (`destructive`, `danger-surface`): offline status, destructive actions, errors, and unsupported token backgrounds.

### Neutral

- **Matte graphite** (`canvas`): main content and settings fields.
- **Navigation graphite** (`card`): sidebar, sheets, and framed controls.
- **Floating graphite** (`popover`): selector menus and muted hover surfaces.
- **Raised graphite** (`secondary`, `accent`): secondary controls and interaction surfaces; `secondary-foreground` keeps secondary text readable.
- **Reading white** (`ink`): main text and the off-white switch thumb. Answer prose has a local softer text color (`#e2e4e9`).
- **Muted and faint ink** (`ink-muted`, `ink-faint`): supporting labels, metadata, and placeholders.
- **Separator and field strokes** (`line`, `input`): structural divisions and stronger control boundaries.
- **Switch gray** (`switch-off`): unchecked track. **Composer graphite** (`composer`): the question field's opaque surface.

**The Functional Color Rule.** Use accent and status colors to communicate focus, provenance, selection, or state.

Sidecar tonal ramps are synthesized OKLCH inspection aids required by the document format; they are not additional app tokens or new state colors.

## Typography

**Body and interface font:** system sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`). **Code font:** system monospace (`"SFMono-Regular", Consolas, "Liberation Mono", monospace`). There is no separate display family. The approved system sans choice is deliberate.

- **Page headline:** semibold (600, 24px, 1.4); secondary views reduce to (22px) at the narrow breakpoint.
- **Sheet and result title:** semibold (600, 18px).
- **Answer body:** regular (400, 16px, 1.8). Markdown headings use (23px/1.4), (19px/1.5), and (16px/1.5), all semibold (600).
- **Composer:** regular (400, 16px, 1.7), retaining the reading size on mobile.
- **Base interface:** regular (400, 14px). Navigation, selectors, and settings use (13px); metadata commonly uses (12px), with compact timestamps and captions (11px).
- **Opening prompt:** medium (500, 28px, 1.3), reducing to (25px) on narrow screens. This is a surface-specific empty state, not a global display token.

Tracking is zero throughout. Counts and numerical metadata use tabular figures. Long prose wraps anywhere when necessary; code blocks scroll horizontally. User-message paragraphs remain (14px, 1.7) even though the transcript region itself is (16px).

**The Reading Priority Rule.** Keep answer prose and composer text at 16px; use the smaller interface hierarchy for navigation and metadata.

## Layout

The viewport shell uses `100dvh` with contained scrolling. Desktop has a fixed navigation/history column (256px) and a flexible main column; the conversation toolbar is (64px). Reading and composer regions share a centered maximum width (860px), including their desktop horizontal padding (32px per side). The answer is unframed; the composer is a genuinely framed input tool.

History and conversation bodies independently scroll with shrinking flex children (`min-height: 0`). Both engine settings and conversation settings have flexing, scrollable bodies (`flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain`), padded (24px) with section gaps (28px). Their sheet headers stay outside the scroll body.

Secondary pages use a centered maximum width (1200px), with desktop padding (36px 48px 64px). Study tools use a control column (280px), a flexible result column, and a gap (40px). Spacing is deliberate rather than a rigid universal grid; the frontmatter records reused steps.

- **At 1100px and below:** secondary-page padding becomes (32px 28px 48px); study controls become (240px), with a column gap (24px).
- **At 900px and below:** the sidebar disappears; a mobile header (56px) and initially closed navigation drawer replace it. The conversation toolbar becomes (52px), and history remains available through its own drawer. Navigation sheets use `min(88%, 300px)` width.
- **At 640px and below:** transcript padding becomes (24px 20px 8px); composer padding becomes (10px 16px) with safe-area-aware bottom spacing. Secondary-page padding becomes (24px 20px 40px). Document rows keep the name and action columns; study controls stack above results, separated by a top border. Tabs share the available width.

The minimum supported CSS viewport width is (320px). Mobile rules adjust layout and secondary typography; answer and composer text retain (16px).

## Elevation & Depth

Opaque tonal layering and thin borders define persistent depth. Buttons and sheets explicitly have no box shadow; sheet backdrops dim the workspace with black at 50% opacity. Floating scope and workspace selector menus carry the implemented soft shadow (`0 8px 24px #00000040`). Generic Radix action menus retain their shared component elevation; the selector shadow is not a universal replacement token.

**The Quiet Depth Rule.** Separate persistent surfaces with tones and borders; reserve the documented soft shadow for floating selector menus.

State changes use (160ms) color/border transitions. Switch tracks and thumbs use (150ms ease); shared sheets enter in (200ms) and exit in (150ms). Custom selector menus disable animation. Loading lines pulse in (1.8s ease-in-out). Reduced-motion CSS reduces animations and transitions to (0.01ms), limits animation iterations, and restores automatic scrolling.

## Shapes

Controls and navigation rows use restrained corners (6px); menus, composer, user messages, and upload zones use (8px). Citation markers and selector option rows use (4px). Sheets meet viewport edges with square corners. Full rounding belongs to binary switch tracks and circular thumbs/status dots. The study-tab wrapper has a local (7px) radius; it is not a new general radius tier.

One-pixel borders mark fields and divisions; the upload target uses a dashed border. Page sections remain unframed, with separators rather than nested cards.

## Components

### Buttons

Compact and predictable. Filled actions use pale action color with dark text; outline actions use transparent backgrounds and stronger field strokes. Ghost actions start muted and gain reading-white text on a muted surface at hover. Destructive actions use rose text on the danger surface. Default shared buttons are (36px) high with (6px) corners, medium-weight (14px) text, and horizontal padding (16px; 12px with an icon). Disabled shared buttons use half opacity and suppress pointer events. Icon tools use Lucide icons with accessible names; the workspace icon button is (36px square).

Global keyboard focus uses a functional-blue outline (2px, 3px offset); shared Radix/shadcn buttons and selectors also carry their component focus-ring treatment. Preserve both source-defined mechanisms.

### Inputs and Composer

Search fields use subtle stroked boundaries (34px height, 6px corners); focus-within turns the border blue. The composer uses an opaque surface with a stronger stroke, (8px) corners, and padding (16px 14px 12px). Its focus-within border becomes muted blue (`#738eaf`). Textarea height is constrained (46px minimum, 160px maximum); it does not resize manually. Attachments are contained rows with thumbnails, filenames, and a removal action.

### Navigation and Lists

Primary navigation rows are (36px) high, with (13px) labels and selected blue icons. History rows share the compact height, use truncated titles, and expose their action menu on hover, keyboard focus, or open state; those menus remain visible on mobile. Library documents use separator-based rows, not repeated floating cards. Study tools use the existing summary, comparison, and practice-question tabs.

### Shared Radix Selectors

The composer scope and the reusable settings/study selector share an opaque dropdown surface, (8px) corners, padding (4px), and option rows with a minimum height (40px). Options use (13px) text, (4px) corners, checked-state bright text, and highlighted-state muted surfaces. Rows may grow when labels wrap; 40px is not a clipping height.

The scope trigger is compact (34px high, 142px minimum width, 220px maximum width) and its menu is (224px) wide. Settings/study triggers are full-width (42px high); their menus follow the Radix trigger width with a minimum (200px), and all custom menus are capped at viewport width minus (32px). Trigger labels truncate; workspace option labels wrap. The reusable selector opens with a (6px) side offset. Keep Radix keyboard selection, check indicators, disabled states, portal positioning, and available-height scrolling.

### Shared Radix Switches

Binary settings use the shared Radix switch: track (40px by 24px), padding (3px), gray off, functional blue on, and an off-white thumb (18px diameter). The checked thumb translates (16px). An invisible extended hit region (`inset: -10px -2px`) surrounds the track. Disabled switches use opacity (0.45); keyboard focus has the global blue outline. The optional small implementation is (32px by 20px), with a (14px) thumb and (12px) translation; the conversation settings use the default size.

### Citations, Evidence, and Notices

Inline citation markers are compact (22px high, 4px corners) blue-backed links; hover deepens their surface (`#32445f`). Evidence is progressively disclosed beneath an answer or inside a detail sheet. Green, amber, and rose token backgrounds express grounding states. Conflict and request-error notices use their functional tinted surfaces with (6px) corners. They do not replace answer prose.

## Do's and Don'ts

### Do:

- Do preserve the dark-only matte graphite surfaces and system sans typography.
- Do align desktop reading and composer regions at the implemented 860px maximum width.
- Do reuse the shared Radix selectors and switches with their keyboard, focus, and disabled states.
- Do keep settings bodies scrollable within their sheets and respect reduced motion.

### Don't:

- Don't introduce theme switching, glassmorphism, decorative gradients, or physical desk imagery.
- Don't promote diagnostic metadata into the primary reading hierarchy.
- Don't replace shared selectors or switches with visually inconsistent controls.
- Don't treat synthesized sidecar tonal ramps as shipped application tokens.

Not canonized or repaired: no new defect is established by this source-only documentation pass. Local exceptions (14px user paragraphs, 11px metadata, 7px tab wrapper) remain component facts rather than new global tokens. The previously fixed scrolling, selector, and switch issues are not inherited as design rules.

## Document reader

Library and citation sheets show formatted PDF, Word and PowerPoint pages by
default. A compact wrapping toolbar provides page/slide selection and fit/zoom;
the document fits both dimensions of its reading stage initially. The Text tab
keeps extracted content secondary. Preview images override generic evidence-image
styles so they retain their own aspect ratio and sizing.

Open full document links to the dedicated `/reader` route in a separate tab,
carrying the source name, current page, and optional citation ID. This route has a
quiet filename/back toolbar and a document stage that fills the remaining viewport;
it does not use browser fullscreen or an expanded sheet. Controls wrap on narrow
screens and the page stage owns scrolling. Source documents remain local.

