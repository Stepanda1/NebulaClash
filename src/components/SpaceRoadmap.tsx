import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Lock, LogOut, Settings, X } from 'lucide-react';
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

const TOTAL_LEVELS = 30;
const MAP_WIDTH = 340;
const NODE_SIZE = 42;
const TOP_PADDING = 96;
const STEP_Y = 118;

const DECORATIONS = [
  { left: 24, top: 180, size: 62, color: 'from-rose-300/35 to-fuchsia-500/20' },
  { left: 250, top: 320, size: 84, color: 'from-cyan-300/35 to-blue-500/25' },
  { left: 18, top: 740, size: 48, color: 'from-emerald-300/30 to-cyan-500/20' },
  { left: 262, top: 990, size: 58, color: 'from-amber-300/35 to-orange-500/20' },
  { left: 42, top: 1380, size: 96, color: 'from-violet-300/30 to-indigo-500/20' },
  { left: 252, top: 1850, size: 54, color: 'from-sky-300/35 to-indigo-500/20' },
  { left: 58, top: 2430, size: 78, color: 'from-pink-300/30 to-rose-500/20' },
  { left: 254, top: 2920, size: 64, color: 'from-lime-300/30 to-emerald-500/20' },
];

export function SpaceRoadmap({ unlockedLevel, language, onStartLevel, onExitGame }: SpaceRoadmapProps) {
  const [selectedLevel, setSelectedLevel] = useState(Math.max(1, unlockedLevel));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const t = COPY[language];

  const points = useMemo<Point[]>(() => {
    return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
      const level = i + 1;
      const y = TOP_PADDING + (TOTAL_LEVELS - 1 - i) * STEP_Y;
      const x = MAP_WIDTH / 2 + Math.sin(i * 0.72) * 92 + Math.cos(i * 0.24) * 12;
      return { level, x, y };
    });
  }, []);

  useEffect(() => {
    setSelectedLevel((prev) => (prev > unlockedLevel ? unlockedLevel : prev));
  }, [unlockedLevel]);

  const mapHeight = points[0].y + 180;

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

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const selectedPoint = points.find((point) => point.level === selectedLevel);
    if (!selectedPoint) return;

    const target = Math.max(0, selectedPoint.y - scroller.clientHeight * 0.62);
    scroller.scrollTo({ top: target, behavior: 'smooth' });
  }, [selectedLevel, points]);

  const levelLabel = language === 'ru' ? 'Карта уровней' : 'Level Map';
  const currentLabel = language === 'ru' ? 'Текущий прогресс' : 'Current Progress';
  const settingsLabel = language === 'ru' ? 'Настройки карты' : 'Map Settings';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1f3d7a_0%,#120b2e_40%,#06030f_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.55)_1px,transparent_1px),radial-gradient(circle_at_68%_64%,rgba(125,211,252,0.5)_1px,transparent_1px),radial-gradient(circle_at_83%_26%,rgba(196,181,253,0.45)_1px,transparent_1px)] [background-size:180px_180px,220px_220px,260px_260px]" />
      <div className="pointer-events-none absolute -left-20 top-28 h-56 w-56 rounded-full bg-fuchsia-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/20 bg-black/30 px-4 py-3 backdrop-blur-md">
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

        <div ref={scrollerRef} className="relative flex-1 overflow-y-auto rounded-3xl border border-white/15 bg-black/25 shadow-[0_0_80px_rgba(56,189,248,0.12)] backdrop-blur-sm">
          <div className="relative mx-auto w-[340px]" style={{ height: mapHeight }}>
            {DECORATIONS.map((item, idx) => (
              <div
                key={idx}
                className={`pointer-events-none absolute rounded-full bg-gradient-to-br ${item.color} blur-[1px] border border-white/10`}
                style={{ left: item.left, top: item.top, width: item.size, height: item.size }}
              />
            ))}

            <svg className="pointer-events-none absolute inset-0" width={MAP_WIDTH} height={mapHeight} viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`} fill="none" aria-hidden="true">
              <path d={pathD} stroke="rgba(148,163,184,0.35)" strokeWidth="14" strokeLinecap="round" />
              <path d={pathD} stroke="url(#roadGlow)" strokeWidth="8" strokeLinecap="round" />
              <defs>
                <linearGradient id="roadGlow" x1="0" y1="0" x2={MAP_WIDTH} y2={mapHeight}>
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
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
                    if (!isLocked) {
                      onStartLevel(point.level);
                    }
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

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xs rounded-3xl border border-white/25 bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-3 top-3 w-8 h-8 rounded-full border border-red-300/70 bg-red-500/75 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center"
              aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X size={16} />
            </button>

            <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">{settingsLabel}</div>
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
