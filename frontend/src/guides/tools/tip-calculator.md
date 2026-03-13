---
title: Tip Calculator
description: Calculate tips and split bills easily for any group size.
toolId: tip-calculator
icon: 🧾
tags: [finance, utility, math]
---

# Tip Calculator

Quickly calculate tips and split a bill among any number of people.

## How to Use

1. Enter the **bill total**.
2. Select or enter a **tip percentage** (common options: 10%, 15%, 18%, 20%, 25%).
3. Set the **number of people** splitting the bill.
4. Results show instantly.

## What You Get

| Result | Description |
|--------|-------------|
| **Tip Amount** | Total tip to add |
| **Total Bill** | Bill + tip combined |
| **Per Person** | Each person's share (tip included) |
| **Tip Per Person** | Each person's share of just the tip |

## Custom Tip

Type any percentage in the custom field for non-standard tip amounts — useful for rounding to even numbers or matching a specific amount.

## Rounding

Use the **Round Up** option to round each person's share up to the nearest dollar, making cash splitting easier.

## Tips

- The standard US tip is 18–20% for sit-down restaurants, 10–15% for counter service.
- Use the **rounding** option when paying with cash so everyone pays a clean amount.
- For large groups, the restaurant may automatically add a gratuity — check your bill first.

## How It Works

The math is straightforward:

- **Tip amount** = Bill total × (tip % ÷ 100)
- **Total bill** = Bill total + Tip amount
- **Per person** = Total bill ÷ Number of people

For the **workdays-only** split, each person's share is rounded up to the nearest dollar, and any overpayment from rounding goes toward the shared total.

Tipping customs vary by country and context. In the US, gratuity is a major part of service workers' income — the IRS assumes 8% tip minimum for tax purposes, while actual customary rates are 18–20%. In many European countries, service charges are included in menu prices by law.

## What Powers This

All calculations are pure JavaScript arithmetic. No external libraries are used. Everything runs locally in your browser.
