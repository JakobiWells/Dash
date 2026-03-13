---
title: SoundCloud
description: Stream SoundCloud music and podcasts directly in your dashboard.
toolId: soundcloud
icon: 🎶
tags: [music, streaming, media]
---

# SoundCloud

Stream tracks, playlists, and podcasts from SoundCloud without leaving your dashboard.

## Features

- **Search** — Find any track, artist, or playlist on SoundCloud.
- **Stream** — Play music directly in the embedded player.
- **Playlists** — Browse and queue entire playlists.
- **Trending** — Discover what's popular right now.

## How to Use

1. Use the **Search** bar to find a track or artist.
2. Click any result to start playing.
3. Use the playback controls to pause, skip, and adjust volume.

## Tips

- SoundCloud is especially good for independent artists, remixes, and electronic music not found on major platforms.
- Keep the card open while using other tools — audio continues playing in the background.
- If you find an artist you like, click through to their profile to see their full catalog.
- Pair with the **BPM Detector** if you want to analyze tracks you find.

## How It Works

SoundCloud primarily hosts audio in **MP3** format with a custom streaming protocol. Tracks are delivered from SoundCloud's CDN in progressive or segmented format depending on the client.

Unlike major streaming services, SoundCloud pioneered **waveform visualization** — they pre-process each uploaded track to generate a compressed waveform representation (180 sample points normalized to the peak amplitude), which is what you see in the player's waveform display. This is computed server-side during upload using FFT-based peak detection.

SoundCloud's **audio fingerprinting** system (used for copyright detection) works similarly to services like AcoustID — it generates a perceptual hash of the audio content that remains stable across minor edits and encoding changes.

## What Powers This

This tool uses the **SoundCloud Widget API** — SoundCloud's official JavaScript embed API. It provides access to playback controls, track metadata, and event callbacks. Playback of some tracks may be restricted based on the uploader's privacy settings or geographic licensing.
