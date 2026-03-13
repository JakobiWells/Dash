---
title: Desmos Graphing Calculator
description: How to plot functions, use sliders, and explore math visually with Desmos.
toolId: desmos
icon: 📈
tags: [math, graphing]
---

# Desmos Graphing Calculator

Desmos is a full-featured graphing calculator embedded directly in Dashpad. It supports 2D function plotting, parametric curves, polar graphs, implicit equations, and interactive sliders.

## Plotting a Function

Type any expression into the input list on the left side:

- `y = x^2` — plots a parabola
- `y = sin(x)` — plots a sine wave
- `y = 2x + 1` — plots a line

Desmos automatically graphs as you type. Use `^` for exponents and standard function names like `sin`, `cos`, `tan`, `log`, `sqrt`.

## Using Sliders

Define a parameter and Desmos will offer to create a slider for it:

1. Type `y = a * sin(b * x + c)`
2. Desmos will detect `a`, `b`, `c` as undefined variables and prompt you to add sliders.
3. Drag the sliders to see the graph update in real time.

This is great for exploring how parameters affect a curve.

## Implicit Equations

You can graph equations that aren't solved for y:

- `x^2 + y^2 = 25` — a circle of radius 5
- `x^2/9 + y^2/4 = 1` — an ellipse

## Parametric Curves

Switch to parametric mode by typing a point expression:

```
(cos(t), sin(t))
```

Then set the range of `t` in the expression settings.

## Inequalities

Shade regions by using inequality symbols:

- `y > x^2` — shades above a parabola
- `y < sin(x)` — shades below a sine curve

## Tips

- **Zoom** — Scroll to zoom, or use the + / − buttons.
- **Pan** — Click and drag the graph background.
- **Table** — Click the `+` icon and choose *Table* to enter data points and plot them.
- **Settings** — Click the wrench icon to adjust axes, grid, and radians/degrees mode.

## How It Works

Graphing a function means computing `y = f(x)` for many values of x and connecting the results. Desmos does this with several sophisticated techniques:

- **Adaptive sampling**: Rather than evaluating at fixed intervals, it detects regions of rapid change (steep slopes, discontinuities) and samples more densely there, producing smooth curves efficiently.
- **Implicit graphing**: For equations like `x² + y² = 25`, Desmos uses a **marching squares** algorithm — it evaluates the expression on a grid and traces contour lines where the value crosses zero.
- **Interval arithmetic**: To reliably detect discontinuities and asymptotes, Desmos tracks not just function values but intervals of uncertainty, preventing false connections across asymptotes.
- **WebGL rendering**: Curves and regions are rendered using the GPU via WebGL for smooth, hardware-accelerated graphics even with complex expressions.

Sliders work by treating variable names as parameters and re-evaluating expressions reactively when slider values change.

## What Powers This

This tool embeds the **Desmos API** — a JavaScript graphing engine developed by **Desmos, Inc.** The Desmos calculator is widely used in K-12 and university math education and is the approved calculator for several standardized tests.
