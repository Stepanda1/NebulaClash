import { useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { useGame } from './hooks/useGame';
import { PauseMenu } from './components/PauseMenu';
import { GameOverMenu } from './components/GameOverMenu';
import { LevelUpModal } from './components/LevelUpModal';
import { StarProgress } from './components/StarProgress';
import { AudioPlayer } from './components/AudioPlayer';
import { Coffee, Map, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialHint } from './components/TutorialHint';
import { SpaceRoadmap } from './components/SpaceRoadmap';
import { LevelStartModal } from './components/LevelStartModal';
import type { GemType } from './types';
import type { Language } from './i18n';
import { COPY } from './i18n';
import { initAnalytics, trackEvent } from './analytics';

const GOAL_GEM_STYLE: Record<GemType, string> = {
  red: 'from-rose-300 via-rose-500 to-red-900',
  blue: 'from-sky-300 via-blue-500 to-blue-900',
  green: 'from-emerald-300 via-emerald-500 to-emerald-900',
  yellow: 'from-yellow-200 via-amber-400 to-amber-800',
  purple: 'from-fuchsia-300 via-violet-500 to-violet-900',
  orange: 'from-orange-200 via-orange-500 to-orange-900',
};

function GoalGemIcon({ color }: { color: GemType }) {
  return (
    <span
      className={`inline-block h-5 w-5 rotate-45 rounded-[0.3rem] bg-gradient-to-br ${GOAL_GEM_STYLE[color]} align-middle shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:h-6 sm:w-6`}
      aria-hidden="true"
    />
  );
}

function getDefaultLanguage(): Language {
  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage.getItem('match3_language');
    if (savedLanguage === 'ru' || savedLanguage === 'en') {
      return savedLanguage;
    }
  }

  if (typeof navigator !== 'undefined') {
    return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  return 'en';
}

function App() {
  const { grid, score, moves, timeLeft, levelConfig, level, collected, isProcessing, isPaused, setIsPaused, selectedTile, explodingIds, isLevelTransition, validMoves, match3Moves, bombDoubleActivations, lightningSwaps, spawnSpecial, handleTileClick, handleTileSwipe, matchTick, comboLevel, comboId, bigBlastId, handleRestart, isLevelUp, startAtLevel } = useGame();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [pendingSpawn, setPendingSpawn] = useState<null | 'bomb' | 'lightning'>(null);
  const [comboText, setComboText] = useState<string | null>(null);
  const [comboFlash, setComboFlash] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [comboPos, setComboPos] = useState<{ x: number; y: number }>({ x: 50, y: 18 });
  const [comboStyle, setComboStyle] = useState<{ color: string; size: string }>({ color: 'text-amber-300', size: 'text-lg sm:text-2xl' });
  const [lowPerfMode, setLowPerfMode] = useState(false);
  const [language, setLanguage] = useState<Language>(getDefaultLanguage);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelToLaunch, setLevelToLaunch] = useState<number | null>(null);
  const [isLaunchingLevel, setIsLaunchingLevel] = useState(false);
  const match3Ref = useRef(0);
  const bombRef = useRef(0);
  const lightningRef = useRef(0);
  const analyticsInitRef = useRef(false);
  const prevPausedRef = useRef(false);
  const prevGameOverRef = useRef(false);
  const prevLevelUpRef = useRef(false);
  const prevLevelRef = useRef(level);
  const analyticsMovesRef = useRef(0);
  const analyticsBombCountRef = useRef(0);
  const analyticsLightningCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const parallaxEnabledRef = useRef(false);
  const tutorialActive = showTutorial && level === 1;
  const t = COPY[language];

  // Game Over only when limit reached AND animations are done
  const isGameOver = (
    (levelConfig.mode === 'moves' && moves <= 0) ||
    (levelConfig.mode === 'time' && timeLeft <= 0)
  ) && !isProcessing;

  const onRestart = () => {
    trackEvent('restart_click', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    handleRestart();
    if (level === 1) {
      setShowTutorial(true);
      setTutorialStep(0);
      setPendingSpawn(null);
      match3Ref.current = match3Moves;
      bombRef.current = bombDoubleActivations;
      lightningRef.current = lightningSwaps;
    }
    // setIsPaused(false) is handled in handleRestart hook
  };

  const onExitGame = () => {
    trackEvent('exit_click', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    window.close();

    window.setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.replace('about:blank');
      }
    }, 120);
  };
  const onSkipTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    setPendingSpawn(null);
  };

  const onLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem('match3_language', nextLanguage);
    trackEvent('language_change', { language: nextLanguage });
  };

  const onToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      trackEvent('sound_toggle', { muted: next, level });
      return next;
    });
  };

  const onNextLevel = () => {
    const nextUnlockedLevel = level + 1;
    trackEvent('next_level_click', { level, score, mode: levelConfig.mode, next_level: nextUnlockedLevel });
    setUnlockedLevel((prev) => Math.max(prev, nextUnlockedLevel));
    setIsPaused(false);
    setLevelToLaunch(null);
    setIsMapOpen(true);
  };

  const onOpenMap = () => {
    setIsPaused(false);
    setIsMapOpen(true);
    trackEvent('map_open', { level, unlocked_level: unlockedLevel });
  };

  const onStartFromMap = (targetLevel: number) => {
    if (targetLevel > unlockedLevel) return;
    setLevelToLaunch(targetLevel);
    trackEvent('map_level_selected', { level: targetLevel });
  };

  const onPlaySelectedLevel = () => {
    if (levelToLaunch == null) return;
    setIsLaunchingLevel(true);

    window.setTimeout(() => {
      startAtLevel(levelToLaunch);
      trackEvent('map_level_start', { level: levelToLaunch });
      setLevelToLaunch(null);
      setIsMapOpen(false);
      setIsLaunchingLevel(false);
    }, 180);
  };

  const onCloseLevelStart = () => {
    if (isLaunchingLevel) return;
    setLevelToLaunch(null);
    setIsMapOpen(true);
  };

  useEffect(() => {
    const savedUnlocked = localStorage.getItem('match3_unlocked_level');
    const parsed = Number(savedUnlocked);
    if (Number.isFinite(parsed) && parsed >= 1) {
      setUnlockedLevel(Math.floor(parsed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('match3_unlocked_level', String(unlockedLevel));
  }, [unlockedLevel]);

  useEffect(() => {
    if (analyticsInitRef.current) return;
    initAnalytics();
    analyticsInitRef.current = true;
    trackEvent('session_start', { level, mode: levelConfig.mode, language });
  }, [language, level, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (prevLevelRef.current === level) return;

    prevLevelRef.current = level;
    analyticsMovesRef.current = 0;
    prevGameOverRef.current = false;
    prevLevelUpRef.current = false;

    trackEvent('level_start', {
      level,
      mode: levelConfig.mode,
      goal_type: levelConfig.goal.type,
      goal_value: levelConfig.goal.value,
    });
  }, [level, levelConfig.mode, levelConfig.goal.type, levelConfig.goal.value]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;

    if (isPaused && !prevPausedRef.current) {
      trackEvent('pause_open', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    }

    if (!isPaused && prevPausedRef.current) {
      trackEvent('pause_close', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    }

    prevPausedRef.current = isPaused;
  }, [isPaused, level, score, moves, timeLeft, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (isLevelUp && !prevLevelUpRef.current) {
      trackEvent('level_complete', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    }

    prevLevelUpRef.current = isLevelUp;
  }, [isLevelUp, level, score, moves, timeLeft, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (isGameOver && !prevGameOverRef.current) {
      trackEvent('game_over', { level, score, moves, time_left: timeLeft, mode: levelConfig.mode });
    }

    prevGameOverRef.current = isGameOver;
  }, [isGameOver, level, score, moves, timeLeft, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (validMoves <= analyticsMovesRef.current) return;

    analyticsMovesRef.current = validMoves;

    if (validMoves === 1 || validMoves % 10 === 0) {
      trackEvent('moves_checkpoint', { level, moves_done: validMoves, score, mode: levelConfig.mode });
    }
  }, [validMoves, level, score, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (bombDoubleActivations <= analyticsBombCountRef.current) return;

    analyticsBombCountRef.current = bombDoubleActivations;
    trackEvent('bomb_activation', { level, count: bombDoubleActivations });
  }, [bombDoubleActivations, level]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (lightningSwaps <= analyticsLightningCountRef.current) return;

    analyticsLightningCountRef.current = lightningSwaps;
    trackEvent('lightning_swap', { level, count: lightningSwaps });
  }, [lightningSwaps, level]);


  useEffect(() => {
    if (level === 1) {
      setShowTutorial(true);
      setTutorialStep(0);
      setPendingSpawn(null);
      match3Ref.current = match3Moves;
      bombRef.current = bombDoubleActivations;
      lightningRef.current = lightningSwaps;
      return;
    }
    setShowTutorial(false);
    setPendingSpawn(null);
  }, [level]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 0 && match3Moves > match3Ref.current) {
      match3Ref.current = match3Moves;
      setTutorialStep(1);
      setPendingSpawn('bomb');
    }
  }, [match3Moves, tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 1 && bombDoubleActivations > bombRef.current) {
      bombRef.current = bombDoubleActivations;
      setTutorialStep(2);
      setPendingSpawn('lightning');
    }
  }, [bombDoubleActivations, tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 2 && lightningSwaps > lightningRef.current) {
      lightningRef.current = lightningSwaps;
      setShowTutorial(false);
    }
  }, [lightningSwaps, tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!pendingSpawn || !tutorialActive) return;
    if (isProcessing) return;
    spawnSpecial(pendingSpawn);
    setPendingSpawn(null);
  }, [pendingSpawn, isProcessing, spawnSpecial, tutorialActive]);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    setLowPerfMode(prefersReduced || lowMemory || lowCpu);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('low-performance', lowPerfMode);
    return () => {
      document.body.classList.remove('low-performance');
    };
  }, [lowPerfMode]);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || lowPerfMode) return;
    parallaxEnabledRef.current = true;
    const onMove = (e: PointerEvent) => {
      if (!parallaxEnabledRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      document.body.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
      document.body.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
    };
  }, [lowPerfMode]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  const playClick = () => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 520;
    gain.gain.value = 0.05 * volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playCombo = () => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const g = ctx.createGain();
    g.gain.value = 0.08 * volume;
    g.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.value = 320;
    o2.frequency.value = 480;
    o1.connect(g);
    o2.connect(g);
    const now = ctx.currentTime;
    o1.start(now);
    o2.start(now + 0.02);
    o1.stop(now + 0.18);
    o2.stop(now + 0.22);
  };

  useEffect(() => {
    if (matchTick <= 0) return;
    playClick();
  }, [matchTick]);

  useEffect(() => {
    if (lowPerfMode) return;
    if (comboId <= 0) return;
    setComboText(t.combo(comboLevel));
    setComboPos({
      x: 22 + Math.random() * 56,
      y: 18 + Math.random() * 52,
    });
    if (comboLevel <= 2) {
      setComboStyle({ color: 'text-yellow-300', size: 'text-base sm:text-lg' });
    } else if (comboLevel === 3) {
      setComboStyle({ color: 'text-orange-300', size: 'text-lg sm:text-xl' });
    } else {
      setComboStyle({ color: 'text-red-400', size: 'text-xl sm:text-3xl' });
    }
    setComboFlash(true);
    playCombo();
    const t1 = window.setTimeout(() => setComboText(null), 900);
    const t2 = window.setTimeout(() => setComboFlash(false), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [comboId, comboLevel, lowPerfMode, t]);

  useEffect(() => {
    if (lowPerfMode) return;
    if (bigBlastId <= 0) return;
    setShakeActive(true);
    setPulseActive(true);
    const t1 = window.setTimeout(() => setShakeActive(false), 350);
    const t2 = window.setTimeout(() => setPulseActive(false), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bigBlastId, lowPerfMode]);

  if (isMapOpen) {
    return (
      <div className="relative h-full w-full">
        <SpaceRoadmap
          unlockedLevel={unlockedLevel}
          language={language}
          onStartLevel={onStartFromMap}
        />
        <AnimatePresence>
          {levelToLaunch !== null && (
            <LevelStartModal
              level={levelToLaunch}
              language={language}
              onPlay={onPlaySelectedLevel}
              onClose={onCloseLevelStart}
            />
          )}
        </AnimatePresence>
        {isLaunchingLevel && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="rounded-2xl border border-cyan-200/35 bg-slate-950/70 px-6 py-4 text-center shadow-[0_0_28px_rgba(34,211,238,0.28)]">
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">{language === 'ru' ? 'Запуск' : 'Launching'}</div>
              <div className="mt-2 text-lg font-black text-white">{levelToLaunch !== null ? t.level(levelToLaunch) : ''}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-between h-full w-full max-w-none max-h-none sm:max-w-lg sm:max-h-[900px] mx-auto p-1 sm:p-4 safe-area-inset relative overflow-hidden bg-black/30 backdrop-blur-none ${lowPerfMode ? 'sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-lg' : 'sm:backdrop-blur-md sm:rounded-[3rem] sm:border sm:border-white/20 sm:shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)]'} ${shakeActive ? 'shake-soft' : ''}`}>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <PauseMenu
            onResume={() => setIsPaused(false)}
            onRestart={onRestart}
            onClose={() => setIsPaused(false)}
            onExitGame={onExitGame}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            volume={volume}
            onVolumeChange={(v) => {
              setVolume(v);
              if (v > 0 && isMuted) setIsMuted(false);
            }}
            language={language}
            onLanguageChange={onLanguageChange}
          />
        )}
        {isGameOver && (
          <GameOverMenu score={score} onRestart={onRestart} language={language} />
        )}
        {isLevelUp && (
          <LevelUpModal level={level} score={score} onNextLevel={onNextLevel} language={language} />
        )}
      </AnimatePresence>

      <AudioPlayer isMuted={isMuted} volume={volume} />
      {tutorialActive && (
        <TutorialHint step={tutorialStep} onSkip={onSkipTutorial} language={language} />
      )}

      {/* Top Bar: Progress & Settings */}
      <div className="w-full flex flex-col gap-1 sm:gap-2 z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 mt-1 sm:mt-2">
            <button
              onClick={() => setIsPaused(true)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 border-2 sm:border-4 border-white shadow-lg text-white font-bold active:scale-95 transition-transform flex items-center justify-center p-0"
            >
              <Settings className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onOpenMap}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 border-2 sm:border-4 border-white shadow-lg text-white font-bold active:scale-95 transition-transform flex items-center justify-center p-0"
              aria-label={language === 'ru' ? 'Открыть карту уровней' : 'Open level map'}
              title={language === 'ru' ? 'Карта уровней' : 'Level map'}
            >
              <Map className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Star Progress Bar */}
          <div className="flex-1 flex flex-col items-center -mt-0.5 sm:-mt-1">
            <StarProgress
              score={levelConfig.goal.type === 'score'
                ? score
                : (levelConfig.goal.color ? collected[levelConfig.goal.color] : 0)}
              target={levelConfig.goal.value}
              level={level}
              language={language}
            />
            <div className="mt-2 w-full max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl bg-sky-200 border border-white/80 shadow-[0_8px_20px_rgba(14,165,233,0.4)] text-slate-900 text-center">
              <div className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase">{t.goal}</div>
              <div className="text-xl sm:text-2xl font-extrabold leading-tight">
                {levelConfig.goal.type === 'score' && `${levelConfig.goal.value} ${t.points}`}
                {levelConfig.goal.type === 'collect' && (
                  <span className="inline-flex items-center gap-2">
                    {levelConfig.goal.color && <GoalGemIcon color={levelConfig.goal.color} />}
                    <span>
                      {levelConfig.goal.value} ({levelConfig.goal.color ? collected[levelConfig.goal.color] : 0}/{levelConfig.goal.value})
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Donate Button */}
          <a
            href="https://dalink.to/stepanda1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[68px] h-10 sm:w-[76px] sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-300/90 via-sky-300/80 to-blue-300/90 border-2 border-white/70 shadow-[0_8px_18px_rgba(56,189,248,0.55)] backdrop-blur-md flex items-center justify-center gap-1 text-black font-extrabold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 mt-1 sm:mt-2"
            title="Поддержать разработчика"
            aria-label="Поддержать разработчика"
          >
            <Coffee className="w-4 h-4" />
            <span className="text-[9px] sm:text-[10px]">{t.donate}</span>
          </a>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full relative">
        {/* Score Popup Placeholder */}
        <div className="flex justify-center items-center h-8 sm:h-14 w-full z-10 shrink-0 -mt-1 sm:-mt-2 relative">
          <motion.span
            key={score}
            initial={lowPerfMode ? false : { scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: lowPerfMode ? 0.1 : 0.2 }}
            className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black"
            style={{ WebkitTextStroke: '2px #000' }}
          >
            {score}
          </motion.span>
        </div>

        {/* Board Frame */}
        <div className={`relative p-2 sm:p-3 mb-1 sm:mb-3 bg-white/15 sm:bg-white/20 backdrop-blur-none ${lowPerfMode ? '' : 'sm:backdrop-blur-xl'} rounded-3xl border-4 border-white/40 ${lowPerfMode ? 'shadow-lg' : 'shadow-2xl'} [transform:translateZ(0)] ${pulseActive ? 'frame-pulse' : ''}`}>
          {!lowPerfMode && comboFlash && (
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,rgba(59,130,246,0.15)_40%,rgba(0,0,0,0)_70%)] animate-[comboFlash_0.4s_ease-out]" />
          )}
          {!lowPerfMode && comboText && (
            <motion.div
              className={`pointer-events-none absolute z-50 font-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${comboStyle.color} ${comboStyle.size}`}
              style={{ left: `${comboPos.x}%`, top: `${comboPos.y}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {comboText}
            </motion.div>
          )}
          <GameBoard
            grid={grid}
            selectedTile={selectedTile}
            explodingIds={explodingIds}
            isLevelTransition={isLevelTransition}
            showTutorial={tutorialActive}
            tutorialStep={tutorialStep}
            isProcessing={isProcessing}
            lowPerfMode={lowPerfMode}
            language={language}
            onTileClick={(tile) => !isPaused && handleTileClick(tile)}
            onTileSwipe={(from, to) => !isPaused && handleTileSwipe(from, to)}
          />
        </div>
      </div>

      {/* Bottom Bar: Moves (Left) & Boosters (Right) */}
      <div className="w-full z-10 pb-1 sm:pb-6 px-2 sm:px-4 -mt-1 sm:mt-0">
        <div className="flex items-end justify-between max-w-md mx-auto relative">
          {/* Moves Counter (Bottom Left) */}
          <div className="flex flex-col items-center justify-center bg-blue-600 w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border-2 sm:border-4 border-white shadow-xl relative z-20">
            <span className="text-white/80 text-[8px] sm:text-[10px] font-bold uppercase mt-1">
              {levelConfig.mode === 'time' ? t.time : t.moves}
            </span>
            <span className="text-xl sm:text-3xl font-black text-white leading-none drop-shadow-md">
              {levelConfig.mode === 'time' ? `${Math.max(0, timeLeft)}s` : moves}
            </span>
          </div>

          {/* Boosters (Right side) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-xl mb-1 ml-2 sm:ml-4 flex-1 justify-end">
            {[1, 2, 3].map((i) => (
              <button key={i} className="w-7 h-7 sm:w-12 sm:h-12 bg-purple-500/20 hover:bg-purple-500/40 border-2 border-purple-400/30 rounded-xl flex items-center justify-center transition-all active:scale-95 group">
                <div className="w-3 h-3 sm:w-6 sm:h-6 bg-purple-400/20 rounded-md rotate-45 border border-purple-300/20" />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;




