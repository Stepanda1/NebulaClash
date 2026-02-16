import { useMemo, useState } from 'react';
import { Check, Lock, Rocket } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

type SpaceRoadmapProps = {
  unlockedLevel: number;
  language: Language;
  onStartLevel: (level: number) => void;
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

export function SpaceRoadmap({ unlockedLevel, language, onStartLevel }: SpaceRoadmapProps) {
  const [selectedLevel, setSelectedLevel] = useState(Math.max(1, unlockedLevel));
  const t = COPY[language];

  const points = useMemo<Point[]>(() => {
    return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
      const level = i + 1;
      const y = TOP_PADDING + i * STEP_Y;
      const x = MAP_WIDTH / 2 + Math.sin(i * 0.72) * 92 + Math.cos(i * 0.24) * 12;
      return { level, x, y };
    });
  }, []);

  const mapHeight = points[points.length - 1].y + 180;

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

  const selectedUnlocked = selectedLevel <= unlockedLevel;
  const levelLabel = language === 'ru' ? `Карта уровней` : 'Level Map';
  const startLabel = language === 'ru' ? 'Старт' : 'Start';
  const lockedLabel = language === 'ru' ? 'Закрыт' : 'Locked';
  const currentLabel = language === 'ru' ? 'Текущий прогресс' : 'Current Progress';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1f3d7a_0%,#120b2e_40%,#06030f_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.55)_1px,transparent_1px),radial-gradient(circle_at_68%_64%,rgba(125,211,252,0.5)_1px,transparent_1px),radial-gradient(circle_at_83%_26%,rgba(196,181,253,0.45)_1px,transparent_1px)] [background-size:180px_180px,220px_220px,260px_260px]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-4 pb-24 pt-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/20 bg-black/30 px-4 py-3 backdrop-blur-md">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{currentLabel}</div>
            <div className="text-lg font-black">{t.level(unlockedLevel)}</div>
          </div>
          <div className="rounded-xl bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100">
            {levelLabel}
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto rounded-3xl border border-white/15 bg-black/25 shadow-[0_0_80px_rgba(56,189,248,0.12)] backdrop-blur-sm">
          <div className="relative mx-auto w-[340px]" style={{ height: mapHeight }}>
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
                  onClick={() => setSelectedLevel(point.level)}
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

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/45 p-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{selectedUnlocked ? t.level(selectedLevel) : `${t.level(selectedLevel)} • ${lockedLabel}`}</div>
            <div className="text-sm font-bold text-white/85">{selectedUnlocked ? levelLabel : lockedLabel}</div>
          </div>
          <button
            type="button"
            disabled={!selectedUnlocked}
            onClick={() => onStartLevel(selectedLevel)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide transition-all ${
              selectedUnlocked
                ? 'bg-gradient-to-r from-cyan-300 to-sky-500 text-slate-900 shadow-[0_0_24px_rgba(56,189,248,0.45)] hover:scale-105 active:scale-95'
                : 'cursor-not-allowed bg-slate-600/70 text-slate-300'
            }`}
          >
            <Rocket className="h-4 w-4" />
            {selectedUnlocked ? startLabel : lockedLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
