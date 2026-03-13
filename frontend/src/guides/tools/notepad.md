---
title: Notepad
description: A persistent rich-text notepad that saves automatically to your browser.
toolId: notepad
icon: 📝
tags: [productivity, writing]
---

# Notepad

A clean, distraction-free text editor that auto-saves to your browser's local storage. Your notes persist across page refreshes.

## Writing Notes

Just click inside the pad and start typing. Content is saved automatically as you type — no save button needed.

## Formatting

The notepad supports basic **rich text** formatting via keyboard shortcuts:

| Action | Shortcut |
|---|---|
| Bold | Ctrl/Cmd + B |
| Italic | Ctrl/Cmd + I |
| Underline | Ctrl/Cmd + U |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |

## Tips

- Resize the card taller for more writing space.
- Use the notepad alongside other tools — for example, take notes while referencing the Formula Bank or watching a stock chart.
- To start fresh, select all (`Ctrl/Cmd + A`) and delete.

## How It Works

A browser-based notepad stores text using the **Web Storage API**. There are two variants:
- **localStorage**: persists indefinitely until explicitly cleared — survives page reloads, tab closures, and browser restarts
- **sessionStorage**: cleared when the tab is closed

Text is stored as a UTF-16 encoded string under a key. The storage limit is typically 5–10 MB per origin. For larger notes, some implementations use **IndexedDB** — a transactional key-value database built into the browser that supports much larger storage quotas.

**Auto-save** works by debouncing the save operation: a timer is reset on every keystroke, and the actual save only fires after a short idle period (e.g., 500ms with no typing). This prevents excessive writes while ensuring data isn't lost.

## What Powers This

Text storage uses the browser's built-in **localStorage** or **IndexedDB** API. The text editor is either a styled `<textarea>` element or the browser's **contenteditable** API. Markdown preview (if available) uses a JavaScript markdown renderer. No external services are used — your notes never leave your browser.
