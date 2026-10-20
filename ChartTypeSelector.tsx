import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CHART_TYPE_GROUPS, CHART_TYPE_LABELS, type ChartType } from '@/types';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  onChartTypeChange: (ct: ChartType) => void;
}

// Small inline SVG icon for each chart type preview
function ChartTypeIcon({ type, size = 14 }: { type: ChartType; size?: number }) {
  const up = '#10b981';
  const down = '#f43f5e';
  const w = size;
  const h = size;

  switch (type) {
    case 'bars':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="4" y1="3" x2="4" y2="13" stroke={up} strokeWidth="1.5" />
          <line x1="3" y1="7" x2="4" y2="7" stroke={up} strokeWidth="1.5" />
          <line x1="4" y1="10" x2="5" y2="10" stroke={up} strokeWidth="1.5" />
          <line x1="11" y1="4" x2="11" y2="12" stroke={down} strokeWidth="1.5" />
          <line x1="10" y1="6" x2="11" y2="6" stroke={down} strokeWidth="1.5" />
          <line x1="11" y1="9" x2="12" y2="9" stroke={down} strokeWidth="1.5" />
        </svg>
      );
    case 'candles':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="5" y1="2" x2="5" y2="14" stroke={up} strokeWidth="0.8" />
          <rect x="3.5" y="5" width="3" height="6" fill={up} />
          <line x1="11" y1="3" x2="11" y2="13" stroke={down} strokeWidth="0.8" />
          <rect x="9.5" y="6" width="3" height="4" fill={down} />
        </svg>
      );
    case 'hollow_candles':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="5" y1="2" x2="5" y2="14" stroke={up} strokeWidth="0.8" />
          <rect x="3.5" y="5" width="3" height="6" fill="none" stroke={up} strokeWidth="0.8" />
          <line x1="11" y1="3" x2="11" y2="13" stroke={down} strokeWidth="0.8" />
          <rect x="9.5" y="6" width="3" height="4" fill={down} />
        </svg>
      );
    case 'volume_candles':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="5" y1="3" x2="5" y2="13" stroke={up} strokeWidth="0.8" />
          <rect x="3" y="5" width="4" height="6" fill={up} opacity="0.7" />
          <line x1="11" y1="4" x2="11" y2="12" stroke={down} strokeWidth="0.8" />
          <rect x="10" y="6" width="2" height="4" fill={down} opacity="0.7" />
        </svg>
      );
    case 'line':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <polyline points="2,12 5,8 8,10 11,4 14,6" fill="none" stroke={up} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'line_markers':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <polyline points="2,12 5,8 8,10 11,4 14,6" fill="none" stroke={up} strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="2" cy="12" r="1.5" fill={up} />
          <circle cx="5" cy="8" r="1.5" fill={up} />
          <circle cx="8" cy="10" r="1.5" fill={down} />
          <circle cx="11" cy="4" r="1.5" fill={up} />
          <circle cx="14" cy="6" r="1.5" fill={up} />
        </svg>
      );
    case 'step_line':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <polyline points="2,12 5,12 5,8 8,8 8,10 11,10 11,4 14,4" fill="none" stroke={up} strokeWidth="1.5" />
        </svg>
      );
    case 'area':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <path d="M2,12 L5,8 L8,10 L11,4 L14,6 L14,14 L2,14 Z" fill={up} fillOpacity="0.3" />
          <polyline points="2,12 5,8 8,10 11,4 14,6" fill="none" stroke={up} strokeWidth="1.2" />
        </svg>
      );
    case 'hlc_area':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <path d="M2,4 L5,3 L8,5 L11,2 L14,3 L14,12 L11,13 L8,11 L5,14 L2,13 Z" fill="#06b6d4" fillOpacity="0.25" />
          <polyline points="2,8 5,6 8,7 11,5 14,6" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
        </svg>
      );
    case 'baseline':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="8" x2="14" y2="8" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 1" />
          <line x1="3" y1="6" x2="3" y2="8" stroke={up} strokeWidth="2" />
          <line x1="6" y1="5" x2="6" y2="8" stroke={up} strokeWidth="2" />
          <line x1="9" y1="9" x2="9" y2="11" stroke={down} strokeWidth="2" />
          <line x1="12" y1="7" x2="12" y2="8" stroke={up} strokeWidth="2" />
        </svg>
      );
    case 'columns':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="2.5" height="8" fill={up} rx="0.5" />
          <rect x="6" y="8" width="2.5" height="6" fill={down} rx="0.5" />
          <rect x="10" y="4" width="2.5" height="10" fill={up} rx="0.5" />
        </svg>
      );
    case 'high_low':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="4" y1="3" x2="4" y2="13" stroke={up} strokeWidth="1.5" />
          <line x1="3" y1="3" x2="5" y2="3" stroke={up} strokeWidth="1.5" />
          <line x1="3" y1="13" x2="5" y2="13" stroke={up} strokeWidth="1.5" />
          <line x1="11" y1="4" x2="11" y2="12" stroke={down} strokeWidth="1.5" />
          <line x1="10" y1="4" x2="12" y2="4" stroke={down} strokeWidth="1.5" />
          <line x1="10" y1="12" x2="12" y2="12" stroke={down} strokeWidth="1.5" />
        </svg>
      );
    case 'heikin_ashi':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="5" y1="3" x2="5" y2="13" stroke={up} strokeWidth="0.8" />
          <rect x="3.5" y="4" width="3" height="7" fill={up} opacity="0.8" />
          <line x1="11" y1="5" x2="11" y2="12" stroke={down} strokeWidth="0.8" />
          <rect x="9.5" y="6" width="3" height="4" fill={down} opacity="0.8" />
        </svg>
      );
    case 'renko':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="10" width="4" height="3" fill={up} opacity="0.7" rx="0.5" />
          <rect x="2" y="7" width="4" height="3" fill={up} opacity="0.7" rx="0.5" />
          <rect x="6" y="4" width="4" height="3" fill={up} opacity="0.7" rx="0.5" />
          <rect x="10" y="6" width="4" height="3" fill={down} opacity="0.7" rx="0.5" />
        </svg>
      );
    case 'line_break':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <rect x="3" y="10" width="8" height="2.5" fill={up} opacity="0.6" rx="0.5" />
          <rect x="3" y="6.5" width="8" height="2.5" fill={up} opacity="0.6" rx="0.5" />
          <rect x="3" y="3" width="8" height="2.5" fill={down} opacity="0.6" rx="0.5" />
        </svg>
      );
    case 'kagi':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="4" y1="12" x2="4" y2="6" stroke={up} strokeWidth="2" />
          <line x1="4" y1="6" x2="9" y2="6" stroke={up} strokeWidth="1.5" />
          <line x1="9" y1="6" x2="9" y2="10" stroke={down} strokeWidth="2" />
          <line x1="9" y1="10" x2="13" y2="10" stroke={down} strokeWidth="1.5" />
          <line x1="13" y1="10" x2="13" y2="4" stroke={up} strokeWidth="2.5" />
        </svg>
      );
    case 'point_figure':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="4" y1="10" x2="6" y2="12" stroke={up} strokeWidth="1.2" />
          <line x1="6" y1="10" x2="4" y2="12" stroke={up} strokeWidth="1.2" />
          <line x1="4" y1="7" x2="6" y2="9" stroke={up} strokeWidth="1.2" />
          <line x1="6" y1="7" x2="4" y2="9" stroke={up} strokeWidth="1.2" />
          <circle cx="11" cy="8" r="2" fill="none" stroke={down} strokeWidth="1.2" />
          <circle cx="11" cy="11" r="2" fill="none" stroke={down} strokeWidth="1.2" />
        </svg>
      );
    case 'range':
      return (
        <svg width={w} height={h} viewBox="0 0 16 16" fill="none">
          <line x1="3" y1="6" x2="7" y2="6" stroke={up} strokeWidth="1.5" />
          <line x1="3" y1="11" x2="7" y2="11" stroke={up} strokeWidth="1.5" />
          <line x1="5" y1="6" x2="5" y2="11" stroke={up} strokeWidth="0.8" opacity="0.5" />
          <line x1="9" y1="4" x2="13" y2="4" stroke={down} strokeWidth="1.5" />
          <line x1="9" y1="9" x2="13" y2="9" stroke={down} strokeWidth="1.5" />
          <line x1="11" y1="4" x2="11" y2="9" stroke={down} strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ChartTypeSelector({ chartType, onChartTypeChange }: ChartTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Chart type"
        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-all ${
          open ? 'bg-slate-700 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
        }`}
      >
        <ChartTypeIcon type={chartType} size={16} />
        <span className="hidden sm:inline">{CHART_TYPE_LABELS[chartType]}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 animate-in fade-in duration-150">
          <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-700 bg-[#161b26] py-1.5 shadow-2xl">
            {CHART_TYPE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {group.label}
                </div>
                {group.types.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      onChartTypeChange(type);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                      chartType === type
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      <ChartTypeIcon type={type} size={16} />
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                    {chartType === type && <Check size={12} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
