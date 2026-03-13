---
title: Metronome
description: A click-track metronome with adjustable BPM, time signature, and accent patterns.
toolId: metronome
icon: 🎵
tags: [music, practice]
---

# Metronome

A precise digital metronome for music practice, with adjustable tempo, time signature, and beat accents.

## Setting the Tempo

- Use the **BPM slider** or type a number in the BPM field to set the tempo.
- Typical ranges: slow (40–60), medium (80–120), fast (140–180+).
- Click **Tap** repeatedly in time with music to detect the BPM automatically.

## Time Signature

Set the **beats per measure** (numerator) and **note value** (denominator):
- 4/4 — standard pop/rock
- 3/4 — waltz
- 6/8 — compound duple (two groups of three)
- 5/4 — odd meter (Dave Brubeck, Tool)

## Accents

The first beat of each measure plays an **accented click** (higher pitch). You can customize which beats are accented using the beat pattern editor.

## Visual Indicator

The metronome flashes visually on each beat — useful if you're in a noisy environment and can't rely on audio alone.

## Tips

- Start **slower than you think you need to** when learning a new piece, then gradually increase BPM.
- Enable **subdivisions** (8th notes, 16th notes) for more precise rhythmic practice.
- Keep the metronome card small — its minimal design works well in a corner of your workspace.

## How It Works

A metronome produces clicks at a precise, configurable tempo measured in **BPM (beats per minute)**. The time between clicks is simply `60,000 ms / BPM`.

The challenge in a browser is that `setTimeout` and `setInterval` are not sample-accurate — they can drift by tens of milliseconds due to JavaScript's event loop. To solve this, the metronome uses a **lookahead scheduler**: it schedules audio events slightly in advance using the Web Audio API's clock, which runs on a separate, high-precision audio thread independent of the JavaScript event loop.

Each click is synthesized as a short sine wave burst using an **OscillatorNode** with a rapidly decaying **GainNode** (exponential ramp), producing a crisp click sound without any audio file loading.

## What Powers This

The metronome uses the **Web Audio API** — a browser-native audio processing system that runs on a dedicated audio thread. The scheduling technique follows the approach described by Chris Wilson's "A Tale of Two Clocks" (Google Web Fundamentals). No external libraries are used.
