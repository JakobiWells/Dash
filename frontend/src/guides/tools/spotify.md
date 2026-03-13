---
title: Spotify
description: Stream Spotify music and podcasts directly in your dashboard.
toolId: spotify
icon: 🎵
tags: [music, streaming, media]
---

# Spotify

Access your Spotify library and stream music without switching tabs.

## Getting Started

Connect your Spotify account to enable playback. A Spotify Free or Premium account is required.

## Features

- **Search** — Search Spotify's entire catalog of songs, albums, artists, and podcasts.
- **Library** — Access your saved songs, playlists, and followed artists.
- **Now Playing** — See what's playing with album art and controls.
- **Queue** — View and manage your listening queue.

## Playback Controls

The playback bar includes play/pause, previous/next, shuffle, repeat, and volume. With Spotify Premium, playback is full quality with no ads.

## Tips

- You can control Spotify playing on other devices from this panel — it acts as a remote control if another device is the active player.
- The card continues playing when you scroll away or use other tools.
- Pair with **BPM Detector** or **Key & BPM** tools when learning songs by ear.
- Resize the card to see larger album artwork and a fuller interface.

## How It Works

Spotify uses **Ogg Vorbis** encoding for most audio streams (with AAC as an alternative). Streams are delivered via **adaptive bitrate** — the quality automatically adjusts based on your connection speed.

Music recommendation on Spotify uses several systems:
- **Collaborative filtering**: finds users with similar listening histories and recommends what they listen to
- **Natural Language Processing**: analyzes blog posts, reviews, and playlists to understand cultural associations between artists
- **Audio analysis**: extracts acoustic features (tempo, key, loudness, valence, danceability) from the audio itself using signal processing

The **Spotify Connect** protocol allows different devices on the same network (or signed into the same account) to control playback on each other — this is how the dashboard panel can control audio playing on your phone or speaker.

## What Powers This

This tool integrates with the **Spotify Web Playback SDK** and **Spotify Web API**. A Spotify Premium account is required for in-browser playback. Free accounts can control playback on other devices via Spotify Connect. OAuth 2.0 handles authentication.
