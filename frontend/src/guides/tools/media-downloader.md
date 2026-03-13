---
title: Media Downloader
description: Download videos and audio from YouTube, Twitter, Instagram, and more.
toolId: media-downloader
icon: ⬇️
tags: [media, download]
---

# Media Downloader

Download videos and audio from popular platforms directly to your device.

## Supported Platforms

- YouTube
- Twitter / X
- Instagram
- TikTok
- Facebook
- Reddit
- And many more via yt-dlp

## How to Download

1. Copy the URL of the video or post you want to download.
2. Paste it into the URL input field.
3. Click **Fetch** to retrieve available formats.
4. Choose your preferred **quality / format** from the list (e.g. 1080p MP4, audio-only MP3).
5. Click **Download**.

## Audio-Only

Select an **audio** format (MP3, M4A, OGG) to download only the sound track — useful for saving music, podcasts, or lectures.

## Tips

- Some platforms may require the video to be publicly accessible.
- For YouTube playlists, enter the playlist URL to queue multiple downloads.
- If a download fails, try a different quality option — some resolutions may be restricted.

> **Note:** Only download content you have the right to download. Respect copyright and platform terms of service.

## How It Works

Streaming platforms deliver video using **adaptive bitrate streaming** (ABR) — the video is split into short segments (2–10 seconds each) at multiple quality levels. The player dynamically selects the segment quality based on available bandwidth.

To download:
1. The platform's webpage is analyzed to find the video's manifest URL (M3U8 for HLS, MPD for DASH) or direct stream URL
2. All segments at the highest available quality are fetched and concatenated
3. If audio and video are in separate streams (common on YouTube), they are **muxed** back together using FFmpeg

For sites with DRM (Widevine, PlayReady), content is encrypted and cannot be downloaded. The tool only works with unencrypted streams.

## What Powers This

Downloads are processed server-side using **yt-dlp** — an open-source command-line tool that supports 1000+ websites. yt-dlp is a community-maintained fork of youtube-dl. Video/audio muxing uses **FFmpeg**. Only publicly accessible, unencrypted content can be downloaded.
