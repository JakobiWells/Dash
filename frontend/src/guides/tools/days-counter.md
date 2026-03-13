---
title: Days Counter
description: Count days between dates, calculate deadlines, and track countdowns.
toolId: days-counter
icon: 📅
tags: [productivity, utility, date]
---

# Days Counter

Calculate the number of days between any two dates, or count down to an upcoming event.

## Modes

- **Between two dates** — Enter a start and end date to see the exact difference in days, weeks, and months.
- **Countdown** — Enter a future date to see how many days remain until then.
- **Days since** — Enter a past date to see how many days have elapsed.

## How to Use

1. Select a **mode** from the tabs.
2. Enter your date(s) using the date picker.
3. The result updates instantly.

## What's Shown

- Total **days** between the dates
- Broken down into **weeks and remaining days**
- Approximate **months**
- Whether the result includes weekends, or workdays only (toggle available)

## Tips

- Use **workdays only** mode to calculate business deadlines (excludes Saturdays and Sundays).
- The countdown auto-updates daily — keep it on your dashboard as a live reminder.
- Negative results (past dates) are shown clearly so you always know which direction the count goes.
- Useful for calculating age, project timelines, contract durations, and event planning.

## How It Works

Date arithmetic is more complex than it appears because of irregular month lengths, leap years, and daylight saving time transitions.

**Leap year rule:** A year is a leap year if it is divisible by 4, except for century years (divisible by 100), which must also be divisible by 400. So 2000 was a leap year; 1900 was not.

**Day counting:** The most reliable approach converts both dates to a common unit (Unix timestamp in milliseconds, or an absolute day count like the **Julian Day Number**) and subtracts. This automatically accounts for month length variations and leap years.

**Workday calculation** excludes weekends by computing `floor(days/7) × 5 + adjustment` for the partial week, using modular arithmetic on the day-of-week values of the start and end dates.

The Gregorian calendar reform (1582) means historic dates before then don't follow current rules — this tool operates on the proleptic Gregorian calendar.

## What Powers This

Date calculations use JavaScript's built-in `Date` object and arithmetic. The `Date` object internally stores time as milliseconds since the Unix epoch (January 1, 1970 UTC). All computation happens in your browser.
