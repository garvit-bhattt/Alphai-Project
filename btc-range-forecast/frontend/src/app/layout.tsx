import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className={`${inter.className} bg-[#000000] text-white overflow-hidden w-screen h-screen relative`}>
        {/* Layered Background Depth */}
        <div className="fixed inset-0 pointer-events-none z-[-1]">
          {/* Layer 1: Pure Black */}
          <div className="absolute inset-0 bg-[#000000]" />
        </div>
        
        {children}
      </body>
    </html>
  );
}
