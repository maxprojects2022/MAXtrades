import { Play, Pause, ChevronRight, SkipBack, X, Rewind } from 'lucide-react';
import { REPLAY_SPEEDS } from '@/types';

interface ReplayControlsProps {
  position: number;
  total: number;
  playing: boolean;
  speed: number;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (s: number) => void;
  onSeek: (pos: number) => void;
  onExit: () => void;
}

export default function ReplayControls({
  position,
  total,
  playing,
  speed,
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  onSpeedChange,
  onSeek,
  onExit,
}: ReplayControlsProps) {
  const progress = total > 0 ? ((position + 1) / total) * 100 : 0;

  return (
    <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#161b26]/95 px-4 py-2.5 shadow-2xl backdrop-blur-sm">
        {/* Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-slate-300">
            {position + 1}<span className="text-slate-600"> / {total}</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Transport */}
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            title="Reset to start"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <SkipBack size={15} />
          </button>
          <button
            onClick={onStepBack}
            disabled={position === 0}
            title="Step back"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Rewind size={15} />
          </button>
          <button
            onClick={onPlayPause}
            title={playing ? 'Pause' : 'Play'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-900 transition-colors hover:bg-emerald-400"
          >
            {playing ? <Pause size={16} className="fill-slate-900" /> : <Play size={16} className="fill-slate-900" />}
          </button>
          <button
            onClick={onStepForward}
            disabled={position >= total - 1}
            title="Step forward"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Progress / scrubber */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={total - 1}
            value={position}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="replay-slider h-1 w-40 cursor-pointer appearance-none rounded-full bg-slate-700"
            style={{
              background: `linear-gradient(to right, #10b981 ${progress}%, #334155 ${progress}%)`,
            }}
          />
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Speed */}
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-800/80 p-0.5">
          {REPLAY_SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                speed === s
                  ? 'bg-emerald-500 text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Exit */}
        <button
          onClick={onExit}
          title="Exit replay"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-rose-400"
        >
          <X size={14} />
          Exit
        </button>
      </div>
    </div>
  );
}
