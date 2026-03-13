---
title: Monaco Editor
description: A full-featured VS Code-based code editor in your browser with syntax highlighting and IntelliSense.
toolId: monaco
icon: 💻
tags: [developer, code]
---

# Monaco Editor

Monaco is the same editor that powers VS Code — full syntax highlighting, IntelliSense, multi-cursor editing, and keyboard shortcuts, right in your browser.

## Selecting a Language

Use the **language picker** in the toolbar to switch syntax highlighting mode. Supports 50+ languages including JavaScript, TypeScript, Python, Rust, Go, SQL, JSON, YAML, Markdown, and more.

## Key Shortcuts

| Action | Shortcut |
|---|---|
| Command palette | F1 |
| Find | Ctrl/Cmd + F |
| Find & Replace | Ctrl/Cmd + H |
| Format document | Shift + Alt + F |
| Toggle comment | Ctrl/Cmd + / |
| Multi-cursor | Alt + Click |
| Duplicate line | Shift + Alt + ↓ |
| Move line | Alt + ↑ / ↓ |

## Theme

Toggle between **light** and **dark** themes using the moon/sun icon in the toolbar. The theme follows Dashpad's dark mode setting by default.

## Saving Content

Monaco saves your code to **browser local storage** automatically. Your work persists across page reloads.

## Tips

- Resize the card to give yourself more editing space — Monaco works best at larger sizes (L or XL).
- Use it as a scratch pad for code snippets, configuration files, or JSON exploration.
- Combine with the Mermaid tool to draft diagrams using code.

## How It Works

Monaco is a full code editor engine that tokenizes source code using **TextMate grammars** — the same grammar format used by many other editors. Tokenization assigns semantic types (keyword, string, comment, etc.) to each piece of text, enabling syntax highlighting.

Features like bracket matching, auto-indentation, and multi-cursor editing are implemented as editor plugins within Monaco's extension model. The editor uses a **piece-tree data structure** for efficient text storage and manipulation, enabling fast edits even in large files.

## What Powers This

This tool is powered by **Monaco Editor** — the open-source code editor engine developed by Microsoft that also runs Visual Studio Code. It is one of the most capable browser-based code editors available.
