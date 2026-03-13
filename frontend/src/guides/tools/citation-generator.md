---
title: Citation Generator
description: Generate properly formatted citations in APA, MLA, Chicago, and other styles.
toolId: citation-generator
icon: 📝
tags: [writing, academic, reference]
---

# Citation Generator

Create correctly formatted citations for books, articles, websites, and more — in seconds.

## Citation Styles

- **APA** (7th edition) — psychology, social sciences
- **MLA** (9th edition) — humanities, literature
- **Chicago** (17th edition) — history, humanities (notes-bibliography and author-date)
- **Harvard** — common in UK/Australian academia
- **IEEE** — engineering, computer science

## Source Types

- **Website / Web page**
- **Book**
- **Journal article**
- **Newspaper / Magazine article**
- **Video** (YouTube, etc.)
- **Podcast**
- **Government / Report document**

## How to Use

1. Select your **citation style**.
2. Choose the **source type**.
3. Fill in the available fields (title, author, date, URL, etc.).
4. Click **Generate Citation**.
5. Copy the formatted citation into your document.

## Tips

- The more fields you fill in, the more accurate the citation. At minimum, provide the title and URL or author and year.
- For websites, include the **access date** — some styles require it.
- Copy the citation directly from the output box; formatting (italics, punctuation) is preserved when pasting into Word or Google Docs.
- Double-check auto-generated citations against your institution's style guide — details like punctuation can vary.

## How It Works

Citation formats are defined by style manuals published by academic and professional organizations. Each style specifies the exact order, punctuation, and formatting of bibliographic elements:

- **APA** (American Psychological Association) — emphasizes the publication date, placed early to indicate recency: Author, A. A. (Year). *Title*. Publisher.
- **MLA** (Modern Language Association) — emphasizes the author and source container: Author Last, First. *Title*. Publisher, Year.
- **Chicago** — two systems: Notes-Bibliography (humanities, uses footnotes) and Author-Date (sciences, similar to APA).
- **IEEE** — uses numbered references in order of appearance, with specific formatting for technical documents: [1] A. Author, "Title," *Journal*, vol. X, no. Y, pp. Z, Year.

The formatting rules (when to italicize, use quotes, abbreviate, include DOIs, etc.) are detailed in style manuals hundreds of pages long.

## What Powers This

Citations are generated using a rule-based JavaScript implementation of each style's formatting specification. For URL-based sources, metadata (title, author, date) may be fetched automatically. No external citation API is used — all formatting logic is built in and runs in your browser.
