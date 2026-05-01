'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface HistoryItem {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartProps {
  symbol?: string;
  history: HistoryItem[];
  isLoading?: boolean;
  prediction?: {
    lower: number;
    upper: number;
    current_price: number;
  };
}

export default function Chart({ 
  symbol = "BTCUSDT", 
  history,
  isLoading = false,
  prediction
}: ChartProps) {
  const lastCandle = history[history.length - 1];
  
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const dates = history.map(h => h.time);
    const opens = history.map(h => h.open);
    const highs = history.map(h => h.high);
    const lows = history.map(h => h.low);
    const closes = history.map(h => h.close);

    const traces: any[] = [
      {
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: 'Price',
        increasing: { line: { color: '#00C853', width: 1.5 }, fillcolor: '#00C853' },
        decreasing: { line: { color: '#FF3D00', width: 1.5 }, fillcolor: '#FF3D00' },
        showlegend: false,
        hovertemplate: `
          <span style="font-size: 10px; color: #8F9BB3; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Candle Data</span><br>
          <span style="color: #8F9BB3;">O</span> <span style="color: #ffffff; font-weight: 600;">$%{open:,.2f}</span>
          <span style="color: #8F9BB3; margin-left: 8px;">H</span> <span style="color: #ffffff; font-weight: 600;">$%{high:,.2f}</span><br>
          <span style="color: #8F9BB3;">L</span> <span style="color: #ffffff; font-weight: 600;">$%{low:,.2f}</span>
          <span style="color: #8F9BB3; margin-left: 8px;">C</span> <span style="color: #ffffff; font-weight: 600;">$%{close:,.2f}</span>
          <extra></extra>
        `
      }
    ];

    if (prediction && lastCandle) {
      const lastTime = new Date(lastCandle.time);
      const nextTime = new Date(lastTime.getTime() + 3600000).toISOString();
      const lastTimeStr = lastTime.toISOString();

      traces.push({
        x: [dates[0], nextTime],
        y: [prediction.current_price, prediction.current_price],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'rgba(255, 255, 255, 0.15)', width: 1, dash: 'dash' },
        name: 'Current Price',
        hoverinfo: 'skip',
        showlegend: false
      });

      traces.push({
        x: [lastTimeStr, nextTime],
        y: [lastCandle.close, prediction.upper],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#FF3D00', width: 2, dash: 'dash' },
        name: 'Upper Bound',
        showlegend: false,
        hovertemplate: `
          <span style="font-size: 10px; color: #FF3D00; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">🔴 Forecast Upper</span><br>
          <span style="color: #ffffff; font-weight: 800; font-size: 14px;">$%{y:,.2f}</span>
          <extra></extra>
        `
      });

      traces.push({
        x: [lastTimeStr, nextTime],
        y: [lastCandle.close, prediction.lower],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#00C853', width: 2, dash: 'dash' },
        name: 'Lower Bound',
        showlegend: false,
        fill: 'tonexty',
        fillcolor: 'rgba(0, 200, 83, 0.15)',
        hovertemplate: `
          <span style="font-size: 10px; color: #00C853; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">🟢 Forecast Lower</span><br>
          <span style="color: #ffffff; font-weight: 800; font-size: 14px;">$%{y:,.2f}</span>
          <extra></extra>
        `
      });

      traces.push({
        x: [lastTimeStr, lastTimeStr],
        y: [Math.min(...lows) * 0.98, Math.max(...highs) * 1.02],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'rgba(255, 255, 255, 0.1)', width: 1, dash: 'dash' },
        name: 'Now',
        hoverinfo: 'skip',
        showlegend: false
      });
    }

    return traces;
  }, [history, prediction, lastCandle]);

  return (
    <div className="card h-full min-h-0 flex flex-col overflow-hidden relative border border-[#1C2530] bg-[#0F1720]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0B0F14]/40 backdrop-blur-[1px] z-50 flex items-center justify-center transition-opacity duration-300">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex justify-between items-center mb-0 px-4 pt-2 shrink-0">
        <div>
          <h2 className="text-sm font-black tracking-tight text-white/90 uppercase">{symbol} · BINANCE</h2>
          {lastCandle && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-[0.1em] tabular-nums">
              <span className="text-white/50">O</span> {lastCandle.open.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="ml-3 text-white/50">H</span> {lastCandle.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="ml-3 text-white/50">L</span> {lastCandle.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="ml-3 text-white/50">C</span> {lastCandle.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">⚙</span>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">⛶</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative transition-opacity duration-500">
        {history.length > 0 ? (
          <Plot
            data={chartData}
            layout={{
              autosize: true,
              margin: { l: 0, r: 60, t: 10, b: 30 },
              showlegend: false,
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              xaxis: {
                gridcolor: 'rgba(30, 36, 43, 0.2)',
                zeroline: false,
                rangeslider: { visible: false },
                tickfont: { color: '#4F5B6F', size: 9, weight: 'bold' },
                type: 'date',
                range: history.length > 0 ? [
                  history[Math.max(0, history.length - 60)].time, 
                  new Date(new Date(lastCandle?.time || '').getTime() + 10800000).toISOString()
                ] : undefined
              },
              yaxis: {
                gridcolor: 'rgba(30, 36, 43, 0.2)',
                zeroline: false,
                tickfont: { color: '#4F5B6F', size: 9, weight: 'bold' },
                side: 'right',
                tickformat: ',.0f'
              },
              font: { family: 'Inter, sans-serif' },
              hovermode: 'x unified',
              hoverlabel: {
                bgcolor: '#0B0F14',
                bordercolor: '#1C2530',
                font: { family: 'Inter, sans-serif', color: '#ffffff', size: 11 },
                align: 'left'
              },
              dragmode: 'pan'
            }}
            config={{ 
              responsive: true, 
              displayModeBar: false,
              scrollZoom: true
            }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#0B0F14]/20">
            <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
