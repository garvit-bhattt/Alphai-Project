import { useState, useEffect } from 'react';

export const useBinancePrice = (symbol: string = 'btcusdt') => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 'p' is the price in Binance trade stream
      if (data.p) {
        setPrice(parseFloat(data.p));
      }
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return price;
};
