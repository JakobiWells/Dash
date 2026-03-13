---
title: GeoGebra
description: Interactive geometry, algebra, and graphing tool for math education and exploration.
toolId: geogebra
icon: 📐
tags: [math, geometry, graphing, education]
---

# GeoGebra

A full-featured interactive mathematics tool for geometry, algebra, calculus, and statistics.

## What You Can Do

- **Construct geometry** — Points, lines, circles, polygons, angles with dynamic relationships
- **Graph functions** — Enter any expression and see it plotted instantly
- **Algebra view** — All objects listed with their current values
- **3D graphing** — Switch to 3D mode for surfaces and solids
- **Spreadsheet** — Data input for statistics and regression

## Getting Started

The default view shows the graphing calculator. Use the toolbar on the left to switch tools:
- **Move** (arrow) — drag and reposition objects
- **Point** — place a point anywhere
- **Line/Segment/Ray** — draw linear objects
- **Circle** — center + radius or three points
- **Input bar** — type expressions, equations, or commands

## Entering Expressions

Type in the input bar at the bottom:
- `f(x) = x^2 - 3x + 2` — plot a function
- `A = (2, 3)` — define a point
- `Circle(A, 3)` — draw a circle at A with radius 3
- `Derivative(f)` — compute and plot the derivative

## Tips

- Right-click any object to access its properties (color, label, visibility).
- Drag objects to see related objects update in real time — great for exploring geometric relationships.
- Use **View → 3D Graphics** to switch to 3D mode.
- GeoGebra is used widely in education — search online for ready-made applets you can load via File → Open.

## How It Works

GeoGebra is a **dynamic mathematics system** — objects have defined relationships, and changing one object automatically updates all dependent objects. This is implemented as a **constraint propagation graph**: each object knows its dependencies, and when a value changes, a topological traversal recomputes all downstream objects.

**Coordinate geometry** is handled symbolically as well as numerically: GeoGebra can solve for intersection points algebraically using **Gröbner bases** and polynomial systems, not just numerically.

**3D rendering** uses WebGL for hardware-accelerated rendering of surfaces, solids, and 3D curves. Surfaces defined by equations like `z = sin(x) * cos(y)` are rendered by evaluating on a mesh grid and constructing a triangle mesh.

**The GeoGebra language** is a subset of its own CAS (Computer Algebra System) built on top of **Reduce** (open-source symbolic computation system), enabling exact computation with surds, fractions, and symbolic variables.

## What Powers This

This tool embeds **GeoGebra** — an open-source interactive mathematics software developed at the University of Salzburg and maintained by the GeoGebra Institute. The browser version uses JavaScript/WebAssembly with WebGL for 3D graphics. GeoGebra is used by over 100 million students and teachers worldwide.
