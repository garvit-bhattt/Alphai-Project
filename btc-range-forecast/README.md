<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin Logo" width="80" height="80">
  <h1>AlphaRange: BTC Range Forecast</h1>
  <p>An institutional-grade, automated Bitcoin 1-hour range forecasting system powered by Cyber-GBM and FIGARCH models.</p>
</div>

## 📌 Overview

AlphaRange is a production-ready forecasting dashboard that predicts the next 1-hour trading range (95% confidence intervals) for Bitcoin (BTC/USDT). It leverages advanced stochastic volatility modeling (Cyber-GBM) with Student-t distributed shocks to account for crypto market fat-tails and volatility clustering.

The system is fully automated, continuously fetching live market data from Binance, generating predictions via an hourly background job, storing results in a Supabase PostgreSQL database, and serving them to a sleek, modern Next.js frontend dashboard.

---

## 🏗️ System Architecture

The architecture is divided into a robust Python quantitative backend and a high-fidelity React dashboard.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Data Ingestion** | Binance API, `requests` | Fetches live and historical BTCUSDT OHLCV data. |
| **Data Processing** | `pandas`, `numpy` | Cleans data, computes log returns, and prepares features. |
| **Quantitative Model** | `scipy`, `arch` | Implements Cyber-GBM with FIGARCH conditional volatility. |
| **Automation** | `APScheduler` | Runs hourly cron jobs to generate and persist predictions. |
| **Backend API** | FastAPI, Uvicorn | Serves prediction endpoints, historical data, and metrics. |
| **Database** | Supabase | Stores prediction history and resolves actual vs. predicted bounds. |
| **Frontend UI** | Next.js, React 19 | Provides an institutional-grade, responsive dashboard. |
| **Visualizations** | Plotly.js, Tailwind v4 | Renders interactive price charts and predictive bands. |

---

## 🧠 Modeling Approach: Cyber-GBM

The core of the forecasting engine is a specialized Monte Carlo simulation approach. Instead of a standard Geometric Brownian Motion, it employs **Cyber-GBM** to handle cryptocurrency's extreme market behaviors:

1. **FIGARCH Volatility**: Captures long-memory volatility clustering. Fits hourly using the `arch` library.
2. **Student-t Shocks**: Accommodates the "fat tails" commonly seen in BTC returns by fitting degrees of freedom (`nu`) dynamically.
3. **Dynamic Parameters**: Uses rolling Shannon entropy and return magnitudes to dynamically update shock parameters during crisis periods.
4. **Monte Carlo Simulation**: Simulates 5,000 price paths to determine the 2.5th and 97.5th percentiles (95% CI) for the next hourly candle.

---

## 🔌 API Reference

The FastAPI backend exposes the following endpoints to the dashboard:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/price` | `GET` | Fetches the absolute latest BTC price for lightweight polling. |
| `/predict` | `GET` | Retrieves the latest pre-computed prediction range from Supabase. |
| `/metrics` | `GET` | Returns precomputed backtest metrics (coverage, avg width, Winkler).|
| `/history` | `GET` | Returns historical OHLC data for charting. Supports dynamic timeframes. |
| `/prediction-history` | `GET` | Returns resolved past predictions for the audit timeline UI. |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase Project

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

Run the backend server:
```bash
python main.py
```
*(The server will start on `http://localhost:8000` and instantly kick off the background APScheduler).*

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```
*(The dashboard will be available at `http://localhost:3000`).*

---

## 📁 Directory Structure

```text
btc-range-forecast/
├── backend/
│   ├── src/
│   │   ├── data_fetch.py      # Binance API integrations
│   │   ├── preprocess.py      # Feature engineering
│   │   └── model.py           # Cyber-GBM & FIGARCH implementation
│   ├── db.py                  # Supabase database interactions
│   ├── main.py                # FastAPI app & background scheduler
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components (Charts, Timeline)
│   │   ├── app/               # Next.js app router pages
│   │   └── ...
│   └── package.json           # Node dependencies
├── results/                   # Backtest metrics and evaluation logs
└── README.md                  # Project documentation
```
