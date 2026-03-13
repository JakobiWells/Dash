---
title: Stem Splitter
description: Separate a song into individual stems — vocals, drums, bass, and other instruments.
toolId: stem-splitter
icon: 🎛️
tags: [music, audio, ai]
---

# Stem Splitter

Split any song into its individual components using AI audio source separation. Extract vocals, drums, bass, and other instruments from a full mix.

## How to Use

1. Drop an audio file (MP3, WAV, OGG, FLAC) onto the card, or click **Choose File**.
2. Select the **separation model** — 2-stem (vocals + accompaniment) or 4-stem (vocals, drums, bass, other).
3. Click **Split** and wait for processing (time depends on file length and model).
4. Each stem appears as a separate audio player.
5. Click **Download** on any stem to save it.

## Stems

| Stem | Contains |
|---|---|
| Vocals | Lead and backing vocals |
| Drums | Kick, snare, hi-hats, cymbals |
| Bass | Bass guitar, sub-bass |
| Other | Piano, guitars, synths, etc. |

## Use Cases

- Create **karaoke tracks** by isolating the instrumental
- **Learn a bass line** by listening to the isolated bass stem
- **Sample** specific elements for production
- **Analyze** how a mix is structured

## Tips

- Processing is done on-device — longer files take proportionally longer.
- Quality is best on well-recorded, mixed tracks. Live bootlegs may produce more bleed between stems.
- 4-stem gives more granular control; 2-stem is faster and often cleaner.

## How It Works

Stem splitting is a form of **blind source separation** — recovering individual audio sources from a mixed signal. Modern approaches use deep learning:

1. The audio mixture is converted to a **spectrogram** (a 2D time-frequency representation using STFT — Short-Time Fourier Transform)
2. A neural network (typically a **U-Net architecture**) is trained to predict a **mask** for each source (vocals, drums, bass, other)
3. Each mask is applied to the original spectrogram to isolate the target source
4. The masked spectrograms are converted back to audio using the **inverse STFT**

The model learns to separate sources by training on thousands of songs where the isolated stems are known. The key challenge is that sources overlap heavily in the frequency domain — this is what makes the problem hard and why ML is necessary.

## What Powers This

This tool uses **Demucs** — a state-of-the-art music source separation model developed by **Meta AI Research**. Demucs operates directly on raw audio waveforms (not spectrograms) using a hybrid transformer architecture. The model runs either server-side or via a WebAssembly inference engine in the browser.
