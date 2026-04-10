import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Lock, LogOut, Share2, Sparkles, Star, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import type { Language } from '../i18n';
import type { LegalSection } from '../types/legal';
import { COPY } from '../i18n';
import { CompassGlyph, JumpGlyph, NebulaCoreIcon } from './CosmicArtwork';

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
  dailyCanClaim: boolean;
  dailyStreak: number;
  dailyNextReward: number;
  bestScore: number;
  weeklyChallengeScore: number;
  weeklyChallengeCompleted: boolean;
  weeklyTasksCompleted: number;
  eventActive: boolean;
  eventTitle: string;
  eventMissionProgress: string;
  onOpenDailyRewards: () => void;
  onOpenLeaderboard: () => void;
  onOpenWeeklyLoop: () => void;
  onOpenEvent: () => void;
  onShareGame: () => void;
  onShowSystemNotice: (message: string) => void;
};

type Point = {
  level: number;
  x: number;
  y: number;
};

type SectorConfig = {
  id: number;
  startLevel: number;
  endLevel: number;
  label: string;
  glowClassName: string;
  labelClassName: string;
  nodeClassName: string;
  currentNodeClassName: string;
  detailAccentClassName: string;
  details: Array<{
    x: number;
    yOffset: number;
    size: number;
    shape: 'planet' | 'asteroid' | 'rift' | 'crystal' | 'beacon' | 'comet';
  }>;
};

const TOTAL_LEVELS = 120;
const MAP_WIDTH = 340;
const NODE_SIZE = 42;
const TOP_PADDING = 110;
const STEP_Y = 118;

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
  dailyCanClaim,
  dailyStreak,
  dailyNextReward,
  bestScore,
  weeklyChallengeScore,
  weeklyChallengeCompleted,
  weeklyTasksCompleted,
  eventActive,
  eventTitle,
  eventMissionProgress,
  onOpenDailyRewards,
  onOpenLeaderboard,
  onOpenWeeklyLoop,
  onOpenEvent,
  onShareGame,
  onShowSystemNotice,
}: SpaceRoadmapProps) {
  const tx = (ru: string, en: string, zh: string) => {
    if (language === 'ru') return ru;
    if (language === 'zh') return zh;
    return en;
  };
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

  const levelLabel = tx('Карта уровней', 'Level Map', '关卡地图');
  const currentLabel = tx('Текущий прогресс', 'Current Progress', '当前进度');
  const settingsLabel = tx('Настройки карты', 'Map Settings', '地图设置');
  const comingSoonLabel = tx('Скоро', 'Coming Soon', '即将推出');
  const endPoint = points[points.length - 1];
  const sectors = useMemo<SectorConfig[]>(() => {
    return [
      {
        id: 1,
        startLevel: 1,
        endLevel: 30,
        label: tx('Локация 1: Орбитальный Порт', 'Location 1: Orbital Port', '区域 1：轨道港'),
        glowClassName:
          'bg-[radial-gradient(circle_at_50%_12%,rgba(103,232,249,0.18),transparent_36%),radial-gradient(circle_at_16%_72%,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_84%_68%,rgba(34,211,238,0.1),transparent_30%)]',
        labelClassName: 'border-cyan-200/35 bg-slate-950/72 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]',
        nodeClassName: 'border-cyan-100/90 bg-gradient-to-br from-sky-300 to-blue-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.45)]',
        currentNodeClassName: 'border-cyan-50 bg-gradient-to-br from-cyan-200 to-sky-500 text-slate-900 shadow-[0_0_28px_rgba(34,211,238,0.5)]',
        detailAccentClassName: 'border-cyan-200/30 bg-cyan-300/10 text-cyan-100/90',
        details: [
          { x: 272, yOffset: 22, size: 54, shape: 'planet' },
          { x: 72, yOffset: 540, size: 30, shape: 'beacon' },
        ],
      },
      {
        id: 2,
        startLevel: 31,
        endLevel: 60,
        label: tx('Локация 2: Квантовый Пояс', 'Location 2: Quantum Belt', '区域 2：量子带'),
        glowClassName:
          'bg-[radial-gradient(circle_at_56%_16%,rgba(52,211,153,0.16),transparent_36%),radial-gradient(circle_at_18%_58%,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_82%_76%,rgba(45,212,191,0.09),transparent_30%)]',
        labelClassName: 'border-emerald-200/35 bg-slate-950/72 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.18)]',
        nodeClassName: 'border-emerald-100/80 bg-gradient-to-br from-emerald-300 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]',
        currentNodeClassName: 'border-emerald-50 bg-gradient-to-br from-emerald-200 to-teal-500 text-slate-900 shadow-[0_0_28px_rgba(16,185,129,0.45)]',
        detailAccentClassName: 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100/90',
        details: [
          { x: 264, yOffset: 72, size: 34, shape: 'crystal' },
          { x: 62, yOffset: 622, size: 46, shape: 'rift' },
        ],
      },
      {
        id: 3,
        startLevel: 61,
        endLevel: 90,
        label: tx('Локация 3: Астральный Разлом', 'Location 3: Astral Rift', '区域 3：星界裂隙'),
        glowClassName:
          'bg-[radial-gradient(circle_at_48%_18%,rgba(192,132,252,0.16),transparent_38%),radial-gradient(circle_at_22%_72%,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_84%_62%,rgba(217,70,239,0.1),transparent_30%)]',
        labelClassName: 'border-fuchsia-200/35 bg-slate-950/72 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.18)]',
        nodeClassName: 'border-fuchsia-100/85 bg-gradient-to-br from-fuchsia-300 to-violet-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.34)]',
        currentNodeClassName: 'border-fuchsia-50 bg-gradient-to-br from-fuchsia-200 to-violet-500 text-slate-900 shadow-[0_0_28px_rgba(217,70,239,0.46)]',
        detailAccentClassName: 'border-fuchsia-200/30 bg-fuchsia-300/10 text-fuchsia-100/90',
        details: [
          { x: 78, yOffset: 86, size: 36, shape: 'asteroid' },
          { x: 268, yOffset: 608, size: 44, shape: 'rift' },
        ],
      },
      {
        id: 4,
        startLevel: 91,
        endLevel: 120,
        label: tx('Локация 4: Солнечная Корона', 'Location 4: Solar Crown', '区域 4：日冕核心'),
        glowClassName:
          'bg-[radial-gradient(circle_at_54%_18%,rgba(251,191,36,0.18),transparent_38%),radial-gradient(circle_at_20%_70%,rgba(249,115,22,0.08),transparent_28%),radial-gradient(circle_at_84%_62%,rgba(251,191,36,0.09),transparent_30%)]',
        labelClassName: 'border-amber-200/40 bg-slate-950/72 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.22)]',
        nodeClassName: 'border-amber-100/85 bg-gradient-to-br from-amber-300 to-orange-600 text-white shadow-[0_0_20px_rgba(251,146,60,0.36)]',
        currentNodeClassName: 'border-yellow-100 bg-gradient-to-br from-amber-200 to-orange-500 text-slate-900 shadow-[0_0_28px_rgba(251,191,36,0.55)]',
        detailAccentClassName: 'border-amber-200/30 bg-amber-300/10 text-amber-100/90',
        details: [
          { x: 258, yOffset: 62, size: 52, shape: 'planet' },
          { x: 84, yOffset: 628, size: 32, shape: 'comet' },
        ],
      },
    ];
  }, [language]);
  const sectorAnchors = useMemo(
    () =>
      sectors
        .map((sector) => {
          const startPoint = points.find((point) => point.level === sector.startLevel);
          const endPointForSector = points.find((point) => point.level === sector.endLevel);
          if (!startPoint || !endPointForSector) return null;
          return { sector, startPoint, endPoint: endPointForSector };
        })
        .filter((value): value is { sector: SectorConfig; startPoint: Point; endPoint: Point } => Boolean(value)),
    [points, sectors],
  );
  const openLegalFromSettings = (section: LegalSection) => {
    setIsSettingsOpen(false);
    onOpenLegal(section);
  };

  const renderRoadmapDetail = (detail: SectorConfig['details'][number], accentClassName: string) => {
    if (detail.shape === 'planet') {
      return (
        <div className="absolute inset-0">
          <div className={`absolute inset-0 rounded-full border ${accentClassName} bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.26),rgba(255,255,255,0.06)_24%,transparent_26%),radial-gradient(circle_at_50%_55%,rgba(125,211,252,0.34),rgba(14,165,233,0.12)_58%,rgba(2,6,23,0.28)_100%)] shadow-[0_0_24px_rgba(56,189,248,0.14)]`} />
          <div className="absolute left-1/2 top-1/2 h-[28%] w-[132%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/16 bg-white/6" />
          <div className="absolute left-[24%] top-[22%] h-[16%] w-[16%] rounded-full bg-white/18" />
        </div>
      );
    }

    if (detail.shape === 'asteroid') {
      return (
        <div className={`absolute inset-[8%] rounded-[38%] border ${accentClassName} bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.2),rgba(255,255,255,0.04)_28%,transparent_30%),linear-gradient(145deg,rgba(192,132,252,0.22),rgba(30,41,59,0.75))] rotate-12 shadow-[0_0_18px_rgba(192,132,252,0.1)]`}>
          <div className="absolute left-[26%] top-[24%] h-[16%] w-[16%] rounded-full bg-black/20" />
          <div className="absolute right-[22%] top-[48%] h-[12%] w-[12%] rounded-full bg-black/15" />
          <div className="absolute left-[46%] bottom-[18%] h-[10%] w-[10%] rounded-full bg-white/10" />
        </div>
      );
    }

    if (detail.shape === 'crystal') {
      return (
        <div className="absolute inset-[12%] rotate-45">
          <div className={`absolute inset-0 rounded-[28%] border ${accentClassName} bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08)_32%,rgba(15,23,42,0.84)_100%)] shadow-[0_0_20px_rgba(255,255,255,0.08)]`} />
          <div className="absolute left-[18%] top-[12%] h-[46%] w-[18%] rounded-full bg-white/20" />
        </div>
      );
    }

    if (detail.shape === 'rift') {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`relative h-[42%] w-[92%] rotate-12 rounded-full border ${accentClassName} bg-[linear-gradient(90deg,rgba(15,23,42,0.15),rgba(15,23,42,0.85)_20%,rgba(255,255,255,0.12)_50%,rgba(15,23,42,0.85)_80%,rgba(15,23,42,0.15))] shadow-[0_0_22px_rgba(168,85,247,0.12)]`}>
            <div className="absolute inset-y-[20%] left-1/2 w-[10%] -translate-x-1/2 rounded-full bg-white/24 blur-[1px]" />
          </div>
        </div>
      );
    }

    if (detail.shape === 'beacon') {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`relative h-[72%] w-[44%] rounded-[999px] border ${accentClassName} bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(15,23,42,0.72))]`}>
            <div className="absolute left-1/2 top-[18%] h-[18%] w-[18%] -translate-x-1/2 rounded-full bg-white/40" />
            <div className="absolute left-1/2 top-[38%] h-[34%] w-[10%] -translate-x-1/2 rounded-full bg-white/16" />
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0">
        <div className="absolute left-[18%] top-[42%] h-[22%] w-[52%] -translate-y-1/2 rounded-full bg-white/16 blur-[1px]" />
        <div className={`absolute right-[18%] top-[34%] h-[24%] w-[24%] rounded-full border ${accentClassName} bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.32),rgba(255,255,255,0.1)_40%,rgba(15,23,42,0.4)_100%)]`} />
      </div>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050a17] text-white">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/20 bg-[linear-gradient(145deg,rgba(2,6,23,0.52),rgba(15,23,42,0.36))] px-4 py-3 backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-cyan-200/80">
              <NebulaCoreIcon className="h-3.5 w-3.5 text-cyan-100" />
              {currentLabel}
            </div>
            <div className="text-lg font-black">{t.level(unlockedLevel)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100">
              <CompassGlyph className="h-3.5 w-3.5 text-cyan-100" />
              {levelLabel}
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white/70 shadow-lg text-white active:scale-95 transition-transform flex items-center justify-center"
              aria-label={settingsLabel}
              title={settingsLabel}
            >
              <CompassGlyph className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
        <div className="relative flex-1 min-h-0 isolate">
          <div className="absolute left-2 top-2 z-[70] flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onOpenDailyRewards}
              className={`inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border transition-all ${
                dailyCanClaim
                  ? 'border-emerald-200/55 bg-emerald-300/25 text-emerald-50 shadow-[0_0_16px_rgba(74,222,128,0.28)]'
                  : 'border-white/20 bg-slate-900/70 text-white/80'
              }`}
              title={tx(`Ежедневная награда: день ${dailyStreak}, +${dailyNextReward}`, `Daily reward: day ${dailyStreak}, +${dailyNextReward}`, `每日奖励：第 ${dailyStreak} 天，+${dailyNextReward}`)}
              aria-label={tx(`Ежедневная награда: день ${dailyStreak}, +${dailyNextReward}`, `Daily reward: day ${dailyStreak}, +${dailyNextReward}`, `每日奖励：第 ${dailyStreak} 天，+${dailyNextReward}`)}
            >
              <Gift className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={onOpenWeeklyLoop}
              className="inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border border-violet-200/45 bg-violet-300/20 text-violet-50 shadow-[0_0_14px_rgba(167,139,250,0.24)] transition-all hover:bg-violet-300/28"
              title={tx(`Недельный цикл: ${weeklyTasksCompleted}/3`, `Weekly loop: ${weeklyTasksCompleted}/3`, `每周循环：${weeklyTasksCompleted}/3`)}
              aria-label={tx(`Недельный цикл: ${weeklyTasksCompleted}/3`, `Weekly loop: ${weeklyTasksCompleted}/3`, `每周循环：${weeklyTasksCompleted}/3`)}
            >
              <Star className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (eventActive) {
                  onOpenEvent();
                  return;
                }
                onShowSystemNotice(tx('Ивент скоро откроется', 'Event opens soon', '活动即将开启'));
              }}
              className={`inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border transition-all ${
                eventActive
                  ? 'border-fuchsia-200/45 bg-fuchsia-300/22 text-fuchsia-50 shadow-[0_0_14px_rgba(217,70,239,0.24)] hover:bg-fuchsia-300/30'
                  : 'cursor-not-allowed border-white/12 bg-slate-900/50 text-white/45 opacity-70'
              }`}
              title={eventActive ? `${eventTitle}: ${eventMissionProgress}` : tx('Ивент скоро', 'Event soon', '活动即将开启')}
              aria-label={eventActive ? `${eventTitle}: ${eventMissionProgress}` : tx('Ивент скоро', 'Event soon', '活动即将开启')}
              aria-disabled={!eventActive}
            >
              <Sparkles className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className={`inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border transition-all ${
                weeklyChallengeCompleted
                  ? 'border-amber-200/45 bg-amber-300/22 text-amber-50 shadow-[0_0_14px_rgba(251,191,36,0.24)]'
                  : 'border-cyan-200/45 bg-cyan-300/22 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.24)] hover:bg-cyan-300/30'
              }`}
              title={tx(`Рейтинг: цель ${weeklyChallengeScore}, лучший счёт ${bestScore}`, `Ranking: target ${weeklyChallengeScore}, best score ${bestScore}`, `排行榜：目标 ${weeklyChallengeScore}，最佳分数 ${bestScore}`)}
              aria-label={tx(`Рейтинг: цель ${weeklyChallengeScore}, лучший счёт ${bestScore}`, `Ranking: target ${weeklyChallengeScore}, best score ${bestScore}`, `排行榜：目标 ${weeklyChallengeScore}，最佳分数 ${bestScore}`)}
            >
              <Trophy className="h-6 w-6" />
            </button>
          </div>
          <div
            ref={scrollerRef}
            className="relative z-10 h-full overflow-y-auto overscroll-y-none rounded-3xl border border-cyan-100/22 bg-slate-950/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_80px_rgba(56,189,248,0.24),0_0_0_1px_rgba(148,163,184,0.12)] backdrop-blur-md"
          >
            <img
              src="/roadmap-space-bg.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-95"
            />
            <div className="relative mx-auto w-full max-w-[340px]" style={{ height: mapHeight }}>
            {sectorAnchors.map(({ sector, startPoint, endPoint: sectorEndPoint }) => (
              <div key={sector.id} className="pointer-events-none absolute inset-x-0" style={{ top: Math.max(30, sectorEndPoint.y - 72), height: Math.max(180, startPoint.y - sectorEndPoint.y + 120) }}>
                <div
                  className={`absolute left-1/2 z-[6] -translate-x-1/2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] ${sector.labelClassName}`}
                  style={{ top: 12, maxWidth: 196 }}
                >
                  <span className="block whitespace-normal text-center leading-tight">{sector.label}</span>
                </div>
                {sector.details.map((detail, index) => {
                  return (
                    <div
                      key={`${sector.id}-${index}`}
                      className="absolute"
                      style={{
                        left: detail.x - detail.size / 2,
                        top: detail.yOffset,
                        width: detail.size,
                        height: detail.size,
                      }}
                    >
                      {renderRoadmapDetail(detail, sector.detailAccentClassName)}
                    </div>
                  );
                })}
              </div>
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
              const sector = sectors.find((entry) => point.level >= entry.startLevel && point.level <= entry.endLevel) ?? sectors[0];
              const stars = Math.max(0, Math.min(3, levelStars[point.level] ?? 0));

              return (
                <div key={point.level} className="absolute" style={{ left: point.x - NODE_SIZE / 2, top: point.y - NODE_SIZE / 2, width: NODE_SIZE }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        onShowSystemNotice(
                          tx(
                            `Сначала открой ${t.level(unlockedLevel)}`,
                            `Unlock ${t.level(unlockedLevel)} first`,
                            `请先解锁 ${t.level(unlockedLevel)}`,
                          ),
                        );
                        return;
                      }
                      setSelectedLevel(point.level);
                      onStartLevel(point.level);
                    }}
                    className={`flex items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                      isLocked
                        ? 'border-slate-500/50 bg-slate-700/60 text-slate-300'
                        : isCurrent
                          ? sector.currentNodeClassName
                          : sector.nodeClassName
                    } ${isSelected ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent' : 'scale-100'} ${isLocked ? 'cursor-not-allowed opacity-85' : 'hover:scale-110 active:scale-95'}`}
                    style={{ width: NODE_SIZE, height: NODE_SIZE }}
                    aria-label={t.level(point.level)}
                    aria-disabled={isLocked}
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
      </div>

      {showJumpToCurrent && (
        <button
          type="button"
          onClick={() => scrollToLevel(unlockedLevel)}
          className="absolute bottom-6 left-1/2 z-30 inline-flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-white/85 bg-cyan-400/90 p-3 text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:scale-105 active:scale-95 transition-all"
          aria-label={tx('К текущему уровню', 'Go to current level', '跳到当前关卡')}
        >
          <JumpGlyph className="h-[18px] w-[18px] text-slate-900" />
        </button>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative my-auto max-h-[min(88dvh,42rem)] w-full max-w-xs overflow-y-auto rounded-3xl border border-white/25 bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-3 top-3 h-10 w-10 rounded-full border-4 border-white bg-red-500/90 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center"
              aria-label={tx('Закрыть', 'Close', '关闭')}
            >
              <X size={18} strokeWidth={4} />
            </button>

            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200/80"><NebulaCoreIcon className="h-[13px] w-[13px] text-cyan-100" />{settingsLabel}</div>
            <h3 className="mt-2 text-xl font-black text-white">{levelLabel}</h3>

            <div className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 p-3 shadow-inner">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold tracking-wide text-white/80">{tx('Язык', 'Language', '语言')}</span>
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
                  <button
                    type="button"
                    onClick={() => onLanguageChange('zh')}
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide transition-all ${language === 'zh' ? 'bg-cyan-300 text-slate-900 shadow' : 'text-white/80 hover:bg-white/10'}`}
                    aria-pressed={language === 'zh'}
                  >
                    中文
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
                  onShareGame();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl py-2 border border-fuchsia-200/30 bg-fuchsia-300/12 text-fuchsia-100 hover:bg-fuchsia-300/22 transition-all active:scale-95 text-xs font-semibold"
              >
                <Share2 className="h-3.5 w-3.5" />
                {tx('Поделиться игрой', 'Share game', '分享游戏')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onOpenGuide();
                }}
                className="rounded-xl py-2 border bg-cyan-300/15 border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/25 transition-all active:scale-95 text-xs font-semibold"
              >
                {tx('Руководство', 'Guide', '指南')}
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





