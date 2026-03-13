---
title: Maps
description: Interactive map with place search and geolocation.
toolId: maps
icon: 🗺️
tags: [maps, geolocation, navigation]
---

# Maps

An interactive world map with place search, geolocation, and automatic dark mode support — powered by Geoapify and Leaflet.js.

## Setup

Maps requires a free Geoapify API key:

1. Visit [geoapify.com](https://www.geoapify.com/) and create a free account.
2. Go to your dashboard and copy your API key.
3. Paste it into the Maps setup screen and click **Save & Open Map**.

The free tier includes **3,000 requests per day** — no credit card required. Your key is stored only in your browser's localStorage and is sent directly to Geoapify when fetching tiles or searching.

## How to Use

**Search for a place**
Type any address, city, landmark, or country into the search bar at the top of the map and press **Go** (or Enter). The map will fly to the result and drop a marker with the place name.

**Jump to your current location**
Click the 📍 button in the bottom-right corner. Your browser will ask for permission to access your location; once granted, the map flies to your coordinates and drops a marker.

**Pan and zoom**
- Drag to pan the map.
- Scroll (or use the +/− buttons) to zoom in and out.

The map remembers your last position and zoom level between sessions.

**Change your API key**
Click the 🔑 button in the bottom-right corner to return to the setup screen and enter a new key.

## How It Works

### Tile Servers and Zoom Levels

Web maps are made of small square images called **tiles**. Each tile covers a fixed geographic area and is 256 × 256 pixels. At zoom level 0 the entire world fits in a single tile; each level up quadruples the number of tiles, adding more detail. A typical city view uses zoom level 12–14, while a street-level view uses 17–19.

When you pan or zoom, the map library (Leaflet) requests only the tiles needed for the current viewport, stitching them together seamlessly.

### Mercator Projection

Most web maps use the **Web Mercator projection** (EPSG:3857). It represents the spherical Earth on a flat rectangle by treating longitude as the horizontal axis and using a logarithmic formula for latitude. This preserves the shapes of local features (conformal) but distorts sizes at high latitudes — Greenland appears far larger than it really is relative to Africa. The projection was chosen because it makes north always "up" and rhumb lines (constant compass-bearing paths) appear as straight lines.

### Geocoding

Searching for a place name and getting back a latitude/longitude pair is called **forward geocoding**. The Maps tool sends your search query to the Geoapify Geocoding API, which returns a ranked list of matching features. The top result's coordinates are used to reposition the map. The reverse process — turning coordinates into an address — is called **reverse geocoding**.

### Dark Mode

The tool detects the `dark` class on `<html>` using a `MutationObserver`. When dark mode is active, it switches the tile source from Geoapify's `osm-bright` (light) style to `dark-matter`, a dark-themed cartographic style. The switch happens in real time without reloading the page.

## What Powers This

| Component | Description |
|---|---|
| **Geoapify** | Tile server, geocoding API, and place data. Built on OpenStreetMap. |
| **Leaflet.js** | Open-source JavaScript library for interactive maps, loaded from CDN. |
| **OpenStreetMap** | The community-built geographic database that underlies the map data. |
| **Browser Geolocation API** | Web standard for accessing the device's GPS or network-based location. |
