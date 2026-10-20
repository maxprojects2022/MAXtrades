import { useEffect, useRef, useState, useCallback } from 'react';
import type { Candle, Timeframe } from '@/types';
import { generateCandles, timeframeToBinanceInterval, timeframeToSeconds } from '@/lib/marketData';

interface LiveDataState {
  candles: Candle[];
  livePrice: number | null;
  connected: boolean;
  source: 'websocket' | 'simulated';
}

export function useLiveData(symbol: string, timeframe: Timeframe): LiveDataState {
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(timeframe));
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState<'websocket' | 'simulated'>('simulated');

  const wsRef = useRef<WebSocket | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candleCloseRef = useRef<Candle | null>(null);

  const initCandles = useCallback(() => {
    const initial = generateCandles(timeframe);
    setCandles(initial);
    candleCloseRef.current = initial[initial.length - 1];
    setLivePrice(initial[initial.length - 1].close);
  }, [timeframe]);

  // Simulated live feed — updates the last candle and occasionally rolls a new one
  const startSimulation = useCallback(() => {
    setSource('simulated');
    setConnected(true);
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        const tickVol = Math.random() * 40 + 5;
        const drift = (Math.random() - 0.48) * (tickVol * 2);
        last.close = Math.max(100, last.close + drift);
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.volume += Math.floor(Math.random() * 20 + 5);
        updated[updated.length - 1] = last;
        candleCloseRef.current = last;
        setLivePrice(last.close);
        return updated;
      });
    }, 800);
  }, []);

  // Try to connect to Binance WebSocket; fall back to simulation on failure
  const connectWebSocket = useCallback(() => {
    const interval = timeframeToBinanceInterval(timeframe);
    const wsSymbol = symbol.toLowerCase().replace('/', '').replace('usdt', 'usdt');
    const stream = `${wsSymbol}@kline_${interval}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const fallbackTimer = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          startSimulation();
        }
      }, 4000);

      ws.onopen = () => {
        clearTimeout(fallbackTimer);
        setSource('websocket');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const k = msg.k;
          if (!k) return;
          const candle: Candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };
          setLivePrice(candle.close);

          setCandles((prev) => {
            if (prev.length === 0) return [candle];
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (candle.time === last.time) {
              updated[updated.length - 1] = candle;
            } else if (candle.time > last.time) {
              updated.push(candle);
              if (updated.length > 200) updated.shift();
            }
            return updated;
          });
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        clearTimeout(fallbackTimer);
        startSimulation();
      };

      ws.onclose = () => {
        clearTimeout(fallbackTimer);
        if (source !== 'simulated') {
          startSimulation();
        }
      };
    } catch {
      startSimulation();
    }
  }, [symbol, timeframe, startSimulation, source]);

  useEffect(() => {
    initCandles();

    // Clean up any existing connections
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };
  }, [symbol, timeframe, initCandles, connectWebSocket]);

  return { candles, livePrice, connected, source };
}
