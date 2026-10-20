import { useMemo, useState } from 'react';
import { X, MousePointerClick } from 'lucide-react';
import type { Candle, ChartType } from '@/types';
import type { LevelAnalysis } from '@/lib/analysis';
import { transformForChartType, type KagiSegment, type PFColumn } from '@/lib/chartTransforms';

interface TradingChartProps {
  candles: Candle[];
  chartType: ChartType;
  symbol: string;
  analysis: LevelAnalysis | null;
  onClearAnalysis: () => void;
  replayActive: boolean;
  replayCutoff: number | null;
  replayPosition: number;
  onSelectCutoff: (index: number) => void;
  livePrice: number | null;
  dataSource: 'websocket' | 'simulated';
}

const WIDTH = 1000;
const HEIGHT = 460;
const PADDING = { top: 20, right: 64, bottom: 80, left: 8 };
const VOLUME_HEIGHT = 60;

const UP = '#10b981';
const DOWN = '#f43f5e';

export default function TradingChart({
  candles,
  chartType,
  symbol,
  analysis,
  onClearAnalysis,
  replayActive,
  replayCutoff,
  replayPosition,
  onSelectCutoff,
  livePrice,
  dataSource,
}: TradingChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  // In replay mode with a cutoff, only render candles 0..position
  const visibleCount = replayActive && replayCutoff !== null ? replayPosition + 1 : candles.length;
  const sourceCandles = candles.slice(0, visibleCount);
  const futureCandles = replayActive && replayCutoff !== null ? candles.slice(0, replayCutoff + 1) : candles;

  // Transform candles for the current chart type
  const transformed = useMemo(
    () => transformForChartType(sourceCandles, chartType),
    [sourceCandles, chartType],
  );
  const renderCandles = transformed.candles;
  const kagiData = transformed.kagi;
  const pfColumns = transformed.pfColumns;

  // For kagi/pf, we still use the raw candles for price scaling
  const scaleCandles = chartType === 'kagi' || chartType === 'point_figure' ? candles : renderCandles;

  const { min, max, maxVol, plotW, plotH } = useMemo(() => {
    if (scaleCandles.length === 0) {
      return { min: 0, max: 1, maxVol: 1, plotW: WIDTH - PADDING.left - PADDING.right, plotH: HEIGHT - PADDING.top - PADDING.bottom - VOLUME_HEIGHT };
    }
    const prices = scaleCandles.flatMap((c) => [c.high, c.low]);
    const volumes = scaleCandles.map((c) => c.volume);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || 1;
    return {
      min: lo - range * 0.08,
      max: hi + range * 0.08,
      maxVol: Math.max(...volumes, 1),
      plotW: WIDTH - PADDING.left - PADDING.right,
      plotH: HEIGHT - PADDING.top - PADDING.bottom - VOLUME_HEIGHT,
    };
  }, [scaleCandles]);

  const xCount = renderCandles.length || 1;
  const xFor = (i: number) => PADDING.left + (i / Math.max(1, xCount - 1)) * plotW;
  const yFor = (price: number) => PADDING.top + (1 - (price - min) / (max - min || 1)) * plotH;
  const volY = HEIGHT - PADDING.bottom;
  const candleSpacing = plotW / xCount;
  const candleWidth = Math.max(2, candleSpacing * 0.6);

  const lastCandle = renderCandles[renderCandles.length - 1] ?? sourceCandles[sourceCandles.length - 1] ?? candles[0];
  const prevClose = renderCandles[renderCandles.length - 2]?.close ?? lastCandle.open;
  const isUp = lastCandle.close >= prevClose;
  const change = lastCandle.close - prevClose;
  const changePct = (change / prevClose) * 100;

  const displayPrice = livePrice ?? lastCandle.close;

  const priceSteps = 6;
  const gridLines = Array.from({ length: priceSteps + 1 }, (_, i) => min + (i / priceSteps) * (max - min));

  const hovered = hover !== null && hover < sourceCandles.length ? sourceCandles[hover] : lastCandle;

  const linePath = useMemo(() => {
    if (renderCandles.length === 0) return '';
    return renderCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(c.close)}`).join(' ');
  }, [renderCandles, min, max]);

  const stepPath = useMemo(() => {
    if (renderCandles.length === 0) return '';
    return renderCandles
      .map((c, i) => {
        if (i === 0) return `M ${xFor(i)} ${yFor(c.close)}`;
        const prevX = xFor(i - 1);
        return `L ${xFor(i)} ${yFor(renderCandles[i - 1].close)} L ${xFor(i)} ${yFor(c.close)}`;
      })
      .join(' ');
  }, [renderCandles, min, max]);

  const areaPath = useMemo(() => {
    if (renderCandles.length === 0) return '';
    const base = PADDING.top + plotH;
    return `${linePath} L ${xFor(renderCandles.length - 1)} ${base} L ${xFor(0)} ${base} Z`;
  }, [linePath, renderCandles.length]);

  // Baseline: center price
  const baselinePrice = useMemo(() => {
    if (renderCandles.length === 0) return 0;
    return (Math.min(...renderCandles.map((c) => c.low)) + Math.max(...renderCandles.map((c) => c.high))) / 2;
  }, [renderCandles]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!replayActive || replayCutoff !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.round(((x - PADDING.left) / plotW) * (candles.length - 1));
    const clamped = Math.max(5, Math.min(candles.length - 1, idx));
    onSelectCutoff(clamped);
  };

  const inSelectionMode = replayActive && replayCutoff === null;

  // Render a candle body (shared by candle variants)
  const renderCandleBody = (c: typeof renderCandles[0], i: number, opts: { hollow?: boolean; volumeWeighted?: boolean } = {}) => {
    const up = c.isUp;
    const color = up ? UP : DOWN;
    const bodyTop = yFor(Math.max(c.open, c.close));
    const bodyBot = yFor(Math.min(c.open, c.close));
    const x = xFor(i);

    if (opts.volumeWeighted) {
      const volScale = c.volume / maxVol;
      const vw = Math.max(2, candleWidth * (0.3 + volScale * 0.7));
      return (
        <g key={i}>
          <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} stroke={color} strokeWidth="1" opacity="0.6" />
          <rect
            x={x - vw / 2}
            y={bodyTop}
            width={vw}
            height={Math.max(1, bodyBot - bodyTop)}
            fill={color}
            opacity={0.8}
          />
        </g>
      );
    }

    if (opts.hollow) {
      return (
        <g key={i}>
          <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} stroke={color} strokeWidth="1" />
          <rect
            x={x - candleWidth / 2}
            y={bodyTop}
            width={candleWidth}
            height={Math.max(1, bodyBot - bodyTop)}
            fill={up ? 'transparent' : color}
            stroke={color}
            strokeWidth="1"
          />
        </g>
      );
    }

    return (
      <g key={i}>
        <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} stroke={color} strokeWidth="1" />
        <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
      </g>
    );
  };

  // Ghost candles for replay
  const renderGhost = () => {
    if (!replayActive || replayCutoff === null) return null;
    return (
      <g opacity="0.18">
        {futureCandles.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? UP : DOWN;
          const x = xFor(i);
          const bodyTop = yFor(Math.max(c.open, c.close));
          const bodyBot = yFor(Math.min(c.open, c.close));
          return (
            <g key={`ghost-${i}`}>
              <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} stroke={color} strokeWidth="1" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
            </g>
          );
        })}
      </g>
    );
  };

  const isCandleType = (t: ChartType) =>
    ['candles', 'hollow_candles', 'volume_candles', 'heikin_ashi', 'renko', 'line_break', 'range'].includes(t);

  return (
    <div className="relative flex-1 bg-[#0d1117]">
      {/* Price header */}
      <div className="absolute left-4 top-3 z-10 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">{symbol}</span>
          <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">Spot</span>
          {dataSource === 'websocket' ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              Sim
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Replay mode badge */}
      {replayActive && (
        <div className={`absolute right-4 z-10 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
          inSelectionMode ? 'top-3 bg-amber-500/15 text-amber-400' : 'top-3 bg-emerald-500/15 text-emerald-400'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${inSelectionMode ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'}`} />
          {inSelectionMode ? 'Select cutoff point' : 'Replay Mode'}
        </div>
      )}

      {/* Selection mode prompt */}
      {inSelectionMode && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-[#161b26]/95 px-4 py-3 shadow-2xl">
            <MousePointerClick size={18} className="text-amber-400" />
            <span className="text-sm text-slate-200">Click on the chart to set the replay cutoff point</span>
          </div>
        </div>
      )}

      {/* AI levels badge */}
      {analysis && (
        <div className={`absolute right-4 z-10 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
          replayActive ? 'top-12' : 'top-3'
        } bg-slate-800/90 text-slate-300`}>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-emerald-400" />
            <span className="h-2 w-2 rounded-sm bg-rose-400" />
            AI Levels
          </span>
          <button onClick={onClearAnalysis} className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200" title="Remove AI levels">
            <X size={12} />
          </button>
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`h-full w-full ${inSelectionMode ? 'cursor-crosshair' : ''}`}
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
          const idx = Math.round(((x - PADDING.left) / plotW) * (candles.length - 1));
          setHover(Math.max(0, Math.min(candles.length - 1, idx)));
        }}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={UP} stopOpacity="0.28" />
            <stop offset="100%" stopColor={UP} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaGradientDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={DOWN} stopOpacity="0.28" />
            <stop offset="100%" stopColor={DOWN} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hlcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="replayDim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d1117" stopOpacity="0" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0.78" />
          </linearGradient>
        </defs>

        {/* Horizontal grid + price axis */}
        {gridLines.map((p, i) => (
          <g key={i}>
            <line x1={PADDING.left} y1={yFor(p)} x2={PADDING.left + plotW} y2={yFor(p)} stroke="#1c2333" strokeWidth="1" strokeDasharray="3 4" />
            <text x={WIDTH - PADDING.right + 6} y={yFor(p) + 3} fill="#64748b" fontSize="10" fontFamily="monospace">{p.toFixed(2)}</text>
          </g>
        ))}

        {/* Vertical grid (time) */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = PADDING.left + (i / 7) * plotW;
          const timeIdx = Math.round((i / 7) * (candles.length - 1));
          return (
            <g key={i}>
              <line x1={x} y1={PADDING.top} x2={x} y2={volY} stroke="#1c2333" strokeWidth="1" strokeDasharray="3 4" />
              <text x={x - 20} y={volY + 14} fill="#64748b" fontSize="9" fontFamily="monospace">
                {candles[timeIdx] ? formatTime(candles[timeIdx].time) : ''}
              </text>
            </g>
          );
        })}

        {/* Ghost candles during replay */}
        {renderGhost()}

        {/* Volume bars (skip for kagi/pf/columns which handle volume differently) */}
        {!['kagi', 'point_figure', 'columns'].includes(chartType) && renderCandles.map((c, i) => {
          const h = (c.volume / maxVol) * VOLUME_HEIGHT;
          const up = c.isUp;
          return (
            <rect key={`vol-${i}`} x={xFor(i) - candleWidth / 2} y={volY - h + VOLUME_HEIGHT} width={candleWidth} height={h} fill={up ? `${UP}33` : `${DOWN}33`} />
          );
        })}

{/* ===== Chart Type Renderers ===== */}

        {/* BARS */}
        {chartType === 'bars' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          return (
            <g key={i} stroke={color} strokeWidth="1">
              <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} />
              <line x1={x - candleWidth / 3} y1={yFor(c.open)} x2={x} y2={yFor(c.open)} />
              <line x1={x} y1={yFor(c.close)} x2={x + candleWidth / 3} y2={yFor(c.close)} />
            </g>
          );
        })}

        {/* CANDLES */}
        {chartType === 'candles' && renderCandles.map((c, i) => renderCandleBody(c, i))}

        {/* HOLLOW CANDLES */}
        {chartType === 'hollow_candles' && renderCandles.map((c, i) => renderCandleBody(c, i, { hollow: true }))}

        {/* VOLUME CANDLES */}
        {chartType === 'volume_candles' && renderCandles.map((c, i) => renderCandleBody(c, i, { volumeWeighted: true }))}

        {/* HEIKIN ASHI */}
        {chartType === 'heikin_ashi' && renderCandles.map((c, i) => renderCandleBody(c, i))}

        {/* RENKO */}
        {chartType === 'renko' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          const bodyTop = yFor(Math.max(c.open, c.close));
          const bodyBot = yFor(Math.min(c.open, c.close));
          return (
            <rect key={i} x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(1, bodyBot - bodyTop)} fill={color} opacity="0.7" stroke={color} strokeWidth="0.5" rx="1" />
          );
        })}

        {/* LINE BREAK */}
        {chartType === 'line_break' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          const bodyTop = yFor(Math.max(c.open, c.close));
          const bodyBot = yFor(Math.min(c.open, c.close));
          return (
            <rect key={i} x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(1, bodyBot - bodyTop)} fill={color} opacity="0.6" stroke={color} strokeWidth="1" rx="1" />
          );
        })}

        {/* RANGE */}
        {chartType === 'range' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          const bodyTop = yFor(Math.max(c.open, c.close));
          const bodyBot = yFor(Math.min(c.open, c.close));
          return (
            <g key={i}>
              <line x1={x - candleWidth / 2} y1={bodyTop} x2={x + candleWidth / 2} y2={bodyTop} stroke={color} strokeWidth="1.5" />
              <line x1={x - candleWidth / 2} y1={bodyBot} x2={x + candleWidth / 2} y2={bodyBot} stroke={color} strokeWidth="1.5" />
              <line x1={x} y1={bodyTop} x2={x} y2={bodyBot} stroke={color} strokeWidth="1" opacity="0.5" />
            </g>
          );
        })}

        {/* LINE */}
        {chartType === 'line' && renderCandles.length > 0 && (
          <path d={linePath} fill="none" stroke={isUp ? UP : DOWN} strokeWidth="1.5" strokeLinejoin="round" />
        )}

        {/* LINE WITH MARKERS */}
        {chartType === 'line_markers' && renderCandles.length > 0 && (
          <>
            <path d={linePath} fill="none" stroke={isUp ? UP : DOWN} strokeWidth="1.5" strokeLinejoin="round" />
            {renderCandles.map((c, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(c.close)} r="2" fill={c.isUp ? UP : DOWN} />
            ))}
          </>
        )}

        {/* STEP LINE */}
        {chartType === 'step_line' && renderCandles.length > 0 && (
          <path d={stepPath} fill="none" stroke={isUp ? UP : DOWN} strokeWidth="1.5" strokeLinejoin="round" />
        )}

        {/* AREA */}
        {chartType === 'area' && renderCandles.length > 0 && (
          <>
            <path d={areaPath} fill={isUp ? 'url(#areaGradient)' : 'url(#areaGradientDown)'} />
            <path d={linePath} fill="none" stroke={isUp ? UP : DOWN} strokeWidth="1.5" strokeLinejoin="round" />
          </>
        )}

        {/* HLC AREA — area between high and low with close line */}
        {chartType === 'hlc_area' && renderCandles.length > 0 && (
          <>
            {(() => {
              const hlPath = renderCandles.map((c, i) => {
                const x = xFor(i);
                return `${i === 0 ? 'M' : 'L'} ${x} ${yFor(c.high)}`;
              }).join(' ');
              const hlPathBack = renderCandles.slice().reverse().map((c, i) => {
                const x = xFor(renderCandles.length - 1 - i);
                return `L ${x} ${yFor(c.low)}`;
              }).join(' ');
              return <path d={`${hlPath} ${hlPathBack} Z`} fill="url(#hlcGradient)" />;
            })()}
            <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" />
          </>
        )}

        {/* BASELINE — green above center, red below */}
        {chartType === 'baseline' && renderCandles.length > 0 && (
          <>
            <line x1={PADDING.left} y1={yFor(baselinePrice)} x2={PADDING.left + plotW} y2={yFor(baselinePrice)} stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
            <text x={PADDING.left + 4} y={yFor(baselinePrice) - 4} fill="#64748b" fontSize="9" fontFamily="monospace">{baselinePrice.toFixed(2)}</text>
            {renderCandles.map((c, i) => {
              const x = xFor(i);
              const y = yFor(c.close);
              const baseY = yFor(baselinePrice);
              const above = c.close >= baselinePrice;
              return (
                <line key={i} x1={x} y1={y} x2={x} y2={baseY} stroke={above ? UP : DOWN} strokeWidth={candleWidth * 0.5} opacity="0.7" />
              );
            })}
            <path d={linePath} fill="none" stroke={isUp ? UP : DOWN} strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
          </>
        )}

        {/* COLUMNS — volume-style price bars */}
        {chartType === 'columns' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          const baseY = volY + VOLUME_HEIGHT;
          const closeY = yFor(c.close);
          return (
            <rect key={i} x={x - candleWidth / 2} y={Math.min(closeY, baseY)} width={candleWidth} height={Math.abs(baseY - closeY)} fill={color} opacity="0.75" rx="1" />
          );
        })}

        {/* HIGH-LOW — high-low bars with tick marks */}
        {chartType === 'high_low' && renderCandles.map((c, i) => {
          const color = c.isUp ? UP : DOWN;
          const x = xFor(i);
          return (
            <g key={i} stroke={color} strokeWidth="1.5">
              <line x1={x} y1={yFor(c.high)} x2={x} y2={yFor(c.low)} />
              <line x1={x - candleWidth / 3} y1={yFor(c.high)} x2={x + candleWidth / 3} y2={yFor(c.high)} />
              <line x1={x - candleWidth / 3} y1={yFor(c.low)} x2={x + candleWidth / 3} y2={yFor(c.low)} />
            </g>
          );
        })}

        {/* KAGI — vertical lines with horizontal reversal segments */}
        {chartType === 'kagi' && kagiData && kagiData.length > 0 && (
          <g>
            {kagiData.map((seg, i) => {
              if (i === 0) return null;
              const prev = kagiData[i - 1];
              const x1 = xFor(i - 1);
              const x2 = xFor(i);
              const y1 = yFor(prev.price);
              const y2 = yFor(seg.price);
              const thick = seg.thickness === 'thick';
              return (
                <g key={i}>
                  {Math.abs(x2 - x1) > 0.5 && (
                    <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={thick ? UP : DOWN} strokeWidth={thick ? 2 : 1.5} />
                  )}
                  <line x1={x2} y1={y1} x2={x2} y2={y2} stroke={thick ? UP : DOWN} strokeWidth={thick ? 2.5 : 2} />
                </g>
              );
            })}
          </g>
        )}

        {/* POINT & FIGURE — X and O columns */}
        {chartType === 'point_figure' && pfColumns && pfColumns.length > 0 && (
          <g>
            {pfColumns.map((col, ci) => {
              const x = xFor(ci);
              const boxRange = (max - min) / 30;
              const numBoxes = col.boxes;
              const colHeight = numBoxes * boxRange;
              const startY = col.type === 'X' ? yFor(col.endPrice) : yFor(col.startPrice);
              return (
                <g key={ci}>
                  {Array.from({ length: numBoxes }, (_, bi) => {
                    const boxY = startY + bi * boxRange;
                    if (col.type === 'X') {
                      return (
                        <g key={bi}>
                          <line x1={x - candleWidth / 3} y1={boxY} x2={x + candleWidth / 3} y2={boxY + boxRange} stroke={UP} strokeWidth="1.2" />
                          <line x1={x + candleWidth / 3} y1={boxY} x2={x - candleWidth / 3} y2={boxY + boxRange} stroke={UP} strokeWidth="1.2" />
                        </g>
                      );
                    }
                    return (
                      <circle key={bi} cx={x} cy={boxY + boxRange / 2} r={candleWidth / 3} fill="none" stroke={DOWN} strokeWidth="1.2" />
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}

        {/* Current price line */}
        <g>
          <line x1={PADDING.left} y1={yFor(lastCandle.close)} x2={PADDING.left + plotW} y2={yFor(lastCandle.close)} stroke={isUp ? UP : DOWN} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
          <rect x={WIDTH - PADDING.right + 2} y={yFor(lastCandle.close) - 9} width={PADDING.right - 4} height={18} rx="3" fill={isUp ? UP : DOWN} />
          <text x={WIDTH - PADDING.right + 6} y={yFor(lastCandle.close) + 3} fill="#0d1117" fontSize="10" fontWeight="700" fontFamily="monospace">
            {lastCandle.close.toFixed(2)}
          </text>
        </g>

        {/* Replay cutoff line */}
        {replayActive && replayCutoff !== null && (
          <g>
            {replayPosition < replayCutoff && (
              <rect x={xFor(replayPosition) + candleWidth / 2} y={PADDING.top} width={xFor(replayCutoff) - xFor(replayPosition)} height={plotH} fill="url(#replayDim)" />
            )}
            <line x1={xFor(replayCutoff)} y1={PADDING.top} x2={xFor(replayCutoff)} y2={volY + VOLUME_HEIGHT} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
            <rect x={xFor(replayCutoff) - 28} y={PADDING.top - 2} width={56} height={14} rx="3" fill="#f59e0b" />
            <text x={xFor(replayCutoff) - 24} y={PADDING.top + 8} fill="#0d1117" fontSize="9" fontWeight="700" fontFamily="monospace">CUTOFF</text>
            <line x1={xFor(replayPosition)} y1={PADDING.top} x2={xFor(replayPosition)} y2={volY + VOLUME_HEIGHT} stroke={UP} strokeWidth="1.5" opacity="0.6" />
          </g>
        )}

        {/* Selection preview line */}
        {inSelectionMode && hover !== null && (
          <g>
            <line x1={xFor(hover)} y1={PADDING.top} x2={xFor(hover)} y2={volY + VOLUME_HEIGHT} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
            <rect x={xFor(hover) - 30} y={volY + VOLUME_HEIGHT + 2} width={60} height={14} rx="3" fill="#f59e0b" opacity="0.9" />
            <text x={xFor(hover) - 26} y={volY + VOLUME_HEIGHT + 12} fill="#0d1117" fontSize="9" fontWeight="700" fontFamily="monospace">
              {candles[hover] ? formatTime(candles[hover].time) : ''}
            </text>
          </g>
        )}

        {/* AI-drawn Support / Resistance lines */}
        {analysis && (
          <g>
            {analysis.support.map((level, i) => {
              const y = yFor(level);
              if (y < PADDING.top || y > PADDING.top + plotH) return null;
              return (
                <g key={`s-${i}`}>
                  <line x1={PADDING.left} y1={y} x2={PADDING.left + plotW} y2={y} stroke={UP} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
                  <rect x={PADDING.left + 4} y={y - 8} width={64} height={16} rx="3" fill={UP} opacity="0.95" />
                  <text x={PADDING.left + 8} y={y + 3} fill="#0d1117" fontSize="9" fontWeight="700" fontFamily="monospace">S{i + 1} {level.toLocaleString()}</text>
                </g>
              );
            })}
            {analysis.resistance.map((level, i) => {
              const y = yFor(level);
              if (y < PADDING.top || y > PADDING.top + plotH) return null;
              return (
                <g key={`r-${i}`}>
                  <line x1={PADDING.left} y1={y} x2={PADDING.left + plotW} y2={y} stroke={DOWN} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
                  <rect x={PADDING.left + 4} y={y - 8} width={64} height={16} rx="3" fill={DOWN} opacity="0.95" />
                  <text x={PADDING.left + 8} y={y + 3} fill="#0d1117" fontSize="9" fontWeight="700" fontFamily="monospace">R{i + 1} {level.toLocaleString()}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* Crosshair */}
        {hover !== null && !inSelectionMode && (
          <g>
            <line x1={xFor(Math.min(hover, xCount - 1))} y1={PADDING.top} x2={xFor(Math.min(hover, xCount - 1))} y2={volY + VOLUME_HEIGHT} stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />
            <line x1={PADDING.left} y1={yFor(hovered.close)} x2={PADDING.left + plotW} y2={yFor(hovered.close)} stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />
          </g>
        )}
      </svg>

      {/* OHLC tooltip */}
      <div className="absolute left-4 top-[60px] z-10 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono">
        <span className="text-slate-500">O <span className="text-slate-300">{hovered.open.toFixed(2)}</span></span>
        <span className="text-slate-500">H <span className="text-slate-300">{hovered.high.toFixed(2)}</span></span>
        <span className="text-slate-500">L <span className="text-slate-300">{hovered.low.toFixed(2)}</span></span>
        <span className="text-slate-500">C <span className={hovered.close >= hovered.open ? 'text-emerald-400' : 'text-rose-400'}>{hovered.close.toFixed(2)}</span></span>
        <span className="text-slate-500">Vol <span className="text-slate-300">{hovered.volume.toLocaleString()}</span></span>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
