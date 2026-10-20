import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChartToolbar from '@/components/ChartToolbar';
import TradingChart from '@/components/TradingChart';
import AskAIPanel from '@/components/AskAIPanel';
import ReplayControls from '@/components/ReplayControls';
import { generateCandles } from '@/lib/marketData';
import type { LevelAnalysis } from '@/lib/analysis';
import type { ChartType, Timeframe } from '@/types';

function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [analysis, setAnalysis] = useState<LevelAnalysis | null>(null);

  // Bar Replay state
  const [replayActive, setReplayActive] = useState(false);
  const [replayCutoff, setReplayCutoff] = useState<number | null>(null);
  const [replayPosition, setReplayPosition] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const candles = useMemo(() => generateCandles(timeframe), [timeframe]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear chart overlays when timeframe changes
  const handleTimeframeChange = (tf: Timeframe) => {
    setAnalysis(null);
    setReplayActive(false);
    setReplayCutoff(null);
    setReplayPosition(0);
    setReplayPlaying(false);
    setTimeframe(tf);
  };

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-advance during playback
  useEffect(() => {
    clearTimer();
    if (!replayPlaying || replayCutoff === null) return;

    const interval = 700 / replaySpeed;
    timerRef.current = setInterval(() => {
      setReplayPosition((pos) => {
        if (pos >= replayCutoff) {
          setReplayPlaying(false);
          return replayCutoff;
        }
        return pos + 1;
      });
    }, interval);

    return clearTimer;
  }, [replayPlaying, replaySpeed, replayCutoff, clearTimer]);

  const toggleBarReplay = () => {
    if (replayActive) {
      // Exit replay
      setReplayActive(false);
      setReplayCutoff(null);
      setReplayPosition(0);
      setReplayPlaying(false);
      clearTimer();
    } else {
      // Enter replay — start in selection mode
      setReplayActive(true);
      setReplayCutoff(null);
      setReplayPlaying(false);
      clearTimer();
    }
  };

  const handleSelectCutoff = (index: number) => {
    setReplayCutoff(index);
    setReplayPosition(0);
    setReplayPlaying(false);
  };

  const handlePlayPause = () => {
    if (replayPosition >= (replayCutoff ?? 0)) {
      setReplayPosition(0);
      setReplayPlaying(true);
    } else {
      setReplayPlaying((p) => !p);
    }
  };

  const handleStepForward = () => {
    setReplayPlaying(false);
    setReplayPosition((p) => Math.min(p + 1, replayCutoff ?? p));
  };

  const handleStepBack = () => {
    setReplayPlaying(false);
    setReplayPosition((p) => Math.max(0, p - 1));
  };

  const handleReset = () => {
    setReplayPlaying(false);
    setReplayPosition(0);
  };

  const handleSeek = (pos: number) => {
    setReplayPlaying(false);
    setReplayPosition(pos);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117] text-slate-200">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#0a0e14] px-4 py-2.5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 17l5-5 4 4 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-100">Pulse<span className="text-emerald-400">Trade</span></span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {['Markets', 'Trade', 'Portfolio', 'News'].map((item, i) => (
              <button
                key={item}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === 1 ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-md bg-slate-800/60 px-2.5 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400">Live</span>
          </div>
          <button className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-emerald-400">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left 70% — chart area */}
        <main className="flex flex-col" style={{ width: '70%' }}>
          <ChartToolbar
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            chartType={chartType}
            onChartTypeChange={setChartType}
            onBarReplay={toggleBarReplay}
            barReplayActive={replayActive}
          />
          <TradingChart
            candles={candles}
            chartType={chartType}
            symbol="BTC/USDT"
            analysis={analysis}
            onClearAnalysis={() => setAnalysis(null)}
            replayActive={replayActive}
            replayCutoff={replayCutoff}
            replayPosition={replayPosition}
            onSelectCutoff={handleSelectCutoff}
          />
          {replayActive && replayCutoff !== null && (
            <ReplayControls
              position={replayPosition}
              total={replayCutoff + 1}
              playing={replayPlaying}
              speed={replaySpeed}
              onPlayPause={handlePlayPause}
              onStepForward={handleStepForward}
              onStepBack={handleStepBack}
              onReset={handleReset}
              onSpeedChange={setReplaySpeed}
              onSeek={handleSeek}
              onExit={toggleBarReplay}
            />
          )}

          {/* Bottom order book strip */}
          <div className="flex items-stretch border-t border-slate-800 bg-[#0a0e14]">
            <div className="flex-1 p-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">Order Book</div>
              <div className="grid grid-cols-2 gap-x-6 text-[11px] font-mono">
                <div className="space-y-0.5">
                  {[43310, 43300, 43290, 43280].map((p, i) => (
                    <div key={p} className="flex items-center justify-between">
                      <span className="text-emerald-400">{p.toFixed(1)}</span>
                      <span className="text-slate-500">{(1.2 - i * 0.2).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {[43270, 43260, 43250, 43240].map((p, i) => (
                    <div key={p} className="flex items-center justify-between">
                      <span className="text-rose-400">{p.toFixed(1)}</span>
                      <span className="text-slate-500">{(0.4 + i * 0.2).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-l border-slate-800 p-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">24h Stats</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono">
                <div className="text-slate-500">High <span className="ml-1 text-slate-300">43,580</span></div>
                <div className="text-slate-500">Low <span className="ml-1 text-slate-300">42,910</span></div>
                <div className="text-slate-500">Vol <span className="ml-1 text-slate-300">18.2K</span></div>
                <div className="text-slate-500">Turnover <span className="ml-1 text-slate-300">$787M</span></div>
              </div>
            </div>
          </div>
        </main>

        {/* Right 30% — Ask AI panel */}
        <aside className="border-l border-slate-800" style={{ width: '30%' }}>
          <AskAIPanel candles={candles} symbol="BTC/USDT" onAnalysis={setAnalysis} />
        </aside>
      </div>
    </div>
  );
}

export default App;
