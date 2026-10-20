import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, TrendingUp, TrendingDown, Activity, Zap, Lightbulb, X } from 'lucide-react';
import type { Candle } from '@/types';
import { analyzeLevels, type LevelAnalysis } from '@/lib/analysis';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  analysis?: LevelAnalysis;
}

interface AskAIPanelProps {
  candles: Candle[];
  symbol: string;
  onAnalysis: (a: LevelAnalysis | null) => void;
}

const SUGGESTIONS = [
  'Analyze support and resistance',
  'What is the current trend?',
  'Identify key levels',
];

export default function AskAIPanel({ candles, symbol, onAnalysis }: AskAIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const generateResponse = (query: string): ChatMessage => {
    const a = analyzeLevels(candles);
    const lower = query.toLowerCase();
    let content = '';

    if (lower.includes('support') && lower.includes('resistance')) {
      content = `Based on the recent ${candles.length} candles for ${symbol}, here are the key levels I've identified:\n\n**Support Levels:**\n• S1: ${a.support[0].toLocaleString()}\n• S2: ${a.support[1].toLocaleString()}\n\n**Resistance Levels:**\n• R1: ${a.resistance[0].toLocaleString()}\n• R2: ${a.resistance[1].toLocaleString()}\n\nI've drawn these levels directly on your chart — green lines for support, red lines for resistance.\n\n${a.note}`;
    } else if (lower.includes('trend') || lower.includes('direction')) {
      content = `The current trend for ${symbol} is **${a.trend}** with ${a.confidence}% confidence.\n\nRSI is at ${a.rsi}, indicating ${a.rsi > 70 ? 'overbought conditions' : a.rsi < 30 ? 'oversold conditions' : 'neutral momentum'}.\n\n${a.note}`;
    } else if (lower.includes('level')) {
      content = `Key levels for ${symbol}:\n\nImmediate support at ${a.support[0].toLocaleString()} and ${a.support[1].toLocaleString()}\nResistance to watch at ${a.resistance[0].toLocaleString()} and ${a.resistance[1].toLocaleString()}\n\nI've highlighted these on the chart for you.\n\n${a.note}`;
    } else {
      content = `I've analyzed the ${symbol} chart. The trend is ${a.trend} with RSI at ${a.rsi}. Support sits at ${a.support[0].toLocaleString()} and resistance at ${a.resistance[0].toLocaleString()}.\n\n${a.note}`;
    }

    return { id: crypto.randomUUID(), role: 'ai', content, analysis: a };
  };

  const send = (text: string) => {
    const query = text.trim();
    if (!query) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: query }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = generateResponse(query);
      setMessages((m) => [...m, response]);
      if (response.analysis) onAnalysis(response.analysis);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="flex h-full flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-500/10">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-100">Ask AI</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online · Analyzing {symbol}
            </div>
          </div>
        </div>
        <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-2 pt-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/10">
              <Sparkles size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Ask AI About {symbol}</div>
              <p className="mt-1 text-xs text-slate-500">
                I can analyze support and resistance levels, identify trends, and highlight key price action.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500 px-3.5 py-2.5 text-xs leading-relaxed text-slate-900">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[92%] space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/20 to-cyan-500/10">
                    <Sparkles size={12} className="text-emerald-400" />
                  </div>
                  <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-slate-800/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-200">
                    {m.content.split('**').map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="font-semibold text-emerald-400">{part}</strong>
                      ) : (
                        part
                      )
                    )}
                  </div>
                </div>
                {m.analysis && (
                  <div className="ml-8 grid grid-cols-2 gap-2">
                    <LevelCard
                      label="Support"
                      icon={TrendingDown}
                      levels={m.analysis.support}
                      color="emerald"
                    />
                    <LevelCard
                      label="Resistance"
                      icon={TrendingUp}
                      levels={m.analysis.resistance}
                      color="rose"
                    />
                    <MetricCard icon={Activity} label="RSI" value={m.analysis.rsi.toString()} />
                    <MetricCard icon={Zap} label="Confidence" value={`${m.analysis.confidence}%`} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/20 to-cyan-500/10">
              <Sparkles size={12} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-800/70 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 transition-all focus-within:border-emerald-500/50">
          <Lightbulb size={16} className="shrink-0 text-slate-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask about support, resistance, trends..."
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-900 transition-all hover:bg-emerald-400 disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LevelCard({
  label,
  icon: Icon,
  levels,
  color,
}: {
  label: string;
  icon: typeof TrendingUp;
  levels: number[];
  color: 'emerald' | 'rose';
}) {
  const styles =
    color === 'emerald'
      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
      : 'border-rose-500/20 bg-rose-500/5 text-rose-400';
  return (
    <div className={`rounded-lg border p-2.5 ${styles}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
        <Icon size={11} />
        {label}
      </div>
      <div className="mt-1.5 space-y-0.5">
        {levels.map((l, i) => (
          <div key={i} className="font-mono text-sm font-semibold">
            ${l.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        <Icon size={11} />
        {label}
      </div>
      <div className="mt-1.5 font-mono text-sm font-semibold text-slate-200">{value}</div>
    </div>
  );
}
