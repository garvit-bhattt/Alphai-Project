'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPrediction, getMetrics, getHistory, getPredictionHistory, getPrice, PredictionResponse, MetricsResponse, HistoryItem, PredictionHistoryItem } from '@/lib/api';
import MetricsCard from "@/components/MetricsCard";
import Chart from "@/components/Chart";
import ForecastPanel from "@/components/ForecastPanel";
import PredictionHistory from "@/components/PredictionHistory";

import { useBinancePrice } from '@/lib/useBinancePrice';

interface DashboardContentProps {
  initialPrediction: PredictionResponse;
  initialMetrics: MetricsResponse;
  initialHistory: HistoryItem[];
  initialPredictionHistory: PredictionHistoryItem[];
}

export default function DashboardContent({ 
  initialPrediction, 
  initialMetrics,
  initialHistory,
  initialPredictionHistory
}: DashboardContentProps) {
  const [prediction, setPrediction] = useState<PredictionResponse>(initialPrediction);
  const [metrics, setMetrics] = useState<MetricsResponse>(initialMetrics);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>(initialPredictionHistory);
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [cache, setCache] = useState<Record<string, HistoryItem[]>>({ "1h": initialHistory });
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live price via WebSocket
  const livePrice = useBinancePrice('btcusdt');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: "UTC" }));
  }, []);

  // Update prediction state when livePrice updates from WebSocket
  useEffect(() => {
    if (livePrice !== null) {
      setPrediction(prev => ({ ...prev, current_price: livePrice }));
    }
  }, [livePrice]);

  // 2. MEDIUM REFRESH: Prediction + Metrics + Chart (60s)
  const fetchAllData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [newPrediction, newMetrics, newPredictionHistory, newHistory] = await Promise.all([
        getPrediction(),
        getMetrics(),
        getPredictionHistory(),
        getHistory(timeframe)
      ]);
      setPrediction(newPrediction);
      setMetrics(newMetrics);
      setPredictionHistory(newPredictionHistory);
      setHistory(newHistory);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: "UTC" }));
    } catch (err) {
      console.error("Data refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [timeframe]);

  // Set up decoupled intervals (removed priceInterval since we use WebSocket)
  useEffect(() => {
    const dataInterval = setInterval(fetchAllData, 60000); // 60s
    
    return () => {
      clearInterval(dataInterval);
    };
  }, [fetchAllData]);

  const updateHistory = useCallback(async (tf: string) => {
    if (cache[tf]) {
      setHistory(cache[tf]);
      return;
    }
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      setIsHistoryLoading(true);
      const newHistory = await getHistory(tf);
      setHistory(newHistory);
      setCache(prev => ({ ...prev, [tf]: newHistory }));
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("History fetch failed:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [cache]);

  const handleTimeframeChange = (tf: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimeframe(tf);
    timeoutRef.current = setTimeout(() => {
      updateHistory(tf);
    }, 200);
  };

  const formatP = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const insights = [
    { 
      color: 'red' as const, 
      title: "Model calibration check", 
      text: `Currently at ${(metrics.coverage * 100).toFixed(2)}% (Target: 95.00%). Calibration is strictly bound to 1H windows.` 
    },
    { 
      color: 'green' as const, 
      title: "Multi-timeframe analysis", 
      text: `Chart switched to ${timeframe}. Predictions remain 1H calibrated for statistical accuracy.` 
    },
    { 
      color: 'green' as const, 
      title: "Simulation window", 
      text: "Analyzing last 500 hours of volatility to compute Student-t distribution." 
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 py-4 gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white">AlphaRange <span className="text-[var(--primary)]">BTC</span></h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Institutional Grade Volatility Forecasting</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-[#0F1720] p-1 rounded-lg border border-[#1C2530]">
            {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => (
              <button 
                key={tf}
                onClick={() => handleTimeframeChange(tf.toLowerCase())}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all duration-200 ${timeframe === tf.toLowerCase() ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <div className={`w-1.5 h-1.5 ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]'} rounded-full`} />
              <span className="text-[9px] font-black uppercase text-white">System: Live</span>
            </div>
            <p className="text-[8px] text-gray-500 mt-0.5 font-bold uppercase tracking-tighter">Updated {lastUpdated} UTC</p>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-5 gap-4 shrink-0">
        <MetricsCard variant="current-price" label="Current Price" value={`$${formatP(prediction.current_price)}`} subValue="Live BTCUSDT" />
        <MetricsCard variant="forecast-range" label="Forecast Range (1H)" value={`$${formatP(prediction.lower)} - $${formatP(prediction.upper)}`} subValue="95% Confidence" />
        <MetricsCard variant="coverage" label="Coverage (30D)" value={`${(metrics.coverage * 100).toFixed(2)}%`} progress={metrics.coverage * 100} progressTarget="95%" />
        <MetricsCard variant="avg-range" label="Avg Range Width" value={`$${formatP(metrics.avg_width)}`} subValue="Lower = Higher Precision" />
        <MetricsCard variant="winkler" label="Winkler Score" value={formatP(metrics.winkler)} subValue="Efficiency Metric" />
      </div>

      {/* Main Content Area (PROPORTIONAL FLEX) */}
      <div className="flex-[2] min-h-0 grid grid-cols-12 gap-4">
        {/* Left: Chart */}
        <div className="col-span-8 h-full min-h-0">
          <Chart 
            history={history}
            isLoading={isHistoryLoading}
            prediction={timeframe === '1h' ? {
              lower: prediction.lower,
              upper: prediction.upper,
              current_price: prediction.current_price
            } : undefined}
          />
        </div>

        {/* Right: Forecast Panel */}
        <div className="col-span-4 h-full min-h-0">
          <ForecastPanel 
            prediction={prediction}
            currentPrice={prediction.current_price}
            insights={insights}
            history={history}
          />
        </div>
      </div>

      {/* Bottom Section (PROPORTIONAL FLEX) */}
      <div className="flex-[1] min-h-0 grid grid-cols-2 gap-4">
        <div className="card min-h-0 p-6 flex flex-col justify-between border-l-4 border-l-[#22c55e]">
          <div>
            <div className="mb-4">
              <h3 className="text-[10px] font-black uppercase text-white/90 tracking-widest">Backtest Performance</h3>
              <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">30-Day Statistical Evaluation</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end border-b border-[#1C2530] pb-2">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Coverage (95% Target)</span>
                <span className="text-xl font-black tracking-tighter text-white">{(metrics.coverage * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-end border-b border-[#1C2530] pb-2">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Avg Interval Width</span>
                <span className="text-xl font-black tracking-tighter text-white">${formatP(metrics.avg_width)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Winkler Score</span>
                <span className="text-xl font-black tracking-tighter text-white">{formatP(metrics.winkler)}</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter leading-relaxed border-t border-[#1C2530] pt-2 mt-2 shrink-0">
            Higher coverage & lower score = Better calibration.
          </p>
        </div>
        
        <PredictionHistory history={predictionHistory} />
      </div>
    </div>
  );
}
