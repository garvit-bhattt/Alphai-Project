import numpy as np
import pandas as pd




def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform cleaned price data into a modelling-ready dataset.

    Takes the 720-row DataFrame from fetch_btc_data() and returns a
    719-row DataFrame with an appended ``log_return`` column.

    Steps
    -----
    1. Compute log returns:  log(close[t] / close[t-1])
    2. Drop the first row   (NaN from the shift)
    3. Reset the index      (0 → n-1)
    4. Validate             (no NaN, no inf, correct length, temporal order)

    The original price columns are never modified.
    """

    # ── 0. Work on a copy so the caller's DataFrame stays intact ────
    out = df.copy()

    # ── 1. Compute log returns ──────────────────────────────────────
    out["log_return"] = np.log(out["close"] / out["close"].shift(1))

    # ── 2. Drop the first row (NaN from shift) ──────────────────────
    out = out.iloc[1:].reset_index(drop=True)

    # ── 3. Validate ─────────────────────────────────────────────────
    _validate_features(out, expected_rows=len(df) - 1)

    return out


def _validate_features(df: pd.DataFrame, expected_rows: int) -> None:
    """Run all validation checks on the enriched DataFrame."""

    # Row count
    if len(df) != expected_rows:
        raise ValueError(
            f"Expected {expected_rows} rows, got {len(df)}"
        )

    # Sequential index (0 → n-1)
    if not (df.index == range(expected_rows)).all():
        raise ValueError("Index is not sequential after reset")

    # No NaN anywhere
    if df.isnull().any().any():
        raise ValueError("DataFrame still contains NaN values")

    # No inf / -inf in log_return
    if not np.isfinite(df["log_return"]).all():
        raise ValueError("log_return contains inf or -inf values")

    # Correct dtypes
    if df["log_return"].dtype != np.float64:
        raise TypeError("log_return is not float64")
    for col in ("open", "high", "low", "close"):
        if df[col].dtype != np.float64:
            raise TypeError(f"Column '{col}' is not float64")
    if not pd.api.types.is_datetime64_any_dtype(df["open_time"]):
        raise TypeError("open_time is not datetime")

    # Temporal order — sorted ascending
    if not df["open_time"].is_monotonic_increasing:
        raise ValueError("Data is not sorted ascending by open_time")
