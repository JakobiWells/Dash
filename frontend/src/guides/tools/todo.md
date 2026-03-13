---
title: Todo List
description: A simple task manager with persistent to-do items saved in your browser.
toolId: todo
icon: ✅
tags: [productivity]
---

# Todo List

A lightweight task manager that keeps your to-do items saved in the browser.

## Adding Tasks

Type a task in the input field at the top and press **Enter** (or click the add button) to add it to your list.

## Managing Tasks

- **Complete a task** — Click the checkbox next to any item to mark it done.
- **Delete a task** — Hover the item and click the trash icon, or use the delete button.
- **Reorder** — Drag and drop tasks to rearrange their order.

## Filters

Use the filter tabs to view:
- **All** — every task
- **Active** — incomplete tasks only
- **Done** — completed tasks only

## Tips

- Your tasks are stored in browser local storage — they persist across sessions.
- Keep the Todo card small for a compact checklist, or resize it wider for longer task names.
- Pair it with the Pomodoro Timer to work through your list in focused sessions.

## How It Works

A to-do list is fundamentally a **persistent ordered collection** of task objects. Each task typically stores: a unique ID, the task text, a completion boolean, a creation timestamp, and optionally a due date or priority.

**State management**: The list is kept in memory as a JavaScript array. Changes (add, complete, delete, reorder) mutate the array and immediately trigger a re-render of the UI.

**Persistence**: The task array is serialized to JSON and saved to **localStorage** on every change. On load, it's deserialized back. Because localStorage is synchronous and blocking, writes are kept small (just the JSON array) and triggered only on actual changes.

**Drag-to-reorder** uses either the HTML5 Drag and Drop API or a library like **@dnd-kit**, tracking the dragged item's index and the target drop index, then swapping array positions.

## What Powers This

Task storage uses the browser's built-in **localStorage** API. The UI is built with React state management. Drag-and-drop reordering uses either the native HTML5 DnD API or a React drag-and-drop library. No external services are involved — all data stays in your browser.
