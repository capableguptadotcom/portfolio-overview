# Northstar — a household investing workspace

A GitHub Pages dashboard for working toward financial independence in India while earning and investing in the U.S. It separates an editable planning scenario, paper practice, and actual financial records.

## What to do first

1. Open **Build your plan**. Confirm the investing start, contribution period, first possible spending date, protected cash, monthly savings and INR target. The defaults are examples, not imported account balances.
2. Read **The playbook**, especially the five-year deadline and U.S.–India sections.
3. Open **Weekly review → Paper practice** to record a hypothetical portfolio. Use **Actual balances** for statement balances; the two histories remain separate.
4. Export a private SQLite backup using the download button. Import it on another device or browser to transfer your data.

The default scenario is June 2027; $100,000 starting savings less $25,000 protected cash; $3,000 monthly for five years; 6% annual whole-portfolio return; ₹85 per dollar at the start; zero FX drift; 5% Indian inflation; and ₹5 crore in today's purchasing power, excluding a home and car. All are editable. The 60% stock allocation and 6% return are independent illustrative inputs, not a suitability conclusion or a forecast.

## Privacy and storage

- The **website and this repository are public**. Deployed assets contain only example assumptions, source notes, and public market data.
- Financial records are stored in a **SQLite database in this browser's IndexedDB**. No account connection, analytics, server database, or financial-data upload is implemented.
- Backups contain your plan, balances and notes **unencrypted**. Keep them private. `.sqlite`, `.db`, `.pdf` and environment files are excluded from Git.
- Storage is specific to the browser and website origin. The local preview and published website have separate data. Clearing site data or private browsing can erase it. Export regularly.
- Use one editing tab at a time. There is no cross-tab, cross-device or household synchronization. Import replaces the current plan/history after confirmation. A custom domain would also have a separate browser database.
- Google Fonts is used for typography; no financial records are transmitted to it. All calculations and database operations run locally. Issuer/research links open external websites.

GitHub Pages serves static files and cannot run a shared writable SQLite server. This browser-local design is intentional. A future shared database would require authenticated hosting and a different privacy design.

## Development

Use Node 22 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
```

Python 3.10+ is needed only for reference-data refresh and its tests:

```sh
python scripts/update_market.py
python -m unittest discover -s scripts -p 'test_*.py'
```

The static output is `dist/`. Relative asset paths support the `/portfolio-overview/` GitHub Pages project path. The app uses in-page navigation, so it does not need server-side route rewrites.

## Publishing and weekly updates

The Pages source must be **GitHub Actions**. `.github/workflows/pages.yml` builds and publishes on pushes to `main`, manual runs, and Sundays at **21:17 UTC**. GitHub may delay scheduled workflows, and it may disable schedules after extended inactivity on a public repository; check the Actions page if quotes become stale. No Codex session or laptop needs to stay running.

The workflow runs tests, refreshes public market quotes, retains the dated snapshot on `main`, then builds and publishes. The bot requires permission to push its data-only commit. Branch protections or repository Actions settings may need to permit that. If that step fails, inspect Actions rather than assuming the site refreshed.

Reference feed: Yahoo Finance's **unofficial** public chart endpoint. No credential is required. It can fail, change, be delayed or include a provisional current-day bar. Failed instruments retain previous values and their actual quote dates. A total refresh failure still produces an error-marked snapshot; the workflow publishes it with a warning. This is context, not an execution feed.

- Price: latest available raw daily close/bar.
- ETF weekly change: adjusted close versus five valid sessions earlier, only when those observations span at most ten calendar days.
- Drawdown: adjusted close versus the highest available adjusted close in the rolling year, not the all-time high.
- `asOf`: per-instrument observation date. `fetchedAt`: time at least one instrument refreshed successfully.
- Quotes older than ten calendar days show **STALE**. FX reference data is not silently substituted into planning assumptions or past journal entries.

## Model and limitations

Monthly growth is `(1 + annualRate)^(1/12) - 1`. Contributions arrive at month-end until the contribution window ends. The initial investment is starting savings minus protected cash. With staging, the first installment goes in at the start and the remaining installments enter monthly; idle installments earn 0% in this comparison.

Today's INR target inflates from the browser's current date to the investing start, then through the holding period. The start-date USD/INR assumption drifts only during the holding period. Thus a today's-money goal moves slightly as the current date changes. If the selected start is in the past, this remains a forward illustration over the selected holding period, not a historical reconstruction.

The required monthly contribution solves the same month-by-month model. Scenarios are arithmetic, not likelihoods. The shaded chart is **not a confidence interval**. The late shock applies -40% to stocks and -5% to defensive investments just before the final contribution; it is not a worst-case bound. Retirement and actual journal balances are never automatically added to the scenario.

Personal taxes, transaction costs, withdrawals and separate fee deductions are omitted. Treat the assumed return as after fund expenses. The withdrawal-rate panel only compares first-year spending arithmetic; it does not establish a sustainable retirement income.

Actual net worth = cash + U.S. investments + INR financial assets / snapshot FX + vested retirement - debt. The outside-retirement figure excludes retirement, but includes reserves and is **not** automatically available for FI spending. Deposits and FX affect snapshot changes, so changes are not presented as investment returns.

## Research

- [Decision memo](docs/decision-memo.md)
- [Investing framework and primary sources](docs/investing-framework.md)
- [U.S.–India accounts and taxes](docs/cross-border-research.md)
- [Original notes from the supplied book](docs/book-notes.md)

The book is not copied into the repository or website. Its contents are treated as source material, not instructions. Source notes distinguish timeless principles from current rules and unverified household assumptions.

Technical references: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), and [sql.js](https://github.com/sql-js/sql.js).
