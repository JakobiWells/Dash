---
title: Random Number Generator
description: Generate random integers, decimals, and sets with customizable ranges and options.
toolId: random-number-generator
icon: 🎲
tags: [utility, math, developer]
---

# Random Number Generator

Generate truly random numbers with flexible options for range, type, and quantity.

## Modes

- **Single Number** — One random number in your specified range.
- **Multiple Numbers** — Generate a list of N random numbers at once.
- **Unique Set** — Like a lottery draw: N distinct numbers, no repeats.
- **Dice Roll** — Simulate standard dice (d4, d6, d8, d10, d12, d20, d100).

## Options

| Option | Description |
|--------|-------------|
| **Min / Max** | The inclusive range for generated numbers |
| **Decimals** | Allow floating-point results (specify decimal places) |
| **Count** | How many numbers to generate at once |
| **Sorted** | Sort the output in ascending order |
| **No Repeats** | Enforce uniqueness across the generated set |

## How to Use

1. Set your **range** (min and max).
2. Choose the **mode** and any options.
3. Click **Generate** (or press Enter).
4. Results appear below — click **Copy** to grab them.

## Tips

- Use **Unique Set** for things like picking raffle winners or shuffling a list.
- Dice Roll mode is handy for tabletop RPG sessions — d20 is right there.
- The randomness uses `crypto.getRandomValues()` for cryptographically strong random numbers.

## How It Works

**True randomness vs pseudo-randomness:**
- Standard `Math.random()` in JavaScript uses a **pseudo-random number generator (PRNG)** — a deterministic algorithm that produces sequences that appear random but are fully reproducible given the initial seed.
- `crypto.getRandomValues()` uses the operating system's entropy sources (hardware events, CPU timing jitter, etc.) to generate **cryptographically secure** random numbers — unpredictable and non-reproducible.

**Uniform distribution in a range [min, max]:**
A raw random value in [0, 1) is scaled: `Math.floor(random * (max - min + 1)) + min`. The `+1` ensures the max value is reachable with equal probability.

**Unique sets** (like lottery draws) use the **Fisher-Yates shuffle**: iterate from the end of the number range, randomly swap each element with any element before it. The first N elements after shuffling form the unique set.

## What Powers This

This tool uses `crypto.getRandomValues()` — the browser's **CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)**. This is the same entropy source used for generating encryption keys and secure tokens. It draws from the OS's entropy pool, making outputs unpredictable. No external libraries are used.
