import numpy as np

def evaluate_predictions(predictions: list[dict], alpha: float = 0.05) -> dict:
    """
    Compute evaluation metrics for backtest predictions.

    Parameters
    ----------
    predictions : list[dict]
        Each record must contain: lower, upper, actual.
    alpha : float
        Significance level (default 0.05 for 95% intervals).

    Returns
    -------
    dict with keys: coverage, avg_width, winkler.
    """

    n = len(predictions)
    assert n > 0, "No predictions to evaluate"

    hits = 0
    total_width = 0.0
    total_winkler = 0.0

    for r in predictions:
        lower = r["lower"]
        upper = r["upper"]
        actual = r["actual"]

        assert np.isfinite(lower) and np.isfinite(upper) and np.isfinite(actual), (
            "Non-finite value in prediction record"
        )

        width = upper - lower

        # ── Coverage ────────────────────────────────────────────────
        if lower <= actual <= upper:
            hits += 1

        # ── Winkler score ───────────────────────────────────────────
        if actual < lower:
            score = width + (2 / alpha) * (lower - actual)
        elif actual > upper:
            score = width + (2 / alpha) * (actual - upper)
        else:
            score = width

        total_width += width
        total_winkler += score

    coverage = hits / n
    avg_width = total_width / n
    winkler = total_winkler / n

    # ── Validation ──────────────────────────────────────────────────
    assert 0.0 <= coverage <= 1.0, f"Coverage {coverage} out of [0, 1]"
    assert avg_width > 0, f"avg_width {avg_width} is not positive"
    assert winkler >= avg_width, f"winkler {winkler} < avg_width {avg_width}"
    assert np.isfinite(avg_width) and np.isfinite(winkler), "Non-finite metric"

    return {
        "coverage": round(coverage, 4),
        "avg_width": round(avg_width, 2),
        "winkler": round(winkler, 2),
    }
