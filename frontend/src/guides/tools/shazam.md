---
title: Shazam
description: Identify any song playing around you instantly.
toolId: shazam
icon: 🎵
tags: [music, recognition, audio]
---

# Shazam

Instantly identify any song playing around you — in a cafe, on TV, or from a friend's speaker.

## Setup

Shazam requires a free RapidAPI key — you get 500 recognitions/month at no cost.

1. Go to [rapidapi.com](https://rapidapi.com) and create a free account
2. Search for **"Shazam"** and open the API by **apidojo**
3. Click **Subscribe to Test** and select the **Basic (free)** plan
4. Go to the **Endpoints** tab — your key appears on the right under **Header Parameters** as `X-RapidAPI-Key`
5. Copy the key and paste it into the Shazam tile on your dash

Your key is saved locally in your browser and never shared.

## How to Use

1. Tap the **🎵 button** to start listening
2. Hold your device near the audio source
3. Wait ~8 seconds while Dashpad captures and identifies the track
4. See the song title, artist, album art, and links to stream it

## Tips

- Works best when the music is clearly audible (reduce background noise if possible)
- If no match is found, try moving closer to the speaker and tapping again
- Browser will ask for microphone permission on first use — this is required

## How It Works

Shazam uses **audio fingerprinting** to identify songs:

1. **Spectrogram analysis** — the audio is transformed into a time-frequency spectrogram using the Short-Time Fourier Transform (STFT), revealing which frequencies are present at each moment in time.
2. **Peak extraction** — prominent peaks (high-energy frequency/time coordinates) are extracted from the spectrogram. These peaks are robust to noise and compression artifacts.
3. **Hash generation** — pairs of peaks are combined into compact hash codes using a combinatorial hashing scheme. Each hash encodes two peaks and the time offset between them.
4. **Database lookup** — the hashes are compared against a database of billions of pre-computed fingerprints. A statistical voting algorithm determines the best match based on how many hashes align with a consistent time offset.
5. **Match confirmation** — a song is confirmed when enough hashes agree on the same track and temporal alignment, providing high confidence even from 5–10 second clips.

This approach was pioneered by Avery Wang at Shazam in 2003 and described in the paper *"An Industrial-Strength Audio Search Algorithm"*.

## What Powers This

- **[Shazam API](https://rapidapi.com/apidojo/api/shazam)** via RapidAPI — the same fingerprinting engine behind the Shazam app, accessed through a REST API
- **Web Audio API / MediaRecorder** — browser-native APIs capture microphone audio as a WebM/Ogg audio blob
- Audio is sent to the Dashpad backend for proxying — your API key is never exposed to the browser
