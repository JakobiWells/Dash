---
title: KaTeX Editor
description: Type LaTeX math and see it rendered beautifully in real time.
toolId: katex
icon: 𝑥
tags: [math, latex]
---

# KaTeX Editor

Type LaTeX math expressions and see them rendered using KaTeX — the same engine used in academic papers and scientific software.

## Writing Math

Type LaTeX in the input field. The rendered output appears below in real time.

Examples:
- `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` → quadratic formula
- `\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}` → Gaussian integral
- `\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}` → Basel problem

## Common LaTeX Commands

| Command | Output |
|---|---|
| `\frac{a}{b}` | Fraction |
| `\sqrt{x}` | Square root |
| `x^2` | Superscript |
| `x_i` | Subscript |
| `\sum_{i=1}^n` | Summation |
| `\int_a^b` | Integral |
| `\alpha \beta \gamma` | Greek letters |
| `\infty` | Infinity symbol |

## Saving Expressions

Click **Save** to add the current expression to your saved list. Saved expressions appear below and can be clicked to reload.

## Tips

- Use the **Formula Bank** tool to browse 170+ formulas and copy their LaTeX directly into this editor.
- Press `Ctrl/Cmd + Enter` to render if auto-render is disabled.
- Wrap multi-line equations with `\begin{align} ... \end{align}`.

## How It Works

TeX (and LaTeX) typesetting uses a **box-and-glue model**: mathematical expressions are broken into boxes (characters, symbols, subexpressions), and glue (elastic spacing) is placed between them. The layout engine recursively measures and positions boxes to produce the final layout.

Key concepts:
- **Math mode vs text mode** — TeX switches rendering rules depending on context.
- **Font metrics** — Precise character dimensions are loaded from font metric tables to calculate exact spacing.
- **Stretchable delimiters** — Brackets, parentheses, and fraction bars are scaled to match the height of their contents.

## What Powers This

This tool uses **KaTeX** — an open-source LaTeX math rendering library developed by Khan Academy. KaTeX is designed for fast, server and client-side rendering and produces identical output to LaTeX. It renders directly to HTML/CSS and SVG, requiring no plugins or MathML support.
