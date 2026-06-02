'use client';

import { PredictionResponse, HistoryItem } from '@/lib/api';
import TerminalPanel from './TerminalPanel';

interface ForecastPanelProps {
  prediction: PredictionResponse;
  currentPrice: number;
  insights: Array<{
    color: 'red' | 'green' | 'blue';
    title: string;
    text: string;
  }>;
  history?: HistoryItem[];
  timeframe?: string;
}

export default function ForecastPanel({ prediction, currentPrice, insights, timeframe = "1h" }: ForecastPanelProps) {
  const formatP = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="h-full flex flex-col gap-6">
      {/* SECTION 1: TARGET RANGE */}
      <TerminalPanel className="flex-[2] flex flex-col justify-center px-6 py-6 relative group">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-bold uppercase text-[#A1A1AA] tracking-[0.2em]">
            Target Range (1H Forecast)
          </h3>
          <span className="text-[9px] font-bold text-[#52525B] uppercase tracking-wider">95% Confidence Projection ⓘ</span>
        </div>
        
        <div className="flex justify-between w-full relative px-2">
          {/* Resistance (Left) */}
          <div className="flex flex-col items-center flex-1">
            <h4 className="text-[10px] font-bold uppercase text-[#EF4444] mb-2 tracking-widest">Resistance (Upper)</h4>
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#EF4444]">︽</span>
              <span className="text-[28px] font-bold text-[#EF4444] tabular-nums tracking-tight">
                ${formatP(prediction.upper)}
              </span>
            </div>
            <span className="text-[9px] font-bold text-[#52525B] mt-2 uppercase tracking-wider">Upper Bound</span>
          </div>

          {/* Support (Right) */}
          <div className="flex flex-col items-center flex-1">
            <h4 className="text-[10px] font-bold uppercase text-[#22C55E] mb-2 tracking-widest">Support (Lower)</h4>
            <div className="flex items-center gap-3">
              <span className="text-[28px] font-bold text-[#22C55E] tabular-nums tracking-tight">
                ${formatP(prediction.lower)}
              </span>
              <span className="text-[14px] text-[#22C55E]">︾</span>
            </div>
            <span className="text-[9px] font-bold text-[#52525B] mt-2 uppercase tracking-wider">Lower Bound</span>
          </div>
        </div>
      </TerminalPanel>

      {/* SECTION 2: CURRENT MARKET PRICE */}
      <TerminalPanel className="shrink-0 flex items-center justify-between px-6 py-4 relative group">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[#f7931a] flex items-center justify-center font-bold text-white text-[10px]">
            ₿
          </div>
          <div className="flex flex-col ml-2">
            <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-wider mb-0.5">Current Market Price</span>
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold text-white tabular-nums tracking-tight">
                ${formatP(currentPrice)}
              </span>
              <div className="flex items-center gap-1 border border-[#151515] px-1.5 py-0.5 rounded-sm bg-white/[0.02]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-[8px] font-bold text-[#22C55E] uppercase tracking-widest">LIVE</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="w-[80px] h-[16px] opacity-70">
             <svg viewBox="0 0 60 12" preserveAspectRatio="none" className="w-full h-full">
               <path d="M0,6 L10,3 L20,8 L30,2 L40,10 L50,5 L60,11" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" />
             </svg>
           </div>
        </div>
      </TerminalPanel>

      {/* SECTION 3: SIMULATION INSIGHTS */}
      <TerminalPanel className="flex-[3] flex flex-col p-6 min-h-0 relative">
        <h3 className="text-[10px] font-bold uppercase text-[#A1A1AA] tracking-[0.2em] mb-6">
          Simulation Insights
        </h3>
        
        <div className="flex flex-col gap-6 flex-1">
          {/* Row 1 */}
          <div className="flex justify-between items-start group">
            <div className="flex gap-4">
              <div className="text-[#EF4444] mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[10px] font-bold text-[#EF4444] tracking-wider mb-1 uppercase">Model Calibration Check</h4>
                <p className="text-[9px] text-[#52525B] max-w-[220px]">Currently at 96.97% (Target: 95.00%). Calibration is strictly bound to 1H windows.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-[#EF4444] block">93.38%</span>
              <span className="text-[8px] font-bold text-[#52525B] uppercase tracking-wider">Current Calibration</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex justify-between items-start group">
            <div className="flex gap-4">
              <div className="text-[#22C55E] mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[10px] font-bold text-[#22C55E] tracking-wider mb-1 uppercase">Multi-Timeframe Analysis</h4>
                <p className="text-[9px] text-[#52525B] max-w-[220px]">Chart switched to 1H. Predictions remain 1H calibrated for statistical accuracy.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-[#22C55E] block">1H</span>
              <span className="text-[8px] font-bold text-[#52525B] uppercase tracking-wider">Active Timeframe</span>
            </div>
          </div>

        </div>

        <p className="hidden">
        </p>
      </TerminalPanel>
    </div>
  );
}
