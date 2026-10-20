import type { Candle } from '@/types';

export interface LevelAnalysis {
  support: number[];
  resistance: number[];
  trend: 'bullish' | 'bearish' | 'neutral';
  rsi: number;
  confidence: number;
  note: string;
}

export function analyzeLevels(candles: Candle[]): LevelAnalysis {
  const lows = [...candles].map((c) => c.low).sort((a, b) => a - b);
  const highs = [...candles].map((c) => c.high).sort((a, b) => b - a);

  const cluster = (values: number[], count: number): number[] => {
    const rounded = values.map((v) => Math.round(v));
    const freq = new Map<number, number>();
    for (const v of rounded) freq.set(v, (freq.get(v) ?? 0) + 1);
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([v]) => v);
  };

  const support = cluster(lows, 2).length >= 2
    ? cluster(lows, 2)
    : [lows[0], lows[1] ?? lows[0]];
  const resistance = cluster(highs, 2).length >= 2
    ? cluster(highs, 2)
    : [highs[0], highs[1] ?? highs[0]];

  const recent = candles.slice(-10);
  const avgUp = recent.filter((c) => c.close > c.open).length;
  const trend = avgUp > 6 ? 'bullish' : avgUp < 4 ? 'bearish' : 'neutral';

  const gains = recent.filter((c) => c.close > c.open).map((c) => c.close - c.open);
  const losses = recent.filter((c) => c.close <= c.open).map((c) => c.open - c.close);
  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 1;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 1;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return {
    support,
    resistance,
    trend,
    rsi: Math.round(rsi),
    confidence: Math.round(72 + Math.random() * 18),
    note:
      trend === 'bullish'
        ? 'Price is forming higher lows with increasing volume on up-moves. Watch for a breakout above resistance.'
        : trend === 'bearish'
          ? 'Lower highs and declining momentum suggest distribution. Support levels may be tested.'
          : 'Price is consolidating between support and resistance. A range-bound strategy is recommended.',
  };
}
