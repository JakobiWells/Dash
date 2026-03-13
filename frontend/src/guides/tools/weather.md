---
title: Weather
description: Current conditions and forecast for any location worldwide.
toolId: weather
icon: 🌤️
tags: [utility, reference, weather]
---

# Weather

Current conditions, hourly forecast, and 7-day outlook for any location.

## Getting Started

On first open, the weather tool requests your **location** for automatic local weather. You can also search any city manually.

## What's Shown

- **Current conditions** — Temperature, feels like, humidity, wind speed and direction, UV index, visibility
- **Hourly forecast** — Next 24 hours with temperature and conditions
- **7-day forecast** — High/low temperatures and condition icons for the week
- **Precipitation** — Chance of rain or snow by hour/day

## Searching a Location

Click the search bar and type any city, town, or region. Select from autocomplete results. You can pin multiple locations and switch between them.

## Units

Toggle between **Celsius / Fahrenheit** and **km/h / mph** using the units toggle in the header.

## Tips

- Keep the weather card on your dashboard for an always-available forecast glance.
- The UV index helps you know when sunscreen is necessary: 3+ means protection recommended, 6+ means high exposure.
- Wind direction is shown as the direction the wind is coming *from* (e.g., "NW wind" blows from northwest to southeast).
- Precipitation percentage is the probability of measurable precipitation, not the expected amount.

## How It Works

Weather forecasting combines **numerical weather prediction (NWP)** with real-time observational data:

- **NWP models** divide the atmosphere into a 3D grid and solve the primitive equations of fluid dynamics (Navier-Stokes equations adapted for atmospheric flow) forward in time. Global models like ECMWF's IFS run at ~9km horizontal resolution.
- **Data assimilation** continuously blends model predictions with observations from weather stations, radiosondes (weather balloons), satellites, and aircraft to correct the model state.
- **Ensemble forecasting** runs the model many times with slightly different initial conditions to quantify forecast uncertainty — the spread of the ensemble is what produces the "probability of rain" percentage.

**Temperature "feels like"** (apparent temperature) combines air temperature, relative humidity (which affects how efficiently sweat evaporates), and wind speed using the **Steadman apparent temperature index**.

The **UV index** is calculated from the solar zenith angle, total ozone column, and cloud cover, using radiative transfer equations.

## What Powers This

Weather data is sourced from a real-time weather API (such as **Open-Meteo** or **OpenWeatherMap**) that aggregates data from national meteorological services. Forecast models include ECMWF, GFS (NOAA), and regional NWP models.
