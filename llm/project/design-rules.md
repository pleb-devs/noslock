Purpose: Visual and UI design conventions for Noslock - minimal cypherpunk terminal aesthetic.

# Noslock Design Rules

## Design Philosophy

- **Cypherpunk**: Privacy-first, no-nonsense, crypto-native
- **Terminal**: Monospace everything, system fonts, command-line feel
- **Minimal**: Only essential elements, black and white with accent
- **Hacker**: Clean, elegant, utilitarian - form follows function

## Color Palette

### Dark Mode (Primary)
```css
--bg-primary: #0a0a0a;       /* near-black */
--bg-secondary: #141414;     /* slightly lighter */
--bg-tertiary: #1a1a1a;      /* input backgrounds */
--text-primary: #e5e5e5;     /* off-white */
--text-secondary: #737373;   /* muted gray */
--text-muted: #525252;       /* very muted */
--accent: #22c55e;           /* terminal green */
--accent-dim: #16a34a;       /* darker green */
--error: #ef4444;            /* red */
--border: #262626;           /* subtle borders */
--selection: #22c55e20;      /* green with transparency */
```

### Light Mode (Optional)
```css
--bg-primary: #fafafa;
--bg-secondary: #f5f5f5;
--text-primary: #171717;
--text-secondary: #737373;
--accent: #16a34a;
--border: #e5e5e5;
```

## Typography

### Font Stack
```css
/* Everything is monospace */
font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Fira Code',
             Consolas, 'Liberation Mono', Menlo, monospace;
```

### Scale
| Element | Size | Weight | Style |
|---------|------|--------|-------|
| Title | 1.25rem (20px) | 400 | uppercase optional |
| Body | 0.875rem (14px) | 400 | normal |
| Small | 0.75rem (12px) | 400 | muted color |
| Code/Content | 0.875rem (14px) | 400 | normal |

### Text Styling
- All lowercase or mixed case (no Title Case)
- Generous letter-spacing for headers: `tracking-wide`
- Line height: 1.6 for readability

## Spacing

### Base Unit: 4px
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight inline |
| sm | 8px | Between related |
| md | 16px | Between sections |
| lg | 24px | Page padding |
| xl | 32px | Major sections |

### Container
- Max width: 640px (max-w-xl)
- Padding: 16px mobile, 24px desktop
- Center aligned

## Components

### Textarea (Primary Input)

```html
<textarea class="w-full h-80 bg-neutral-900 text-neutral-100
                 font-mono text-sm p-4 rounded border border-neutral-800
                 focus:outline-none focus:border-green-500
                 placeholder-neutral-600 resize-none"
          placeholder="// paste content here...">
</textarea>
```

**Style notes**:
- Dark background, light text
- Green focus border (terminal green)
- No resize handle
- Placeholder styled like a comment

### Buttons

**Primary (Create/Action)**
```html
<button class="w-full bg-green-600 text-black font-mono text-sm
               py-3 px-4 rounded hover:bg-green-500
               disabled:opacity-50 disabled:cursor-not-allowed
               uppercase tracking-wider transition-colors">
  [create]
</button>
```

**Secondary (Reset/Navigate)**
```html
<button class="w-full border border-neutral-700 text-neutral-300
               font-mono text-sm py-3 px-4 rounded
               hover:border-neutral-500 hover:text-neutral-100
               transition-colors">
  [new]
</button>
```

**Styling conventions**:
- Brackets around text: `[create]`, `[copy]`, `[new]`
- Uppercase with letter-spacing
- Green = primary action, border = secondary

### URL Display

```html
<div class="bg-neutral-900 border border-neutral-800 rounded p-4
            font-mono text-sm text-green-400 break-all select-all">
  <span class="text-neutral-500">noslock://</span>abc123...#def456...
</div>
```

**Style notes**:
- Protocol prefix in muted color
- Key/ID in accent green
- Fully selectable
- Break long strings

### Copy Button with Feedback

```html
<!-- Default -->
<button class="flex items-center gap-2 text-neutral-400
               hover:text-green-400 font-mono text-sm transition-colors">
  <ClipboardIcon class="w-4 h-4" />
  [copy]
</button>

<!-- Copied state -->
<button class="flex items-center gap-2 text-green-400 font-mono text-sm">
  <CheckIcon class="w-4 h-4" />
  copied_
</button>
```

### Error States

```html
<div class="border border-red-900 bg-red-950/50 rounded p-4">
  <p class="text-red-400 font-mono text-sm">
    error: decryption failed
  </p>
  <p class="text-neutral-500 font-mono text-xs mt-2">
    // key mismatch or corrupted data
  </p>
</div>
```

### Loading States

```html
<div class="flex items-center gap-3 text-neutral-400 font-mono text-sm">
  <span class="animate-pulse">_</span>
  encrypting...
</div>
```

Alternative with dots:
```html
<span class="animate-pulse">encrypting...</span>
```

### Status Messages

```html
<!-- Success -->
<p class="text-green-400 font-mono text-sm">✓ published to 3 relays</p>

<!-- Info -->
<p class="text-neutral-500 font-mono text-sm">// fetching from relays</p>

<!-- Warning -->
<p class="text-yellow-500 font-mono text-sm">! link grants read access</p>
```

## Layout

### Page Structure
```
┌─────────────────────────────────────┐
│  noslock_                           │  header: 48px
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │      main content area        │  │  flex-1
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  // zero-knowledge • nostr          │  footer: optional
└─────────────────────────────────────┘
```

### Header
```html
<header class="py-4 px-4">
  <h1 class="font-mono text-lg text-neutral-100 tracking-wide">
    noslock<span class="text-green-500">_</span>
  </h1>
</header>
```

### Footer (Optional)
```html
<footer class="py-4 px-4 text-center">
  <p class="font-mono text-xs text-neutral-600">
    // zero-knowledge encrypted pastebin on nostr
  </p>
</footer>
```

## Interactions

### Focus States
```css
focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20
```

### Hover States
- Buttons: color shift (green brighter, borders lighter)
- Links: underline or color shift to green
- No transforms or scale effects

### Transitions
```css
transition-colors duration-150
```

### Cursor
- Blinking cursor effect for loading: `animate-pulse` on underscore `_`
- No custom cursors

## Accessibility

### Requirements
- Keyboard navigation for all interactive elements
- Visible focus indicators (green ring)
- Sufficient contrast (check neutral-400 on dark bg)
- Screen reader labels for icon-only buttons

### Contrast Ratios
| Pair | Ratio | Pass |
|------|-------|------|
| neutral-100 on 0a0a0a | 18:1 | ✓ |
| neutral-400 on 0a0a0a | 6.5:1 | ✓ |
| green-400 on 0a0a0a | 8:1 | ✓ |
| green-600 on black text | 7:1 | ✓ |

## Iconography

- Minimal use of icons
- Heroicons outline style, 16px or 20px
- Match text color
- Common: clipboard, check, x-mark

## Animation

### Allowed
- `transition-colors` for hover/focus
- `animate-pulse` for loading cursor
- `animate-spin` for spinner if needed

### Not Allowed
- Page transitions
- Entrance animations
- Bounces, slides, fades
- Skeleton loaders

## Copywriting Style

- Lowercase preferred
- Technical/terse language
- Comment-style hints: `// this is a hint`
- Bracket notation for actions: `[create]`, `[copy]`
- Underscore for cursor/brand: `noslock_`

### Examples
```
// enter text to encrypt
[create]
copied_
error: not found
✓ encrypted
// 3 relays
```

## Don'ts

- No rounded-full buttons
- No gradients
- No shadows (except very subtle if needed)
- No emojis
- No Title Case
- No serif fonts
- No bright white (#fff) - use off-white
- No blue accents - green is the accent color
