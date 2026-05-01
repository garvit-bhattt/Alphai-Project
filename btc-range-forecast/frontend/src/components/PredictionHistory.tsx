'use client';

import { PredictionHistoryItem } from '@/lib/api';

interface PredictionHistoryProps {
  history: PredictionHistoryItem[];
}

export default function PredictionHistory({ history }: PredictionHistoryProps) {
  const formatP = (val: number | null) => 
    val !== null ? val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

  const formatTimeUTC = (timestamp: string) => {
    if (!timestamp) return "--";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC"
    }) + " UTC";
  };

  const uniqueHistory = Array.from(
    new Map(history.map(item => [item.candle_time || (item as any).timestamp || item.created_at, item])).values()
  );

  return (
    <div className="card h-full min-h-0 flex flex-col bg-[#0F1720] border border-[#1C2530] rounded-xl p-0 overflow-hidden relative">
      <div className="px-5 pt-4 pb-3 border-b border-[#1C2530] shrink-0 bg-[#0F1720] z-30">
        <h3 className="text-[10px] font-black uppercase text-white/90 tracking-widest">Prediction Timeline</h3>
        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">Resolved Audit Log</p>
      </div>
      
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar pr-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-[#0F1720] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <tr>
              <th className="text-[9px] font-black uppercase text-gray-500 py-2 px-5">Time</th>
              <th className="text-[9px] font-black uppercase text-gray-500 py-2 px-2">Range</th>
              <th className="text-[9px] font-black uppercase text-gray-500 py-2 px-2">Actual</th>
              <th className="text-[9px] font-black uppercase text-gray-500 py-2 px-5 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2530]">
            {uniqueHistory.map((item, i) => {
              if (item.actual === null || item.hit === null) return null;
              const isHit = item.hit;
              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-1.5 px-5 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-white tracking-wide tabular-nums">
                      {formatTimeUTC(item.created_at)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <span className="text-[10px] font-mono text-gray-300 tabular-nums">
                      ${formatP(item.lower)} – ${formatP(item.upper)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <span className="text-[10px] font-mono font-bold text-white tabular-nums">
                      ${formatP(item.actual)}
                    </span>
                  </td>
                  <td className="py-1.5 px-5 text-right whitespace-nowrap">
                    {isHit ? (
                      <span className="inline-block min-w-[50px] text-center bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[9px] font-black tracking-widest px-2 py-0.5 rounded shadow-[0_0_8px_rgba(34,197,94,0.15)]">HIT</span>
                    ) : (
                      <span className="inline-block min-w-[50px] text-center bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[9px] font-black tracking-widest px-2 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.15)]">MISS</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

