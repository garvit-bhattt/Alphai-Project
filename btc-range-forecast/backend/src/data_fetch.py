import pandas as pd
import requests
import time
import random


BINANCE_ENDPOINTS = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

def _fetch_from_bybit_klines(symbol: str, interval: str, limit: int):
    """Fallback fetcher using Bybit v5 API."""
    print(f"Attempting fallback fetch from Bybit for {symbol}...")
    bybit_interval = "60" if interval == "1h" else interval.replace("h", "60").replace("d", "D").replace("m", "")
    if interval == "1d": bybit_interval = "D"
    
    url = "https://api.bybit.com/v5/market/kline"
    params = {
        "category": "spot",
        "symbol": symbol.upper(),
        "interval": bybit_interval,
        "limit": limit
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if data.get("retCode") != 0:
            raise Exception(f"Bybit API error: {data.get('retMsg')}")
            
        # Bybit returns [startTime, open, high, low, close, volume, turnover]
        # Map to Binance format: [openTime, open, high, low, close, ...]
        raw_list = data["result"]["list"]
        raw_list.reverse() # Oldest first
        
        return [
            [int(r[0]), r[1], r[2], r[3], r[4], "0", "0", "0", "0", "0", "0"]
            for r in raw_list
        ]
    except Exception as e:
        print(f"Bybit fallback failed: {e}")
        raise e

def _fetch_from_bybit_ticker(symbol: str):
    """Fallback ticker fetcher using Bybit v5 API."""
    url = "https://api.bybit.com/v5/market/tickers"
    params = {"category": "spot", "symbol": symbol.upper()}
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return {"price": data["result"]["list"][0]["lastPrice"]}
    except Exception as e:
        print(f"Bybit ticker fallback failed: {e}")
        raise e

def _make_request(path: str, params: dict, timeout: int = 10):
    """Try multiple Binance endpoints and handle retries with rotation and Bybit fallback."""
    last_exception = None
    
    mirrors = [
        "https://api.binance.com",
        "https://api1.binance.com",
        "https://api2.binance.com",
        "https://api3.binance.com",
        "https://api-g1.binance.com",
        "https://api-g2.binance.com",
        "https://api-g3.binance.com"
    ]
    
    for base_url in mirrors:
        url = f"{base_url}{path}"
        try:
            resp = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
            
            if resp.status_code == 418:
                print(f"418 Client Error on {base_url}, trying next mirror...")
                last_exception = requests.exceptions.HTTPError(f"418 Client Error on {base_url}", response=resp)
                time.sleep(random.uniform(0.3, 0.8))
                continue
                
            resp.raise_for_status()
            return resp.json()
            
        except Exception as e:
            print(f"Error on {base_url}: {e}")
            last_exception = e
            continue
    
    # LAST RESORT: BYBIT FALLBACK
    try:
        if "klines" in path:
            return _fetch_from_bybit_klines(params["symbol"], params["interval"], params["limit"])
        elif "ticker" in path:
            return _fetch_from_bybit_ticker(params["symbol"])
    except Exception as e:
        print(f"Critical: Bybit fallback also failed: {e}")
    
    error_msg = f"Failed to fetch {path} from all Binance mirrors AND Bybit fallback. Last error: {last_exception}"
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
