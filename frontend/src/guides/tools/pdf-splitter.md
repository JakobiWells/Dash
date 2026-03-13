---
title: PDF Splitter
description: Split a PDF into individual pages or custom page ranges.
toolId: pdf-splitter
icon: ✂️
tags: [files, pdf]
---

# PDF Splitter

Extract pages or ranges from a PDF — useful for separating documents, removing pages, or extracting specific sections.

## How to Split

1. Drop a PDF onto the card or click **Choose PDF**.
2. A **page preview** grid shows all pages as thumbnails.
3. Choose a split mode:
   - **Extract all pages** — one PDF file per page
   - **Custom range** — specify pages like `1-3, 5, 7-9`
4. Click **Split** and then **Download** the resulting files (zipped if multiple).

## Custom Range Syntax

Enter page numbers and ranges separated by commas:
- `1, 3, 5` — pages 1, 3, and 5
- `1-5` — pages 1 through 5
- `1-3, 6-8` — pages 1–3 and 6–8

## Tips

- All processing is local — no uploads, no servers.
- Pair with the PDF Merger to extract specific pages and then re-combine them into a new document.
- Page thumbnails are generated in your browser and may take a second for large files.

## How It Works

Splitting a PDF is essentially the reverse of merging: rather than combining multiple page trees into one, a subset of pages is extracted from the original document's object graph.

The process:
1. Parse the source PDF and locate the **page tree** node containing the target pages
2. Extract only the objects referenced (directly or transitively) by those pages — fonts, images, content streams, annotations
3. Build a new minimal PDF containing only those objects and a new page tree

The challenge is **resource deduplication**: if multiple pages share the same font or image object, it must be included only once in the output but referenced correctly by all pages that use it.

## What Powers This

PDF splitting uses **pdf-lib** — an open-source JavaScript library for creating and modifying PDF files in the browser. All processing happens locally in your browser. No files are uploaded to any server.
