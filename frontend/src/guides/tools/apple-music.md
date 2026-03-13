---
title: Apple Music
description: Browse and play Apple Music directly in your dashboard.
toolId: apple-music
icon: 🎵
tags: [music, streaming, media]
---

# Apple Music

Stream Apple Music without leaving your dashboard.

## Getting Started

Sign in with your Apple ID to access your library. If you don't have an Apple Music subscription, you can use the free trial or browse public playlists.

## Features

- **Library** — Access your saved songs, albums, artists, and playlists.
- **Search** — Find any track, album, or artist in the Apple Music catalog.
- **Radio** — Listen to Apple Music Radio stations.
- **Recommendations** — Browse curated playlists and new releases.

## Playback Controls

Use the playback bar at the bottom to play, pause, skip, and adjust volume. The queue shows upcoming tracks.

## Tips

- Resize the card wider to see the full player UI with artwork.
- You can keep Apple Music playing while using other tools — it continues in the background.
- Use alongside the **Circle of Fifths** or **Chord Explorer** tools when learning songs.

## How It Works

Apple Music uses **AAC (Advanced Audio Coding)** at 256 kbps for standard streams, and **Apple Lossless (ALAC)** for lossless and hi-res lossless tiers.

AAC improves on MP3 by using more sophisticated psychoacoustic modeling — it identifies sounds that are masked by louder simultaneous sounds (auditory masking) and allocates fewer bits to them. This produces better quality than MP3 at the same bitrate.

**Apple's recommendation system** uses a combination of collaborative filtering (what similar listeners enjoy), editorial curation (human curated playlists), and audio feature analysis to power features like autoplay and personalized mixes.

## What Powers This

This tool uses **MusicKit JS** — Apple's official JavaScript SDK for integrating Apple Music into web applications. Authentication is handled via Apple's OAuth flow. Playback requires an Apple Music subscription. MusicKit JS communicates with Apple's CDN to stream DRM-protected content.
