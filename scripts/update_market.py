"""Refresh the public weekly market snapshot from Yahoo's one-year daily chart.

For ETFs, weekChange compares adjusted closes five valid trading sessions apart
(only if those sessions span at most 10 calendar days). drawdown compares the
latest adjusted close with the highest available adjusted daily close in the
rolling 365-day window. price is the latest unadjusted daily close. INR=X uses
unadjusted closes for weekChange and has no drawdown metric.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


OUTPUT = Path(__file__).resolve().parents[1] / "public" / "market.json"
ASSETS = (
    ("VTI", "U.S. total stock market"),
    ("VXUS", "International stocks"),
    ("QQQM", "Nasdaq-100"),
    ("BND", "U.S. aggregate bonds"),
    ("INR=X", "USD to INR"),
)
TIMEOUT_SECONDS = 10


def chart_url(symbol: str) -> str:
    return f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol, safe='')}?range=1y&interval=1d"


def fetch_chart(symbol: str) -> dict:
    url = chart_url(symbol)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; PortfolioMarketSnapshot/1.0)"})
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return json.load(response)


def parse_asset(symbol: str, name: str, chart: dict) -> dict:
    try:
        result = chart["chart"]["result"][0]
        stamps = result["timestamp"]
        quote_data = result["indicators"]["quote"][0]
        raw = quote_data["close"]
        adjusted = result["indicators"].get("adjclose", [{}])[0].get("adjclose", [])
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("missing chart series") from exc

    is_fx = symbol == "INR=X"
    values = raw if is_fx else adjusted
    observations = []
    for stamp, raw_close, metric_close in zip(stamps, raw, values):
        if not isinstance(raw_close, (int, float)) or raw_close <= 0:
            continue
        if not isinstance(metric_close, (int, float)) or metric_close <= 0:
            continue
        day = datetime.fromtimestamp(stamp, tz=timezone.utc).date()
        observations.append((day, float(raw_close), float(metric_close)))

    if not observations:
        raise ValueError("no valid daily closes")

    latest_day, latest_price, latest_metric = observations[-1]
    week_change = None
    if len(observations) >= 6:
        prior_day, _, prior_metric = observations[-6]
        if (latest_day - prior_day).days <= 10:
            week_change = round((latest_metric / prior_metric - 1) * 100, 4)

    drawdown = None
    if not is_fx:
        rolling = [metric for day, _, metric in observations if (latest_day - day).days <= 365]
        drawdown = round((latest_metric / max(rolling) - 1) * 100, 4)

    return {
        "symbol": symbol,
        "name": name,
        "asOf": latest_day.isoformat(),
        "price": round(latest_price, 4),
        "weekChange": week_change,
        "drawdown": drawdown,
        "source": chart_url(symbol),
    }


def read_previous(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as file:
            snapshot = json.load(file)
        if isinstance(snapshot, dict) and isinstance(snapshot.get("assets"), list):
            return snapshot
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        pass
    return {"fetchedAt": None, "assets": [], "errors": []}


def refresh(previous: dict, fetch=fetch_chart, now=None) -> tuple[dict, bool]:
    previous_assets = {
        asset.get("symbol"): asset
        for asset in previous.get("assets", [])
        if isinstance(asset, dict) and isinstance(asset.get("symbol"), str)
    }
    refreshed = []
    errors = []
    successes = 0
    for symbol, name in ASSETS:
        try:
            asset = parse_asset(symbol, name, fetch(symbol))
            refreshed.append(asset)
            successes += 1
        except (ValueError, KeyError, IndexError, TypeError, HTTPError, URLError, TimeoutError, OSError) as exc:
            errors.append(f"{symbol}: {exc}")
            if symbol in previous_assets:
                refreshed.append(previous_assets[symbol])

    fetched_at = previous.get("fetchedAt")
    if successes:
        fetched_at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {"fetchedAt": fetched_at, "assets": refreshed, "errors": errors}, successes > 0


def write_snapshot(path: Path, snapshot: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as file:
        temp_path = Path(file.name)
        json.dump(snapshot, file, indent=2)
        file.write("\n")
    try:
        os.replace(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)


def main() -> int:
    snapshot, any_success = refresh(read_previous(OUTPUT))
    write_snapshot(OUTPUT, snapshot)
    for error in snapshot["errors"]:
        print(error, file=sys.stderr)
    return 0 if any_success else 1


if __name__ == "__main__":
    raise SystemExit(main())
