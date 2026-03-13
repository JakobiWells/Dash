---
title: Background Remover
description: Remove the background from any image using AI, directly in your browser.
toolId: bg-remover
icon: 🖼️
tags: [image, ai]
---

# Background Remover

Automatically remove the background from photos using an on-device AI model — no uploads, completely private.

## Removing a Background

1. Drop an image onto the card or click **Choose Image**.
2. The AI processes the image and removes the background automatically.
3. The result is shown with a transparent (checkerboard) background.
4. Click **Download PNG** to save the image with transparency.

## Supported Formats

Input: JPG, PNG, WebP
Output: PNG (with transparency)

## Tips

- Works best on images with a clear subject and distinct background (portraits, product photos, logos).
- For complex scenes with fine details (hair, fur, transparent objects), results may need manual touch-up.
- The model runs entirely in your browser using WebAssembly — first run may be slower while the model loads.
- After removing the background, you can place the subject on a new color or image using a photo editor.

## How It Works

Background removal is a **semantic segmentation** problem: the model must classify every pixel as either foreground (the subject) or background.

Modern approaches use deep convolutional neural networks trained on large datasets of images with annotated foreground masks. The most widely used architecture for this is **U-Net**, which uses an encoder-decoder structure with skip connections:
- The **encoder** progressively downsamples the image, extracting high-level features
- The **decoder** upsamples back to the original resolution, using skip connections to recover fine spatial detail
- The output is a **soft mask** (0.0–1.0 per pixel) indicating foreground probability

More recent models like **IS-Net** and **BiRefNet** use transformer-based architectures that capture long-range dependencies, producing cleaner edges around fine details like hair.

The mask is applied as an alpha channel to produce the transparent PNG output.

## What Powers This

Background removal uses a machine learning model — either a server-side inference API or a client-side ONNX model run via **ONNX Runtime Web** (WebAssembly). The underlying model architecture is based on **U²-Net** or **IS-Net**, both open-source research models trained for salient object detection.
