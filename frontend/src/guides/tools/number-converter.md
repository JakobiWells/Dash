---
title: Number Converter
description: Convert numbers between decimal, binary, hexadecimal, octal, and other bases.
toolId: number-converter
icon: 🔢
tags: [developer, math, utility]
---

# Number Converter

Convert numbers between different bases and numeral systems instantly.

## Supported Bases

- **Binary** (base 2) — `0` and `1`
- **Octal** (base 8) — `0`–`7`
- **Decimal** (base 10) — standard integers
- **Hexadecimal** (base 16) — `0`–`9`, `A`–`F`

## How to Use

Type a number in any of the input fields. All other fields update automatically.

For example, entering `255` in decimal gives:
- Binary: `11111111`
- Octal: `377`
- Hex: `FF`

## Custom Base

Use the **Custom Base** field to convert to any base from 2 to 36. Enter the base, then type your number in decimal to see the result.

## Large Numbers

The converter handles large integers accurately. Hex values are shown with `0x` prefix for clarity.

## Tips

- Hex is commonly used in web colors (`#FF5733`), memory addresses, and byte values.
- Binary is fundamental to how CPUs process data — each bit represents a 0 or 1.
- Quick reference: `0xFF` = 255 decimal = 11111111 binary.

## How It Works

A number's **base** (or radix) determines how many symbols are used to represent values and what each digit's positional value is.

In base 10: `255 = 2×10² + 5×10¹ + 5×10⁰`
In base 2 (binary): `11111111 = 1×2⁷ + 1×2⁶ + ... + 1×2⁰ = 255`
In base 16 (hex): `FF = 15×16¹ + 15×16⁰ = 255`

**Conversion algorithm:** To convert from decimal to base N, repeatedly divide by N and collect the remainders in reverse order. To convert to decimal from base N, multiply each digit by N raised to its position power and sum.

Binary and hex have a special relationship: every 4 binary digits map exactly to one hex digit (`1111₂ = F₁₆`), making hex a compact notation for binary data commonly used in memory addresses, color codes, and byte values.

## What Powers This

Conversions use JavaScript's built-in `parseInt(value, fromBase)` and `Number.prototype.toString(toBase)` methods for bases 2–36. All computation happens in your browser with no external dependencies.
