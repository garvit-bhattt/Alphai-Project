import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlphaRange BTC | Institutional Forecasting",
  description: "High-precision volatility range forecasting for Bitcoin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0B0F14] text-white overflow-hidden`}>
        <div className="h-screen w-screen flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[220px] flex flex-col bg-[#0B0F14] border-r border-[#1C2530] shrink-0">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-8">
                <Image src="/AIphai.svg" alt="AlphaRange Logo" width={28} height={28} className="opacity-100" />
                <span className="text-lg font-black tracking-tighter">AlphaRange</span>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-3">Symbol</h3>
                  <div className="flex items-center justify-between bg-[#0F1720] border border-[#1C2530] rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-[#f7931a] rounded-full flex items-center justify-center text-[9px] font-bold text-white">₿</div>
                      <span className="text-xs font-bold tabular-nums">BTCUSDT</span>
                    </div>
                    <span className="text-[10px] text-gray-500">▼</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto p-5 border-t border-[#1C2530]">
              <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold">V</div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Version 1.0.0</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Institutional</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Stage */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.02),_transparent_40%)] pointer-events-none" />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
