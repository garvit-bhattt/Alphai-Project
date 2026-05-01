'use client';

import { PredictionResponse, HistoryItem } from '@/lib/api';
import { ChevronsUp, ChevronsDown, Info, BarChart2, Target, LineChart, Clock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

interface ForecastPanelProps {
  prediction: PredictionResponse;
  currentPrice: number;
  insights: Array<{
    color: 'red' | 'green' | 'blue';
    title: string;
    text: string;
  }>;
  history?: HistoryItem[];
}

export default function ForecastPanel({ prediction, currentPrice, insights, history }: ForecastPanelProps) {
  const formatP = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Generate SVG path for the sparkline
  const sparklinePath = useMemo(() => {
    if (!history || history.length < 2) return '';
    const data = history.slice(-30); // Use last 30 points for sparkline
    const min = Math.min(...data.map(d => d.close));
    const max = Math.max(...data.map(d => d.close));
    const range = max - min || 1;
    
    // SVG dimensions 120x40
    const w = 120;
    const h = 40;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.close - min) / range) * h;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [history]);

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 overflow-hidden">
      
      {/* 1. TARGET RANGE CARD */}
      <div className="card shrink-0 p-0 relative overflow-hidden border-[#1C2530] bg-[#0F1720] shadow-md">
        {/* Subtle background glows */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent opacity-60" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-60" />

        <div className="relative z-10 flex flex-col items-center pt-3 pb-3">
          <div className="text-center mb-3">
            <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] mb-0.5">Target Range (1H Forecast)</h3>
            <div className="flex items-center justify-center gap-1.5 text-gray-500">
              <p className="text-[9px] font-bold">95% Confidence Projection</p>
              <Info size={10} className="opacity-80" />
            </div>
          </div>

          <div className="flex w-full px-4 relative">
            {/* Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#1C2530] to-transparent -translate-x-1/2" />
            
            {/* Resistance Column */}
            <div className="flex-1 flex flex-col items-center relative pr-4">
              <ChevronsUp className="absolute left-1 top-1/2 -translate-y-1/2 text-[#ef4444] opacity-80" size={20} strokeWidth={3} />
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-full px-2 py-0.5 mb-1">
                <span className="text-[8px] font-black uppercase text-[#ef4444] tracking-widest">Resistance (Upper)</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-[#ef4444] tabular-nums shadow-[#ef4444]/20 drop-shadow-md">
                ${formatP(prediction.upper)}
              </span>
              <span className="text-[9px] text-gray-500 font-medium mt-0.5">Upper Bound</span>
            </div>

            {/* Support Column */}
            <div className="flex-1 flex flex-col items-center relative pl-4">
              <ChevronsDown className="absolute right-1 top-1/2 -translate-y-1/2 text-[#22c55e] opacity-80" size={20} strokeWidth={3} />
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full px-2 py-0.5 mb-1">
                <span className="text-[8px] font-black uppercase text-[#22c55e] tracking-widest">Support (Lower)</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-[#22c55e] tabular-nums shadow-[#22c55e]/20 drop-shadow-md">
                ${formatP(prediction.lower)}
              </span>
              <span className="text-[9px] text-gray-500 font-medium mt-0.5">Lower Bound</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CURRENT MARKET PRICE CARD */}
      <div className="card shrink-0 py-2 px-5 flex items-center justify-between border-[#1C2530] bg-[#0F1720]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#F7931A] to-[#D47910] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(247,147,26,0.3)] shrink-0">
            <span className="text-white font-black text-lg" style={{ fontFamily: 'sans-serif' }}>₿</span>
          </div>
          <div>
            <h3 className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-0.5">Current Market Price</h3>
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none font-black tracking-tighter text-white tabular-nums">${formatP(currentPrice)}</span>
              <div className="flex items-center gap-1 bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded text-[#22c55e]">
                <div className="w-1 h-1 bg-[#22c55e] rounded-full shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="h-[25px] w-[80px] relative">
          {sparklinePath && (
            <svg width="80" height="25" viewBox="0 0 120 40" className="overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${sparklinePath} L 120,40 L 0,40 Z`}
                fill="url(#sparklineGradient)"
                stroke="none"
              />
              <path
                d={sparklinePath}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_3px_rgba(34,197,94,0.8)]"
              />
            </svg>
          )}
        </div>
      </div>

      {/* 3. SIMULATION INSIGHTS CARD */}
      <div className="card flex-1 min-h-0 flex flex-col p-4 border-[#1C2530] bg-[#0F1720]">
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <BarChart2 size={12} className="text-gray-400" />
          <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Simulation Insights</h3>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Row 1: Model Calibration */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1C2530]/50 group flex-1">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[#0B0F14] border border-[#1C2530] flex items-center justify-center shrink-0 group-hover:border-[#ef4444]/30 transition-colors">
                <Target size={12} className="text-[#ef4444]" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  <h4 className="text-[9px] font-black uppercase text-white tracking-wider">Model Calibration Check</h4>
                </div>
                <p className="text-[8px] text-gray-500 font-medium mt-0.5 leading-snug">
                  {insights[0]?.text || "Currently at 93.38% (Target: 95.00%). Calibration is strictly bound to 1H windows."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-[#0B0F14] border border-[#1C2530] rounded-md px-2 py-1 shrink-0 min-w-[80px]">
              <span className="text-[10px] font-black text-[#ef4444] tracking-wide">93.38%</span>
              <span className="text-[7px] text-gray-500 font-medium">Current Calibration</span>
            </div>
          </div>

          {/* Row 2: Multi-Timeframe Analysis */}
          <div className="flex items-center justify-between py-2 border-b border-[#1C2530]/50 group flex-1">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[#0B0F14] border border-[#1C2530] flex items-center justify-center shrink-0 group-hover:border-[#22c55e]/30 transition-colors shadow-[inset_0_0_15px_rgba(34,197,94,0.05)]">
                <LineChart size={12} className="text-[#22c55e]" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <h4 className="text-[9px] font-black uppercase text-white tracking-wider">Multi-Timeframe Analysis</h4>
                </div>
                <p className="text-[8px] text-gray-500 font-medium mt-0.5 leading-snug">
                  {insights[1]?.text || "Chart switched to 1h. Predictions remain 1H calibrated for statistical accuracy."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-[#0B0F14] border border-[#1C2530] rounded-md px-2 py-1 shrink-0 min-w-[80px]">
              <span className="text-[10px] font-black text-[#22c55e] tracking-wide">1H</span>
              <span className="text-[7px] text-gray-500 font-medium">Active Timeframe</span>
            </div>
          </div>

          {/* Row 3: Simulation Window */}
          <div className="flex items-center justify-between pt-2 group flex-1">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[#0B0F14] border border-[#1C2530] flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]">
                <Clock size={12} className="text-blue-500" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h4 className="text-[9px] font-black uppercase text-white tracking-wider">Simulation Window</h4>
                </div>
                <p className="text-[8px] text-gray-500 font-medium mt-0.5 leading-snug">
                  {insights[2]?.text || "Analyzing last 500 hours of volatility to compute Student-t distribution."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-[#0B0F14] border border-[#1C2530] rounded-md px-2 py-1 shrink-0 min-w-[80px]">
              <span className="text-[10px] font-black text-blue-500 tracking-wide">500 HRS</span>
              <span className="text-[7px] text-gray-500 font-medium">Analysis Window</span>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1C2530] shrink-0">
          <ShieldCheck size={10} className="text-blue-500 opacity-80 shrink-0" />
          <span className="text-[8px] text-gray-500 font-medium">All simulations are based on institutional-grade volatility forecasting models.</span>
        </div>
      </div>

    </div>
  );
}
