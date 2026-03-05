# ToolBox — Project Brief

## Vision
A web-first productivity dashboard that lets users install, arrange, and resize tools natively — no tab switching, no sketchy websites, no ads. Think of it as a personal OS for everyday tasks like merging PDFs, extracting audio, generating citations, etc. Long term, users can build or AI-generate their own tools.

## Design Philosophy
- Modern, minimal, clean
- Light background with a subtle grid
- Tools appear as clean cards on the grid
- Nothing in the way — the tools are the UI

## Platform
- Web first (React), built for future expansion to iOS, Android, macOS, Windows
- No login for MVP — layout saved to localStorage

---

## Tech Stack
- **Vite** — build tool
- **React** — UI framework
- **Tailwind CSS** — styling
- **react-grid-layout** — drag, drop, resize

---

## Folder Structure
```
src/
  shell/          → grid, layout engine, drag/drop
  registry/       → tool manifest loader and registry
  tools/          → one folder per tool
    example-tool/
      index.jsx
      manifest.json
  components/     → shared UI (buttons, cards, modals)
  store/          → layout state (localStorage)
```

---

## Core Abstraction: The Plugin Contract

Every tool consists of exactly two files:

### manifest.json
```json
{
  "id": "unique-tool-id",
  "name": "Tool Display Name",
  "description": "One line description of what this tool does",
  "icon": "emoji or icon name",
  "defaultSize": { "w": 4, "h": 3 },
  "minSize": { "w": 2, "h": 2 }
}
```

### index.jsx
A standard React component. Receives no special props for now. Should be self-contained.

```jsx
export default function ExampleTool() {
  return (
    <div>Tool UI here</div>
  )
}
```

This is the contract. Every tool follows it. The registry loads tools by reading their manifest and rendering their component. Adding a new tool = adding a new folder.

---

## System Layers

1. **Shell** — renders the grid, handles layout state, drag/drop/resize
2. **Plugin Registry** — knows what tools exist, loads them by ID
3. **Tools** — self-contained React components with a manifest

---

## Build Order
1. Project setup (Vite + React + Tailwind + react-grid-layout)
2. Shell + grid
3. Plugin registry + manifest system
4. First tool (proves the system works end to end)
5. Second tool (proves adding tools is easy)
6. Polish UI to match design philosophy

---

## Future Considerations (not MVP)
- User login + accounts (for saving layouts and monetization)
- Sandboxed iframes for user-submitted tools (security)
- AI tool builder (user describes a tool, AI generates manifest + component)
- Mobile / native apps via React Native or Tauri

---

## Important Notes for Claude Code
- Less code is better — keep things simple and clean
- Always follow the plugin contract when adding tools
- New tools go in `src/tools/<tool-id>/` with `index.jsx` and `manifest.json`
- Don't over-engineer — we are building a prototype first
- When in doubt, ask before writing code