---
title: Periodic Table
description: An interactive periodic table with element details, electron configurations, and category filtering.
toolId: periodic-table
icon: ⚗️
tags: [chemistry, science, reference]
---

# Periodic Table

An interactive 118-element periodic table with detailed element data, category color coding, and filtering.

## Navigating the Table

The main grid shows 7 periods × 18 groups. The **lanthanides** and **actinides** (f-block) are displayed below the main table, as is the convention.

Click any element cell to open its **detail panel**, which shows:
- Full name and symbol
- Atomic number and atomic mass
- Electron configuration
- Electronegativity (Pauling scale)
- Period, group, and category
- Physical state at room temperature (solid, liquid, gas)

## Category Filtering

Element cells are color-coded by category. Click any **category badge** in the legend to highlight only elements in that category (others dim to 25% opacity). Click the badge again to clear the filter.

**Categories:**
- Alkali metals, Alkaline earth metals
- Transition metals, Post-transition metals
- Metalloids, Nonmetals, Halogens, Noble gases
- Lanthanides, Actinides

## Responsive Sizing

The cell size adapts to the card width — resize the card wider to see atomic masses and fuller labels.

## Tips

- Click the **placeholder cell** (marked `*`) in periods 6 and 7 to scroll to the f-block section.
- Pair with the Formula Bank (Chemistry section) for quick reference to formulas involving these elements.

## How It Works

The periodic table is organized by **atomic number** (number of protons) and **electron configuration**. The arrangement reflects periodicity — elements in the same column share valence electron structures, producing similar chemical behavior.

**Electron configuration** follows quantum mechanical rules:
- Electrons occupy **orbitals** described by four quantum numbers (n, l, m, s)
- The **Aufbau principle** fills lower-energy orbitals first
- The **Pauli exclusion principle** limits each orbital to 2 electrons (opposite spins)
- **Hund's rule** places one electron in each orbital before pairing

The table's block structure reflects this: s-block (groups 1–2, columns 1–2), p-block (groups 13–18), d-block (transition metals), f-block (lanthanides/actinides).

**Electronegativity** (Pauling scale) measures an atom's tendency to attract electrons in a bond. It generally increases across a period (left to right) and decreases down a group.

## What Powers This

Element data (atomic masses, electron configurations, electronegativity values, etc.) is sourced from the **IUPAC (International Union of Pure and Applied Chemistry)** standard dataset. The interactive table is rendered using custom **React** components and **SVG**. No external chemistry libraries are used.
