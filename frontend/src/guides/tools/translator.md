---
title: Translator
description: Translate text between 100+ languages instantly.
toolId: translator
icon: 🌐
tags: [language, utility, productivity]
---

# Translator

Instant text translation between 100+ languages, powered by a neural translation engine.

## How to Use

1. Type or paste text in the **left panel**.
2. Select the **source language** (or leave on Auto-detect).
3. Select the **target language** on the right.
4. Translation appears instantly as you type.

## Auto-Detection

With source language set to **Auto**, the tool detects the input language automatically. The detected language is shown below the input.

## Supported Languages

100+ languages including:
- European: Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Polish, and more
- Asian: Chinese (Simplified/Traditional), Japanese, Korean, Vietnamese, Thai, Indonesian
- Middle Eastern: Arabic, Hebrew, Persian, Turkish
- And many more regional languages

## Features

- **Copy** — Copy the translated text with one click.
- **Swap** — Flip source and target languages.
- **Text-to-Speech** — Hear the pronunciation of the original or translated text.

## Tips

- For best results, use clear, grammatically correct input text — machine translation handles well-structured sentences better.
- Technical or specialized vocabulary (medical, legal) may be less accurate.
- The **Swap** button is useful for back-translation — translate something, then swap to see if it translates back correctly.
- Pair with the **Word Counter** to check text length before and after translation.

## How It Works

Modern machine translation uses **Neural Machine Translation (NMT)** based on the **Transformer architecture** (introduced in "Attention Is All You Need," Vaswani et al., 2017):

1. The source text is tokenized into **subword units** (using Byte-Pair Encoding or SentencePiece), converting words into a sequence of token IDs
2. An **encoder** processes the token sequence, using self-attention layers to build contextual representations where each token's meaning is influenced by all others in the sentence
3. A **decoder** autoregressively generates the target language tokens, attending to the encoded source representations at each step
4. The output tokens are converted back to text

**Attention mechanisms** allow the model to focus on relevant parts of the source sentence when generating each target word — solving the long-range dependency problem that made older RNN-based models struggle with long sentences.

Modern systems (Google Translate, DeepL) are trained on hundreds of billions of sentence pairs across 100+ languages.

## What Powers This

Translation is powered by a neural machine translation API. Depending on the configuration, this may use **LibreTranslate** (open-source, self-hosted NMT), **DeepL API**, or **Google Cloud Translation API**. Language detection uses a fastText-based language identification model.
