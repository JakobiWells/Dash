---
title: Quick Links
description: Save and access your most-used URLs in one place.
toolId: quick-links
icon: 🔗
tags: [productivity, utility, bookmarks]
---

# Quick Links

A personal bookmark panel — save your most-visited URLs and open them in one click.

## Adding Links

1. Click **+ Add Link**.
2. Enter a **label** (display name) and the **URL**.
3. Optionally pick an **icon** or emoji.
4. Click **Save**.

The link appears as a button in your Quick Links panel.

## Managing Links

- **Reorder** — Drag links to rearrange them.
- **Edit** — Click the pencil icon on a link to change its label or URL.
- **Delete** — Click the trash icon to remove a link.

## Organization

Group links by adding **section headers**:
1. Click **+ Add Section**.
2. Name the section (e.g., "Work", "Learning", "Social").
3. Drag links into the appropriate section.

## Tips

- Quick Links replaces the need to keep browser bookmarks open in a separate window.
- Add links to internal tools, project dashboards, documentation sites, or anything you visit daily.
- Works great as a startup card — keep it prominently on your dashboard for immediate access.
- URLs open in a new tab by default.

## How It Works

Quick Links is essentially a **personal bookmark manager** stored in your browser. Each link is a simple object: `{ id, label, url, icon }`. Sections add a lightweight grouping layer: `{ id, title, items: [...] }`.

The data structure is serialized to JSON and stored in **localStorage** or synced to a backend if signed in. The entire link set is small enough (typically < 10KB) that it can be read and written synchronously on every change without performance concerns.

**URL validation** checks that entered URLs have a valid scheme (`http://` or `https://`) and a parseable hostname, using the browser's built-in `URL` constructor as a validator.

**Drag-to-reorder** within and between sections uses index-based array manipulation: when an item is dropped at position j from position i, the array is sliced and spliced to move the item.

## What Powers This

Link data is stored using the browser's **localStorage** API. Drag-and-drop reordering uses either the HTML5 Drag and Drop API or a React DnD library. Favicon fetching (if shown) uses the target site's `/favicon.ico` or a favicon service. No external services are required for core functionality.
