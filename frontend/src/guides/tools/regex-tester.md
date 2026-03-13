---
title: Regex Tester
description: Test and debug regular expressions with live match highlighting and group capture display.
toolId: regex-tester
icon: 🔍
tags: [developer, text]
---

# Regex Tester

Test regular expressions in real time with live match highlighting and capture group inspection.

## Writing a Pattern

Type your regex in the **Pattern** field. You don't need to include surrounding slashes — just the pattern itself.

Example: `\b\w{5}\b` matches all 5-letter words.

## Flags

Select flags using the checkboxes next to the pattern input:
- **g** — global (find all matches)
- **i** — case-insensitive
- **m** — multiline (`^` and `$` match line boundaries)
- **s** — dotall (`.` matches newlines)

## Test String

Type or paste your test text in the large input area. Matches are **highlighted in real time** as you type.

## Match Details

Below the test string, a panel shows:
- Total number of matches
- Each match's value, index position, and length
- **Capture groups** (if your pattern uses parentheses)

## Common Patterns

| Pattern | Matches |
|---|---|
| `\d+` | One or more digits |
| `\w+` | One or more word characters |
| `[a-z]+` | Lowercase letters |
| `^.+$` | Entire non-empty lines |
| `\b\w+\b` | Whole words |

## Tips

- Use named groups `(?<name>...)` to make capture group output more readable.
- The **Replace** tab lets you test substitution with `$1`, `$2` backreferences.

## How It Works

Regular expressions describe patterns using a formal grammar. The engine compiles your pattern into a **finite automaton** — a state machine that reads the input character by character, transitioning between states based on the pattern rules.

Two main engine types exist:
- **NFA (Non-deterministic Finite Automaton)** — Can explore multiple paths simultaneously. JavaScript uses an NFA-based engine with backtracking, which enables features like backreferences but can be slow on pathological inputs.
- **DFA (Deterministic Finite Automaton)** — Only one state at a time, faster but can't support all regex features.

Key concepts: quantifiers (`*`, `+`, `?`) control repetition; anchors (`^`, `$`) match positions; groups `()` capture substrings; character classes `[a-z]` match sets.

## What Powers This

This tool uses JavaScript's built-in `RegExp` engine — the same one your browser uses natively. No external libraries are needed. Test results are computed live using `String.prototype.matchAll()` and `RegExp.prototype.exec()`.
