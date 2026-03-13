---
title: PDF Merger
description: Merge multiple PDF files into one, reorder pages, and download the result.
toolId: pdf-merger
icon: 📎
tags: [files, pdf]
---

# PDF Merger

Combine multiple PDF files into a single document — entirely in your browser, with no file uploads.

## Merging PDFs

1. Click **Add PDFs** or drag and drop multiple PDF files onto the card.
2. The files appear as a list with page count and file size.
3. **Drag to reorder** the files — the output PDF will follow this order.
4. Click **Merge** to combine them.
5. Click **Download** to save the merged PDF.

## Reordering Files

Drag the handle on the left of each file row to reorder before merging.

## Removing a File

Click the **✕** on any file in the list to remove it before merging.

## Tips

- All processing is done locally in your browser — your PDFs never leave your device.
- There's no limit on the number of PDFs you can merge at once, though very large files may take a moment.
- Pair with the PDF Splitter if you need to split one PDF and then re-merge specific pages.

## How It Works

A PDF file is structured as a collection of **objects** (pages, fonts, images, content streams) linked by a **cross-reference table** that maps object numbers to byte offsets within the file.

Merging PDFs involves:
1. Parsing each input PDF's object graph
2. **Renumbering objects** from each document to avoid collisions in the merged output
3. Building a new **page tree** that references all pages from all input documents in order
4. Writing a new cross-reference table and trailer pointing to the merged object set

Font and image resources referenced by pages must be copied and their references updated accordingly. Modern PDF versions use **cross-reference streams** (compressed) instead of plain tables.

## What Powers This

PDF merging uses **pdf-lib** — an open-source JavaScript library for creating and modifying PDF files. All processing happens entirely in your browser. No files are uploaded to any server.
