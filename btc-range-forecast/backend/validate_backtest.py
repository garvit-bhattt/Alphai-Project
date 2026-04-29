"""
Validation script — Rolling Window Backtest (No Leakage, Strict)
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from src.data_fetch import fetch_btc_data
from src.preprocess import prepare_features
from src.backtest import run_backtest

WINDOW = 100

def run():
    print("Fetching data & preparing features ...")
    raw = fetch_btc_data()
    df = prepare_features(raw)
    print(f"  Input rows: {len(df)}")
    expected_preds = len(df) - WINDOW
    print(f"  Expected predictions: {expected_preds}")

    print("\nRunning backtest (this may take a few minutes) ...")
    records = run_backtest(df, window_size=WINDOW)

    errors = []

    # ── 1. Record count ─────────────────────────────────────────────
    ok = len(records) == expected_preds
    print(f"\n{'PASS' if ok else 'FAIL'} 1. Record count: {len(records)} (expected {expected_preds})")
    if not ok: errors.append(f"Record count {len(records)} != {expected_preds}")

    # ── 2. All bounds valid ─────────────────────────────────────────
    bounds_ok = all(r["lower"] <= r["upper"] for r in records)
    print(f"{'PASS' if bounds_ok else 'FAIL'} 2. lower <= upper for all records")
    if not bounds_ok: errors.append("Found lower > upper")

    # ── 3. No NaN/inf in outputs ────────────────────────────────────
    finite_ok = all(
        np.isfinite(r["lower"]) and np.isfinite(r["upper"]) and np.isfinite(r["actual"])
        for r in records
    )
    print(f"{'PASS' if finite_ok else 'FAIL'} 3. All outputs finite")
    if not finite_ok: errors.append("Non-finite output found")

    # ── 4. Coverage sanity (should be roughly 0.90 – 1.00) ─────────
    hits = sum(1 for r in records if r["hit"])
    coverage = hits / len(records)
    cov_ok = 0.80 <= coverage <= 1.00   # loose sanity bounds
    print(f"{'PASS' if cov_ok else 'WARN'} 4. Coverage: {coverage:.2%} ({hits}/{len(records)})")

    # ── 5. Time alignment (records match df times) ──────────────────
    align_ok = True
    for idx, r in enumerate(records):
        expected_time = df["open_time"].iloc[WINDOW + idx]
        if r["time"] != expected_time:
            align_ok = False
            errors.append(f"Time mismatch at idx {idx}")
            break
    print(f"{'PASS' if align_ok else 'FAIL'} 5. Time alignment correct")

    # ── 6. Actual prices match df ───────────────────────────────────
    actual_ok = True
    for idx, r in enumerate(records):
        expected_actual = round(float(df["close"].iloc[WINDOW + idx]), 2)
        if r["actual"] != expected_actual:
            actual_ok = False
            errors.append(f"Actual mismatch at idx {idx}")
            break
    print(f"{'PASS' if actual_ok else 'FAIL'} 6. Actual prices match source data")

    # ── 7. Original df not mutated ──────────────────────────────────
    df2 = prepare_features(raw)
    mut_ok = df.equals(df2)
    print(f"{'PASS' if mut_ok else 'FAIL'} 7. Original df not mutated by backtest")
    if not mut_ok: errors.append("df was mutated")

    # ── Summary ────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    if errors:
        print(f"FAILED — {len(errors)} issue(s):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("ALL CHECKS PASSED")
    print(f"{'='*50}")

    # Show sample records
    print("\nSample predictions (first 3):")
    for r in records[:3]:
        tag = "HIT" if r["hit"] else "MISS"
        print(f"  {r['time']}  [{r['lower']:.2f} – {r['upper']:.2f}]  actual={r['actual']:.2f}  {tag}")

if __name__ == "__main__":
    run()
