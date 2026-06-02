'use client';

import { useState, useEffect } from 'react';
import { getPrediction, getMetrics, getHistory, getPredictionHistory, PredictionResponse, MetricsResponse as SystemMetrics, HistoryItem, PredictionHistoryItem } from '@/lib/api';
import TerminalPanel from './TerminalPanel';
import Chart from './Chart';
import ForecastPanel from './ForecastPanel';
import PredictionHistory from './PredictionHistory';

interface DashboardContentProps {
  initialPrediction: PredictionResponse;
  initialMetrics: SystemMetrics;
  initialHistory: HistoryItem[];
  initialPredictionHistory: PredictionHistoryItem[];
}

export default function DashboardContent({
  initialPrediction,
  initialMetrics,
  initialHistory,
  initialPredictionHistory
}: DashboardContentProps) {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(initialPrediction);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(initialMetrics);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>(initialPredictionHistory);
  const [isLoading, setIsLoading] = useState(!initialPrediction);
  const [isHistoryLoading, setIsHistoryLoading] = useState(!initialHistory.length);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("1h");

  // Load latest prediction and metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predData, metricsData, predictionHistoryData] = await Promise.all([
          getPrediction(),
          getMetrics(),
          getPredictionHistory()
        ]);
        setPrediction(predData);
        setMetrics(metricsData);
        setPredictionHistory(predictionHistoryData);
        setError(null);
      } catch (err) {
        setError('Failed to load system data. Ensure backend is running.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const interval = setInterval(fetchData, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  // Load chart history when timeframe changes
  useEffect(() => {
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const data = await getHistory(timeframe);
        setHistory(data);
      } catch (err) {
        console.error("Failed to load chart history", err);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [timeframe]);

  const handleTimeframeChange = (newTf: string) => {
    if (newTf !== timeframe) {
      setTimeframe(newTf);
    }
  };

  const formatP = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--secondary)]">Initializing forecasting engine...</p>
        </div>
      </div>
    );
  }

  if (error || !prediction || !metrics) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 rounded text-red-500 max-w-md text-center">
          {error || 'System unavailable'}
        </div>
      </div>
    );
  }

  const lastUpdated = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }).slice(0, 5) + ' UTC';

  const insights = [
    {
      color: 'green' as const,
      title: 'Current Price Position',
      text: `Trading comfortably within the projected 95% confidence interval at $${formatP(prediction.current_price)}. No immediate breakout detected.`
    },
    {
      color: 'blue' as const,
      title: 'Volatility Contraction',
      text: 'Short-term FIGARCH variance indicates decreasing market noise. Range bounds are expected to tighten over the next 4 hours.'
    },
    {
      color: 'red' as const,
      title: 'Support Vulnerability',
      text: `There is a 5% tail risk of breaking below $${formatP(prediction.lower)} due to recent institutional outflows. Adjust stop-losses.`
    }
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      
      {/* Sidebar: Institutional Left Navigation */}
      <aside className="w-[240px] border-r border-[#151515] bg-[#050505] flex flex-col shrink-0 relative">
        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#3A3A3A] opacity-50 pointer-events-none" />
        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#3A3A3A] opacity-50 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#3A3A3A] opacity-50 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#3A3A3A] opacity-50 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-[20px] pt-[24px] pb-[20px] flex flex-col gap-[20px]">
          
          {/* Logo Area */}
          <div className="flex items-center gap-[12px] mb-2">
            <div className="w-[20px] h-[20px] bg-white text-black flex items-center justify-center rounded-[2px] font-bold text-[12px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
            <span className="text-[16px] font-bold text-white tracking-tight">AlphaRange</span>
          </div>

          {/* MARKET */}
          <div className="flex flex-col gap-[4px] mt-4">
            <h3 className="text-[10px] font-bold uppercase text-[#71717A] tracking-[0.25em] mb-[8px] pl-3">Market</h3>
            <button className="h-[28px] flex items-center px-[12px] bg-white/[0.03] group rounded-md">
              <div className="flex items-center gap-[12px] flex-1">
                <div className="w-[14px] h-[14px] bg-[#f7931a] rounded-full flex items-center justify-center text-[8px] font-bold text-white">₿</div>
                <span className="text-[11px] font-medium text-white">BTCUSDT</span>
              </div>
              <div className="w-[4px] h-[4px] rounded-full bg-[#22C55E] shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
            </button>
            <button className="h-[28px] flex items-center px-[12px] group">
              <div className="flex items-center gap-[12px]">
                <span className="text-[10px] font-mono text-[#52525B] group-hover:text-white">+</span>
                <span className="text-[11px] font-medium text-[#A1A1AA] group-hover:text-white transition-colors">ETHUSDT</span>
              </div>
            </button>
            <button className="h-[28px] flex items-center px-[12px] group">
              <div className="flex items-center gap-[12px]">
                <span className="text-[10px] font-mono text-[#52525B] group-hover:text-white">+</span>
                <span className="text-[11px] font-medium text-[#A1A1AA] group-hover:text-white transition-colors">SOLUSDT</span>
              </div>
            </button>
            <button className="h-[28px] flex items-center px-[12px] group">
              <div className="flex items-center gap-[12px]">
                <span className="text-[10px] font-mono text-[#52525B] group-hover:text-white">-</span>
                <span className="text-[11px] font-medium text-[#A1A1AA] group-hover:text-white transition-colors">XRPUSDT</span>
              </div>
            </button>
            <button className="h-[28px] flex items-center px-[12px] group">
              <div className="flex items-center gap-[12px] pl-[18px]">
                <span className="text-[11px] font-medium text-[#A1A1AA] group-hover:text-white transition-colors">ADAUSDT</span>
              </div>
            </button>
          </div>

          {/* MODEL */}
          <div className="flex flex-col gap-[2px] mt-6">
            <h3 className="text-[10px] font-bold uppercase text-[#71717A] tracking-[0.25em] mb-[8px] pl-3">Model</h3>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#22C55E] flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#22C55E]">-</span>
              FIGARCH
            </button>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              GARCH
            </button>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              EGARCH
            </button>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              REALIZED-GARCH
            </button>
          </div>

          {/* TIMEFRAME */}
          <div className="flex flex-col gap-[2px] mt-6">
            <h3 className="text-[10px] font-bold uppercase text-[#71717A] tracking-[0.25em] mb-[8px] pl-3">Timeframe</h3>
            <button onClick={() => handleTimeframeChange('1h')} className={`text-left px-[12px] py-[4px] text-[11px] font-medium flex items-center gap-[12px] ${timeframe === '1h' ? 'text-[#22C55E] bg-white/[0.03]' : 'text-[#A1A1AA] hover:text-white transition-colors'}`}>
              <span className={`text-[10px] font-mono ${timeframe === '1h' ? 'text-[#22C55E]' : 'text-[#52525B] group-hover:text-white'}`}>-</span>
              1H
            </button>
            <button onClick={() => handleTimeframeChange('4h')} className={`text-left px-[12px] py-[4px] text-[11px] font-medium flex items-center gap-[12px] ${timeframe === '4h' ? 'text-[#22C55E] bg-white/[0.03]' : 'text-[#A1A1AA] hover:text-white transition-colors'}`}>
              <span className={`text-[10px] font-mono ${timeframe === '4h' ? 'text-[#22C55E]' : 'text-[#52525B] group-hover:text-white'}`}>-</span>
              4H
            </button>
            <button onClick={() => handleTimeframeChange('1d')} className={`text-left px-[12px] py-[4px] text-[11px] font-medium flex items-center gap-[12px] ${timeframe === '1d' ? 'text-[#22C55E] bg-white/[0.03]' : 'text-[#A1A1AA] hover:text-white transition-colors'}`}>
              <span className={`text-[10px] font-mono ${timeframe === '1d' ? 'text-[#22C55E]' : 'text-[#52525B] group-hover:text-white'}`}>-</span>
              1D
            </button>
            <button onClick={() => handleTimeframeChange('1w')} className={`text-left px-[12px] py-[4px] text-[11px] font-medium flex items-center gap-[12px] ${timeframe === '1w' ? 'text-[#22C55E] bg-white/[0.03]' : 'text-[#A1A1AA] hover:text-white transition-colors'}`}>
              <span className={`text-[10px] font-mono ${timeframe === '1w' ? 'text-[#22C55E]' : 'text-[#52525B] group-hover:text-white'}`}>-</span>
              1W
            </button>
          </div>

          {/* RESEARCH */}
          <div className="flex flex-col gap-[2px] mt-6">
            <h3 className="text-[10px] font-bold uppercase text-[#71717A] tracking-[0.25em] mb-[8px] pl-3">Research</h3>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              BACKTEST
            </button>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              AUDIT LOG
            </button>
            <button className="text-left px-[12px] py-[4px] text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-[12px]">
              <span className="text-[10px] font-mono text-[#52525B] hover:text-white">-</span>
              SIMULATION
            </button>
          </div>

          {/* SYSTEM STATUS */}
          <div className="mt-auto border border-[#151515]/0 p-[12px] flex flex-col gap-[6px] bg-transparent pl-3">
            <h3 className="text-[10px] font-bold uppercase text-[#71717A] tracking-[0.25em]">System Status</h3>
            <div className="flex items-center gap-[6px]">
              <div className="w-[4px] h-[4px] rounded-full bg-[#22C55E] shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-bold text-[#22C55E] tracking-[0.15em] uppercase">LIVE</span>
            </div>
            <p className="text-[9px] text-[#52525B] tracking-[0.15em] uppercase mt-1">
              UPDATED {lastUpdated}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation */}
        <header className="h-[80px] px-8 flex items-center justify-between border-b border-[#151515] bg-transparent shrink-0">
          <div className="flex flex-col">
            <h1 className="text-[32px] font-light tracking-[-0.03em] text-white flex items-center gap-2 leading-none">
              ALPHARANGE <span className="text-[#22C55E]">BTC</span>
            </h1>
            <p className="text-[10px] text-[#71717A] uppercase tracking-[0.25em] mt-2 font-medium">Institutional Grade Volatility Forecasting</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-3">
              {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => {
                const isActive = timeframe === tf.toLowerCase();
                return (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf.toLowerCase())}
                    className={`w-[40px] h-[28px] border flex items-center justify-center text-[10px] font-bold uppercase transition-colors ${isActive ? 'border-[#22C55E] bg-white/[0.05] text-white' : 'border-[#151515] text-[#71717A] hover:border-[#52525B]'}`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
            <div className="text-right flex items-center gap-3">
              <div className="w-[6px] h-[6px] rounded-full bg-[#22C55E]" />
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-bold uppercase text-[#71717A] tracking-wider">SYSTEM: LIVE</p>
                <p className="text-[9px] text-[#52525B] font-bold mt-0.5">UPDATED {lastUpdated}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative z-10">
          
          {/* Top Row: KPIs */}
          <div className="flex gap-6 h-[110px] shrink-0">
            {/* Primary Forecast Panel */}
            <TerminalPanel className="flex-[4] flex flex-col justify-between px-6 py-4 relative group">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">Forecast Range ({timeframe.toUpperCase()})</h3>
              <div className="flex items-center gap-4 mt-2 mb-0">
                <span className="text-[28px] font-bold text-white tracking-tight">${formatP(prediction.lower)}</span>
                <span className="text-[16px] text-[#71717A]">→</span>
                <span className="text-[28px] font-bold text-white tracking-tight">${formatP(prediction.upper)}</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4 w-full max-w-[200px]">
                  <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-wider">CONFIDENCE</span>
                  <span className="text-[12px] font-bold text-white">{(metrics.coverage * 100).toFixed(2)}%</span>
                  <div className="flex-1 h-[2px] bg-[#151515] relative">
                    <div className="absolute top-0 left-0 h-full bg-[#22C55E]" style={{ width: `${metrics.coverage * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[9px] font-bold text-[#52525B] uppercase tracking-wider">TARGET: 95%</span>
                </div>
              </div>
            </TerminalPanel>

            {/* Metrics */}
            <TerminalPanel className="flex-[2] flex flex-col justify-between px-6 py-4 relative group">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">Coverage (30D)</h3>
              <span className="text-[24px] font-bold text-white tracking-tight">{(metrics.coverage * 100).toFixed(2)}%</span>
              <span className="text-[9px] font-bold text-[#52525B] uppercase tracking-[0.1em]">Target: 95%</span>
            </TerminalPanel>

            <TerminalPanel className="flex-[2] flex flex-col justify-between px-6 py-4 relative group">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">Avg Range Width</h3>
              <span className="text-[24px] font-bold text-white tracking-tight">${formatP(metrics.avg_width)}</span>
              <span className="text-[9px] font-bold text-[#52525B] uppercase tracking-[0.1em]">Lower = Higher Precision</span>
            </TerminalPanel>

            <TerminalPanel className="flex-[2] flex flex-col justify-between px-6 py-4 relative group">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">Winkler Score</h3>
              <span className="text-[24px] font-bold text-white tracking-tight">{formatP(metrics.winkler)}</span>
              <span className="text-[9px] font-bold text-[#52525B] uppercase tracking-[0.1em]">Efficiency Metric</span>
            </TerminalPanel>
          </div>

          {/* Middle Row: Chart & Signal Analysis */}
          <div className="flex gap-4 min-h-[400px] flex-1">
            {/* Chart */}
            <TerminalPanel className="flex-[7] flex flex-col p-0 relative overflow-hidden group">

              
              <div className="flex-1 relative">
                <Chart 
                  history={history}
                  isLoading={isHistoryLoading}
                  prediction={timeframe === '1h' ? {
                    lower: prediction.lower,
                    upper: prediction.upper,
                    current_price: prediction.current_price
                  } : undefined}
                  timeframe={timeframe}
                />
              </div>
            </TerminalPanel>

            {/* Analysis Panel */}
            <div className="flex-[3] min-h-0">
              <ForecastPanel 
                prediction={prediction}
                currentPrice={prediction.current_price}
                insights={insights}
                history={history}
                timeframe={timeframe}
              />
            </div>
          </div>

          {/* Bottom Row: Backtest & Audit Log */}
          <div className="flex gap-6 h-[200px] shrink-0">
            <TerminalPanel className="flex-[4] p-6 flex flex-col group relative">
              <div className="mb-6">
                <h3 className="text-[11px] font-bold uppercase text-[#A1A1AA] tracking-[0.2em] mb-1">Backtest Performance</h3>
                <p className="text-[9px] text-[#52525B] uppercase tracking-wider">30-Day Statistical Evaluation</p>
              </div>
              <div className="flex-1 flex flex-col justify-between pt-2">
                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider group-hover/item:text-white transition-colors">Coverage (95% Target)</span>
                  <span className="text-[16px] font-bold text-white">{(metrics.coverage * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider group-hover/item:text-white transition-colors">Avg Interval Width</span>
                  <span className="text-[16px] font-bold text-white">${formatP(metrics.avg_width)}</span>
                </div>
                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider group-hover/item:text-white transition-colors">Winkler Score</span>
                  <span className="text-[16px] font-bold text-white">{formatP(metrics.winkler)}</span>
                </div>
              </div>
              <p className="text-[9px] text-[#52525B] uppercase tracking-wider mt-6">Higher Coverage & Lower Score = Better Calibration.</p>
            </TerminalPanel>

            <div className="flex-[8] min-h-0">
              <PredictionHistory history={predictionHistory} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
