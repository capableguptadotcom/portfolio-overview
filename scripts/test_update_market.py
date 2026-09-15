import unittest
from datetime import datetime, timedelta, timezone

from update_market import ASSETS, parse_asset, refresh


def chart(days, raw, adjusted=None):
    start = datetime(2026, 9, 1, 20, tzinfo=timezone.utc)
    indicators = {"quote": [{"close": raw}]}
    if adjusted is not None:
        indicators["adjclose"] = [{"adjclose": adjusted}]
    return {
        "chart": {
            "result": [
                {
                    "timestamp": [int((start + timedelta(days=day)).timestamp()) for day in days],
                    "indicators": indicators,
                }
            ]
        }
    }


class ParseAssetTests(unittest.TestCase):
    def test_etf_uses_adjusted_closes_for_changes_and_raw_latest_price(self):
        days = [0, 1, 2, 3, 4, 7, 8]
        asset = parse_asset("VTI", "U.S. total stock market", chart(days, [100, 101, 102, 103, 104, 105, 110], [100, 110, 108, 106, 105, 100, 99]))
        self.assertEqual(asset["asOf"], "2026-09-09")
        self.assertEqual(asset["price"], 110)
        self.assertEqual(asset["weekChange"], -10)
        self.assertEqual(asset["drawdown"], -10)
        self.assertIn("range=1y&interval=1d", asset["source"])

    def test_missing_adjusted_quote_rejects_etf(self):
        with self.assertRaisesRegex(ValueError, "no valid daily closes"):
            parse_asset("VTI", "U.S. total stock market", chart([0, 1], [100, 101]))

    def test_large_gap_makes_week_change_unknown(self):
        asset = parse_asset("BND", "U.S. aggregate bonds", chart([0, 1, 2, 3, 4, 20], [100] * 6, [100] * 6))
        self.assertIsNone(asset["weekChange"])
        self.assertEqual(asset["drawdown"], 0)

    def test_fx_has_raw_week_change_and_no_drawdown(self):
        asset = parse_asset("INR=X", "USD to INR", chart([0, 1, 2, 3, 4, 7], [80, 80, 80, 80, 80, 84]))
        self.assertEqual(asset["weekChange"], 5)
        self.assertIsNone(asset["drawdown"])


class RefreshTests(unittest.TestCase):
    def test_failed_asset_retains_prior_quote_and_date(self):
        prior = {
            "fetchedAt": "2026-08-31T00:00:00Z",
            "assets": [{"symbol": "VTI", "name": "U.S. total stock market", "asOf": "2026-08-30", "price": 99, "weekChange": None, "drawdown": None, "source": "previous"}],
            "errors": [],
        }

        def fetch(symbol):
            if symbol == "VTI":
                raise TimeoutError("timed out")
            return chart([0], [100], [100]) if symbol != "INR=X" else chart([0], [80])

        snapshot, success = refresh(prior, fetch, datetime(2026, 9, 15, tzinfo=timezone.utc))
        self.assertTrue(success)
        self.assertEqual(snapshot["fetchedAt"], "2026-09-15T00:00:00Z")
        self.assertEqual(snapshot["assets"][0], prior["assets"][0])
        self.assertEqual(snapshot["errors"], ["VTI: timed out"])
        self.assertEqual(len(snapshot["assets"]), len(ASSETS))

    def test_total_failure_on_first_run_has_empty_assets(self):
        def fetch(_symbol):
            raise TimeoutError("timed out")

        snapshot, success = refresh({"fetchedAt": None, "assets": [], "errors": []}, fetch)
        self.assertFalse(success)
        self.assertIsNone(snapshot["fetchedAt"])
        self.assertEqual(snapshot["assets"], [])
        self.assertEqual(len(snapshot["errors"]), len(ASSETS))


if __name__ == "__main__":
    unittest.main()
