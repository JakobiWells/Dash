---
title: Chord Explorer
description: Look up guitar and piano chord voicings, fingerings, and inversions.
toolId: chord-explorer
icon: 🎸
tags: [music, chords]
---

# Chord Explorer

Look up chord voicings for guitar and piano. Explore root notes, chord types, and inversions.

## Finding a Chord

1. Select the **root note** (e.g. C, F#, Bb).
2. Choose the **chord type** (major, minor, dominant 7th, major 7th, diminished, etc.).
3. The chord diagram updates instantly, showing the fingering and note names.

## Guitar Diagrams

The guitar view shows a **fretboard diagram** with:
- Dot positions for each finger
- Open strings (O) and muted strings (X)
- Fret position indicator for higher-up chords

## Piano View

Switch to the piano view to see which keys to press on a keyboard layout.

## Inversions

Use the **inversion selector** to see different voicings of the same chord (root position, 1st inversion, 2nd inversion).

## Tips

- Pair with the Circle of Fifths to understand chord relationships within a key.
- Use the Scale Explorer to see which chords naturally fit a given scale.
- Click the **play** button to hear the chord if audio output is available.

## How It Works

A chord is built by stacking intervals above a root note. **Intervals** are defined by the number of semitones between two notes:
- Minor 3rd = 3 semitones, Major 3rd = 4, Perfect 5th = 7, Minor 7th = 10, Major 7th = 11

**Chord formulas** stack these intervals:
- Major triad: Root + Major 3rd + Perfect 5th (e.g., C–E–G)
- Minor triad: Root + Minor 3rd + Perfect 5th (e.g., C–E♭–G)
- Dominant 7th: Root + Major 3rd + Perfect 5th + Minor 7th

The 12-tone equal temperament system divides the octave into 12 equal semitones, with each semitone being a frequency ratio of 2^(1/12) ≈ 1.0595. This means A4=440Hz and A5=880Hz, with every note in between spaced multiplicatively.

## What Powers This

Chord theory is computed using a custom JavaScript music theory engine. Audio playback uses the **Web Audio API** — the browser's built-in synthesis and audio processing system. No external audio libraries are needed.
