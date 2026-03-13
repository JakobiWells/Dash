---
title: Stat Tables
description: Interactive statistical distribution calculators and tables for Z, t, chi-squared, and F distributions.
toolId: stat-tables
icon: 📐
tags: [statistics, math, reference]
---

# Stat Tables

Interactive calculators and reference tables for the four major statistical distributions: Z (normal), t, chi-squared (χ²), and F.

## Distributions

Switch between distributions using the tabs at the top:
- **Z** — Standard normal distribution, used for large sample hypothesis tests and confidence intervals.
- **t** — Student's t-distribution, used for small sample tests. Requires degrees of freedom.
- **χ²** — Chi-squared distribution, used for goodness-of-fit and independence tests.
- **F** — F-distribution, used in ANOVA and regression tests. Requires two degrees of freedom (numerator, denominator).

## Using the Calculator

1. Enter your **test statistic** (the value from your data analysis).
2. Set the **significance level α** (commonly 0.05 or 0.01).
3. Choose a **tail type** — left, right, or two-tailed.
4. The calculator shows:
   - The **p-value** for your test statistic
   - The **critical value** at your chosen α
   - A significance verdict (✓ significant / ✗ not significant)

## Distribution Graph

The SVG graph shows the distribution curve with:
- **Blue shaded area** — the tail probability (p-value region)
- **Red dashed line** — your test statistic
- **Amber dashed line** — the critical value at α

Click the **camera icon** to copy the graph as a PNG image.

## Tips

- The p-value tells you the probability of observing your result (or more extreme) under the null hypothesis.
- A p-value below α indicates the result is statistically significant at that level.
- Resize the card taller to see the graph at a larger size.

## How It Works

Statistical distributions are mathematical models that describe the probability of outcomes. Each has a **probability density function (PDF)** and a **cumulative distribution function (CDF)**.

- **Z (Standard Normal)** — Bell curve centered at 0 with standard deviation 1. Described by `f(x) = (1/√2π) * e^(-x²/2)`. The CDF has no closed form and is approximated numerically.
- **t-distribution** — Similar to normal but with heavier tails, parameterized by degrees of freedom (df). As df → ∞, it converges to the standard normal. Used when population variance is unknown.
- **Chi-squared (χ²)** — The distribution of the sum of k squared standard normal variables, where k is the degrees of freedom. Used in goodness-of-fit tests.
- **F-distribution** — The ratio of two chi-squared distributions divided by their degrees of freedom. Used in ANOVA to compare group variances.

P-values are computed by integrating the PDF from the test statistic to ±∞ (tails). Critical values are the inverse of the CDF at significance level α.

## What Powers This

Distribution calculations use **jStat** — an open-source JavaScript statistics library. CDFs are computed using numerical integration and series approximations. All calculations run in your browser.
