import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Lock, LogOut, Navigation, Settings, Sparkles, X } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

type SpaceRoadmapProps = {
  unlockedLevel: number;
  language: Language;
  onStartLevel: (level: number) => void;
  onExitGame: () => void;
};

type Point = {
  level: number;
  x: number;
  y: number;
};

type Decoration = {
  left: number;
  top: number;
  size: number;
  color: string;
};

const TOTAL_LEVELS = 30;
const MAP_WIDTH = 340;
const NODE_SIZE = 42;
const TOP_PADDING = 110;
const STEP_Y = 118;

const PLANETS: Decoration[] = [
  { left: 18, top: 140, size: 70, color: 'from-fuchsia-300/35 to-violet-600/25' },
  { left: 250, top: 300, size: 90, color: 'from-cyan-300/35 to-blue-500/25' },
  { left: 22, top: 620, size: 56, color: 'from-amber-300/30 to-orange-500/20' },
  { left: 258, top: 910, size: 62, color: 'from-emerald-300/30 to-cyan-500/20' },
  { left: 38, top: 1220, size: 84, color: 'from-rose-300/30 to-pink-500/20' },
  { left: 245, top: 1540, size: 76, color: 'from-sky-300/35 to-indigo-500/20' },
  { left: 52, top: 1860, size: 58, color: 'from-lime-300/30 to-emerald-500/20' },
  { left: 256, top: 2140, size: 92, color: 'from-violet-300/30 to-fuchsia-500/20' },
  { left: 30, top: 2460, size: 64, color: 'from-cyan-300/30 to-blue-500/20' },
  { left: 252, top: 2820, size: 72, color: 'from-amber-300/30 to-orange-500/20' },
  { left: 40, top: 3120, size: 88, color: 'from-rose-300/30 to-violet-500/20' },
];

const STARS = Array.from({ length: 42 }, (_, i) => ({
  left: 12 + ((i * 61) % 316),
  top: 90 + i * 78,
  size: 1 + (i % 3),
  opacity: 0.28 + (i % 5) * 0.12,
}));

export function SpaceRoadmap({ unlockedLevel, language, onStartLevel, onExitGame }: SpaceRoadmapProps) {
  const [selectedLevel, setSelectedLevel] = useState(Math.max(1, unlockedLevel));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showJumpToCurrent, setShowJumpToCurrent] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const t = COPY[language];

  const points = useMemo<Point[]>(() => {
    return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
      const level = i + 1;
      const y = TOP_PADDING + (TOTAL_LEVELS - 1 - i) * STEP_Y;
      const x = MAP_WIDTH / 2 + Math.sin(i * 0.72) * 94 + Math.cos(i * 0.22) * 14;
      return { level, x, y };
    });
  }, []);

  const currentPoint = useMemo(() => points.find((point) => point.level === unlockedLevel), [points, unlockedLevel]);

  useEffect(() => {
    setSelectedLevel((prev) => (prev > unlockedLevel ? unlockedLevel : prev));
  }, [unlockedLevel]);

  const mapHeight = points[0].y + 220;

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const current = points[i];
      const controlX = (prev.x + current.x) / 2;
      d += ` Q ${controlX} ${prev.y}, ${current.x} ${current.y}`;
    }
    return d;
  }, [points]);

  const scrollToLevel = (level: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const point = points.find((p) => p.level === level);
    if (!point) return;
    const target = Math.max(0, point.y - scroller.clientHeight * 0.62);
    scroller.scrollTo({ top: target, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToLevel(selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !currentPoint) return;

    const updateVisibility = () => {
      const top = scroller.scrollTop;
      const bottom = top + scroller.clientHeight;
      const y = currentPoint.y;
      setShowJumpToCurrent(y < top + 24 || y > bottom - 24);
    };

    updateVisibility();
    scroller.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      scroller.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [currentPoint]);

  const levelLabel = language === 'ru' ? 'Карта уровней' : 'Level Map';
  const currentLabel = language === 'ru' ? 'Текущий прогресс' : 'Current Progress';
  const settingsLabel = language === 'ru' ? 'Настройки карты' : 'Map Settings';
  const jumpLabel = language === 'ru' ? 'К текущему уровню' : 'Go to current level';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_130%_at_18%_12%,#3b1f7a_0%,#18103b_36%,#09041d_72%,#05020f_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_80%_33%,rgba(125,211,252,0.55)_1px,transparent_1px),radial-gradient(circle_at_68%_78%,rgba(196,181,253,0.48)_1px,transparent_1px)] [background-size:190px_190px,240px_240px,300px_300px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(217,70,239,0.2),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_55%_20%,rgba(251,191,36,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-md">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{currentLabel}</div>
            <div className="text-lg font-black">{t.level(unlockedLevel)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100">
              {levelLabel}
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white/70 shadow-lg text-white active:scale-95 transition-transform flex items-center justify-center"
              aria-label={settingsLabel}
              title={settingsLabel}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="relative flex-1 overflow-y-auto rounded-3xl border border-white/15 bg-black/30 shadow-[0_0_80px_rgba(56,189,248,0.16)] backdrop-blur-md">
          <div className="relative mx-auto w-[340px]" style={{ height: mapHeight }}>
            {PLANETS.map((item, idx) => (
              <div
                key={idx}
                className={`pointer-events-none absolute rounded-full bg-gradient-to-br ${item.color} border border-white/10`}
                style={{ left: item.left, top: item.top, width: item.size, height: item.size }}
              />
            ))}

            {STARS.map((star, idx) => (
              <div
                key={`star-${idx}`}
                className="pointer-events-none absolute rounded-full bg-white"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                }}
              />
            ))}

            <svg className="pointer-events-none absolute inset-0" width={MAP_WIDTH} height={mapHeight} viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`} fill="none" aria-hidden="true">
              <path d={pathD} stroke="rgba(148,163,184,0.34)" strokeWidth="14" strokeLinecap="round" />
              <path d={pathD} stroke="url(#roadGlow)" strokeWidth="8" strokeLinecap="round" />
              <defs>
                <linearGradient id="roadGlow" x1="0" y1="0" x2={MAP_WIDTH} y2={mapHeight}>
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="34%" stopColor="#22d3ee" />
                  <stop offset="68%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            {points.map((point) => {
              const isCompleted = point.level < unlockedLevel;
              const isCurrent = point.level === unlockedLevel;
              const isLocked = point.level > unlockedLevel;
              const isSelected = point.level === selectedLevel;

              return (
                <button
                  key={point.level}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(point.level);
                    if (!isLocked) onStartLevel(point.level);
                  }}
                  className={`absolute flex items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                    isLocked
                      ? 'border-slate-500/50 bg-slate-700/60 text-slate-300'
                      : isCurrent
                        ? 'border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-slate-900 shadow-[0_0_28px_rgba(251,191,36,0.65)]'
                        : 'border-cyan-100/80 bg-gradient-to-br from-cyan-300 to-sky-500 text-slate-900'
                  } ${isSelected ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent' : 'scale-100'} ${isLocked ? '' : 'hover:scale-110 active:scale-95'}`}
                  style={{
                    left: point.x - NODE_SIZE / 2,
                    top: point.y - NODE_SIZE / 2,
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                  }}
                  aria-label={t.level(point.level)}
                >
                  {isLocked ? <Lock className="h-4 w-4" /> : isCompleted ? <Check className="h-5 w-5" /> : point.level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showJumpToCurrent && (
        <button
          type="button"
          onClick={() => scrollToLevel(unlockedLevel)}
          className="absolute bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-cyan-200/60 bg-cyan-400/85 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:scale-105 active:scale-95 transition-all"
        >
          <Navigation size={14} />
          {jumpLabel}
        </button>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xs rounded-3xl border border-white/25 bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-3 top-3 h-9 w-9 rounded-full border-2 border-red-300/80 bg-red-500/80 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center"
              aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X size={17} strokeWidth={3.2} />
            </button>

            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200/80"><Sparkles size={13} />{settingsLabel}</div>
            <h3 className="mt-2 text-xl font-black text-white">{levelLabel}</h3>

            <button
              type="button"
              onClick={onExitGame}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-95 transition-all"
            >
              <LogOut size={18} />
              {t.exitGame}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
