---
title: IP Lookup
description: Look up geolocation, ISP, and network info for any IP address.
toolId: ip-lookup
icon: 🌐
tags: [developer, network, geolocation]
---

# IP Lookup

Instantly look up geolocation, ISP, hostname, and timezone for any IP address or domain — no setup required for your own IP.

## What It Shows Automatically

When you open the tool, it immediately fetches information about **your own current IP address** — no token or configuration needed. You'll see:

- Your public IP address
- City, region, and country (with flag)
- Your ISP or hosting organization (the `org` field)
- Timezone
- Approximate coordinates (linked to Google Maps)
- Hostname (if one is assigned to your IP)

Click the coordinates link to open Google Maps centered on the approximate location.

## Looking Up Any IP or Domain

To look up other IP addresses or domain names, you need a free **IPinfo token**.

### Getting a Free Token

1. Go to [ipinfo.io](https://ipinfo.io) and create a free account
2. The free tier includes **50,000 requests/month** — more than enough for personal use
3. Copy your API token from the dashboard
4. In the tool, click **Add token** (bottom-right corner) and paste it in
5. The search bar will appear at the top — enter any IPv4, IPv6 address, or domain name

Your token is stored in your browser's localStorage and never sent anywhere except directly to the IPinfo API.

## How It Works

**IP geolocation** is the process of mapping an IP address to a physical location. This isn't GPS — it's an inference based on several data sources:

- **BGP routing tables** — The Border Gateway Protocol is the internet's routing system. Every IP block is announced by an Autonomous System (AS), which is owned by an ISP or organization. The AS and country of origin are often embedded in the routing data, giving a reliable country-level fix.
- **WHOIS records** — When an IP block is registered with a Regional Internet Registry (ARIN, RIPE, APNIC, etc.), the registrant provides contact information including address. This is used to pin down city and region with varying accuracy.
- **MaxMind-style databases** — Commercial geolocation databases cross-reference routing, WHOIS, DNS, and user-contributed data to build high-accuracy mapping tables. Accuracy is typically country: ~99%, region: ~80%, city: ~50–70%.
- **Reverse DNS** — Hostnames assigned to IPs (e.g., `203-0-113-42.isp.example.com`) sometimes encode location hints.

IP geolocation is not exact — it identifies the approximate location of an ISP's point-of-presence, not the physical device. VPNs, proxies, and Tor exits will show the location of the exit node, not the user.

## What Powers This

IP data is provided by the **[IPinfo API](https://ipinfo.io)** — one of the most accurate and widely-used IP intelligence services. It aggregates BGP data, WHOIS records, and its own proprietary dataset updated daily. Your own IP is fetched directly from the browser with no token required (IPinfo allows CORS-enabled anonymous requests for self-lookup). All lookups happen client-side — no data passes through Dashpad's servers.
