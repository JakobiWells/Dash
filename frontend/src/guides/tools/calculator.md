---
title: Calculator
description: A standard scientific calculator for everyday arithmetic and functions.
toolId: calculator
icon: 🔢
tags: [math, utility]
---

# Calculator

A straightforward scientific calculator supporting arithmetic, trigonometry, logarithms, and memory functions.

## Basic Usage

Click the buttons or use your **keyboard** to enter expressions. Press **=** or **Enter** to evaluate.

## Supported Operations

- **Arithmetic** — `+`, `−`, `×`, `÷`
- **Exponents** — `xʸ`, `x²`, `√`
- **Trigonometry** — `sin`, `cos`, `tan` (and their inverses)
- **Logarithms** — `log` (base 10), `ln` (natural log)
- **Constants** — `π`, `e`
- **Memory** — `M+`, `M−`, `MR`, `MC`

## Angle Mode

Toggle between **DEG** (degrees) and **RAD** (radians) for trigonometric functions using the mode button.

## Tips

- Press **C** to clear the current entry, **AC** to clear everything.
- Use parentheses to control order of operations: `(2 + 3) × 4 = 20`.
- For long calculations, the history panel shows previous results you can tap to reuse.

## How It Works

Calculators parse mathematical expressions using a technique called **recursive descent parsing** or the **shunting-yard algorithm** (Dijkstra, 1961):

1. **Tokenization**: The input string is split into tokens — numbers, operators (`+`, `-`, `*`, `/`), functions (`sin`, `log`), and parentheses.
2. **Operator precedence**: The shunting-yard algorithm converts infix notation (`3 + 4 * 2`) to postfix (Reverse Polish Notation: `3 4 2 * +`) by using a stack to handle precedence and associativity rules.
3. **Evaluation**: The postfix expression is evaluated left-to-right using a stack — operands are pushed, operators pop their arguments and push the result.

**Floating-point precision**: Computers store numbers in IEEE 754 binary floating-point, which can't exactly represent many decimal fractions. This is why `0.1 + 0.2 = 0.30000000000000004` in most languages. Calculators use rounding or arbitrary-precision libraries to hide this.

## What Powers This

Expression parsing uses a JavaScript math library (such as **math.js**) or a custom recursive descent parser. Scientific functions (`sin`, `cos`, `log`, etc.) use JavaScript's built-in `Math` object, which delegates to the CPU's floating-point unit. All computation happens in your browser.
