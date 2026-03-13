---
title: File Converter
description: Convert images, documents, audio, and video files entirely in your browser.
toolId: file-converter
icon: 🔄
tags: [files, utility]
---

# File Converter

Convert files between formats directly in your browser — no uploads to a server, everything stays local.

## Supported Formats

- **Images** — JPG, PNG, WebP, GIF, BMP, TIFF, SVG
- **Documents** — PDF conversions (image → PDF, PDF → image)
- **Audio** — MP3, WAV, OGG, FLAC, M4A
- **Video** — MP4, WebM, MOV, AVI (limited by browser codec support)

## How to Convert

1. **Drop a file** onto the card, or click **Choose File** to browse.
2. Select the **output format** from the dropdown.
3. Adjust any format-specific options (quality, resolution).
4. Click **Convert** and wait for processing.
5. Click **Download** to save the result.

## Quality Settings

For lossy formats (JPG, MP3, MP4), a **quality slider** lets you balance file size vs. fidelity. Higher quality = larger file.

## Tips

- All processing happens in your browser using WebAssembly — your files never leave your device.
- Large video files may take a few seconds; the progress bar shows conversion status.
- For batch conversions, convert one file at a time for best reliability.

## How It Works

File conversion involves **decoding** the source format and **re-encoding** to the target format:

- **Video conversion** (e.g., MP4 → WebM): The video is decoded frame by frame from the source codec (H.264, HEVC, etc.), then each frame is re-encoded using the target codec (VP9, AV1, etc.). Audio tracks are decoded and re-encoded separately.
- **Image conversion** (e.g., PNG → JPEG): Pixels are decoded from the source format's compression scheme, then re-encoded. JPEG uses **Discrete Cosine Transform (DCT)** to convert pixel blocks into frequency components, which are then quantized (lossy).
- **Audio conversion** (e.g., MP3 → WAV): The MP3 is decoded using **Huffman coding** and inverse **Modified Discrete Cosine Transform (MDCT)** to recover PCM audio samples, then either stored raw (WAV) or re-encoded.

Conversion quality and file size are controlled by codec parameters like bitrate, quality factor, and resolution.

## What Powers This

File conversion runs entirely in your browser using **FFmpeg.wasm** — a WebAssembly port of **FFmpeg**, the industry-standard open-source multimedia processing library used in professional video production worldwide. No files are uploaded to any server.
