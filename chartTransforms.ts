import type { Candle, ChartType } from '@/types';

export interface RenderCandle extends Candle {
  isUp: boolean;
  direction?: 'up' | 'down' | 'neutral';
}

function toRender(candles: Candle[]): RenderCandle[] {
  return candles.map((c, i) => {
    const prev = candles[i - 1];
    return {
      ...c,
      isUp: c.close >= c.open,
      direction: c.close > (prev?.close ?? c.open) ? 'up' : c.close < (prev?.close ?? c.open) ? 'down' : 'neutral',
    };
  });
}

/** Heikin Ashi: smoothed candles that filter noise */
export function heikinAshi(candles: Candle[]): Candle[] {
  const result: Candle[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      result.push({ ...c });
      continue;
    }
    const prev = result[i - 1];
    const close = (c.open + c.high + c.low + c.close) / 4;
    const open = (prev.open + prev.close) / 2;
    const high = Math.max(c.high, open, close);
    const low = Math.min(c.low, open, close);
    result.push({ time: c.time, open, high, low, close, volume: c.volume });
  }
  return result;
}

/** Renko: bricks of fixed size, only when price moves by the threshold */
export function renko(candles: Candle[], brickSize?: number): Candle[] {
  if (candles.length === 0) return [];
  const range = Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low));
  const size = brickSize ?? Math.max(1, range / 20);
  const bricks: Candle[] = [];
  let price = candles[0].close;
  let direction: 'up' | 'down' = 'up';
  let brickOpen = price;

  for (const c of candles) {
    while (true) {
      if (direction === 'up' && c.close - brickOpen >= size) {
        const brickClose = brickOpen + size;
        bricks.push({ time: c.time, open: brickOpen, high: brickClose, low: brickOpen, close: brickClose, volume: c.volume });
        brickOpen = brickClose;
      } else if (direction === 'down' && brickOpen - c.close >= size) {
        const brickClose = brickOpen - size;
        bricks.push({ time: c.time, open: brickOpen, high: brickOpen, low: brickClose, close: brickClose, volume: c.volume });
        brickOpen = brickClose;
      } else if (direction === 'up' && brickOpen - c.close >= size * 2) {
        direction = 'down';
        brickOpen = brickOpen - size;
        const brickClose = brickOpen - size;
        bricks.push({ time: c.time, open: brickOpen, high: brickOpen, low: brickClose, close: brickClose, volume: c.volume });
        brickOpen = brickClose;
      } else if (direction === 'down' && c.close - brickOpen >= size * 2) {
        direction = 'up';
        brickOpen = brickOpen + size;
        const brickClose = brickOpen + size;
        bricks.push({ time: c.time, open: brickOpen, high: brickClose, low: brickOpen, close: brickClose, volume: c.volume });
        brickOpen = brickClose;
      } else {
        break;
      }
    }
  }
  return bricks;
}

/** Line Break: N-line break chart (3-line by default) */
export function lineBreak(candles: Candle[], lookback = 3): Candle[] {
  if (candles.length === 0) return [];
  const lines: Candle[] = [];
  for (const c of candles) {
    if (lines.length < lookback) {
      lines.push({ ...c });
      continue;
    }
    const recent = lines.slice(-lookback);
    const isUp = c.close > recent[0].close;
    const isDown = c.close < recent[0].close;
    if (isUp) {
      const open = recent[recent.length - 1].close;
      lines.push({ time: c.time, open, high: c.close, low: open, close: c.close, volume: c.volume });
    } else if (isDown) {
      const open = recent[recent.length - 1].close;
      lines.push({ time: c.time, open, high: open, low: c.close, close: c.close, volume: c.volume });
    }
  }
  return lines;
}

/** Kagi: lines that reverse only when price moves beyond a threshold */
export interface KagiSegment {
  time: number;
  price: number;
  direction: 'up' | 'down';
  thickness: 'thick' | 'thin';
}

export function kagi(candles: Candle[], reversalPct = 0.03): { segments: KagiSegment[]; points: { x: number; y: number; time: number; price: number }[] } {
  if (candles.length === 0) return { segments: [], points: [] };
  const points: KagiSegment[] = [];
  let prevPrice = candles[0].close;
  let dir: 'up' | 'down' = 'up';
  let highWater = prevPrice;
  let lowWater = prevPrice;
  let prevDir: 'up' | 'down' = 'up';

  points.push({ time: candles[0].time, price: prevPrice, direction: 'up', thickness: 'thin' });

  for (let i = 1; i < candles.length; i++) {
    const price = candles[i].close;
    const change = (price - prevPrice) / prevPrice;

    if (dir === 'up') {
      highWater = Math.max(highWater, price);
      if (price > prevPrice) {
        points.push({ time: candles[i].time, price, direction: 'up', thickness: price > highWater ? 'thick' : 'thin' });
        prevPrice = price;
      } else if (change < -reversalPct) {
        dir = 'down';
        lowWater = price;
        prevDir = 'up';
        points.push({ time: candles[i].time, price, direction: 'down', thickness: 'thin' });
        prevPrice = price;
      }
    } else {
      lowWater = Math.min(lowWater, price);
      if (price < prevPrice) {
        points.push({ time: candles[i].time, price, direction: 'down', thickness: price < lowWater ? 'thick' : 'thin' });
        prevPrice = price;
      } else if (change > reversalPct) {
        dir = 'up';
        highWater = price;
        prevDir = 'down';
        points.push({ time: candles[i].time, price, direction: 'up', thickness: 'thick' });
        prevPrice = price;
      }
    }
  }

  void prevDir;

  const segments = points;
  return { segments, points: segments.map((s) => ({ x: 0, y: 0, time: s.time, price: s.price })) };
}

/** Point & Figure: X/O columns based on box size and reversal threshold */
export interface PFColumn {
  type: 'X' | 'O';
  startPrice: number;
  endPrice: number;
  boxes: number;
  startTime: number;
  endTime: number;
}

export function pointFigure(candles: Candle[], boxSize?: number, reversalBoxes = 3): PFColumn[] {
  if (candles.length === 0) return [];
  const range = Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low));
  const size = boxSize ?? Math.max(1, range / 25);
  const reversal = size * reversalBoxes;

  const columns: PFColumn[] = [];
  let price = candles[0].close;
  let colType: 'X' | 'O' = 'X';
  let colStart = price;
  let colEnd = price;
  let colStartTime = candles[0].time;

  for (const c of candles) {
    if (colType === 'X') {
      if (c.high - colEnd >= size) {
        colEnd = c.high;
      } else if (colEnd - c.low >= reversal) {
        columns.push({ type: 'X', startPrice: colStart, endPrice: colEnd, boxes: Math.round((colEnd - colStart) / size), startTime: colStartTime, endTime: c.time });
        colType = 'O';
        colStart = colEnd;
        colEnd = c.low;
        colStartTime = c.time;
      }
    } else {
      if (colStart - c.low >= size) {
        colEnd = c.low;
      } else if (c.high - colEnd >= reversal) {
        columns.push({ type: 'O', startPrice: colStart, endPrice: colEnd, boxes: Math.round((colStart - colEnd) / size), startTime: colStartTime, endTime: c.time });
        colType = 'X';
        colStart = colEnd;
        colEnd = c.high;
        colStartTime = c.time;
      }
    }
  }
  if (colEnd !== colStart) {
    columns.push({ type: colType, startPrice: colStart, endPrice: colEnd, boxes: Math.max(1, Math.round(Math.abs(colEnd - colStart) / size)), startTime: colStartTime, endTime: candles[candles.length - 1].time });
  }
  return columns;
}

/** Range charts: new candle only when price moves beyond a set range */
export function rangeChart(candles: Candle[], rangeSize?: number): Candle[] {
  if (candles.length === 0) return [];
  const range = Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low));
  const size = rangeSize ?? Math.max(1, range / 20);
  const result: Candle[] = [];
  let open = candles[0].close;
  let high = open;
  let low = open;

  for (const c of candles) {
    high = Math.max(high, c.high);
    low = Math.min(low, c.low);
    if (high - low >= size) {
      result.push({ time: c.time, open, high, low, close: c.close, volume: c.volume });
      open = c.close;
      high = open;
      low = open;
    }
  }
  return result;
}

/** Transforms candles for the given chart type, returns RenderCandle[] or specialized data */
export function transformForChartType(candles: Candle[], chartType: ChartType): {
  candles: RenderCandle[];
  kagi?: KagiSegment[];
  pfColumns?: PFColumn[];
} {
  switch (chartType) {
    case 'heikin_ashi': {
      const ha = heikinAshi(candles);
      return { candles: toRender(ha) };
    }
    case 'renko': {
      const bricks = renko(candles);
      return { candles: toRender(bricks) };
    }
    case 'line_break': {
      const lb = lineBreak(candles);
      return { candles: toRender(lb) };
    }
    case 'kagi': {
      const k = kagi(candles);
      return { candles: toRender(candles), kagi: k.segments };
    }
    case 'point_figure': {
      const pf = pointFigure(candles);
      return { candles: toRender(candles), pfColumns: pf };
    }
    case 'range': {
      const r = rangeChart(candles);
      return { candles: toRender(r) };
    }
    default:
      return { candles: toRender(candles) };
  }
}
