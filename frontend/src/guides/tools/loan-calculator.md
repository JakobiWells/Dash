---
title: Loan Calculator
description: Calculate monthly payments, total interest, and amortization schedules for any loan.
toolId: loan-calculator
icon: 🏦
tags: [finance, math, utility]
---

# Loan Calculator

Compute monthly payments and total costs for any fixed-rate loan, with a full amortization breakdown.

## Inputs

| Field | Description |
|-------|-------------|
| **Loan Amount** | Principal borrowed |
| **Annual Interest Rate** | APR as a percentage |
| **Loan Term** | Duration in years or months |
| **Extra Payment** | Optional additional monthly payment |

## Outputs

- **Monthly Payment** — Fixed amount due each month
- **Total Interest Paid** — Over the full loan term
- **Total Cost** — Principal + total interest
- **Amortization Table** — Month-by-month breakdown of principal vs interest

## How to Use

1. Enter your **loan amount**, **interest rate**, and **term**.
2. Results update instantly.
3. Toggle the **Amortization Schedule** to see each payment broken down.
4. Optionally enter an **extra monthly payment** to see how much interest you save.

## Tips

- Add an extra payment of even $50–100/month to see how significantly it reduces total interest on long-term loans.
- The amortization table shows that early payments are mostly interest — this is how fixed-rate mortgages work.
- Use **Loan Term in months** for more precise short-term loan calculations.
- Compare scenarios: same loan amount, different rates or terms, to evaluate refinancing options.

## How It Works

Fixed-rate loan payments are calculated using the **amortization formula**:

**M = P × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]**

Where:
- M = monthly payment
- P = principal (loan amount)
- r = monthly interest rate (annual rate ÷ 12)
- n = total number of payments (years × 12)

Each payment covers two components:
- **Interest**: current balance × monthly rate
- **Principal**: M − interest payment

In early payments, most of the fixed payment goes to interest. Over time, as the balance decreases, more of each payment goes to principal. This is why paying extra early has a disproportionate impact — it reduces the principal that future interest charges are calculated against.

Total interest paid = (M × n) − P

## What Powers This

All calculations use standard mathematical formulas implemented in pure JavaScript. No external libraries or APIs are used. All computation happens in your browser.
