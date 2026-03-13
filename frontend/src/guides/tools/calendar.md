---
title: Calendar
description: A monthly calendar view for tracking dates and events.
toolId: calendar
icon: 📅
tags: [productivity, time]
---

# Calendar

A monthly calendar that lets you navigate dates and track events stored in your browser.

## Navigating Months

Use the **← / →** arrows in the header to move between months. Click on any date to select it.

## Adding Events

1. Click a date on the calendar.
2. Type your event name in the input that appears.
3. Press **Enter** to save the event.

Events are stored in your browser and persist across sessions.

## Viewing Events

Dates with events show a dot indicator. Click the date to see all events for that day listed below the calendar.

## Tips

- Resize the card taller to see more event detail.
- Pair with the Pomodoro Timer or Habit Tracker for a productivity-focused layout.
- The calendar is local-only — events won't sync across devices unless you're using cloud save.

## How It Works

Calendar rendering requires solving several date arithmetic problems:

- **First day of month**: `new Date(year, month, 1).getDay()` — gives a 0–6 value for Sunday–Saturday, used to determine how many blank cells to prepend
- **Days in month**: `new Date(year, month + 1, 0).getDate()` — the zeroth day of the next month is the last day of the current month
- **Leap year**: February has 29 days if the year is divisible by 4 (with century year exceptions)
- **Week numbers**: ISO 8601 defines week 1 as the week containing the first Thursday of the year; computed using the day-of-year and day-of-week

**Event storage** typically uses **localStorage** or **IndexedDB**, keying events by their ISO date string (`YYYY-MM-DD`).

For timezone handling, JavaScript's `Date` object works in the local timezone by default. All-day events are stored as date strings (not timestamps) to avoid timezone-related off-by-one-day errors.

## What Powers This

Calendar layout uses custom JavaScript date arithmetic. Event data is stored in the browser's **localStorage** or synced via a backend API if signed in. The calendar grid is rendered with React. No external calendar library dependencies are required for basic functionality.
