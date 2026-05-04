import pandas as pd
import requests


BINANCE_KLINES_URL = "https://api1.binance.com/api/v3/klines"
BINANCE_TICKER_URL = "https://api1.binance.com/api/v3/ticker/price"

# Binance kline response column indices
_OPEN_TIME = 0
_OPEN = 1
_HIGH = 2
_LOW = 3
_CLOSE = 4


def fetch_btc_data(
    symbol: str = "BTCUSDT",
    interval: str = "1h",
    limit: int = 721,
) -> pd.DataFrame:
    """
    Fetch BTCUSDT 1-hour candle data from Binance and return a clean
    720-row DataFrame ready for modelling.

    Steps:
        1. Fetch `limit` rows (721 by default – one extra for the
           incomplete candle that is still forming).
        2. Parse into a DataFrame with columns:
           open_time, open, high, low, close.
        3. Cast types: OHLC → float64, open_time → datetime.
        4. Sort ascending by open_time.
        5. Drop the last row (incomplete candle) to prevent data leakage.
        6. Validate: no nulls, correct dtypes, expected row count,
           and 1-hour gaps between consecutive timestamps.
    """

    # ── 1. Fetch ────────────────────────────────────────────────────
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    resp = requests.get(BINANCE_KLINES_URL, params=params, timeout=15)
    resp.raise_for_status()
    raw = resp.json()

    # ── 2. Parse ────────────────────────────────────────────────────
    rows = [
        {
            "open_time": r[_OPEN_TIME],
            "open":      r[_OPEN],
            "high":      r[_HIGH],
            "low":       r[_LOW],
            "close":     r[_CLOSE],
        }
        for r in raw
    ]
    df = pd.DataFrame(rows)

    # ── 3. Clean types ──────────────────────────────────────────────
    for col in ("open", "high", "low", "close"):
        df[col] = df[col].astype(float)

    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms")

    # ── 4. Sort ascending ───────────────────────────────────────────
    df = df.sort_values("open_time").reset_index(drop=True)

    # ── 5. Drop incomplete candle (last row) ────────────────────────
    df = df.iloc[:-1].reset_index(drop=True)

    # ── 6. Validate ─────────────────────────────────────────────────
    _validate(df, expected_rows=limit - 1, interval=interval)

    return df


def _validate(df: pd.DataFrame, expected_rows: int, interval: str) -> None:
    """Run sanity checks on the cleaned DataFrame."""

    # Row count
    if len(df) != expected_rows:
        raise ValueError(
            f"Expected {expected_rows} rows, got {len(df)}"
        )

    # No missing values
    if df.isnull().any().any():
        raise ValueError("DataFrame contains null values")

    # Correct dtypes
    for col in ("open", "high", "low", "close"):
        if df[col].dtype != "float64":
            raise TypeError(f"Column '{col}' is not float64")
    if not pd.api.types.is_datetime64_any_dtype(df["open_time"]):
        raise TypeError("Column 'open_time' is not datetime")

    # Time continuity – calculate expected gap based on interval
    diffs = df["open_time"].diff().dropna()
    
    if interval.endswith('m'):
        expected_delta = pd.Timedelta(minutes=int(interval[:-1]))
    elif interval.endswith('h'):
        expected_delta = pd.Timedelta(hours=int(interval[:-1]))
    elif interval.endswith('d'):
        expected_delta = pd.Timedelta(days=int(interval[:-1]))
    else:
        expected_delta = pd.Timedelta(hours=1) # Default

    bad = diffs[diffs != expected_delta]
    if not bad.empty:
        raise ValueError(
            f"Found {len(bad)} non-{interval} gap(s) in open_time "
            f"starting at index {bad.index[0]}"
        )

def fetch_current_price(symbol: str = "BTCUSDT") -> float:
    """Fetch the absolute latest price for a symbol using the lightweight ticker endpoint."""
    try:
        resp = requests.get(BINANCE_TICKER_URL, params={"symbol": symbol}, timeout=5)
        resp.raise_for_status()
        return float(resp.json()["price"])
    except Exception as e:
        # Re-raise with info but allow caller to handle fallback
        print(f"Error fetching price from {BINANCE_TICKER_URL}: {e}")
        raise e
