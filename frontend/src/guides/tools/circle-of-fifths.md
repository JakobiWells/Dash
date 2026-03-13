---
title: Circle of Fifths
description: An interactive circle of fifths for understanding key signatures, chord relationships, and music theory.
toolId: circle-of-fifths
icon: 🎵
tags: [music, theory]
---

# Circle of Fifths

The Circle of Fifths is a fundamental music theory tool that shows the relationships between the 12 keys, their chord families, and how they connect to each other.

## Reading the Circle

- **Outer ring** — Major keys
- **Inner ring** — Relative minor keys
- Moving **clockwise** adds one sharp to the key signature
- Moving **counter-clockwise** adds one flat

## Selecting a Key

Click any segment of the circle to highlight that key. The tool shows:
- The **key signature** (sharps or flats)
- The **diatonic chords** (I, ii, iii, IV, V, vi, vii°) for that key
- The **relative minor** key

## Chord Relationships

The highlighted key shows which chords are closely related:
- Adjacent keys share many common chords (good for modulation)
- Opposite keys are the most distant (dramatic modulation)

## Tips

- Use alongside the Chord Explorer to look up specific voicings for diatonic chords.
- The circle is especially useful for songwriting — keys adjacent on the circle sound natural together.
- Musicians often refer to moving "around the circle" when a song cycles through related keys.

## How It Works

The circle of fifths is derived from a fundamental property of musical tuning: moving up a **perfect fifth** (7 semitones) from any note cycles through all 12 notes before returning to the starting note, forming a closed loop. This happens because 7 and 12 are coprime (share no common factors).

The key signature of each key follows a predictable pattern: each step clockwise adds one sharp (or removes one flat). This is because tuning a perfect fifth means multiplying frequency by 3/2 — and when normalized to an octave, the resulting note is a semitone higher than expected, requiring an accidental.

**Relative keys** share the same key signature because they use the same set of 7 notes from the 12-tone chromatic scale, just starting from a different root. The relative minor is always 3 semitones (a minor third) below the major key.

## What Powers This

The circle of fifths visualization is rendered using **SVG** with custom JavaScript for the interactive rotation and highlighting. Music theory relationships are computed using modular arithmetic on the 12-note chromatic scale. No external music libraries are used.
