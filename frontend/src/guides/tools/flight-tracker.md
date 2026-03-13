---
title: Flight Tracker
description: Track live flight status, departures, and arrivals by flight number.
toolId: flight-tracker
icon: ✈️
tags: [travel, flights, aviation]
---

# Flight Tracker

Track live flight status, departure and arrival times, gate information, and real-time position by IATA flight number.

## Setup

To use Flight Tracker you need a free API key from AviationStack:

1. Go to [aviationstack.com](https://aviationstack.com) and create a free account.
2. Copy your **Access Key** from the dashboard.
3. Paste it into the Flight Tracker setup screen and click **Save & Continue**.

The free tier includes **100 requests per month** — enough for casual tracking. Your key is stored locally in your browser and never sent to any server other than the backend proxy.

## How to Use

Enter an **IATA flight number** (e.g. `BA123`, `AA100`, `UA456`) in the search box and press **Track**. Results show all matching flights (a flight number may appear on multiple days).

Each flight card displays:

- **Flight number and airline name**
- **Status badge** — see the colour key below
- **Departure and arrival airports** — IATA code plus full airport name
- **Scheduled times** — with actual/estimated time shown alongside if they differ
- **Terminal and gate** — when available
- **Flight duration** — calculated from scheduled times
- **Live position** — latitude, longitude, altitude, and ground speed when the aircraft is airborne and broadcasting

### Status badge colours

| Status | Colour | Meaning |
|---|---|---|
| Scheduled | Blue | Flight is planned but not yet departed |
| In Air | Green | Aircraft is currently airborne |
| Landed | Grey | Flight has arrived |
| Cancelled | Red | Flight has been cancelled |
| Diverted | Orange | Flight was redirected to a different airport |
| Incident | Red | An incident has been reported |

## How It Works

### ADS-B transponders

Modern commercial aircraft carry **ADS-B (Automatic Dependent Surveillance–Broadcast)** transponders that broadcast the aircraft's GPS-derived position, altitude, speed, and heading on 1090 MHz every 0.5–2 seconds. A global network of ground receivers and satellites captures these transmissions and forwards them to aviation data aggregators in near real-time.

### Flight data aggregation

AviationStack aggregates data from multiple sources:

- **ADS-B and MLAT** receivers for live position
- **ACARS (Aircraft Communications Addressing and Reporting System)** for departure/arrival gate and block times
- **Airline and airport FIDS** (Flight Information Display Systems) for schedule data
- **Radar feeds** from national air traffic control agencies

This data is merged into a unified flight record, reconciling differences between the ACARS block-out/block-in times and the ADS-B position stream.

### IATA flight codes

**IATA (International Air Transport Association)** assigns each airline a two-character code (e.g. `BA` = British Airways, `AA` = American Airlines) and each flight a numeric suffix. The combined string — e.g. `BA123` — is the IATA flight number used on boarding passes and airport display boards. It is distinct from the **ICAO** callsign used by air traffic control, which uses a three-letter airline prefix (e.g. `BAW123`).

### Why a backend proxy?

AviationStack's free tier only permits **HTTP** connections (not HTTPS). Browsers block mixed-content requests, so the flight data must be fetched server-side and relayed to the frontend over a secure HTTPS connection. The Dash backend proxy at `dash-production-3e07.up.railway.app` handles this transparently.

## What Powers This

Flight data is provided by the **[AviationStack API](https://aviationstack.com)**, which aggregates real-time and historical flight information from ADS-B networks, ACARS feeds, and official airline/airport data sources.
