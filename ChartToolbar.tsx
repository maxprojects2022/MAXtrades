import { useState } from 'react';
import {
  CandlestickChart,
  PenTool,
  TrendingUp,
  Ruler,
  Minus,
  Type,
  Eraser,
  Trash2,
  Camera,
  Play,
  Settings2,
  Crosshair,
  Move,
} from 'lucide-react';
import ChartTypeSelector from '@/components/ChartTypeSelector';
import type { Timeframe } from '@/types';

interface ChartToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartType: import('@/types').ChartType;
  onChartTypeChange: (ct: import('@/types').ChartType) => void;
  onBarReplay: () => void;
  barReplayActive: boolean;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '1h', '1D'];

const DRAW_TOOLS = [
  { id: 'trend', icon: TrendingUp, label: 'Trend Line' },
  { id: 'pen', icon: PenTool, label: 'Brush' },
  { id: 'ruler', icon: Ruler, label: 'Measure' },
  { id: 'line', icon: Minus, label: 'Horizontal Line' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'erase', icon: Eraser, label: 'Eraser' },
];

const UTILITY_TOOLS = [
  { id: 'cursor', icon: Move, label: 'Pan' },
  { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
  { id: 'screenshot', icon: Camera, label: 'Screenshot' },
];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  onBarReplay,
  barReplayActive,
}: ChartToolbarProps) {
  const [activeDraw, setActiveDraw] = useState<string | null>(null);
  const [activeUtility, setActiveUtility] = useState('crosshair');

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-[#0d1117] px-3 py-2">
      {/* Logo / symbol */}
      <div className="mr-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
          <CandlestickChart size={16} />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-xs font-semibold text-slate-100">BTC/USDT</div>
          <div className="text-[10px] text-emerald-400">+2.34%</div>
        </div>
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Timeframes */}
      <div className="flex items-center gap-0.5 rounded-lg bg-slate-800/60 p-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              timeframe === tf
                ? 'bg-emerald-500 text-slate-900'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Chart type selector dropdown */}
      <ChartTypeSelector chartType={chartType} onChartTypeChange={onChartTypeChange} />

      <div className="h-5 w-px bg-slate-700" />

      {/* Utility tools */}
      <div className="flex items-center gap-0.5">
        {UTILITY_TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => setActiveUtility(id)}
            className={`rounded-md p-1.5 transition-all ${
              activeUtility === id
                ? 'bg-slate-700 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Drawing tools */}
      <div className="flex items-center gap-0.5">
        {DRAW_TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => setActiveDraw(activeDraw === id ? null : id)}
            className={`rounded-md p-1.5 transition-all ${
              activeDraw === id
                ? 'bg-slate-700 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          title="Remove All"
          className="rounded-md p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-rose-400"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <button
          title="Settings"
          className="rounded-md p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200"
        >
          <Settings2 size={16} />
        </button>
        <button
          onClick={onBarReplay}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            barReplayActive
              ? 'bg-emerald-500 text-slate-900'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Play size={14} className={barReplayActive ? 'fill-slate-900' : ''} />
          Bar Replay
        </button>
      </div>
    </div>
  );
}
