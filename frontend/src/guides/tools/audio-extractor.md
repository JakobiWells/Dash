---
title: Audio Extractor
description: Extract audio from video files and export as MP3, WAV, or other formats.
toolId: audio-extractor
icon: 🎧
tags: [audio, video, files, converter]
---

# Audio Extractor

Pull the audio track out of any video file and save it as a standalone audio file.

## How to Use

1. Click **Choose File** or drag and drop a video file onto the tool.
2. Select the output **format** (MP3, WAV, OGG, M4A).
3. Optionally adjust the **bitrate** for MP3 output.
4. Click **Extract Audio**.
5. Download the resulting audio file.

## Supported Input Formats

Most common video formats are supported: MP4, MOV, AVI, MKV, WebM, FLV.

## Output Formats

| Format | Best For |
|--------|----------|
| MP3 | Music, podcasts — small file size |
| WAV | High-quality uncompressed audio |
| OGG | Web-compatible open format |
| M4A | Apple ecosystem compatibility |

## Tips

- All processing happens in your browser — no files are uploaded to any server.
- For music extraction, MP3 at 192 kbps or 320 kbps gives a good quality-to-size balance.
- WAV produces the largest files but preserves original quality — useful for further editing.
- Large video files may take a moment to process depending on your device.

## How It Works

Audio extraction **demuxes** (separates) the audio stream from a video container:

1. The video file's **container format** (MP4, MKV, AVI, etc.) is parsed to locate the audio track's data
2. The raw audio bitstream is extracted from the container
3. It is either copied directly (**stream copy**, lossless and fast) if the target format matches, or **decoded** and **re-encoded** into the target format

For MP3 output: the audio samples are encoded using **MPEG-1 Audio Layer 3**, which uses psychoacoustic modeling to discard audio frequencies less perceptible to human hearing — achieving ~10:1 compression ratios while maintaining acceptable quality.

For WAV output: raw PCM (Pulse-Code Modulation) samples are written directly — linear quantization of the audio waveform at the specified sample rate and bit depth. No compression, no quality loss.

## What Powers This

Audio extraction uses **FFmpeg.wasm** — a WebAssembly port of **FFmpeg** that runs entirely in your browser. No files are uploaded to any server. FFmpeg is the most widely used open-source multimedia processing toolkit in existence, powering platforms like YouTube and VLC.
