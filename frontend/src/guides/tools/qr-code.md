---
title: QR Code Generator
description: Generate QR codes for URLs, text, contact cards, and Wi-Fi credentials.
toolId: qr-code
icon: ▣
tags: [utility, sharing]
---

# QR Code Generator

Create QR codes for any content — links, plain text, contact information, or Wi-Fi credentials.

## Generating a QR Code

1. Select the **content type** from the tabs: URL, Text, Contact (vCard), or Wi-Fi.
2. Enter your content in the input fields.
3. The QR code generates instantly.
4. Click **Download PNG** or **Copy** to use it.

## Content Types

- **URL** — Paste any web address. Scanning opens the URL in a browser.
- **Text** — Any plain text content up to ~2900 characters.
- **Contact (vCard)** — Enter a name, phone, email, and organization to create a scannable contact card.
- **Wi-Fi** — Enter your network name (SSID) and password so guests can connect by scanning.

## Customization

- **Size** — Adjust the output resolution.
- **Error correction** — Higher levels make the QR code readable even if partially obscured (L/M/Q/H).
- **Colors** — Change foreground and background colors to match your brand.

## Tips

- QR codes are generated entirely in your browser — no data is sent to any server.
- For printed materials, use **H** (high) error correction so the code remains scannable even if slightly damaged.
- Test your QR code with your phone's camera before distributing it.

## How It Works

A QR code encodes data in a 2D matrix of black and white squares using several layers:

1. **Data encoding**: The input is encoded into a binary bitstream. QR codes support four modes: Numeric (10 bits per 3 digits), Alphanumeric (11 bits per 2 chars), Byte (8 bits per char, supports UTF-8), and Kanji (13 bits per char).

2. **Error correction**: The bitstream is expanded using **Reed-Solomon error correction codes** — a polynomial-based scheme that adds redundant data. Four levels (L/M/Q/H) allow recovery from 7%, 15%, 25%, or 30% damage respectively. This is why a QR code can still scan even when partially obscured.

3. **Data placement**: The encoded bits are placed in the matrix in a specific zigzag pattern, avoiding the three corner **finder patterns** (the large squares) and **alignment patterns**.

4. **Masking**: Eight mask patterns are evaluated and the one that best balances dark/light cells (minimizing artifacts that confuse scanners) is applied.

The minimum QR code size is 21×21 modules (Version 1); the maximum is 177×177 (Version 40), encoding up to ~3KB of data.

## What Powers This

QR code generation uses **qrcode.js** or a similar open-source JavaScript QR library implementing the ISO/IEC 18004 standard. All generation happens in your browser — no data is sent to any server.
