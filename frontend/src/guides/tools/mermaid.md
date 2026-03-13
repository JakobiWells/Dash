---
title: Mermaid Diagrams
description: Create flowcharts, sequence diagrams, Gantt charts, and more with Mermaid syntax.
toolId: mermaid
icon: 🧜
tags: [developer, diagrams]
---

# Mermaid Diagrams

Write text-based diagrams using Mermaid syntax and see them rendered live.

## Diagram Types

Mermaid supports many diagram types. Start your code with the type declaration:

```
flowchart TD
graph LR
sequenceDiagram
classDiagram
erDiagram
gantt
pie
```

## Flowchart Example

```
flowchart TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Ship it]
  B -- No --> D[Debug]
  D --> B
```

## Sequence Diagram Example

```
sequenceDiagram
  Alice->>Bob: Hello Bob!
  Bob-->>Alice: Hi Alice!
```

## Exporting

Use the **Export** button (PNG or SVG) to download your diagram as an image.

## Tips

- The diagram updates live as you type.
- Use `%%` for comments in your diagram code.
- See the full syntax reference at [mermaid.js.org](https://mermaid.js.org/intro/).
- Resize the card wider for more complex diagrams.

## How It Works

Mermaid parses a diagram definition language and renders it as SVG. The process has three stages:
1. **Lexing & parsing** — The text is tokenized and parsed into an abstract syntax tree (AST) representing the diagram structure.
2. **Layout** — For graphs and flowcharts, the **Dagre** layout algorithm (based on the Sugiyama method) computes node positions to minimize edge crossings.
3. **Rendering** — The positioned nodes and edges are drawn as SVG elements using **D3.js**.

Sequence diagrams use a timeline-based layout; Gantt charts use a calendar projection; pie charts use basic trigonometry to compute arc angles.

## What Powers This

Diagrams are rendered using **Mermaid.js** — an open-source diagramming library. Layout for graphs uses the **Dagre** algorithm. Rendering uses **D3.js**. All processing happens in your browser — no server involved.
