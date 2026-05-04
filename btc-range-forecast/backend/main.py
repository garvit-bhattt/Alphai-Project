import os
import json
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from src.data_fetch import fetch_btc_data, fetch_current_price
from src.preprocess import prepare_features
from src.model import predict_next_range
from db import insert_prediction, get_db_history, resolve_db_predictions

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")
METRICS_PATH = os.path.join(RESULTS_DIR, "metrics.json")

# ── Part A: Background Scheduler Logic ──

def run_prediction_job():
    """
    Core automation: Fetches data, runs the FIGARCH model, and stores the result in Supabase.
    """
    logger.info("CRON: Starting hourly prediction job...")
    try:
        # 1. Fetch
        raw_df = fetch_btc_data() 
        
        # 2. Prepare features
        full_df = prepare_features(raw_df) 
        
        # 3. Select recent (last 500)
        df_recent = full_df.tail(500).reset_index(drop=True)
        
        # 4. Run model
        prediction = predict_next_range(df_recent, seed=42)
        
        # 5. Extract metadata
        last_row = df_recent.iloc[-1]
        current_price = float(last_row["close"])
        import pandas as pd
        candle_time = last_row["open_time"] + pd.Timedelta(hours=1)
        
        # 6. Database Persistence
        # Resolve past entries
        resolve_db_predictions(full_df)
        
        # Format timestamps
        if hasattr(candle_time, 'to_pydatetime'):
            ct = candle_time.to_pydatetime()
        else:
            ct = candle_time
        if ct.tzinfo is None:
            ct = ct.replace(tzinfo=timezone.utc)
            
        # Prepare payload
        data = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "candle_time": ct.isoformat(),
            "current_price": current_price,
            "lower": prediction["lower"],
            "upper": prediction["upper"],
            "width": prediction["upper"] - prediction["lower"],
            "actual": None,
            "hit": None
        }
        
        # Insert to Supabase
        insert_prediction(data)
        logger.info(f"DB_SYNC: New prediction for candle {ct.isoformat()} stored in Supabase.")
        
    except Exception as e:
        logger.error(f"Background prediction job failed: {e}")

# Scheduler setup
scheduler = BackgroundScheduler(timezone=timezone.utc)
scheduler.add_job(run_prediction_job, 'cron', minute=0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler and run initial job in background
    scheduler.start()
    scheduler.add_job(run_prediction_job) 
    yield
    # Shutdown
    scheduler.shutdown()

app = FastAPI(title="BTC Range Forecast API", lifespan=lifespan)

@app.get("/")
def root():
    return {"status": "ok", "service": "BTC Range Forecast API"}

# ── 1. CORS Configuration ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/price")
def get_price():
    """
    Returns the latest BTC price and current hour for lightweight polling.
    """
    try:
        price = fetch_current_price()
        return {
            "price": round(price, 2),
            "hour": datetime.now(timezone.utc).hour
        }
    except Exception as e:
        logger.error(f"Price fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict")
def predict():
    """
    Returns the latest pre-computed prediction from Supabase.
    """
    try:
        history = get_db_history(limit=1)
        if not history:
             # Failsafe: Run job if DB is empty
             run_prediction_job()
             history = get_db_history(limit=1)
             if not history:
                 raise HTTPException(status_code=404, detail="No predictions available yet.")
        
        latest_entry = history[0]
        
        # Get live price - Wrap in try/except to prevent 418 Client Error from crashing the dashboard
        try:
            live_price = fetch_current_price()
        except Exception as e:
            logger.warning(f"Live price fetch failed on backend: {e}. Using fallback from DB.")
            live_price = latest_entry.get("current_price", 0)
        
        return {
            "current_price": live_price,
            "lower": latest_entry.get("lower", 0),
            "upper": latest_entry.get("upper", 0),
            "confidence": 0.95,
            "candle_time": latest_entry.get("candle_time")
        }
    except Exception as e:
        logger.error(f"Failed to read latest prediction from DB: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/metrics")
def metrics():
    """
    Return precomputed backtest metrics from results/metrics.json.
    """
    if not os.path.exists(METRICS_PATH):
        return {
            "coverage": 0.0,
            "avg_width": 0.0,
            "winkler": 0.0,
            "error": "Metrics not yet computed"
        }
    
    try:
        with open(METRICS_PATH, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error(f"Failed to load metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to load metrics")

@app.get("/history")
def history(interval: str = "1h"):
    """
    Returns historical OHLC data for chart visualization.
    """
    try:
        raw_df = fetch_btc_data(interval=interval)
        df_recent = raw_df.tail(100).reset_index(drop=True)
        
        history_data = []
        for _, row in df_recent.iterrows():
            ts = row["open_time"].isoformat()
            if not ts.endswith("Z"): ts += "Z"
            history_data.append({
                "time": ts,
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
            })
        return history_data
    except Exception as e:
        logger.error(f"History fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prediction-history")
def prediction_history(limit: int = 50):
    """
    Returns the history of resolved predictions from Supabase for the audit timeline.
    """
    try:
        from db import get_resolved_db_history
        return get_resolved_db_history(limit=limit)
    except Exception as e:
        logger.error(f"Failed to load prediction history from DB: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
