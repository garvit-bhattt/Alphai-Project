'use client';

import { PredictionHistoryItem } from '@/lib/api';
import TerminalPanel from './TerminalPanel';

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
    });
  };

  const uniqueHistory = Array.from(
    new Map(history.map(item => [item.candle_time || (item as any).timestamp || item.created_at, item])).values()
  );

  return (
    <TerminalPanel className="h-full min-h-0 flex flex-col px-6 py-4 overflow-hidden relative">
      <div className="mb-3 shrink-0 z-10">
        <h3 className="text-[11px] font-bold uppercase text-[#A1A1AA] tracking-[0.25em]">Prediction Audit Log</h3>
        <p className="text-[9px] text-[#52525B] uppercase tracking-wider mt-1">Resolved Audit Log</p>
      </div>
      
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar mt-2">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20 bg-[#050505]">
            <tr>
              <th className="text-[9px] font-bold uppercase text-[#52525B] tracking-wider pb-2 w-1/4 font-mono">Time (UTC)</th>
              <th className="text-[9px] font-bold uppercase text-[#52525B] tracking-wider pb-2 w-2/4 font-mono">Forecast Range (95%)</th>
              <th className="text-[9px] font-bold uppercase text-[#52525B] tracking-wider pb-2 w-1/4 font-mono">Actual</th>
              <th className="text-[9px] font-bold uppercase text-[#52525B] tracking-wider pb-2 w-[80px] font-mono">Result</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[10px]">
            {uniqueHistory.map((item, i) => {
              if (item.actual === null || item.hit === null) return null;
              const isHit = item.hit;
              const statusColor = isHit ? 'text-[#22C55E]' : 'text-[#EF4444]';
              const rowBg = i % 2 === 0 ? 'bg-[#050505]' : 'bg-[#070707]';
              return (
                <tr key={i} className={`${rowBg} transition-colors h-[32px]`}>
                  <td className="text-[#A1A1AA] whitespace-nowrap pl-2">
                    {formatTimeUTC(item.candle_time || item.created_at)}
                  </td>
                  <td className="text-[#A1A1AA] whitespace-nowrap">
                    ${formatP(item.lower)} - ${formatP(item.upper)}
                  </td>
                  <td className={`font-bold whitespace-nowrap text-white`}>
                    ${formatP(item.actual)}
                  </td>
                  <td className={`whitespace-nowrap font-bold ${statusColor}`}>
                    {isHit ? 'HIT' : 'MISS'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TerminalPanel>
  );
}
