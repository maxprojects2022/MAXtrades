import type { Candle, Timeframe } from '@/types';

const BASE_PRICE = 43250;
const VOL_COUNT = 120;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function timeframeToSeconds(tf: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '1h': 3600,
    '1D': 86400,
  };
  return map[tf];
}

export function timeframeToBinanceInterval(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    '1m': '1m',
    '5m': '5m',
    '1h': '1h',
    '1D': '1d',
  };
  return map[tf];
}

export function generateCandles(timeframe: Timeframe, count = VOL_COUNT): Candle[] {
  const seed = timeframe.charCodeAt(0) * 97 + timeframe.length;
  const rand = mulberry32(seed);
  const candles: Candle[] = [];
  let price = BASE_PRICE;

  const step = timeframeToSeconds(timeframe);
  const vol: Record<Timeframe, number> = {
    '1m': 45,
    '5m': 80,
    '1h': 180,
    '1D': 480,
  };
  const volatility = vol[timeframe];
  const now = Math.floor(Date.now() / 1000);

  for (let i = count - 1; i >= 0; i--) {
    const drift = (rand() - 0.48) * volatility;
    const open = price;
    const close = Math.max(100, open + drift);
    const high = Math.max(open, close) + rand() * volatility * 0.6;
    const low = Math.min(open, close) - rand() * volatility * 0.6;
    const volume = Math.floor(rand() * 900 + 100);
    candles.push({
      time: now - i * step,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return candles;
}
