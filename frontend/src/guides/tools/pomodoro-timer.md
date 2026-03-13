---
title: Pomodoro Timer
description: A focus timer using the Pomodoro technique — 25 minutes on, 5 minutes off.
toolId: pomodoro-timer
icon: 🍅
tags: [productivity, focus]
---

# Pomodoro Timer

The Pomodoro Technique is a time management method that breaks work into focused intervals (called *pomodoros*) separated by short breaks.

## How It Works

1. **Work session** — 25 minutes of focused work.
2. **Short break** — 5 minutes to rest.
3. **Repeat** — After 4 pomodoros, take a longer 15–30 minute break.

## Using the Timer

- **Start** — Click the play button to begin the countdown.
- **Pause** — Click again to pause.
- **Reset** — Click the reset button to restart the current interval.
- **Skip** — Skip to the next interval (work → break or break → work).

## Customizing Intervals

Click the settings (gear) icon to adjust:
- Work session duration (default 25 min)
- Short break duration (default 5 min)
- Long break duration (default 15 min)
- Number of sessions before a long break (default 4)

## Tips

- Enable browser notifications so you're alerted when the timer ends, even if you've switched tabs.
- Keep the card small — the timer display is minimal by design so it doesn't distract.

## How It Works

The **Pomodoro Technique** is a time management method developed by Francesco Cirillo in the late 1980s. It exploits two cognitive science principles:

- **Time-boxing**: Committing to work for a fixed, finite period reduces the activation energy to start and creates a sense of urgency
- **Structured breaks**: Regular short breaks prevent cognitive fatigue and maintain focus quality over longer sessions

Research in cognitive psychology suggests the 25-minute interval aligns with the average adult's **sustained attention span** — the duration before performance begins to degrade without a break.

**Timer implementation**: Like the metronome, a precise countdown timer in the browser uses the **Web Audio API clock** or `performance.now()` rather than `setTimeout` alone. `setTimeout` can drift significantly (tens of milliseconds per fire) due to browser throttling, especially in background tabs. The actual elapsed time is checked against a reference start time on each tick.

## What Powers This

The timer uses JavaScript with `Date.now()` or `performance.now()` as the reference clock, with `setInterval` used only to trigger UI updates. Notification at the end of each session uses the **Web Notifications API** (requires browser permission). Session counts are stored in **localStorage**. No external services are used.
