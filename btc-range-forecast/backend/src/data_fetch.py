import pandas as pd
import requests


BINANCE_ENDPOINTS = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def _make_request(path: str, params: dict, timeout: int = 10):
    """Try multiple Binance endpoints and handle retries with rotation."""
    last_exception = None
    for base_url in BINANCE_ENDPOINTS:
        url = f"{base_url}{path}"
        try:
            # Add headers to avoid 418/403 blocks
            resp = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
            
            if resp.status_code == 418:
                print(f"Banned (418) on {base_url}, trying next endpoint...")
                continue
                
            resp.raise_for_status()
            return resp.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Network error on {base_url}: {e}")
            last_exception = e
            continue
        except Exception as e:
            print(f"Unexpected error on {base_url}: {e}")
            last_exception = e
            continue
    
    # If we get here, all endpoints failed
    error_msg = f"Failed to fetch {path} from all Binance endpoints. Last error: {last_exception}"
    print(error_msg)
    raise last_exception or Exception(error_msg)

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
    raw = _make_request("/api/v3/klines", params=params, timeout=15)

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
        data = _make_request("/api/v3/ticker/price", params={"symbol": symbol}, timeout=5)
        return float(data["price"])
    except Exception as e:
        # Re-raise with info but allow caller to handle fallback
        print(f"Error fetching price from {BINANCE_TICKER_URL}: {e}")
        raise e
