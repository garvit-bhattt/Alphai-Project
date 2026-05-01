'use client';

import { MoreHorizontal, LineChart, Target, Shield, Activity, Sigma } from 'lucide-react';

interface MetricsCardProps {
  variant?: 'current-price' | 'forecast-range' | 'coverage' | 'avg-range' | 'winkler';
  label: string;
  value: string | number;
  subValue?: string;
  progress?: number;
  progressTarget?: string;
}

export default function MetricsCard({ 
  variant = 'current-price',
  label, 
  value, 
  subValue, 
  progress,
  progressTarget
}: MetricsCardProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'current-price':
        return {
          Icon: LineChart,
          iconColor: 'text-[#22c55e]',
          glow: 'rgba(34,197,94,0.1)',
          subText: 'text-[#22c55e]',
          hasDot: true
        };
      case 'forecast-range':
        return {
          Icon: Target,
          iconColor: 'text-[#a855f7]',
          glow: 'rgba(168,85,247,0.1)',
          subText: 'text-gray-500',
          hasDot: false
        };
      case 'coverage':
        return {
          Icon: Shield,
          iconColor: 'text-[#3b82f6]',
          glow: 'rgba(59,130,246,0.1)',
          subText: 'text-gray-500',
          hasDot: false
        };
      case 'avg-range':
        return {
          Icon: Activity,
          iconColor: 'text-[#06b6d4]',
          glow: 'rgba(6,182,212,0.1)',
          subText: 'text-gray-500',
          hasDot: false
        };
      case 'winkler':
        return {
          Icon: Sigma,
          iconColor: 'text-[#f97316]',
          glow: 'rgba(249,115,22,0.1)',
          subText: 'text-gray-500',
          hasDot: false
        };
    }
  };

  const { Icon, iconColor, glow, subText, hasDot } = getVariantStyles();

  return (
    <div className="card flex flex-col justify-between min-h-[140px] bg-[#0B0F14] border border-[#1C2530] rounded-xl pt-5 px-5 pb-4 relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg bg-[#0F1720] border border-[#1C2530] flex items-center justify-center transition-colors duration-500"
            style={{ boxShadow: `inset 0 0 15px ${glow}` }}
          >
            <Icon size={14} className={iconColor} />
          </div>
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.1em]">{label}</p>
        </div>
        <MoreHorizontal size={14} className="text-gray-600 hover:text-white cursor-pointer transition-colors" />
      </div>
      
      {/* Value */}
      <h3 className="text-2xl font-black tracking-tighter text-white tabular-nums mb-8 z-10">
        {value}
      </h3>
      
      {/* Bottom Text */}
      <div className="flex items-center justify-between z-10 mt-auto mb-[18px]">
        <div className="flex items-center gap-1.5">
          {hasDot && <div className={`w-1.5 h-1.5 rounded-full bg-[#22c55e]`} />}
          <p className={`text-[10px] font-medium ${subText}`}>
            {subValue}
          </p>
        </div>
        {variant === 'coverage' && (
           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Target: {progressTarget}</span>
        )}
      </div>

      {/* ---------------- DECORATIVE GRAPHICS ---------------- */}
      
      {/* 1. Current Price Sparkline */}
      {variant === 'current-price' && (
        <div className="absolute bottom-0 left-0 w-full h-[45px] pointer-events-none opacity-80 z-0">
          <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,45 Q20,45 40,35 T80,40 T120,25 T160,30 T200,10 L200,50 L0,50 Z" fill="url(#grad-green)" />
            <path d="M0,45 Q20,45 40,35 T80,40 T120,25 T160,30 T200,10" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
          </svg>
        </div>
      )}

      {/* 2. Forecast Range Dashed Line */}
      {variant === 'forecast-range' && (
        <div className="absolute bottom-4 left-5 right-5 h-2 flex items-center pointer-events-none z-0">
          <div className="w-full border-t-[1.5px] border-dashed border-[#a855f7]/40 absolute"></div>
          <div className="w-full flex justify-between absolute">
            <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
            <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
            <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
          </div>
        </div>
      )}

      {/* 3. Coverage Progress Bar */}
      {variant === 'coverage' && (
        <div className="absolute bottom-4 left-5 right-5 pointer-events-none z-0">
          <div className="w-full h-1.5 bg-[#1C2530] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#3b82f6] shadow-[0_0_10px_#3b82f6] rounded-full transition-all duration-1000" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}

      {/* 4. Avg Range Width Sparkline */}
      {variant === 'avg-range' && (
        <div className="absolute bottom-0 left-0 w-full h-[40px] pointer-events-none opacity-80 z-0">
          <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,35 L20,30 L40,37 L60,25 L80,33 L100,23 L120,31 L140,20 L160,27 L180,15 L200,23 L200,40 L0,40 Z" fill="url(#grad-cyan)" />
            <path d="M0,35 L20,30 L40,37 L60,25 L80,33 L100,23 L120,31 L140,20 L160,27 L180,15 L200,23" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" className="drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
          </svg>
        </div>
      )}

      {/* 5. Winkler Score Sparkline */}
      {variant === 'winkler' && (
        <div className="absolute bottom-0 left-0 w-full h-[40px] pointer-events-none opacity-80 z-0">
          <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="grad-orange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,38 Q30,25 50,35 T100,20 T150,30 T200,15 L200,40 L0,40 Z" fill="url(#grad-orange)" />
            <path d="M0,38 Q30,25 50,35 T100,20 T150,30 T200,15" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(249,115,22,0.8)]" />
          </svg>
        </div>
      )}

    </div>
  );
}
