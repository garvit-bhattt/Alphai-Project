import numpy as np
import pandas as pd
from scipy import stats


def run_backtest(
    df: pd.DataFrame,
    window_size: int = 100,
    vol_window: int = 50,
    n_sims: int = 10_000,
    seed: int = 42,
) -> list[dict]:
    """
    Rolling-window backtest with strict no-leakage guarantees.

    At each step *i* the function uses **only** rows ``[i - window_size : i]``
    to predict the price range for time index *i*, then evaluates against
    the realised price.

    Parameters
    ----------
    df : DataFrame
        Output of ``prepare_features()``.
        Columns: open_time, open, high, low, close, log_return.
        Must be sorted ascending by open_time (719 rows typical).
    window_size : int
        Number of past rows used as the training window.
    vol_window : int
        Number of recent rows inside the window used for sigma.
        Must be <= window_size.
    n_sims : int
        Monte-Carlo samples per step.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    list[dict]
        One record per step with keys:
        time, lower, upper, actual, hit.
    """

    assert vol_window <= window_size, "vol_window must be <= window_size"

    rng = np.random.default_rng(seed)

    # Work on a frozen copy — original df must never be mutated.
    df = df.copy()

    i_start = window_size
    i_end = len(df) - 1          # inclusive upper bound
    records: list[dict] = []

    for i in range(i_start, i_end + 1):

        # ── 1. Slice training window (past only) ───────────────────
        train = df.iloc[i - window_size : i]
        assert len(train) == window_size, (
            f"Step {i}: train length {len(train)} != {window_size}"
        )
        assert train["open_time"].max() < df["open_time"].iloc[i], (
            f"Step {i}: training window leaks into the future"
        )

        # ── 2. Extract inputs from train only ──────────────────────
        S_t = float(train["close"].iloc[-1])
        returns = train["log_return"]

        # ── 3. Estimate parameters ─────────────────────────────────
        mu = float(returns.mean())
        sigma = float(returns.iloc[-vol_window:].std())
        assert np.isfinite(sigma) and sigma > 0, (
            f"Step {i}: sigma is invalid ({sigma})"
        )

        # Fit Student-t degrees of freedom from training returns
        standardised = (returns - mu) / sigma
        nu = max(4.0, stats.t.fit(standardised, floc=0, fscale=1)[0])

        # ── 4. Simulate next-step prices (GBM + Student-t) ────────
        dt = 1.0  # 1-hour step
        Z = rng.standard_t(df=nu, size=n_sims)
        Z = Z * np.sqrt((nu - 2) / nu)  # rescale to unit variance
        S_next = S_t * np.exp((mu - 0.5 * sigma**2) * dt
                              + sigma * np.sqrt(dt) * Z)

        # ── 5. Extract 95% prediction range ────────────────────────
        lower = float(np.percentile(S_next, 2.5))
        upper = float(np.percentile(S_next, 97.5))
        assert lower <= upper, f"Step {i}: lower > upper"
        assert np.isfinite(lower) and np.isfinite(upper), (
            f"Step {i}: non-finite bounds"
        )

        # ── 6. Evaluate (NOW read the target) ──────────────────────
        actual = float(df["close"].iloc[i])
        hit = bool(lower <= actual <= upper)

        # ── 7. Record ──────────────────────────────────────────────
        records.append({
            "time":   df["open_time"].iloc[i],
            "lower":  round(lower, 2),
            "upper":  round(upper, 2),
            "actual": round(actual, 2),
            "hit":    hit,
        })

    assert len(records) == len(df) - window_size, (
        f"Expected {len(df) - window_size} records, got {len(records)}"
    )

    return records
