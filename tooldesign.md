# Dashpad Tool Design Standards

A living document defining the visual and interaction patterns for all tool components.
Update this before implementing changes.

---

## Core Principles

- **Space efficiency first.** Tools should be usable at small sizes. Dense, not cluttered. Users can resize if they want more room.
- **Theme-ready.** All colors, fonts, and radii reference CSS variables — never hardcoded values — so the theme system applies automatically.
- **Every tool follows the same shell.** Header → body. The body layout varies by tool type, but the shell is always the same.

---

## Tool Shell

Every tool lives inside a `ToolCard` wrapper which provides the header. The header currently shows: icon, name, guide button, settings button, close button.

**Add a collapse toggle button to the header.** When toggled closed, only the header bar is visible — the body is hidden. The tool shrinks to header height on the grid and other tools do not reflow (the grid slot stays reserved). Toggle state is persisted per instance in localStorage.

Body content uses:
```jsx
<div className="flex flex-col h-full gap-3 p-3 overflow-hidden">
```

---

## Tool Body Layouts

Tools fall into one of three layout types:

### Type A — File pipeline tools
*Examples: file-converter, pdf-merger, audio-extractor, media-downloader*

Layout (top to bottom):
1. **Input zone** — compact file drop/paste area (see File Input below)
2. **Pipeline indicator** — a downward arrow or chevron with an animated fill showing processing progress (see Processing Indicator below)
3. **Output zone** — compact file row or preview depending on tool (see Output below)
4. **Settings** — any format selectors, options, or controls relevant to the operation

The pipeline indicator sits between input and output at all times — idle, processing, and done. When idle it is static/unfilled. When processing it animates. When done it shows fully filled (green).

### Type B — Preview tools
*Examples: bg-remover, color-tool, handwriting-converter*

Layout:
1. **Input zone** — compact file drop/paste area OR interactive input (color picker, canvas)
2. **Preview area** — takes remaining space, shows the result inline
3. **Settings / actions** — below the preview or in a sidebar strip

The preview is the center of the tool. Results are shown visually, not as a file row.

### Type C — No-file tools
*Examples: calculator, word-counter, translator, weather, notepad*

These tools have their own unique layouts. No file input or output zones. No pipeline indicator. Design per-tool.

---

## File Input Zone

The input zone is always **compact** — it never dominates the tool.

### Empty state
```
┌─────────────────────────────┐
│  ↑  Drop file or click      │
│     to browse               │
│     Accepts: .mp4, .mov…    │
└─────────────────────────────┘
```
- Height: fixed `py-4` — never `flex-1`
- Border: `2px dashed` in muted color, turns blue on drag
- Drag highlight: blue border + very light blue background
- Supports: click to browse, drag and drop, **Ctrl/Cmd+V to paste** (for image/file tools)
- Accepts paste events on the window when the tool is in focus

### File selected state — collapses to a single row
```
[icon]  filename.mp4   12.4 MB   [✕]
```
- Single horizontal row, fixed height
- Truncated filename, file size, remove button
- No border change — just a subtle filled background

### Rules
- Always show: filename (truncated), file size, remove/clear button
- Multiple files (pdf-merger): stacked rows in a small scrollable list, max `h-24`
- Image tools only: show a small thumbnail (`w-8 h-8`) next to the filename

---

## Pipeline Indicator (Processing)

Sits between input and output in Type A tools. Always visible.

### Visual
A downward-pointing chevron/arrow SVG:
- **Idle**: gray, unfilled
- **Processing**: animates a fill sweeping downward (top → bottom) in blue, looping
- **Done**: filled solid green, stays until cleared
- **Error**: filled solid red

```
Idle:        ∨  (gray outline)
Processing:  ∨  (blue fill animating)
Done:        ∨  (solid green)
Error:       ∨  (solid red)
```

For determinate progress (known percentage), the fill stops at the percentage point instead of looping.

Label text below the arrow: "Converting…", "Extracting…", "Done", "Failed".

This is implemented as a shared `<PipelineArrow status="idle|processing|done|error" progress={0–1} label="..." />` component.

---

## Output Zone

### When visual preview is NOT useful
*(file type changes, merges, splits — the content doesn't need to be seen)*

Compact file row, same style as file selected state but with a download button:
```
[icon]  output.mkv   8.2 MB   [Download]  [Copy]
```

### When visual preview IS useful
*(bg-remover, image compression, handwriting converter)*

Show the result inline — the preview area fills available space. Below the preview:
```
[Download]  [Copy to clipboard]  [New]
```

---

## Theming

Tools must be theme-ready. All visual values reference CSS variables, never Tailwind hardcoded colors.

**Recommendation: CSS variables on `:root`.**
A theme switch updates the variables once; every tool and component picks up the change automatically — including font, color, and border radius. No per-tool changes needed when adding new themes.

CSS variable set to define (TBD — expand when building the theme system):
```css
:root {
  --dash-bg: ...;           /* tool card background */
  --dash-surface: ...;      /* inputs, file rows, cards within tools */
  --dash-border: ...;       /* all borders */
  --dash-text: ...;         /* primary text */
  --dash-text-muted: ...;   /* labels, helper text */
  --dash-accent: ...;       /* buttons, highlights, active states */
  --dash-success: ...;      /* done state, download buttons */
  --dash-danger: ...;       /* errors, destructive actions */
  --dash-font: ...;         /* font-family */
  --dash-radius: ...;       /* base border radius */
}
```

Tools should use `style={{ color: 'var(--dash-text)' }}` or a Tailwind plugin config that maps utilities to these variables.

---

## Text & Copy Behavior

- **All text in tools is selectable** (no `user-select: none` on content areas)
- **Errors are selectable** — users should be able to copy error messages
- **Values likely to be reused** get an explicit copy button: color hex codes, UUIDs, translated text, converted values, API responses, etc.
- Copy button: small icon button (`w-6 h-6`) that appears inline next to the value. Shows a checkmark for 2 seconds after copying.
- **Paste support**: tools that accept file or image input listen for `paste` events. Ctrl/Cmd+V drops the clipboard file/image directly into the input zone without opening a picker.

---

## Decisions

- **Collapsed state**: header bar only, no content hint — just the existing icon, name, and buttons
- **Collapse toggle**: chevron (`⌄` open → `⌃` closed), placed in the header alongside the existing buttons
- **Border radius**: `--dash-radius` applies to both the tool card itself and all internal elements, controlled via the theme system
- **Font**: deferred — fonts will be part of the theme system, designed separately

## Still To Define

- Exact CSS variable names and default values for light/dark themes
- Theme picker UI (where it lives in settings, what presets ship by default)
