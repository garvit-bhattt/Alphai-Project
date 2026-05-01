from supabase import create_client
import os
from dotenv import load_dotenv

# Ensure env vars are loaded (especially for migration scripts run outside uvicorn)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_prediction(data):
    """Upsert a prediction record, deduplicating by candle_time."""
    # Ensure numerical types are clean
    clean_data = {
        "created_at": data.get("created_at"),
        "candle_time": data.get("candle_time"),
        "current_price": float(data.get("current_price", 0)),
        "lower": float(data.get("lower", 0)),
        "upper": float(data.get("upper", 0)),
        "width": float(data.get("width", 0)),
        "actual": float(data["actual"]) if data.get("actual") is not None else None,
        "hit": data.get("hit")
    }
    
    return supabase.table("predictions").upsert(
        clean_data,
        on_conflict="candle_time"
    ).execute()

def get_db_history(limit=100):
    """Fetch recent predictions sorted by generation time."""
    res = supabase.table("predictions") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return res.data

def get_resolved_db_history(limit=50):
    """Fetch only resolved predictions (actual IS NOT NULL) for the audit log."""
    res = supabase.table("predictions") \
        .select("created_at, candle_time, lower, upper, actual, hit") \
        .not_.is_("actual", "null") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return res.data


def resolve_db_predictions(historical_df):
    """Resolve any pending predictions against their actual target candle close prices."""
    # 1. Fetch pending
    pending = supabase.table("predictions") \
        .select("*") \
        .is_("actual", "null") \
        .execute()
    
    import pandas as pd
    for entry in pending.data:
        target_time_str = entry["candle_time"]
        target_dt = pd.to_datetime(target_time_str)
        if target_dt.tzinfo is not None:
            target_dt = target_dt.tz_localize(None)
            
        matching_row = historical_df[historical_df['open_time'] == target_dt]
        if not matching_row.empty:
            actual_price = float(matching_row.iloc[0]["close"])
            hit = entry["lower"] <= actual_price <= entry["upper"]
            supabase.table("predictions").update({
                "actual": round(actual_price, 2),
                "hit": hit
            }).eq("id", entry["id"]).execute()
