---
title: Markets
description: Live overview of global financial markets — stocks, indices, crypto, and commodities.
toolId: markets
icon: 📊
tags: [finance, stocks, markets]
---

# Markets

A real-time market overview dashboard showing prices, changes, and trends across major asset classes.

## What's Shown

- **Indices** — Major stock indices (S&P 500, NASDAQ, Dow Jones, FTSE 100, Nikkei, etc.)
- **Crypto** — Bitcoin, Ethereum, and other top cryptocurrencies
- **Commodities** — Gold, silver, oil, natural gas
- **Forex** — Major currency pairs

## Reading the Data

Each row shows:
- **Current price** — live or delayed by 15 minutes depending on the exchange
- **Change** — absolute and percentage change from previous close
- **Color coding** — green for up, red for down

## Tips

- This is an overview tool, not a trading platform — use it for quick reference and situational awareness.
- Click any ticker to open a detail view with a price chart.
- Pair with the **Stock Chart** tool for deeper technical analysis on individual securities.
- Markets data is sourced from TradingView — exchange rules may apply a 15-minute delay for some instruments.
- Crypto prices update in real time (no delay).

## How It Works

Financial market data is disseminated in real time by **exchanges** (NYSE, NASDAQ, LSE, etc.) via data feeds. The data includes:
- **Last trade price**: the most recent executed transaction price
- **Bid/Ask**: the highest price a buyer will pay and lowest price a seller will accept
- **Change**: difference from the previous session's closing price

**Index values** (S&P 500, NASDAQ Composite) are calculated as weighted averages of their constituent stocks' prices. The S&P 500 uses **free-float market cap weighting**: each company's weight equals its market cap (price × shares available to trade) divided by the total index market cap.

**Crypto prices** are aggregated across multiple exchanges since there is no single central crypto exchange. The displayed price is typically a volume-weighted average.

## What Powers This

Market data is sourced via the **TradingView** widget infrastructure, which aggregates data from global exchanges and data providers. Equity data follows each exchange's redistribution policies (typically 15-minute delay for retail display). Cryptocurrency data updates in real time.
