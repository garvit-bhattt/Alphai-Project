'use client';

import { PredictionResponse } from '@/lib/api';

interface ForecastPanelProps {
  prediction: PredictionResponse;
  currentPrice: number;
  insights: Array<{
    color: 'red' | 'green';
    title: string;
    text: string;
  }>;
}

export default function ForecastPanel({ prediction, currentPrice, insights }: ForecastPanelProps) {
  const formatP = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
      {/* Target Range Card */}
      <div className="card flex-[1.5] min-h-0 flex flex-col justify-center border border-[#1C2530] bg-[#0F1720]">
        <div className="text-center mb-4 shrink-0">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Target Range (1H Forecast)</h3>
          <p className="text-[11px] font-bold text-gray-400">95% Confidence Projection</p>
        </div>

        <div className="flex-1 flex flex-col justify-around py-2">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-[#ef4444] tracking-widest block mb-1">Resistance (Upper)</span>
            <span className="text-3xl font-black tracking-tighter text-[#ef4444]">
              ${formatP(prediction.upper)}
            </span>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-[#22c55e] tracking-widest block mb-1">Support (Lower)</span>
            <span className="text-3xl font-black tracking-tighter text-[#22c55e]">
              ${formatP(prediction.lower)}
            </span>
          </div>
        </div>
      </div>

      {/* Current Price Card */}
      <div className="card h-20 shrink-0 border border-[#1C2530] bg-[#0F1720] flex flex-col justify-center px-5">
        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Current Market Price</h3>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-black tracking-tighter text-white">${formatP(currentPrice)}</span>
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
            <span className="text-[9px] font-black text-[#22c55e] uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Simulation Insights */}
      <div className="card flex-1 min-h-0 border border-[#1C2530] bg-[#0F1720] p-5 flex flex-col">
        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3 shrink-0">Simulation Insights</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${insight.color === 'red' ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
                <div>
                  <h4 className="text-[10px] font-black uppercase text-white tracking-widest">{insight.title}</h4>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
