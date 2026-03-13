---
title: Color Tool
description: Pick, convert, and explore colors across HEX, RGB, HSL, and more.
toolId: color-tool
icon: 🎨
tags: [design, developer]
---

# Color Tool

A full-featured color picker and converter for designers and developers.

## Picking a Color

Use the **color wheel** or the **gradient picker** to select a color visually. The selected color is shown as a large swatch with all its format values below.

## Format Conversion

The tool automatically displays your color in:
- **HEX** — `#3b82f6`
- **RGB** — `rgb(59, 130, 246)`
- **HSL** — `hsl(217, 91%, 60%)`
- **HSV** — `hsv(217, 76%, 96%)`

Click any value to copy it to your clipboard instantly.

## Color Palettes

The tool generates complementary, analogous, and triadic color schemes based on your selected color. Click any swatch in the palette to switch to that color.

## Saving Colors

Click the **+** button to add a color to your saved swatches. Saved colors persist in your browser and appear at the bottom of the panel.

## Tips

- Paste a HEX code directly into the HEX input to jump to any color.
- Use the opacity slider to adjust the alpha channel for RGBA values.

## How It Works

Color can be described in several mathematical systems, each suited to different purposes:

- **RGB** — Additive color mixing using three channels: Red, Green, Blue (each 0–255). Used by screens. Mixing R+G+B at full intensity produces white.
- **HEX** — A base-16 encoding of RGB. `#FF5733` means R=255 (FF), G=87 (57), B=51 (33). Identical to RGB, just a different notation.
- **HSL** — Hue (0°–360°, the color wheel angle), Saturation (0–100%, how vivid), Lightness (0–100%, where 50% is pure color, 0% is black, 100% is white). More intuitive for designers.
- **HSV / HSB** — Similar to HSL but uses Value/Brightness instead of Lightness. 0% value is always black; 100% value with 0% saturation is white.
- **CMYK** — Subtractive color model used in printing: Cyan, Magenta, Yellow, Key (Black). Mixing all pigments produces black (opposite of RGB's additive model).

Converting between systems involves trigonometry and linear algebra. For example, HSL → RGB requires computing chroma (`C = (1 - |2L - 1|) * S`), then mapping hue sectors to RGB components.

## What Powers This

Color conversions are implemented in pure JavaScript using standard mathematical formulas defined in the CSS Color specification. No external libraries or APIs are used — all computation happens in your browser.
