import { useCallback, useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { useGame } from './hooks/useGame';
import { PauseMenu } from './components/PauseMenu';
import { GameOverMenu } from './components/GameOverMenu';
import { LevelUpModal } from './components/LevelUpModal';
import { StarProgress } from './components/StarProgress';
import { AudioPlayer } from './components/AudioPlayer';
import { Coins, Settings, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialHint } from './components/TutorialHint';
import { SpaceRoadmap } from './components/SpaceRoadmap';
import { LevelStartModal } from './components/LevelStartModal';
import { ShopModal } from './components/ShopModal';
import { LegalModal } from './components/LegalModal';
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


type LevelStarsMap = Record<number, number>;

function getStarsFromScore(score: number): number {
  if (score >= 2200) return 3;
  if (score >= 1400) return 2;
  if (score >= 700) return 1;
  return 0;
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

function getOrCreatePlayerId(): string {
  const existing = window.localStorage.getItem('match3_player_id');
  if (existing) return existing;

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `player_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  window.localStorage.setItem('match3_player_id', generated);
  return generated;
}

function App() {
  const { grid, score, moves, timeLeft, levelConfig, level, collected, isProcessing, isPaused, setIsPaused, selectedTile, explodingIds, isLevelTransition, validMoves, match3Moves, bombDoubleActivations, lightningSwaps, levelBombActivations, levelLightningActivations, trashDestroyed, trashTotal, spawnSpecial, handleTileClick, handleTileSwipe, matchTick, comboLevel, comboId, bigBlastId, handleRestart, isLevelUp, startAtLevel, addExtraMoves, addExtraTime } = useGame();
  const BOOSTER_COST = 30;
  const MOVE_BOOST_AMOUNT = 5;
  const TIME_BOOST_SECONDS = 30;
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
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<'offer' | 'privacy' | 'refunds' | 'contacts'>('offer');
  const [spaceCoins, setSpaceCoins] = useState(120);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelStars, setLevelStars] = useState<LevelStarsMap>({});
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
  const playerIdRef = useRef<string>('');
  const hasServerWalletRef = useRef(false);
  const tutorialActive = showTutorial && level === 1;
  const t = COPY[language];
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'your-email@example.com';
  const contactTelegram = import.meta.env.VITE_CONTACT_TELEGRAM || 'https://t.me/your_username';
  const contactFacebook = import.meta.env.VITE_CONTACT_FACEBOOK || 'https://facebook.com/your.profile';
  const contactInstagram = import.meta.env.VITE_CONTACT_INSTAGRAM || 'https://instagram.com/your.profile';
  const coinPacks = [
    {
      id: 'pack-120',
      coins: 120,
      priceLabel: '99 ₽ / $1.19',
      url: import.meta.env.VITE_SHOP_PACK_SMALL_URL || undefined,
    },
    {
      id: 'pack-300',
      coins: 300,
      priceLabel: '199 ₽ / $2.39',
      url: import.meta.env.VITE_SHOP_PACK_MEDIUM_URL || undefined,
    },
    {
      id: 'pack-800',
      coins: 800,
      priceLabel: '499 ₽ / $5.99',
      url: import.meta.env.VITE_SHOP_PACK_LARGE_URL || undefined,
    },
  ];
  const goalAnalyticsValue = levelConfig.goal.type === 'collect_multi'
    ? Object.values(levelConfig.goal.targets).reduce((sum, value) => sum + (value ?? 0), 0)
    : levelConfig.goal.value;

  const renderGoalContent = () => {
    if (levelConfig.goal.type === 'collect') {
      return (
        <span className="inline-flex items-center gap-2">
          <GoalGemIcon color={levelConfig.goal.color} />
          <span>{collected[levelConfig.goal.color]}/{levelConfig.goal.value}</span>
        </span>
      );
    }

    if (levelConfig.goal.type === 'collect_multi') {
      const targets = Object.entries(levelConfig.goal.targets) as Array<[GemType, number | undefined]>;
      return (
        <span className="inline-flex flex-wrap justify-center gap-2 text-sm sm:text-base">
          {targets.map(([color, target]) => {
            const required = target ?? 0;
            return (
              <span key={color} className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-2 py-1">
                <GoalGemIcon color={color} />
                <span>{collected[color]}/{required}</span>
              </span>
            );
          })}
        </span>
      );
    }

    if (levelConfig.goal.type === 'bombs') {
      return <span>{language === 'ru' ? 'Бомбы' : 'Bombs'}: {levelBombActivations}/{levelConfig.goal.value}</span>;
    }

    if (levelConfig.goal.type === 'lightning') {
      return <span>{language === 'ru' ? 'Молнии' : 'Lightnings'}: {levelLightningActivations}/{levelConfig.goal.value}</span>;
    }

    return <span>{language === 'ru' ? 'Космический мусор' : 'Space debris'}: {trashDestroyed}/{Math.max(levelConfig.goal.value, trashTotal)}</span>;
  };

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

  const openShop = () => {
    setIsShopOpen(true);
    trackEvent('shop_open', { level, coins_balance: spaceCoins, mode: levelConfig.mode });
  };

  const openLegal = (section: 'offer' | 'privacy' | 'refunds' | 'contacts') => {
    setLegalSection(section);
    setIsLegalOpen(true);
  };

  const syncWalletFromServer = useCallback(async (): Promise<boolean> => {
    if (!playerIdRef.current) return false;

    try {
      const response = await fetch(`/api/wallet?playerId=${encodeURIComponent(playerIdRef.current)}`);
      if (!response.ok) return false;
      const payload = await response.json() as { balance?: number };
      const nextBalance = Math.max(0, Math.floor(Number(payload.balance ?? 0)));
      hasServerWalletRef.current = true;
      setSpaceCoins(nextBalance);
      return true;
    } catch {
      return false;
    }
  }, []);

  const spendCoins = async (cost: number): Promise<boolean> => {
    if (hasServerWalletRef.current) {
      try {
        const response = await fetch('/api/wallet/spend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: playerIdRef.current,
            amount: cost,
            reason: 'level_booster',
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({})) as { error?: string };
          if (response.status === 409) {
            setShopNotice(t.notEnoughCoins);
          } else if (payload.error) {
            setShopNotice(payload.error);
          }
          return false;
        }

        const payload = await response.json() as { balance?: number };
        setSpaceCoins(Math.max(0, Math.floor(Number(payload.balance ?? 0))));
        return true;
      } catch {
        setShopNotice(t.shopPackUnavailable);
        return false;
      }
    }

    if (spaceCoins < cost) {
      setShopNotice(t.notEnoughCoins);
      return false;
    }
    setSpaceCoins((prev) => prev - cost);
    return true;
  };

  const refundCoins = async (cost: number) => {
    if (hasServerWalletRef.current) {
      await syncWalletFromServer();
      return;
    }
    setSpaceCoins((prev) => prev + cost);
  };

  const buyExtraMoves = async () => {
    if (!await spendCoins(BOOSTER_COST)) return;
    const applied = addExtraMoves(MOVE_BOOST_AMOUNT);
    if (!applied) {
      await refundCoins(BOOSTER_COST);
      return;
    }
    const notice = t.boughtExtraMoves(MOVE_BOOST_AMOUNT);
    setShopNotice(notice);
    trackEvent('shop_spend_coins', { item: 'extra_moves', cost: BOOSTER_COST, value: MOVE_BOOST_AMOUNT, level, mode: levelConfig.mode });
  };

  const buyExtraTime = async () => {
    if (!await spendCoins(BOOSTER_COST)) return;
    const applied = addExtraTime(TIME_BOOST_SECONDS);
    if (!applied) {
      await refundCoins(BOOSTER_COST);
      return;
    }
    const notice = t.boughtExtraTime(TIME_BOOST_SECONDS);
    setShopNotice(notice);
    trackEvent('shop_spend_coins', { item: 'extra_time', cost: BOOSTER_COST, value: TIME_BOOST_SECONDS, level, mode: levelConfig.mode });
  };

  const buyCoinsPack = async (packId: string) => {
    const pack = coinPacks.find((item) => item.id === packId);
    if (!pack) return;

    if (!hasServerWalletRef.current) {
      if (pack.url) {
        window.open(pack.url, '_blank', 'noopener,noreferrer');
      } else {
        setShopNotice(t.shopPackUnavailable);
      }
      return;
    }

    setPendingPackId(packId);
    try {
      const response = await fetch('/api/payments/lava/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerIdRef.current,
          packId,
        }),
      });

      const payload = await response.json().catch(() => ({})) as { paymentUrl?: string; error?: string };
      if (!response.ok || !payload.paymentUrl) {
        if (pack.url) {
          window.open(pack.url, '_blank', 'noopener,noreferrer');
          return;
        }
        setShopNotice(payload.error || t.shopPackUnavailable);
        return;
      }

      window.open(payload.paymentUrl, '_blank', 'noopener,noreferrer');
      trackEvent('shop_real_money_click', { pack_id: packId, level, mode: levelConfig.mode });
    } catch {
      if (pack.url) {
        window.open(pack.url, '_blank', 'noopener,noreferrer');
      } else {
        setShopNotice(t.shopPackUnavailable);
      }
    } finally {
      setPendingPackId(null);
    }
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
    const earnedStars = getStarsFromScore(score);
    trackEvent('next_level_click', { level, score, mode: levelConfig.mode, next_level: nextUnlockedLevel, stars: earnedStars });
    setUnlockedLevel((prev) => Math.max(prev, nextUnlockedLevel));
    setLevelStars((prev) => ({
      ...prev,
      [level]: Math.max(prev[level] ?? 0, earnedStars),
    }));
    setIsPaused(false);
    setLevelToLaunch(null);
    setIsMapOpen(true);
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
    playerIdRef.current = getOrCreatePlayerId();
  }, []);

  useEffect(() => {
    const savedCoins = localStorage.getItem('match3_space_coins');
    const parsed = Number(savedCoins);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setSpaceCoins(Math.floor(parsed));
    }
  }, []);

  useEffect(() => {
    if (!playerIdRef.current) return;
    void syncWalletFromServer();
  }, [syncWalletFromServer]);

  useEffect(() => {
    if (!isShopOpen || !hasServerWalletRef.current) return;
    const id = window.setInterval(() => {
      void syncWalletFromServer();
    }, 5000);
    return () => clearInterval(id);
  }, [isShopOpen, syncWalletFromServer]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus !== 'success') return;

    const orderId = params.get('orderId');
    setShopNotice(language === 'ru' ? 'Платеж принят. Проверяю зачисление монет...' : 'Payment accepted. Checking coin top-up...');
    void syncWalletFromServer();
    if (orderId) {
      trackEvent('shop_payment_return', { order_id: orderId });
    }
  }, [language, syncWalletFromServer]);

  useEffect(() => {
    localStorage.setItem('match3_space_coins', String(spaceCoins));
  }, [spaceCoins]);

  useEffect(() => {
    const raw = localStorage.getItem('match3_level_stars');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      const normalized: LevelStarsMap = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const levelNum = Number(key);
        if (!Number.isFinite(levelNum)) return;
        const stars = Math.max(0, Math.min(3, Math.floor(Number(value) || 0)));
        normalized[levelNum] = stars;
      });
      setLevelStars(normalized);
    } catch {
      setLevelStars({});
    }
  }, []);

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
    localStorage.setItem('match3_level_stars', JSON.stringify(levelStars));
  }, [levelStars]);

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
      goal_value: goalAnalyticsValue,
    });
  }, [goalAnalyticsValue, level, levelConfig.mode, levelConfig.goal.type]);

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
    if (!shopNotice) return;
    const timeout = window.setTimeout(() => {
      setShopNotice(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [shopNotice]);

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
        <AnimatePresence>
          {isLegalOpen && (
            <LegalModal
              language={language}
              section={legalSection}
              contacts={{
                email: contactEmail,
                telegram: contactTelegram,
                facebook: contactFacebook,
                instagram: contactInstagram,
              }}
              onClose={() => setIsLegalOpen(false)}
              onSelectSection={setLegalSection}
            />
          )}
        </AnimatePresence>
        <SpaceRoadmap
          unlockedLevel={unlockedLevel}
          language={language}
          onStartLevel={onStartFromMap}
          onExitGame={onExitGame}
          onOpenLegal={openLegal}
          levelStars={levelStars}
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
    <div className={`flex h-full w-full max-w-none flex-col items-center justify-between overflow-hidden p-1 sm:mx-auto sm:max-h-[900px] sm:max-w-lg sm:p-4 safe-area-inset relative bg-black/30 backdrop-blur-none ${lowPerfMode ? 'sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-lg' : 'sm:backdrop-blur-md sm:rounded-[3rem] sm:border sm:border-white/20 sm:shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)]'} ${shakeActive ? 'shake-soft' : ''}`}>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isLegalOpen && (
          <LegalModal
            language={language}
            section={legalSection}
            contacts={{
              email: contactEmail,
              telegram: contactTelegram,
              facebook: contactFacebook,
              instagram: contactInstagram,
            }}
            onClose={() => setIsLegalOpen(false)}
            onSelectSection={setLegalSection}
          />
        )}
        {isShopOpen && (
          <ShopModal
            language={language}
            isTimeMode={levelConfig.mode === 'time'}
            coinsBalance={spaceCoins}
            boosterCost={BOOSTER_COST}
            moveBoostAmount={MOVE_BOOST_AMOUNT}
            timeBoostSeconds={TIME_BOOST_SECONDS}
            packs={coinPacks}
            onClose={() => setIsShopOpen(false)}
            onBuyMoves={buyExtraMoves}
            onBuyTime={buyExtraTime}
            onBuyPack={buyCoinsPack}
            pendingPackId={pendingPackId}
          />
        )}
        {isPaused && !isGameOver && (
          <PauseMenu
            onResume={() => setIsPaused(false)}
            onRestart={onRestart}
            onClose={() => setIsPaused(false)}
            onOpenLegal={openLegal}
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
          <LevelUpModal level={level} score={score} starsEarned={getStarsFromScore(score)} onNextLevel={onNextLevel} language={language} />
        )}
      </AnimatePresence>

      <AudioPlayer isMuted={isMuted} volume={volume} />
      {tutorialActive && (
        <TutorialHint step={tutorialStep} onSkip={onSkipTutorial} language={language} />
      )}

      {/* Top Bar: Progress & Settings */}
      <div className="w-full shrink-0 flex flex-col gap-1 sm:gap-2 z-10">
        <div className="flex justify-between items-start px-1 sm:px-2">
          <div className="flex items-center mt-1 sm:mt-2">
            <button
              onClick={() => setIsPaused(true)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 border-2 sm:border-4 border-white shadow-lg text-white font-bold active:scale-95 transition-transform flex items-center justify-center p-0"
            >
              <Settings className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

                    {/* Star Progress Bar */}
          <div className="flex-1 flex flex-col items-center -mt-0.5 sm:-mt-1">
            <StarProgress
              score={score}
              level={level}
              language={language}
            />
            <div className="mt-2 w-full max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl bg-sky-200 border border-white/80 shadow-[0_8px_20px_rgba(14,165,233,0.4)] text-slate-900 text-center">
              <div className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase">{t.goal}</div>
              <div className="text-xl sm:text-2xl font-extrabold leading-tight">{renderGoalContent()}</div>
            </div>
          </div>

          {/* Donate Button */}
          <button
            type="button"
            onClick={openShop}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-300/90 via-sky-300/80 to-blue-300/90 border-2 sm:border-4 border-white/70 shadow-[0_8px_18px_rgba(56,189,248,0.55)] backdrop-blur-md flex items-center justify-center text-black transition-all hover:scale-105 active:scale-95 mt-1 sm:mt-2"
            title={language === 'ru' ? 'Открыть магазин' : 'Open shop'}
            aria-label={language === 'ru' ? 'Открыть магазин' : 'Open shop'}
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-end pr-2 sm:pr-3">
          <button
            type="button"
            onClick={openShop}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-200/40 bg-cyan-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-100 transition-all hover:bg-cyan-400/25"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>{spaceCoins}</span>
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 min-h-0 flex flex-col justify-center items-center w-full relative">
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
      <div className="w-full shrink-0 z-10 pb-1 sm:pb-6 px-2 sm:px-4 -mt-1 sm:mt-0">
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
        {shopNotice && (
          <div className="mt-2 text-center text-xs sm:text-sm font-bold text-cyan-200">
            {shopNotice}
          </div>
        )}
      </div>

    </div>
  );
}

export default App;













