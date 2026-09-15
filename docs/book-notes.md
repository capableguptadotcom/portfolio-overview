# Book notes for the household investing dashboard

Source: Brian Feroldi, *Why Does the Stock Market Go Up?* (2021), local PDF at `D:\Books\General Books\why does the stock market go up_brian feroldi.pdf`. Page references below are **PDF page numbers** (the file has 262 pages), so they can be checked without guessing the book's printed pagination. These are original design notes, not quotations or a forecast.

## Enduring principles from the book

| Principle | Verified location | Dashboard implication |
| --- | --- | --- |
| Daily market moves are strongly shaped by investors' changing optimism and fear; a day's price is weak evidence about the household's long-run plan. | Chapter 16, PDF pp. 78-80; Chapter 20, pp. 94-98 | Do not make daily profit/loss or breaking market news the main screen. Explain a drawdown without implying the user must trade. |
| Feroldi's long-term case is that broad market earnings grow over time, but prices can diverge from earnings for long stretches as valuations change. A past recovery is a historical observation, not a promise about the next decline. | Chapter 18, pp. 86-88; Chapters 20-21, pp. 94-104 | Show a long-range plan and uncertainty bands; avoid a guaranteed upward line or a fixed recovery date. |
| Compounding needs time and reinvestment. Contributions, business growth, and reinvested dividends can increase the base on which future returns are earned; annual results remain uneven. | Chapters 30-32, pp. 131-145, especially pp. 133, 141-144 | Separate money contributed from investment gain, and label projections as scenarios. Show the effect of additional holding years after contributions stop. |
| Broad, inexpensive index funds reduce the need for company research. Fees compound as a drag; an account contribution can remain in cash unless an investment is actually bought. | Chapters 36-39, pp. 160-172, especially pp. 161-165, 166-170, 171-172; advice section, pp. 239-240 | Favor a simple fund-based workflow, show fund costs and an uninvested-cash check, and avoid stock-picking prompts. |
| Risk capacity depends on when the money is needed and how much volatility the household can tolerate. Diversification and a planned mix of stocks, bonds, and cash can reduce dependence on one asset; periodic rebalancing restores the chosen mix. | Chapters 50-52, pp. 207-214 | Ask for the first possible spending date and a tolerable drawdown before displaying a portfolio plan; show drift from the agreed allocation at scheduled reviews. |
| Timing requires choosing both the exit and the re-entry. Regular scheduled purchases remove repeated timing decisions, but do not make a short holding period safe. | Chapters 45-46, pp. 192-198; Chapter 55, pp. 220-221; advice section, pp. 239-240 | Put the contribution schedule and next planned review ahead of market forecasts. Keep a separate safety bucket for funds that may be needed soon. |

## Claims that need current, household-specific verification

- The book's historical return, win-rate, 20-year holding-period, crash-frequency, fund-underperformance, fee, dividend-yield, and broker-cost figures describe older data and particular markets (Chapters 19, 20, 31-32, 35, 37-38). Verify any number before using it in live projections. Past U.S. results do not guarantee future U.S. or global results.
- Account types, tax treatment, fund availability, expense ratios, bond yields, and investment protections can change and depend on residence and account. The dashboard should source current values and show the date checked, rather than treating the book's 2021 examples as product recommendations.
- A ₹5 crore financial-independence target depends on current exchange rates, inflation, taxes, intended withdrawal spending, and where the household will spend. Convert the $100,000 starting balance and future contributions with stated assumptions; do not quietly mix USD portfolio value with an INR target.
- A 3-5 year **contribution** window is not automatically a 3-5 year **holding** window. Confirm when the money could first be needed. If that date is soon, a stock-heavy portfolio may be unsuitable even if the household hopes to hold longer (Chapter 50, PDF pp. 207-209).

## Five behavioral rules for the dashboard

1. **Make the plan the default view.** Lead with $100,000 starting June 2027, the agreed 3-5 year contribution schedule, the earliest spending date, and progress toward ₹5 crore under explicit USD/INR assumptions. Show daily return only after the user asks for it. (Chapters 16, 18, 50)
2. **Make uncertainty visible before upside.** Present several return and exchange-rate scenarios and a meaningful drawdown case; never turn the book's historical average into a promised yearly growth rate or FI date. (Chapters 19-21, 31, 50)
3. **Turn anxious moments into a scheduled check.** On a sharp fall, show the household's pre-agreed risk limit, near-term cash needs, and next review date. Suggest changing allocation only when the plan or risk capacity changed, or when it has drifted beyond the agreed rebalance rule. (Chapters 20, 46, 50-52)
4. **Automate contributions and verify deployment.** Show each scheduled contribution, whether it actually purchased the intended diversified fund, any idle cash, and the current expense ratio. Avoid prompts to find a market bottom or research individual stocks. (Chapters 36-39, 46, 55)
5. **Separate saving from market performance.** Track cumulative contributions, current value, fees, and projected years invested after contributions end. Celebrate a contribution kept on schedule rather than a short-term market gain; the household controls the former. (Chapters 30-32; advice section, pp. 238-240)
