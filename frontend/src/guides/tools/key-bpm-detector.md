---
title: Key & BPM Detector
description: Detect the musical key and tempo of any audio file.
toolId: key-bpm-detector
icon: 🎙️
tags: [music, audio, analysis]
---

# Key & BPM Detector

Analyze an audio file to detect its **musical key** and **tempo (BPM)** automatically.

## How to Use

1. Drop an audio file (MP3, WAV, OGG, FLAC) onto the card, or click **Choose File**.
2. The analyzer processes the audio.
3. Results show:
   - **Key** — the detected tonic and mode (e.g. *A minor*, *C# major*)
   - **BPM** — beats per minute
   - **Confidence** — how certain the algorithm is

## Use Cases

- Matching tracks by key for DJ mixing or mashups
- Finding the key of a song before writing lyrics or melodies over it
- Verifying tempo before syncing to video

## Tips

- Accuracy improves with **longer audio clips** — at least 30 seconds is recommended.
- Very complex or atonal music may yield lower confidence scores.
- For DJ use, the detected key uses **Camelot notation** (e.g. 8A, 11B) which you can cross-reference with the Circle of Fifths.
- The Stem Splitter can isolate the melody or bass from a full mix before analysis for cleaner results.

## How It Works

**BPM detection** uses **autocorrelation** or **onset detection**:
- The audio is analyzed for *onsets* — sudden increases in spectral energy that correspond to beats
- The time between onsets is measured and converted to BPM (beats per minute = 60 / beat interval in seconds)
- A **Fast Fourier Transform (FFT)** converts the audio signal from the time domain to the frequency domain, making rhythmic patterns visible as peaks

**Key detection** uses **chroma features** (pitch class profiles):
- The frequency content of the audio is mapped to 12 pitch classes (C, C#, D, ... B) regardless of octave
- The resulting chroma vector is compared against templates for all 24 major/minor keys using a **Krumhansl-Schmuckler** key profile (derived from music cognition research)
- The key with the highest correlation score is returned

## What Powers This

Audio analysis uses **essentia.js** — a WebAssembly port of the Essentia audio analysis library developed by the Music Technology Group at Universitat Pompeu Fabra. FFT computation uses the browser's **Web Audio API AnalyserNode**.
