'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import TerminalPanel from './TerminalPanel';

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
  timeframe?: string;
}

export default function Chart({ 
  symbol = "BTCUSDT", 
  history,
  isLoading = false,
  prediction,
  timeframe = "1h"
}: ChartProps) {
  const lastCandle = history[history.length - 1];
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const [isUserPanning, setIsUserPanning] = useState(false);

  const handleRelayout = (event: any) => {
    if (event['xaxis.range[0]'] || event['xaxis.range[1]']) {
      setIsUserPanning(true);
    }
    if (event['xaxis.autorange']) {
      setIsUserPanning(false);
    }
  };
  
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
    <TerminalPanel ref={chartContainerRef} className="h-full min-h-0 flex flex-col overflow-hidden p-0">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#050505]/80 z-50 flex items-center justify-center transition-opacity duration-300">
          <div className="w-6 h-6 border-2 border-[var(--success)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0 z-10 w-full bg-[#050505]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-white tracking-wider uppercase">BTCUSDT - BINANCE</span>
          </div>
          {lastCandle && (
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#71717A] mt-1">
            <span>O <span className="text-[#A1A1AA]">{lastCandle.open.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <span>H <span className="text-[#A1A1AA]">{lastCandle.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <span>L <span className="text-[#A1A1AA]">{lastCandle.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <span>C <span className="text-[#A1A1AA]">{lastCandle.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
          </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[12px] font-bold text-[#A1A1AA] group-hover:text-white transition-colors">{timeframe.toUpperCase()}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#71717A] group-hover:text-white transition-colors">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button onClick={toggleFullscreen} className="text-[#71717A] hover:text-white transition-colors focus:outline-none cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <path d="M8 3v3h-3m18-3v3h3m-18 18v-3h-3m18 3v-3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative transition-opacity duration-500 z-0">
        {history.length > 0 ? (
          <Plot
            data={chartData}
            onRelayout={handleRelayout}
            layout={{
              uirevision: 'true',
              autosize: true,
              margin: { l: 24, r: 60, t: 24, b: 24 },
              showlegend: false,
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              xaxis: {
                gridcolor: '#101010',
                zeroline: false,
                rangeslider: { visible: false },
                tickfont: { color: '#52525B', size: 10 },
                type: 'date',
                ...(isUserPanning ? {} : {
                  range: history.length > 0 ? [
                    history[Math.max(0, history.length - 60)].time, 
                    new Date(new Date(lastCandle?.time || '').getTime() + 10800000).toISOString()
                  ] : undefined
                })
              },
              yaxis: {
                gridcolor: '#101010',
                zeroline: false,
                tickfont: { color: '#52525B', size: 10 },
                side: 'right',
                tickformat: ',.0f'
              },
              font: { family: 'Inter, sans-serif' },
              hovermode: 'x unified',
              hoverlabel: {
                bgcolor: '#080808',
                bordercolor: '#151515',
                font: { family: 'Inter, sans-serif', color: '#FFFFFF', size: 11 },
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
          <div className="flex items-center justify-center h-full bg-[#050505]">
            <div className="w-6 h-6 border-2 border-[var(--success)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </TerminalPanel>
  );
}
