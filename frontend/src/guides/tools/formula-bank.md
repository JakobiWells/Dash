---
title: Formula Bank
description: Browse and copy 170+ math and physics formulas rendered in LaTeX.
toolId: formula-bank
icon: ∑
tags: [math, reference, physics]
---

# Formula Bank

The Formula Bank is a searchable reference of 170+ formulas across 14 categories, rendered in LaTeX using KaTeX.

## Browsing Formulas

Use the **category tabs** at the top to browse by subject:

- **Algebra** — Quadratic formula, binomial theorem, logarithm rules, series
- **Geometry** — Areas, volumes, Heron's formula, arc length
- **Trigonometry** — Pythagorean identities, angle sum, double angle, law of sines/cosines
- **Calculus** — Derivatives, integrals, FTC, Taylor series, Stokes' theorem
- **Linear Algebra** — Determinants, eigenvalues, SVD, dot/cross product
- **Diff. Equations** — ODEs, Laplace/Fourier transforms, heat/wave equations
- **Mechanics** — Newton's laws, kinematics, energy, torque, gravity
- **Electromagnetism** — All 4 Maxwell equations (differential + integral), Lorentz force
- **Thermodynamics** — Ideal gas law, entropy, Carnot efficiency, Gibbs/Helmholtz
- **Quantum Mechanics** — Schrödinger equation, uncertainty principle, hydrogen levels
- **Relativity** — Lorentz factor, time dilation, Einstein field equations
- **Waves & Optics** — Snell's law, Doppler, diffraction, lens equation
- **Chemistry** — Arrhenius, Nernst, Henderson–Hasselbalch, Rydberg
- **Statistics** — Normal distribution, Bayes' theorem, CLT, chi-squared

## Searching

The search bar at the top searches **across all categories simultaneously**. Try searching for a concept name (e.g. *entropy*, *eigenvalue*, *quadratic*) or a category name (e.g. *quantum*).

## Copying a Formula

Each formula card has a **copy icon** in the top-right corner. Clicking it copies the raw **LaTeX source** to your clipboard, ready to paste into any LaTeX editor, KaTeX input, or document.

For example, the quadratic formula copies as:
```
x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```

## Using with KaTeX

Dashpad includes a **KaTeX tool** where you can type or paste LaTeX and see it rendered live. The Formula Bank and KaTeX tool are designed to work together — copy a formula from the bank, paste it into KaTeX, and modify it as needed.

## How It Works

Mathematical formulas are typeset using the **TeX typesetting system**, invented by Donald Knuth in 1978. TeX uses a **box-and-glue model**: expressions are composed of boxes (characters, symbols, sub-expressions) with elastic spacing (glue) between them. The renderer recursively measures, positions, and arranges these boxes to produce publication-quality output.

Key challenges in math typesetting:
- **Fraction layout**: numerator and denominator must be centered above/below the fraction bar, which must be wide enough for both
- **Accent placement**: primes, dots, and hats must be precisely positioned above characters of varying widths
- **Delimiter sizing**: brackets and parentheses scale vertically to match the height of their contents

## What Powers This

Formulas are rendered using **KaTeX** — an open-source LaTeX math rendering library developed by **Khan Academy**. KaTeX renders directly to HTML+CSS and SVG, producing output identical to LaTeX without requiring any plugins. It is one of the fastest LaTeX renderers available for the web.
