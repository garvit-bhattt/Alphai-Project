from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.data_fetch import fetch_btc_data

app = FastAPI(title="BTC Range Forecast API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/predict")
def predict():
    """
    Fetch latest BTCUSDT data, use the last 500 rows for speed,
    and return the predicted price range.
    """
    try:
        df = fetch_btc_data()          # 720 clean rows
        df = df.tail(500).reset_index(drop=True)  # keep last 500 for speed

        current_price = float(df["close"].iloc[-1])
        # Stub prediction band until model is integrated
        lower = round(current_price * 0.98, 2)
        upper = round(current_price * 1.02, 2)

        return {
            "current_price": round(current_price, 2),
            "lower": lower,
            "upper": upper,
            "confidence": 0.95,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
def metrics():
    """
    Returns the latest backtest metrics.
    Stub values until backtest pipeline is integrated.
    """
    return {
        "coverage": 0.945,
        "avg_width": 2500.5,
        "winkler": 2600.0,
    }


@app.get("/history")
def history():
    """
    Returns historical predictions.
    """
    return []


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
