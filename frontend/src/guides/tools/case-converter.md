---
title: Case Converter
description: Convert text between camelCase, PascalCase, snake_case, kebab-case, and more.
toolId: case-converter
icon: Aa
tags: [developer, text, utility]
---

# Case Converter

Transform text between any common casing format instantly.

## Supported Formats

| Format | Example |
|--------|---------|
| camelCase | `helloWorldFoo` |
| PascalCase | `HelloWorldFoo` |
| snake_case | `hello_world_foo` |
| SCREAMING_SNAKE | `HELLO_WORLD_FOO` |
| kebab-case | `hello-world-foo` |
| COBOL-CASE | `HELLO-WORLD-FOO` |
| Title Case | `Hello World Foo` |
| Sentence case | `Hello world foo` |
| lowercase | `hello world foo` |
| UPPERCASE | `HELLO WORLD FOO` |

## How to Use

1. Paste or type your text in the input field.
2. Click the target format button.
3. The converted text appears in the output and is copied to your clipboard.

## Tips

- Useful when switching between naming conventions across codebases (e.g., converting API response keys from `snake_case` to `camelCase` for JavaScript).
- Multi-line input is supported — each line is converted independently.
- The tool intelligently splits on spaces, underscores, hyphens, and camelCase boundaries, so `myAPIResponse` correctly becomes `my_api_response` in snake_case.

## How It Works

Case conversion requires two steps: **splitting** the input into words, then **reassembling** in the target format.

**Word splitting** handles multiple input formats:
- Split on whitespace and hyphens/underscores (for `snake_case`, `kebab-case`, space-separated)
- Split on camelCase boundaries using a regex like `/([a-z])([A-Z])/g` → inserts a split point between a lowercase letter and an uppercase letter
- Normalize consecutive delimiters (multiple spaces, `__`, `--`) to single splits

**Reassembly** then applies the target format's rules:
- `camelCase`: lowercase first word, capitalize first letter of subsequent words, join with no separator
- `PascalCase`: capitalize first letter of every word, join with no separator
- `snake_case`: lowercase all, join with `_`
- `Title Case`: capitalize first letter of each word (with optional exception list for articles/prepositions)

Unicode-aware implementations use `toLocaleLowerCase()` and `toLocaleUpperCase()` to handle non-ASCII characters (e.g., German ß, Turkish İ) correctly.

## What Powers This

All conversion logic uses pure JavaScript string manipulation — `split`, `map`, `join`, and regular expressions. No external libraries are required. Processing happens entirely in your browser.
