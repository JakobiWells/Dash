---
title: Word Counter
description: Count words, characters, sentences, and reading time for any text.
toolId: word-counter
icon: 📄
tags: [writing, utility, productivity]
---

# Word Counter

Paste or type any text to get a real-time breakdown of words, characters, sentences, and more.

## What's Counted

| Metric | Description |
|--------|-------------|
| **Words** | Total word count |
| **Characters** | Total characters (with spaces) |
| **Characters (no spaces)** | Characters excluding whitespace |
| **Sentences** | Approximate sentence count |
| **Paragraphs** | Number of paragraph breaks |
| **Reading Time** | Estimated at ~200 words per minute |
| **Speaking Time** | Estimated at ~130 words per minute |

## How to Use

Paste or type your text in the input area. All counts update live as you type.

## Character Limits

Use the **target** field to set a character or word limit. A progress bar shows how close you are to the limit — useful for Twitter/X posts (280 characters), meta descriptions (160 characters), or academic word counts.

## Tips

- Reading time is based on average adult reading speed (~200 wpm). Actual time varies by complexity.
- Use the **character limit** feature when writing social media captions, SMS messages, or form fields with known limits.
- The tool counts words by splitting on whitespace — hyphenated words like "well-known" count as one word.
- Pair with the **Translator** to check if translated text stays within your original word count.

## How It Works

**Word counting** splits text on whitespace using a regular expression: `/\S+/g` matches each non-whitespace sequence as one word. This handles multiple spaces, tabs, and newlines correctly.

**Character counting** has two variants:
- With spaces: `string.length` — counts every Unicode code point
- Without spaces: count characters where `char !== ' '` (or use `/\S/g`)

**Sentence counting** uses punctuation heuristics: split on `.`, `!`, `?` followed by whitespace or end of string, then filter empty results. This is an approximation — edge cases like abbreviations ("Dr. Smith") and ellipses ("...") can cause overcounting.

**Reading time** is estimated at ~200–250 words per minute (the average adult silent reading speed, per research by Brysbaert et al., 2019). Speaking time uses ~130 words per minute (typical presentation pace).

## What Powers This

All text analysis uses JavaScript's built-in string methods and regular expressions. No external libraries are used. All computation happens locally in your browser — your text is never sent anywhere.
