"""
Validation script — Evaluation Metrics (Coverage, Width, Winkler)
Runs the full pipeline end-to-end and validates the metrics output.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from src.data_fetch import fetch_btc_data
from src.preprocess import prepare_features
from src.backtest import run_backtest
from src.evaluate import evaluate_predictions

WINDOW = 100

def run():
    print("Fetching data & preparing features ...")
    raw = fetch_btc_data()
    df = prepare_features(raw)

    print(f"Running backtest ({len(df) - WINDOW} steps) ...")
    preds = run_backtest(df, window_size=WINDOW)

    print("Computing evaluation metrics ...\n")
    metrics = evaluate_predictions(preds)

    errors = []

    # ── 1. All keys present ─────────────────────────────────────────
    keys_ok = all(k in metrics for k in ("coverage", "avg_width", "winkler"))
    print(f"{'PASS' if keys_ok else 'FAIL'} 1. All metric keys present")
    if not keys_ok: errors.append("Missing keys")

    # ── 2. Coverage in [0, 1] ───────────────────────────────────────
    cov = metrics["coverage"]
    cov_ok = 0.0 <= cov <= 1.0
    print(f"{'PASS' if cov_ok else 'FAIL'} 2. Coverage in [0,1]: {cov}")
    if not cov_ok: errors.append(f"Coverage out of range: {cov}")

    # ── 3. avg_width > 0 ───────────────────────────────────────────
    aw = metrics["avg_width"]
    aw_ok = aw > 0
    print(f"{'PASS' if aw_ok else 'FAIL'} 3. avg_width > 0: {aw}")
    if not aw_ok: errors.append(f"avg_width not positive: {aw}")

    # ── 4. winkler >= avg_width ─────────────────────────────────────
    wk = metrics["winkler"]
    wk_ok = wk >= aw
    print(f"{'PASS' if wk_ok else 'FAIL'} 4. winkler >= avg_width: {wk} >= {aw}")
    if not wk_ok: errors.append(f"winkler < avg_width")

    # ── 5. No NaN / inf ────────────────────────────────────────────
    finite_ok = all(np.isfinite(v) for v in metrics.values())
    print(f"{'PASS' if finite_ok else 'FAIL'} 5. All metrics finite")
    if not finite_ok: errors.append("Non-finite metric")

    # ── 6. Cross-check coverage against manual count ────────────────
    manual_hits = sum(1 for r in preds if r["lower"] <= r["actual"] <= r["upper"])
    manual_cov = round(manual_hits / len(preds), 4)
    xcheck = manual_cov == cov
    print(f"{'PASS' if xcheck else 'FAIL'} 6. Coverage cross-check: evaluate={cov}, manual={manual_cov}")
    if not xcheck: errors.append(f"Coverage mismatch: {cov} vs {manual_cov}")

    # ── 7. Cross-check avg_width ────────────────────────────────────
    manual_aw = round(np.mean([r["upper"] - r["lower"] for r in preds]), 2)
    aw_xcheck = manual_aw == aw
    print(f"{'PASS' if aw_xcheck else 'FAIL'} 7. avg_width cross-check: evaluate={aw}, manual={manual_aw}")
    if not aw_xcheck: errors.append(f"avg_width mismatch: {aw} vs {manual_aw}")

    # ── 8. Evaluated count matches input ────────────────────────────
    count_ok = len(preds) == (len(df) - WINDOW)
    print(f"{'PASS' if count_ok else 'FAIL'} 8. Evaluated {len(preds)} records (expected {len(df)-WINDOW})")
    if not count_ok: errors.append("Record count mismatch")

    # ── Summary ────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    if errors:
        print(f"FAILED — {len(errors)} issue(s):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("ALL CHECKS PASSED")
    print(f"{'='*50}")

    print(f"\nFinal Metrics:")
    print(f"  Coverage:  {metrics['coverage']:.2%}")
    print(f"  Avg Width: ${metrics['avg_width']:,.2f}")
    print(f"  Winkler:   ${metrics['winkler']:,.2f}")

if __name__ == "__main__":
    run()
