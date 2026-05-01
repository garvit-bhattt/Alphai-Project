import os
import json
import logging
import pandas as pd
import time
import sys
from datetime import datetime, timezone

# Add parent directory to path to allow imports from src
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.data_fetch import fetch_btc_data
from src.preprocess import prepare_features
from src.model import predict_next_range
import src.model
from analysis.evaluate import evaluate_predictions

def run_cyber_backtest(limit=720, window_size=500):
    """
    Runs a rolling backtest using the Cyber-GBM model.
    """
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    logger.info("Fetching data for backtest...")
    # Fetch enough data for the window + test period
    df_raw = fetch_btc_data(limit=limit)
    df = prepare_features(df_raw)
    
    logger.info(f"Data prepared. Total rows: {len(df)}")
    
    records = []
    total_steps = len(df) - window_size
    
    if total_steps <= 0:
        logger.error(f"Not enough data for backtest. Need more than {window_size} rows.")
        return
        
    logger.info(f"Starting backtest for {total_steps} steps...")
    
    # Disable FIGARCH caching for backtest accuracy (force refit at each step)
    src.model._FIGARCH_CACHE["refresh_interval"] = -1
    
    start_time = time.time()
    for i in range(window_size, len(df)):
        # Training window (mimics production)
        train_df = df.iloc[i-window_size:i].copy()
        actual = float(df["close"].iloc[i])
        
        # Predict range for the next candle
        prediction = predict_next_range(train_df)
        prediction["actual"] = actual
        prediction["time"] = df["open_time"].iloc[i]
        
        records.append(prediction)
        
        if (i - window_size + 1) % 10 == 0:
            elapsed = time.time() - start_time
            logger.info(f"Progress: {i - window_size + 1}/{total_steps} steps. Elapsed: {elapsed:.2f}s")

    logger.info(f"Backtest completed in {time.time() - start_time:.2f} seconds.")
    
    # Evaluate
    metrics = evaluate_predictions(records)
    logger.info(f"Evaluation Metrics: {metrics}")
    
    # Save results
    results_dir = os.path.join(os.path.dirname(__file__), "..", "..", "results")
    os.makedirs(results_dir, exist_ok=True)
    
    metrics_path = os.path.join(results_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    logger.info(f"Updated metrics saved to {metrics_path}")
    return metrics

if __name__ == "__main__":
    run_cyber_backtest()
