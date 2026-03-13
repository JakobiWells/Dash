---
title: UUID Generator
description: Generate UUIDs (v1, v4) and other unique identifiers in bulk.
toolId: uuid-generator
icon: 🔑
tags: [developer, utility]
---

# UUID Generator

Generate Universally Unique Identifiers (UUIDs) for use in databases, APIs, and software development.

## UUID Versions

- **v4** (recommended) — Randomly generated. No information encoded. Suitable for most use cases.
- **v1** — Time-based. Encodes the timestamp and MAC address (or a random node ID).

## Generating UUIDs

Click **Generate** to create a new UUID. The result is automatically copied to your clipboard.

Use the **Bulk** mode to generate multiple UUIDs at once — select a count (up to 100) and click Generate.

## Other Identifiers

The tool also generates:
- **CUID** — Collision-resistant IDs optimized for horizontal scaling
- **NanoID** — URL-safe compact unique IDs (customizable length and alphabet)
- **Timestamp-based IDs** — Unix timestamps in seconds or milliseconds

## Formatting Options

- **Uppercase / lowercase** toggle
- **Hyphens** on/off — `550e8400e29b41d4a716446655440000` vs `550e8400-e29b-41d4-a716-446655440000`
- **Braces** — `{550e8400-e29b-41d4-a716-446655440000}` for some database formats

## Tips

- v4 UUIDs are suitable for primary keys when you don't need time ordering.
- Use NanoID for URL slugs or public-facing IDs where length matters.
- The Copy button copies the last generated ID to your clipboard with one click.

## How It Works

A UUID (Universally Unique Identifier) is a 128-bit number formatted as 32 hexadecimal digits in the pattern `xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx`.

- **v4 (random)** — 122 bits are randomly generated. The remaining 6 bits encode the version (`M=4`) and variant (`N` has the top 2 bits set to `10`). The probability of a collision generating 1 billion UUIDs per second for 100 years is approximately 50%.
- **v1 (time-based)** — Encodes a 60-bit timestamp (in 100-nanosecond intervals since October 1582), a clock sequence, and a 48-bit node ID (typically the MAC address or a random value).
- **NanoID** — Uses a custom alphabet and cryptographically random bytes. At 21 characters with the default alphabet (64 chars), collision probability is comparable to UUID v4.
- **CUID** — Combines a timestamp, fingerprint, and random counter to produce collision-resistant IDs optimized for distributed systems.

## What Powers This

UUID v4 generation uses `crypto.getRandomValues()` — the browser's cryptographically secure random number generator (CSPRNG). This is the same entropy source used for cryptographic operations. NanoID uses the same CSPRNG. CUID uses a custom algorithm implemented in JavaScript.
