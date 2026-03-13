---
title: Map Generator
description: Generate beautiful custom map images in different styles — copy the URL or embed code.
toolId: map-generator
icon: 🗺️
tags: [maps, developer, design, content]
---

# Map Generator

Create styled map images for any location in the world — perfect for embedding in websites, blog posts, presentations, or social media.

## Setup

1. Go to [geoapify.com](https://geoapify.com) and create a free account
2. Create a new project and copy your API key
3. Paste it into the Map Generator tile

Free tier includes 3,000 requests/day — plenty for personal and small commercial use.

## How to Use

1. **Search** for any city, address, or landmark
2. **Pick a style** from the style palette (Bright, Dark Matter, Toner, etc.)
3. **Adjust zoom** with the slider (1 = world view, 18 = street level)
4. **Choose a size** — presets include common social/web dimensions
5. **Toggle the pin** to show or hide a location marker
6. **Export** — copy the image URL, HTML `<img>` tag, or Markdown embed

## Map Styles

| Style | Best for |
|---|---|
| Bright | General purpose, colorful |
| Positron | Clean, minimal, light backgrounds |
| Dark Matter | Dark UI embeds, dramatic visuals |
| Basic | Simple, uncluttered |
| Toner | Black & white, print-ready |
| Liberty | Colorful, detailed |
| Carto | Classic OpenStreetMap look |
| 3D | Stylized depth effect |

## How It Works

Static maps are generated server-side by Geoapify and returned as a single PNG image. Here's what happens:

1. **Tile rendering** — map tiles (256×256 or 512×512 PNG images) are fetched for the requested area at the given zoom level using the Mercator projection. Each zoom level doubles the number of tiles in each dimension.
2. **Style application** — vector tile data (roads, buildings, water, land use) is rendered using a MapLibre GL style JSON specification, which controls colors, line widths, label fonts, and layer ordering.
3. **Compositing** — tiles are stitched together, the requested marker/annotations are drawn on top, and the image is cropped to the exact width/height you specified.
4. **`scaleFactor=2`** — the tool requests 2× resolution (retina) so the image stays sharp on high-DPI displays.

**Zoom levels**: Each step doubles the ground area covered. Zoom 1 = world, zoom 5 = continent, zoom 10 = city, zoom 14 = neighborhood, zoom 18 = individual buildings.

## What Powers This

- **[Geoapify Static Maps API](https://apidocs.geoapify.com/docs/maps/static-maps/)** — server-side map rendering from vector tiles
- **[Geoapify Geocoding API](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/)** — converts place names to coordinates
- Map data from **OpenStreetMap** contributors (© OpenStreetMap)
