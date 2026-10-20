export type Timeframe = '1m' | '5m' | '1h' | '1D';

export type ChartType =
  | 'bars'
  | 'candles'
  | 'hollow_candles'
  | 'volume_candles'
  | 'line'
  | 'line_markers'
  | 'step_line'
  | 'area'
  | 'hlc_area'
  | 'baseline'
  | 'columns'
  | 'high_low'
  | 'heikin_ashi'
  | 'renko'
  | 'line_break'
  | 'kagi'
  | 'point_figure'
  | 'range';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ReplayState {
  cutoff: number | null;
  position: number;
  playing: boolean;
  speed: number;
}

export const REPLAY_SPEEDS = [0.5, 1, 2, 4];

export const CHART_TYPE_GROUPS: { label: string; types: { type: ChartType; label: string }[] }[] = [
  {
    label: 'Basic',
    types: [
      { type: 'bars', label: 'Bars' },
      { type: 'candles', label: 'Candles' },
      { type: 'hollow_candles', label: 'Hollow Candles' },
      { type: 'volume_candles', label: 'Volume Candles' },
      { type: 'line', label: 'Line' },
      { type: 'line_markers', label: 'Line with Markers' },
      { type: 'step_line', label: 'Step Line' },
      { type: 'area', label: 'Area' },
      { type: 'hlc_area', label: 'HLC Area' },
      { type: 'baseline', label: 'Baseline' },
      { type: 'columns', label: 'Columns' },
      { type: 'high_low', label: 'High-Low' },
    ],
  },
  {
    label: 'Advanced',
    types: [
      { type: 'heikin_ashi', label: 'Heikin Ashi' },
      { type: 'renko', label: 'Renko' },
      { type: 'line_break', label: 'Line Break' },
      { type: 'kagi', label: 'Kagi' },
      { type: 'point_figure', label: 'Point & Figure' },
      { type: 'range', label: 'Range' },
    ],
  },
];

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bars: 'Bars',
  candles: 'Candles',
  hollow_candles: 'Hollow Candles',
  volume_candles: 'Volume Candles',
  line: 'Line',
  line_markers: 'Line with Markers',
  step_line: 'Step Line',
  area: 'Area',
  hlc_area: 'HLC Area',
  baseline: 'Baseline',
  columns: 'Columns',
  high_low: 'High-Low',
  heikin_ashi: 'Heikin Ashi',
  renko: 'Renko',
  line_break: 'Line Break',
  kagi: 'Kagi',
  point_figure: 'Point & Figure',
  range: 'Range',
};
