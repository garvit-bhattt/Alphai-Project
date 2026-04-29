"""
Validation script — Feature Engineering (Log Returns)
Runs all 9 checks from the validation checklist.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from src.data_fetch import fetch_btc_data
from src.preprocess import prepare_features

PASS = "\u2705"
FAIL = "\u274c"

def run():
    print("Fetching data from Binance ...\n")
    raw = fetch_btc_data()
    out = prepare_features(raw)

    errors = []

    # ── 1. Row Count ────────────────────────────────────────────────
    expected = len(raw) - 1       # 719
    ok = len(out) == expected
    print(f"{'PASS' if ok else 'FAIL'} 1. Row count: {len(raw)} -> {len(out)}  (expected {expected})")
    if not ok: errors.append("Row count mismatch")

    # ── 2. Index Reset ──────────────────────────────────────────────
    ok = (out.index == range(len(out))).all()
    print(f"{'PASS' if ok else 'FAIL'} 2. Index sequential 0..{len(out)-1}")
    if not ok: errors.append("Index not sequential")

    # ── 3. Log Return Correctness (spot checks) ────────────────────
    # We compare against values computed directly from the raw df.
    spot_ok = True
    for i in [0, 100, 350, len(out)-1]:
        # out row i corresponds to raw row i+1 (because we dropped the first)
        raw_idx = i + 1
        manual = np.log(raw["close"].iloc[raw_idx] / raw["close"].iloc[raw_idx - 1])
        computed = out["log_return"].iloc[i]
        if not np.isclose(manual, computed, rtol=1e-12):
            spot_ok = False
            errors.append(f"log_return mismatch at index {i}: manual={manual}, computed={computed}")
    print(f"{'PASS' if spot_ok else 'FAIL'} 3. Log return spot-check (indices 0, 100, 350, {len(out)-1})")

    # ── 4. Data Alignment ───────────────────────────────────────────
    # out["close"][i] should equal raw["close"][i+1]
    align_ok = True
    for i in [0, 50, 718 if len(out) > 718 else len(out)-1]:
        if out["close"].iloc[i] != raw["close"].iloc[i + 1]:
            align_ok = False
            errors.append(f"Alignment mismatch at index {i}")
    print(f"{'PASS' if align_ok else 'FAIL'} 4. Data alignment (close[i] == raw close[i+1])")

    # ── 5. No NaN or Inf ───────────────────────────────────────────
    no_nan = not out.isnull().any().any()
    no_inf = np.isfinite(out["log_return"]).all()
    print(f"{'PASS' if no_nan else 'FAIL'} 5a. No NaN values")
    print(f"{'PASS' if no_inf else 'FAIL'} 5b. No inf/-inf values")
    if not no_nan: errors.append("NaN found")
    if not no_inf: errors.append("inf found")

    # ── 6. Data Type Consistency ───────────────────────────────────
    dtype_ok = True
    for col in ("open", "high", "low", "close", "log_return"):
        if out[col].dtype != np.float64:
            dtype_ok = False
            errors.append(f"{col} dtype is {out[col].dtype}")
    import pandas as pd
    dt_ok = pd.api.types.is_datetime64_any_dtype(out["open_time"])
    print(f"{'PASS' if dtype_ok else 'FAIL'} 6a. Price/log_return columns are float64")
    print(f"{'PASS' if dt_ok else 'FAIL'} 6b. open_time is datetime")
    if not dt_ok: errors.append("open_time dtype wrong")

    # ── 7. Original Data Integrity ─────────────────────────────────
    orig_ok = True
    for col in ("open", "high", "low", "close"):
        # raw rows 1..720 should match out rows 0..718
        if not (raw[col].iloc[1:].reset_index(drop=True) == out[col]).all():
            orig_ok = False
            errors.append(f"Original column '{col}' was modified")
    print(f"{'PASS' if orig_ok else 'FAIL'} 7. Original price columns unchanged")

    # ── 8. Temporal Order ──────────────────────────────────────────
    sorted_ok = out["open_time"].is_monotonic_increasing
    print(f"{'PASS' if sorted_ok else 'FAIL'} 8. Data sorted ascending by open_time")
    if not sorted_ok: errors.append("Data not sorted")

    # ── 9. Division Safety ─────────────────────────────────────────
    no_zero = (raw["close"] != 0).all()
    print(f"{'PASS' if no_zero else 'FAIL'} 9. No zero close prices (division safety)")
    if not no_zero: errors.append("Zero close price found")

    # ── Summary ────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    if errors:
        print(f"FAILED — {len(errors)} issue(s):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("ALL 9 CHECKS PASSED")
    print(f"{'='*50}")

if __name__ == "__main__":
    run()
