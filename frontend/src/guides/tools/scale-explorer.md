---
title: Scale Explorer
description: Explore musical scales, modes, and their note patterns across all keys.
toolId: scale-explorer
icon: 🎼
tags: [music, theory, scales]
---

# Scale Explorer

Browse and visualize musical scales and modes across all 12 keys on a piano keyboard and guitar fretboard.

## Selecting a Scale

1. Choose the **root note** (e.g. D, F#).
2. Choose the **scale type** — Major, Natural Minor, Harmonic Minor, Melodic Minor, Pentatonic, Blues, Dorian, Phrygian, Lydian, Mixolydian, Locrian, and more.
3. The scale is highlighted on the keyboard and fretboard instantly.

## Reading the Display

- **Highlighted keys/frets** — notes in the scale
- **Root note** — shown in a different color
- **Intervals** — labeled (1, 2, 3, b3, #4, etc.)

## Modes Explained

Modes are scales derived by starting from a different degree of the major scale:
- **Ionian** = Major scale
- **Dorian** = Major scale starting from 2nd degree (minor feel with raised 6th)
- **Phrygian** = Starting from 3rd (Spanish/flamenco sound)
- **Lydian** = Starting from 4th (dreamy, raised 4th)
- **Mixolydian** = Starting from 5th (bluesy major)
- **Aeolian** = Natural Minor
- **Locrian** = Starting from 7th (dark, dissonant)

## Tips

- Pair with the Circle of Fifths to understand which scales fit each key.
- Use the Chord Explorer alongside to see which chords fit a given scale.

## How It Works

A **scale** is defined by a sequence of intervals (semitone steps) that repeat over each octave. The interval pattern determines the scale's character:

- **Major (Ionian):** W-W-H-W-W-W-H (W=2 semitones, H=1 semitone) — bright, resolved sound
- **Natural Minor (Aeolian):** W-H-W-W-H-W-W — darker, sadder character
- **Dorian:** W-H-W-W-W-H-W — minor with a raised 6th, used heavily in jazz and folk
- **Pentatonic Major:** W-W-WH-W-WH — 5 notes, the foundation of blues and rock

All **modes** (Dorian, Phrygian, Lydian, etc.) use the same 7-note diatonic set as a major scale — they just start from a different degree, creating different interval relationships relative to the new root.

In equal temperament, each semitone is a frequency ratio of 2^(1/12). Playing a C major scale means multiplying the root frequency by successive powers of this ratio at positions [0, 2, 4, 5, 7, 9, 11, 12].

## What Powers This

Scale computations use a custom JavaScript music theory engine built on interval arithmetic. Note names are resolved using enharmonic spelling rules. Audio playback uses the **Web Audio API** with oscillator nodes for tone synthesis.
