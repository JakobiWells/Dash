---
title: Falstad Circuit Simulator
description: Simulate electronic circuits interactively in your browser.
toolId: falstad
icon: ⚡
tags: [electronics, engineering, simulation]
---

# Falstad Circuit Simulator

An interactive circuit simulator for building and analyzing electronic circuits in real time.

## What You Can Do

- Build circuits from scratch using a component palette
- Simulate resistors, capacitors, inductors, op-amps, logic gates, and more
- Observe voltages, currents, and waveforms live
- Load example circuits from the built-in library

## Getting Started

The simulator opens with a canvas. Use the right-click context menu (or the toolbar) to add components:

1. Right-click on empty canvas → **Add component** → select type
2. Click and drag between terminals to wire components
3. Press **Run** (or it auto-runs) to start the simulation

## Viewing Results

- **Hover** over a wire to see voltage and current
- **Click** a node to open the oscilloscope and view waveforms over time
- Components light up or change color based on voltage levels

## Example Circuits

Use **File → Open Example** to load pre-built circuits covering:
- RC and RL filters
- Amplifiers (inverting, non-inverting)
- Oscillators
- Digital logic

## Tips

- Double-click any component to edit its value (resistance, capacitance, frequency, etc.).
- Use the oscilloscope to compare input vs output waveforms for filter circuits.
- This is the full Falstad simulator embedded — all features from falstad.com/circuit are available.

## How It Works

The simulator uses **Modified Nodal Analysis (MNA)** — a standard technique for solving electrical circuits:

1. Each node in the circuit is assigned a voltage variable
2. Kirchhoff's Current Law (KCL) is applied at each node: the sum of currents flowing into a node equals zero
3. This produces a system of linear equations: **G·V = I** (where G is the conductance matrix, V is the node voltage vector, I is the current source vector)
4. The system is solved using Gaussian elimination at each time step

For time-varying components (capacitors, inductors), the simulator uses **numerical integration** (trapezoidal method) to approximate their behavior over discrete time steps. Nonlinear components (diodes, transistors) are linearized at each time step using the Newton-Raphson method.

## What Powers This

This tool embeds the **Falstad Circuit Simulator** — an open-source interactive circuit simulator originally written by **Paul Falstad** as a Java applet, later converted to JavaScript. The simulator has been widely used in electronics education for over 20 years.
