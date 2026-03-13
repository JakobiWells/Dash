---
title: Stock Chart
description: Interactive stock and crypto charts with technical indicators powered by TradingView.
toolId: stock-chart
icon: 📈
tags: [finance, stocks, charts]
---

# Stock Chart

Full-featured interactive price charts for stocks, ETFs, indices, forex, and crypto — powered by TradingView.

## Searching for a Symbol

Type a ticker symbol or company name in the search bar:
- `AAPL` — Apple Inc.
- `BTC/USD` — Bitcoin
- `SPY` — S&P 500 ETF
- `EUR/USD` — Euro/Dollar

## Chart Types

Switch between chart types using the toolbar:
- **Candlestick** — Shows open, high, low, close for each period
- **Line** — Simple close price over time
- **Bar** — OHLC bars
- **Area** — Filled line chart

## Timeframes

Select from 1m, 5m, 15m, 1H, 4H, 1D, 1W, 1M and more in the top bar.

## Indicators

Click **Indicators** to add technical overlays:
- **Moving Averages** (SMA, EMA)
- **RSI** — Relative Strength Index
- **MACD** — Moving Average Convergence Divergence
- **Bollinger Bands**
- **Volume** — shown by default at the bottom

## Tips

- Resize the card larger for a better charting experience.
- Right-click the chart for drawing tools: trend lines, Fibonacci retracements, support/resistance levels.
- Use the **Markets** tool alongside this for a broad market overview before drilling into individual charts.
- Data for US equities may be delayed 15 minutes unless you have a TradingView account with real-time data enabled.

## How It Works

A **candlestick chart** encodes four data points per time period — Open, High, Low, Close (OHLC):
- The **body** spans Open to Close (green if Close > Open, red if Close < Open)
- The **wicks** extend to the High and Low

**Technical indicators** are mathematical transformations of price/volume data:
- **SMA (Simple Moving Average)**: arithmetic mean of the last N closing prices
- **EMA (Exponential Moving Average)**: weighted average giving more weight to recent prices — `EMA = Close × k + EMA_prev × (1 - k)`, where `k = 2/(N+1)`
- **RSI**: measures momentum — `RSI = 100 - 100/(1 + RS)`, where RS = average gain / average loss over 14 periods
- **Bollinger Bands**: SMA ± 2 standard deviations, showing volatility bands

**Volume** is plotted separately as it represents the number of shares/contracts traded and indicates conviction behind price moves.

## What Powers This

Charts are rendered using the **TradingView** charting widget — a professional-grade financial charting library used by millions of traders globally. Market data is provided by TradingView's data feeds. US equity data may be delayed 15 minutes per exchange regulations unless a real-time data subscription is active.
