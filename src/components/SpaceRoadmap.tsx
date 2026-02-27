import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Lock, LogOut, Settings, Sparkles, Star, Volume2, VolumeX, X } from 'lucide-react';
import type { Language } from '../i18n';
import type { LegalSection } from '../types/legal';
import { COPY } from '../i18n';

type SpaceRoadmapProps = {
  unlockedLevel: number;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onStartLevel: (level: number) => void;
  onExitGame: () => void;
  onOpenLegal: (section: LegalSection) => void;
  onOpenGuide: () => void;
  levelStars: Record<number, number>;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
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

const TOTAL_LEVELS = 60;
const MAP_WIDTH = 340;
const NODE_SIZE = 42;
const TOP_PADDING = 110;
const STEP_Y = 118;

const PLANETS: Decoration[] = [
  { left: 18, top: 140, size: 70, color: 'from-fuchsia-300/35 to-violet-600/25' },
  { left: 112, top: 210, size: 38, color: 'from-blue-300/30 to-indigo-500/22' },
  { left: 250, top: 300, size: 90, color: 'from-cyan-300/35 to-blue-500/25' },
  { left: 198, top: 470, size: 44, color: 'from-pink-300/28 to-fuchsia-500/18' },
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

const STARS = Array.from({ length: 74 }, (_, i) => ({
  left: 12 + ((i * 61) % 316),
  top: 90 + i * 74,
  size: 1 + (i % 3),
  opacity: 0.28 + (i % 5) * 0.12,
}));

const COMETS = Array.from({ length: 12 }, (_, i) => ({
  left: 20 + ((i * 47) % 300),
  top: 180 + i * 290,
  rotate: -18 + (i % 5) * 7,
}));

const ASTEROID_FIELDS = Array.from({ length: 20 }, (_, i) => ({
  left: 14 + ((i * 37) % 312),
  top: 130 + i * 164,
  size: 4 + (i % 4) * 2,
  rotate: (i * 23) % 360,
}));

const ORBIT_STATIONS = [
  { left: 268, top: 420, scale: 1 },
  { left: 38, top: 1120, scale: 0.85 },
  { left: 260, top: 1980, scale: 1.1 },
  { left: 48, top: 2780, scale: 0.92 },
];
const FIRST_SECTOR_RELICS = [
  { left: 18, top: 260, w: 34, h: 18, rotate: -12 },
  { left: 278, top: 560, w: 28, h: 16, rotate: 18 },
  { left: 46, top: 980, w: 38, h: 20, rotate: -8 },
  { left: 252, top: 1320, w: 30, h: 16, rotate: 11 },
  { left: 68, top: 1680, w: 42, h: 22, rotate: -16 },
];
const FIRST_SECTOR_CRYSTAL_FIELDS = Array.from({ length: 14 }, (_, i) => ({
  left: 18 + ((i * 53) % 300),
  top: 160 + i * 120,
  hue: i % 2 === 0 ? 'cyan' : 'fuchsia',
  rotate: (i * 31) % 360,
  size: 8 + (i % 3) * 3,
}));
const EARLY_ZONE_NEBULAE = [
  { left: -24, top: 3920, w: 220, h: 150, color: 'from-cyan-300/18 via-blue-500/12 to-transparent' },
  { left: 154, top: 4250, w: 210, h: 140, color: 'from-fuchsia-300/16 via-violet-500/10 to-transparent' },
  { left: 22, top: 4680, w: 260, h: 170, color: 'from-emerald-300/14 via-cyan-500/10 to-transparent' },
  { left: 132, top: 5250, w: 240, h: 160, color: 'from-amber-300/14 via-orange-500/10 to-transparent' },
  { left: -10, top: 5900, w: 240, h: 160, color: 'from-rose-300/14 via-pink-500/10 to-transparent' },
  { left: 130, top: 6520, w: 230, h: 155, color: 'from-sky-300/16 via-indigo-500/10 to-transparent' },
];
const EARLY_ZONE_GAS_ARCS = [
  { left: -30, top: 3800, w: 310, h: 90, rotate: -12, color: 'from-cyan-300/12 via-transparent to-fuchsia-300/10' },
  { left: 70, top: 4520, w: 290, h: 86, rotate: 10, color: 'from-violet-300/12 via-transparent to-cyan-300/10' },
  { left: -10, top: 5320, w: 340, h: 96, rotate: -8, color: 'from-emerald-300/10 via-transparent to-sky-300/10' },
  { left: 34, top: 6080, w: 300, h: 88, rotate: 14, color: 'from-amber-300/10 via-transparent to-rose-300/10' },
  { left: -24, top: 6820, w: 320, h: 92, rotate: -10, color: 'from-cyan-300/10 via-transparent to-indigo-300/10' },
];
const EARLY_ZONE_BEACONS = [
  { left: 26, top: 4040, scale: 1 },
  { left: 274, top: 4470, scale: 0.9 },
  { left: 56, top: 5030, scale: 1.08 },
  { left: 262, top: 5660, scale: 0.95 },
  { left: 44, top: 6320, scale: 1.02 },
  { left: 252, top: 6870, scale: 0.88 },
];
const EARLY_ZONE_PORTALS = [
  { left: 238, top: 4180, size: 54, hue: 'cyan' },
  { left: 26, top: 5730, size: 58, hue: 'violet' },
  { left: 248, top: 6460, size: 50, hue: 'emerald' },
];
const EARLY_ZONE_WRECKS = [
  { left: 208, top: 3860, w: 46, h: 18, rotate: -18 },
  { left: 32, top: 4380, w: 52, h: 20, rotate: 14 },
  { left: 236, top: 4905, w: 42, h: 16, rotate: -9 },
  { left: 96, top: 5510, w: 56, h: 22, rotate: 11 },
  { left: 214, top: 6095, w: 48, h: 18, rotate: -15 },
  { left: 118, top: 6755, w: 58, h: 22, rotate: 8 },
];
const EARLY_ZONE_RINGS = [
  { left: 150, top: 4140, w: 74, h: 26, rotate: 18 },
  { left: 62, top: 4780, w: 88, h: 30, rotate: -14 },
  { left: 202, top: 5440, w: 80, h: 28, rotate: 12 },
  { left: 46, top: 6200, w: 92, h: 32, rotate: -10 },
];
const EARLY_ZONE_STAR_CLUSTERS = Array.from({ length: 56 }, (_, i) => ({
  left: 12 + ((i * 47) % 316),
  top: 3720 + i * 62,
  size: 1 + (i % 3),
  opacity: 0.22 + (i % 5) * 0.11,
  tint: i % 4 === 0 ? 'cyan' : i % 4 === 1 ? 'violet' : i % 4 === 2 ? 'white' : 'amber',
}));
const EARLY_ZONE_DRONES = [
  { left: 132, top: 4325, rotate: 18 },
  { left: 226, top: 5080, rotate: -14 },
  { left: 82, top: 5905, rotate: 12 },
  { left: 214, top: 6645, rotate: -20 },
];
const BOTTOM_NEBULAE = [
  { left: -30, top: 3190, w: 210, h: 140, color: 'from-cyan-300/20 via-blue-500/14 to-transparent' },
  { left: 150, top: 3270, w: 230, h: 150, color: 'from-fuchsia-300/18 via-violet-500/14 to-transparent' },
  { left: 30, top: 3400, w: 280, h: 170, color: 'from-amber-300/14 via-orange-500/10 to-transparent' },
];

const BOTTOM_PLANETS: Decoration[] = [
  { left: 20, top: 3336, size: 78, color: 'from-cyan-300/34 to-blue-500/22' },
  { left: 228, top: 3428, size: 64, color: 'from-fuchsia-300/30 to-violet-500/20' },
  { left: 136, top: 3498, size: 46, color: 'from-amber-300/28 to-orange-500/18' },
];

const BOTTOM_COMETS = [
  { left: 30, top: 3310, rotate: 12 },
  { left: 210, top: 3378, rotate: -16 },
  { left: 88, top: 3468, rotate: 20 },
  { left: 246, top: 3524, rotate: -12 },
];

const BOTTOM_STARS = Array.from({ length: 28 }, (_, i) => ({
  left: 8 + ((i * 41) % 324),
  top: 3240 + i * 14,
  size: 1 + (i % 3),
  opacity: 0.24 + (i % 6) * 0.1,
}));

export function SpaceRoadmap({
  unlockedLevel,
  language,
  onLanguageChange,
  onStartLevel,
  onExitGame,
  onOpenLegal,
  onOpenGuide,
  levelStars,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
}: SpaceRoadmapProps) {
  const [selectedLevel, setSelectedLevel] = useState(Math.max(1, unlockedLevel));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showJumpToCurrent, setShowJumpToCurrent] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const didInitialPositionRef = useRef(false);
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
    setSelectedLevel(Math.max(1, unlockedLevel));
  }, [unlockedLevel]);

  const mapHeight = points[0].y + 64;

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

  const getMaxScrollTop = useCallback((scroller: HTMLDivElement) => {
    const levelOne = points[0];
    const maxByContent = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const maxByLevelOne = Math.max(0, levelOne.y - scroller.clientHeight * 0.62);
    return Math.min(maxByContent, maxByLevelOne);
  }, [points]);

  const clampScrollBottom = useCallback((scroller: HTMLDivElement) => {
    const maxTop = getMaxScrollTop(scroller);
    if (scroller.scrollTop > maxTop) {
      scroller.scrollTop = maxTop;
    }
  }, [getMaxScrollTop]);

  const scrollToLevel = (level: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const point = points.find((p) => p.level === level);
    if (!point) return;
    const maxTop = getMaxScrollTop(scroller);
    const target = Math.min(maxTop, Math.max(0, point.y - scroller.clientHeight * 0.62));
    scroller.scrollTo({ top: target, behavior });
  };

  useEffect(() => {
    scrollToLevel(selectedLevel, didInitialPositionRef.current ? 'smooth' : 'auto');
    didInitialPositionRef.current = true;
  }, [selectedLevel]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !currentPoint) return;

    const updateVisibility = () => {
      clampScrollBottom(scroller);
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
  }, [clampScrollBottom, currentPoint]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let lastTouchY: number | null = null;

    const getBlocked = (delta: number) => {
      const maxTop = getMaxScrollTop(scroller);
      return delta > 0 && scroller.scrollTop >= maxTop - 0.5;
    };

    const onWheel = (event: WheelEvent) => {
      if (!getBlocked(event.deltaY)) return;
      event.preventDefault();
      scroller.scrollTop = getMaxScrollTop(scroller);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      lastTouchY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0 || lastTouchY == null) return;
      const currentY = event.touches[0].clientY;
      const delta = lastTouchY - currentY;

      if (getBlocked(delta)) {
        event.preventDefault();
        scroller.scrollTop = getMaxScrollTop(scroller);
        return;
      }

      lastTouchY = currentY;
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
    };
  }, [getMaxScrollTop]);

  const levelLabel = language === 'ru' ? 'Карта уровней' : 'Level Map';
  const currentLabel = language === 'ru' ? 'Текущий прогресс' : 'Current Progress';
  const settingsLabel = language === 'ru' ? 'Настройки карты' : 'Map Settings';
  const comingSoonLabel = language === 'ru' ? 'Скоро' : 'Coming Soon';
  const endPoint = points[points.length - 1];
  const secondSectorStart = points.find((p) => p.level === 31);
  const secondSectorLabel = language === 'ru' ? 'Локация 2: Квантовый Пояс' : 'Location 2: Quantum Belt';
  const openLegalFromSettings = (section: LegalSection) => {
    setIsSettingsOpen(false);
    onOpenLegal(section);
  };

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
            <div className="rounded-xl bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100">{levelLabel}</div>
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

        <div ref={scrollerRef} className="relative flex-1 overflow-y-auto overscroll-y-none rounded-3xl border border-white/15 bg-black/30 shadow-[0_0_80px_rgba(56,189,248,0.16)] backdrop-blur-md">
          <div className="relative mx-auto w-[340px]" style={{ height: mapHeight }}>
            {secondSectorStart && (
              <>
                <div
                  className="pointer-events-none absolute left-2 right-2 rounded-3xl via-teal-400/6 to-transparent"
                  style={{ top: Math.max(90, secondSectorStart.y - 120), bottom: 60 }}
                />
                <div
                  className="pointer-events-none absolute left-1/2 z-[6] -translate-x-1/2 rounded-full border border-emerald-200/30 bg-slate-950/70 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.22)]"
                  style={{ top: secondSectorStart.y - 88 }}
                >
                  {secondSectorLabel}
                </div>
              </>
            )}
            {PLANETS.map((item, idx) => (
              <div key={idx} className="pointer-events-none absolute" style={{ left: item.left, top: item.top, width: item.size, height: item.size }}>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.color} border border-white/20 shadow-[inset_-10px_-8px_20px_rgba(15,23,42,0.35)]`} />
                <div className="absolute inset-[18%] rounded-full border border-white/20" />
                <div className="absolute top-[20%] left-[24%] h-[14%] w-[14%] rounded-full bg-white/25" />
                <div className="absolute top-[45%] right-[18%] h-[10%] w-[10%] rounded-full bg-black/20" />
                {idx % 2 === 0 && (
                  <div className="absolute left-[-12%] top-1/2 h-[24%] w-[124%] -translate-y-1/2 rounded-full border border-white/25 bg-white/5" />
                )}
              </div>
            ))}

            {ORBIT_STATIONS.map((station, idx) => (
              <div key={`station-${idx}`} className="pointer-events-none absolute" style={{ left: station.left, top: station.top, transform: `scale(${station.scale})` }}>
                <div className="relative h-10 w-10 rounded-full border border-cyan-200/50 bg-slate-900/55 shadow-[0_0_14px_rgba(34,211,238,0.35)]">
                  <div className="absolute inset-[22%] rounded-full border border-cyan-100/60" />
                  <div className="absolute left-1/2 top-1/2 h-[2px] w-14 -translate-x-1/2 -translate-y-1/2 bg-cyan-200/70" />
                  <div className="absolute left-1/2 top-1/2 h-14 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-cyan-200/40" />
                </div>
              </div>
            ))}

            {FIRST_SECTOR_RELICS.map((relic, idx) => (
              <div
                key={`relic-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: relic.left, top: relic.top, width: relic.w, height: relic.h, transform: `rotate(${relic.rotate}deg)` }}
              >
                <div className="absolute inset-0 rounded-lg border border-cyan-100/20 bg-slate-900/45 shadow-[0_0_12px_rgba(34,211,238,0.12)]" />
                <div className="absolute inset-y-[35%] left-[10%] right-[10%] rounded-full bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
                <div className="absolute left-[18%] top-[18%] h-[22%] w-[18%] rounded-full bg-cyan-100/25" />
                <div className="absolute right-[16%] bottom-[18%] h-[20%] w-[16%] rounded-full bg-fuchsia-200/20" />
              </div>
            ))}

            {FIRST_SECTOR_CRYSTAL_FIELDS.map((item, idx) => (
              <div
                key={`crystal-field-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: item.left, top: item.top, transform: `rotate(${item.rotate}deg)` }}
              >
                <div
                  className={`relative rounded-[3px] border ${item.hue === 'cyan' ? 'border-cyan-100/25 bg-cyan-300/15' : 'border-fuchsia-100/25 bg-fuchsia-300/12'}`}
                  style={{ width: item.size, height: item.size * 1.5 }}
                >
                  <div className={`absolute left-1/2 top-[-18%] h-[35%] w-[40%] -translate-x-1/2 rotate-45 ${item.hue === 'cyan' ? 'bg-cyan-200/35' : 'bg-fuchsia-200/30'}`} />
                </div>
              </div>
            ))}

            {EARLY_ZONE_NEBULAE.map((nebula, idx) => (
              <div
                key={`early-nebula-${idx}`}
                className={`pointer-events-none absolute rounded-full blur-2xl bg-gradient-to-br ${nebula.color}`}
                style={{ left: nebula.left, top: nebula.top, width: nebula.w, height: nebula.h }}
              />
            ))}

            {EARLY_ZONE_GAS_ARCS.map((arc, idx) => (
              <div
                key={`early-gas-arc-${idx}`}
                className={`pointer-events-none absolute rounded-full bg-gradient-to-r ${arc.color} blur-[1px]`}
                style={{ left: arc.left, top: arc.top, width: arc.w, height: arc.h, transform: `rotate(${arc.rotate}deg)` }}
              >
                <div className="absolute inset-[8%] rounded-full" />
              </div>
            ))}

            {EARLY_ZONE_RINGS.map((ring, idx) => (
              <div
                key={`early-ring-${idx}`}
                className="pointer-events-none absolute rounded-full border border-white/14 bg-white/[0.02]"
                style={{ left: ring.left, top: ring.top, width: ring.w, height: ring.h, transform: `rotate(${ring.rotate}deg)` }}
              >
                <div className="absolute inset-[12%] rounded-full border border-cyan-200/18" />
              </div>
            ))}

            {EARLY_ZONE_PORTALS.map((portal, idx) => (
              <div
                key={`early-portal-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: portal.left, top: portal.top, width: portal.size, height: portal.size }}
              >
                <div
                  className={`absolute inset-0 rounded-full ${
                    portal.hue === 'cyan' ? 'bg-cyan-300/10' : portal.hue === 'violet' ? 'bg-violet-300/10' : 'bg-emerald-300/10'
                  } blur-xl`}
                />
                <div className="absolute inset-0 rounded-full border border-white/14 bg-black/20" />
                <div
                  className={`absolute inset-[12%] rounded-full border-2 ${
                    portal.hue === 'cyan'
                      ? 'border-cyan-200/45 shadow-[0_0_18px_rgba(34,211,238,0.22)]'
                      : portal.hue === 'violet'
                        ? 'border-violet-200/40 shadow-[0_0_18px_rgba(168,85,247,0.22)]'
                        : 'border-emerald-200/40 shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                  }`}
                />
                <div className="absolute inset-[26%] rounded-full border border-white/12" />
                <div className="absolute left-1/2 top-1/2 h-[2px] w-[72%] -translate-x-1/2 -translate-y-1/2 bg-white/12" />
                <div className="absolute left-1/2 top-1/2 h-[72%] w-[2px] -translate-x-1/2 -translate-y-1/2 bg-white/10" />
              </div>
            ))}

            {EARLY_ZONE_BEACONS.map((beacon, idx) => (
              <div
                key={`early-beacon-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: beacon.left, top: beacon.top, transform: `scale(${beacon.scale})` }}
              >
                <div className="relative h-12 w-12">
                  <div className="absolute left-1/2 top-[7px] h-8 w-[3px] -translate-x-1/2 rounded-full bg-slate-300/60" />
                  <div className="absolute left-1/2 top-[2px] h-4 w-4 -translate-x-1/2 rounded-full border border-cyan-100/35 bg-slate-900/70 shadow-[0_0_14px_rgba(34,211,238,0.28)]" />
                  <div className="absolute left-1/2 top-[4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-200/80" />
                  <div className="absolute left-1/2 top-[1px] h-8 w-8 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-md" />
                  <div className="absolute bottom-[4px] left-1/2 h-[2px] w-8 -translate-x-1/2 bg-white/20" />
                </div>
              </div>
            ))}

            {EARLY_ZONE_DRONES.map((drone, idx) => (
              <div
                key={`early-drone-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: drone.left, top: drone.top, transform: `rotate(${drone.rotate}deg)` }}
              >
                <div className="relative h-8 w-8 rounded-full border border-cyan-100/18 bg-slate-900/30">
                  <div className="absolute inset-[22%] rounded-full border border-white/12" />
                  <div className="absolute left-1/2 top-1/2 h-[2px] w-10 -translate-x-1/2 -translate-y-1/2 bg-cyan-200/16" />
                  <div className="absolute left-1/2 top-1/2 h-10 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-violet-200/12" />
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/25" />
                </div>
              </div>
            ))}

            {EARLY_ZONE_WRECKS.map((wreck, idx) => (
              <div
                key={`early-wreck-${idx}`}
                className="pointer-events-none absolute"
                style={{ left: wreck.left, top: wreck.top, width: wreck.w, height: wreck.h, transform: `rotate(${wreck.rotate}deg)` }}
              >
                <div className="absolute inset-0 rounded-lg border border-slate-200/12 bg-slate-700/20" />
                <div className="absolute left-[8%] right-[22%] top-[34%] h-[2px] rounded-full bg-cyan-200/28" />
                <div className="absolute right-[10%] top-[22%] h-[56%] w-[2px] rounded-full bg-white/12" />
                <div className="absolute left-[14%] top-[18%] h-[24%] w-[18%] rounded-full bg-white/12" />
              </div>
            ))}

            {EARLY_ZONE_STAR_CLUSTERS.map((star, idx) => (
              <div
                key={`early-star-cluster-${idx}`}
                className={`pointer-events-none absolute rounded-full ${
                  star.tint === 'cyan'
                    ? 'bg-cyan-100'
                    : star.tint === 'violet'
                      ? 'bg-violet-100'
                      : star.tint === 'amber'
                        ? 'bg-amber-100'
                        : 'bg-white'
                }`}
                style={{ left: star.left, top: star.top, width: star.size, height: star.size, opacity: star.opacity }}
              />
            ))}

            {STARS.map((star, idx) => (
              <div
                key={`star-${idx}`}
                className="pointer-events-none absolute rounded-full bg-white"
                style={{ left: star.left, top: star.top, width: star.size, height: star.size, opacity: star.opacity }}
              />
            ))}

            {ASTEROID_FIELDS.map((asteroid, idx) => (
              <div
                key={`asteroid-${idx}`}
                className="pointer-events-none absolute rounded-full border border-slate-200/20 bg-slate-400/35"
                style={{
                  left: asteroid.left,
                  top: asteroid.top,
                  width: asteroid.size,
                  height: asteroid.size,
                  transform: `rotate(${asteroid.rotate}deg)`,
                }}
              />
            ))}

                        {COMETS.map((comet, idx) => (
              <div
                key={`comet-${idx}`}
                className="pointer-events-none absolute h-[2px] w-16 rounded-full bg-gradient-to-r from-white/0 via-cyan-200/70 to-white/0"
                style={{ left: comet.left, top: comet.top, transform: `rotate(${comet.rotate}deg)` }}
              />
            ))}

            {BOTTOM_NEBULAE.map((nebula, idx) => (
              <div
                key={`bottom-nebula-${idx}`}
                className={`pointer-events-none absolute rounded-full blur-2xl bg-gradient-to-br ${nebula.color}`}
                style={{ left: nebula.left, top: nebula.top, width: nebula.w, height: nebula.h }}
              />
            ))}

                        {BOTTOM_PLANETS.map((item, idx) => (
              <div key={`bottom-planet-${idx}`} className="pointer-events-none absolute" style={{ left: item.left, top: item.top, width: item.size, height: item.size }}>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.color} border border-white/18 shadow-[inset_-8px_-6px_14px_rgba(15,23,42,0.35)]`} />
                <div className="absolute inset-[20%] rounded-full border border-white/20" />
                {idx === 1 && <div className="absolute left-[-16%] top-1/2 h-[22%] w-[132%] -translate-y-1/2 rounded-full border border-white/25 bg-white/5" />}
              </div>
            ))}

            {BOTTOM_COMETS.map((comet, idx) => (
              <div
                key={`bottom-comet-${idx}`}
                className="pointer-events-none absolute h-[2px] w-20 rounded-full bg-gradient-to-r from-white/0 via-cyan-200/75 to-white/0"
                style={{ left: comet.left, top: comet.top, transform: `rotate(${comet.rotate}deg)` }}
              />
            ))}

            {BOTTOM_STARS.map((star, idx) => (
              <div
                key={`bottom-star-${idx}`}
                className="pointer-events-none absolute rounded-full bg-white"
                style={{ left: star.left, top: star.top, width: star.size, height: star.size, opacity: star.opacity }}
              />
            ))}            <svg className="pointer-events-none absolute inset-0" width={MAP_WIDTH} height={mapHeight} viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`} fill="none" aria-hidden="true">
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

            <div
              className="pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2 rounded-full border border-cyan-200/45 bg-slate-950/65 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.3)]"
              style={{ top: Math.max(24, endPoint.y - 78) }}
            >
              {comingSoonLabel}
            </div>

            {points.map((point) => {
              const isCompleted = point.level < unlockedLevel;
              const isCurrent = point.level === unlockedLevel;
              const isLocked = point.level > unlockedLevel;
              const isSelected = point.level === selectedLevel;
              const isSecondSector = point.level > 30;
              const stars = Math.max(0, Math.min(3, levelStars[point.level] ?? 0));

              return (
                <div key={point.level} className="absolute" style={{ left: point.x - NODE_SIZE / 2, top: point.y - NODE_SIZE / 2, width: NODE_SIZE }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel(point.level);
                      if (!isLocked) onStartLevel(point.level);
                    }}
                    className={`flex items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                      isLocked
                        ? 'border-slate-500/50 bg-slate-700/60 text-slate-300'
                        : isCurrent
                          ? (isSecondSector
                              ? 'border-emerald-100 bg-gradient-to-br from-emerald-300 to-teal-500 text-slate-900 shadow-[0_0_28px_rgba(16,185,129,0.45)]'
                              : 'border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-slate-900 shadow-[0_0_28px_rgba(251,191,36,0.65)]')
                          : (isSecondSector
                              ? 'border-emerald-100/80 bg-gradient-to-br from-emerald-300 to-cyan-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                              : 'border-cyan-100/90 bg-gradient-to-br from-sky-300 to-blue-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.45)]')
                    } ${isSelected ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent' : 'scale-100'} ${isLocked ? '' : 'hover:scale-110 active:scale-95'}`}
                    style={{ width: NODE_SIZE, height: NODE_SIZE }}
                    aria-label={t.level(point.level)}
                  >
                    {isLocked ? <Lock className="h-4 w-4" /> : point.level}
                  </button>

                  {isCompleted && (
                    <div className="mt-1 flex items-center justify-center gap-0.5 rounded-full border border-white/20 bg-black/45 px-1.5 py-0.5 text-[9px] font-black text-yellow-300">
                      {[1, 2, 3].map((i) => (
                        <Star key={i} className={`h-2.5 w-2.5 ${i <= stars ? 'fill-yellow-300 text-yellow-300' : 'text-slate-500'}`} strokeWidth={2.2} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showJumpToCurrent && (
        <button
          type="button"
          onClick={() => scrollToLevel(unlockedLevel)}
          className="absolute bottom-6 left-1/2 z-30 inline-flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-white/85 bg-cyan-400/90 p-3 text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:scale-105 active:scale-95 transition-all"
          aria-label={language === 'ru' ? 'К текущему уровню' : 'Go to current level'}
        >
          <ArrowDown size={18} strokeWidth={3.4} />
        </button>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xs rounded-3xl border border-white/25 bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-3 top-3 h-10 w-10 rounded-full border-4 border-white bg-red-500/90 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center"
              aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X size={18} strokeWidth={4} />
            </button>

            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200/80"><Sparkles size={13} />{settingsLabel}</div>
            <h3 className="mt-2 text-xl font-black text-white">{levelLabel}</h3>

            <div className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 p-3 shadow-inner">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold tracking-wide text-white/80">{language === 'ru' ? 'Язык' : 'Language'}</span>
                <div className="inline-flex rounded-full border border-white/20 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('ru')}
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide transition-all ${language === 'ru' ? 'bg-cyan-300 text-slate-900 shadow' : 'text-white/80 hover:bg-white/10'}`}
                    aria-pressed={language === 'ru'}
                  >
                    RU
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide transition-all ${language === 'en' ? 'bg-cyan-300 text-slate-900 shadow' : 'text-white/80 hover:bg-white/10'}`}
                    aria-pressed={language === 'en'}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 p-3 shadow-inner">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide text-white/80">{t.sound}</span>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                  aria-label={isMuted ? t.unmute : t.mute}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                className="w-full accent-cyan-300"
                aria-label={t.sound}
              />
            </div>

            <button
              type="button"
              onClick={onExitGame}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-95 transition-all"
            >
              <LogOut size={18} />
              {t.exitGame}
            </button>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onOpenGuide();
                }}
                className="rounded-xl py-2 border bg-cyan-300/15 border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/25 transition-all active:scale-95 text-xs font-semibold"
              >
                {language === 'ru' ? 'Руководство' : 'Guide'}
              </button>
              <button
                type="button"
                onClick={() => openLegalFromSettings('contacts')}
                className="rounded-xl py-2 border bg-white/10 border-white/20 text-white/85 hover:bg-white/20 transition-all active:scale-95 text-xs font-semibold"
              >
                {t.contacts}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





