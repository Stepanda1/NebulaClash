import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GameBoard } from './components/GameBoard';
import { useGame } from './hooks/useGame';
import { PauseMenu } from './components/PauseMenu';
import { GameOverMenu } from './components/GameOverMenu';
import { LevelUpModal } from './components/LevelUpModal';
import { StarProgress } from './components/StarProgress';
import { AudioPlayer } from './components/AudioPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialHint } from './components/TutorialHint';
import { SpaceRoadmap } from './components/SpaceRoadmap';
import { MarketingLanding } from './components/MarketingLanding';
import { LevelStartModal } from './components/LevelStartModal';
import { ShopModal } from './components/ShopModal';
import { LegalModal } from './components/LegalModal';
import { GameGuideModal } from './components/GameGuideModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AdminModal } from './components/AdminModal';
import { AdminAccessModal } from './components/AdminAccessModal';
import type { GemType } from './types';
import type { Language } from './i18n';
import type { LegalSection } from './types/legal';
import { COPY } from './i18n';
import { initAnalytics, trackEvent } from './analytics';
import { useWallet } from './hooks/useWallet';
import { BoosterGlyph, CoinGlyph, CompassGlyph, GiftGlyph, SignalGlyph, TimeGlyph, VaultGlyph } from './components/CosmicArtwork';
import { buildLevelConfigs, type Goal, type LevelConfig } from './logic/levelProgress';
import {
  BOOSTER_COST,
  MOVE_BOOST_AMOUNT,
  PAYMENT_RETURN_TO_GAME_KEY,
  TIME_BOOST_SECONDS,
  TUTORIAL_SEEN_KEY,
  WALLET_TOKEN_KEY,
  getCoinPacksFromEnv,
  getLegalContactsFromEnv,
  getMarketingLinksFromEnv,
} from './config/appConfig';

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

function getLevelConfigPreview(targetLevel: number): LevelConfig {
  const sanitizedLevel = Math.max(1, Math.floor(targetLevel));
  return APP_LEVEL_CONFIGS[(sanitizedLevel - 1) % APP_LEVEL_CONFIGS.length];
}

function getGoalPreviewText(goal: Goal, language: Language): string {
  const gemNames: Record<Language, Record<GemType, string>> = {
    en: {
      red: 'red crystals',
      blue: 'blue crystals',
      green: 'green crystals',
      yellow: 'yellow crystals',
      purple: 'purple crystals',
      orange: 'orange crystals',
    },
    ru: {
      red: 'красные кристаллы',
      blue: 'синие кристаллы',
      green: 'зелёные кристаллы',
      yellow: 'жёлтые кристаллы',
      purple: 'фиолетовые кристаллы',
      orange: 'оранжевые кристаллы',
    },
  };
  const specialNames: Record<Language, Record<'bomb' | 'lightning' | 'cross' | 'pulse' | 'nova' | 'smash', string>> = {
    en: {
      bomb: 'bombs',
      lightning: 'lightnings',
      cross: 'cross blasts',
      pulse: 'pulse charges',
      nova: 'nova bursts',
      smash: 'smash events',
    },
    ru: {
      bomb: 'бомбы',
      lightning: 'молнии',
      cross: 'крест-взрывы',
      pulse: 'импульсы',
      nova: 'новы',
      smash: 'smash-события',
    },
  };

  if (goal.type === 'collect') {
    return language === 'ru'
      ? `Собери ${goal.value} ${gemNames.ru[goal.color]}`
      : `Collect ${goal.value} ${gemNames.en[goal.color]}`;
  }
  if (goal.type === 'collect_multi') {
    const parts = Object.entries(goal.targets)
      .filter(([, value]) => (value ?? 0) > 0)
      .map(([color, value]) => {
        const gemColor = color as GemType;
        return language === 'ru'
          ? `${value} ${gemNames.ru[gemColor]}`
          : `${value} ${gemNames.en[gemColor]}`;
      });
    return language === 'ru' ? `Собери ${parts.join(' + ')}` : `Collect ${parts.join(' + ')}`;
  }
  if (goal.type === 'bombs') {
    return language === 'ru' ? `Активируй ${goal.value} бомбы` : `Trigger ${goal.value} bombs`;
  }
  if (goal.type === 'lightning') {
    return language === 'ru' ? `Активируй ${goal.value} молнии` : `Trigger ${goal.value} lightnings`;
  }
  if (goal.type === 'special') {
    return language === 'ru'
      ? `Активируй ${goal.value} ${specialNames.ru[goal.special]}`
      : `Trigger ${goal.value} ${specialNames.en[goal.special]}`;
  }
  if (goal.type === 'combo_x5') {
    return language === 'ru' ? `Сделай ${goal.value} комбо x4+` : `Make ${goal.value} combo x4+`;
  }
  if (goal.type === 'trash') {
    return language === 'ru' ? `Убери ${goal.value} космического мусора` : `Clear ${goal.value} debris blocks`;
  }
  return language === 'ru' ? `Сними щит босса: ${goal.value}` : `Break the boss shield: ${goal.value}`;
}


type LevelStarsMap = Record<number, number>;
const TUTORIAL_MODAL_STEPS = [0, 1, 3, 5, 7] as const;
const TUTORIAL_TOTAL_STEPS = TUTORIAL_MODAL_STEPS.length;

const PROGRESS_RESET_VERSION = 5;
const UNLOCKED_LEVEL_STORAGE_KEY = `match3_unlocked_level_v${PROGRESS_RESET_VERSION}`;
const LEVEL_STARS_STORAGE_KEY = `match3_level_stars_v${PROGRESS_RESET_VERSION}`;
const LEGACY_UNLOCKED_LEVEL_STORAGE_KEY = 'match3_unlocked_level';
const LEGACY_LEVEL_STARS_STORAGE_KEY = 'match3_level_stars';
const PREVIOUS_UNLOCKED_LEVEL_STORAGE_KEY = 'match3_unlocked_level_v4';
const PREVIOUS_LEVEL_STARS_STORAGE_KEY = 'match3_level_stars_v4';
const PROGRESS_RESET_MARKER_KEY = `match3_progress_reset_applied_v${PROGRESS_RESET_VERSION}`;
const GAME_STATE_SNAPSHOT_STORAGE_KEY = 'match3_game_state_snapshot';
const MAX_ADMIN_UNLOCK_LEVEL = 60;
const ADMIN_ACCESS_TOKEN_KEY = 'match3_admin_access_token';
const ADMIN_LAST_ACTIVE_KEY = 'match3_admin_last_active_at';
const ADMIN_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const SHOP_TIMING_EXPERIMENT_ID = 'shop_timing_v1';
const SHOP_TIMING_VARIANT_KEY = 'match3_exp_shop_timing_v1_variant';
const SHOP_TIMING_AUTO_SHOWN_KEY = 'match3_exp_shop_timing_v1_auto_shown';
const APP_LEVEL_CONFIGS = buildLevelConfigs();

type ShopTimingVariant = 'a' | 'b';
type LeaderboardItem = {
  rank: number;
  displayName: string;
  bestLevel: number;
  bestScore: number;
  totalStars: number;
};

function getShopTimingVariant(): ShopTimingVariant {
  if (typeof window === 'undefined') return 'a';
  const stored = window.localStorage.getItem(SHOP_TIMING_VARIANT_KEY);
  if (stored === 'a' || stored === 'b') {
    return stored;
  }

  const assigned: ShopTimingVariant = Math.random() < 0.5 ? 'a' : 'b';
  window.localStorage.setItem(SHOP_TIMING_VARIANT_KEY, assigned);
  return assigned;
}

function wasShopTimingAutoShown(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SHOP_TIMING_AUTO_SHOWN_KEY) === '1';
}

function getHasSeenTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
}

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

function shouldOpenMarketingLanding(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.location.pathname.startsWith('/admin')) return false;
  if (window.localStorage.getItem(PAYMENT_RETURN_TO_GAME_KEY) === '1') return false;
  return !window.location.pathname.startsWith('/play');
}

function shouldOpenMapByDefault(): boolean {
  if (typeof window === 'undefined') return getHasSeenTutorial();
  if (window.location.pathname.startsWith('/admin')) return false;
  if (window.localStorage.getItem(PAYMENT_RETURN_TO_GAME_KEY) === '1') return false;
  return getHasSeenTutorial();
}

function replaceAppPath(pathname: string): void {
  if (typeof window === 'undefined') return;
  const { search, hash } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}${hash}`);
}

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
}

function App() {
  const { grid, score, moves, timeLeft, levelConfig, level, collected, isProcessing, isPaused, setIsPaused, selectedTile, explodingIds, isLevelTransition, validMoves, match3Moves, bombDoubleActivations, lightningSwaps, levelBombActivations, levelLightningActivations, levelCrossActivations, levelPulseActivations, levelNovaActivations, levelSmashEvents, comboX5Count, trashDestroyed, trashTotal, spawnSpecial, handleTileClick, handleTileSwipe, matchTick, comboLevel, comboId, bigBlastId, smashId, bossHp, bossMaxHp, bossHitTick, bossLastHitDamage, goalClearId, handleRestart, isLevelUp, startAtLevel, addExtraMoves, addExtraTime } = useGame();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [pendingSpawn, setPendingSpawn] = useState<null | 'bomb' | 'lightning'>(null);
  const [comboText, setComboText] = useState<string | null>(null);
  const [comboFlash, setComboFlash] = useState(false);
  const [bossHitFlash, setBossHitFlash] = useState(false);
  const [bossHitText, setBossHitText] = useState<string | null>(null);
  const [bossAttackFxActive, setBossAttackFxActive] = useState(false);
  const [bossAttackFxId, setBossAttackFxId] = useState(0);
  const [goalClearText, setGoalClearText] = useState<string | null>(null);
  const [shakeActive, setShakeActive] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [comboPos, setComboPos] = useState<{ x: number; y: number }>({ x: 50, y: 18 });
  const [comboStyle, setComboStyle] = useState<{ color: string; size: string }>({ color: 'text-amber-300', size: 'text-lg sm:text-2xl' });
  const [lowPerfMode, setLowPerfMode] = useState(false);
  const [language, setLanguage] = useState<Language>(getDefaultLanguage);
  const [isMarketingLandingOpen, setIsMarketingLandingOpen] = useState(shouldOpenMarketingLanding);
  const [isMapOpen, setIsMapOpen] = useState(shouldOpenMapByDefault);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [dailyCanClaim, setDailyCanClaim] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(1);
  const [dailyNextReward, setDailyNextReward] = useState(40);
  const [adminAccessToken, setAdminAccessToken] = useState(() => (typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) || '' : ''));
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelStars, setLevelStars] = useState<LevelStarsMap>({});
  const [levelToLaunch, setLevelToLaunch] = useState<number | null>(null);
  const [isLaunchingLevel, setIsLaunchingLevel] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(getHasSeenTutorial);
  const match3Ref = useRef(0);
  const bombRef = useRef(0);
  const lightningRef = useRef(0);
  const analyticsInitRef = useRef(false);
  const prevPausedRef = useRef(false);
  const prevGameOverRef = useRef(false);
  const prevLevelUpRef = useRef(false);
  const prevLevelRef = useRef<number | null>(null);
  const analyticsMovesRef = useRef(0);
  const analyticsBombCountRef = useRef(0);
  const analyticsLightningCountRef = useRef(0);
  const levelRewardClaimRef = useRef('');
  const experimentAssignedTrackedRef = useRef(false);
  const autoShopPromptShownRef = useRef(wasShopTimingAutoShown());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const parallaxEnabledRef = useRef(false);
  const tutorialActive = showTutorial && level === 1;
  const tutorialShowsModal = tutorialActive && TUTORIAL_MODAL_STEPS.includes(tutorialStep as (typeof TUTORIAL_MODAL_STEPS)[number]);
  const tutorialAllowsBoardInput = !tutorialActive || tutorialStep === 2 || tutorialStep === 4 || tutorialStep === 6;
  const tutorialDisplayStep = tutorialShowsModal
    ? Math.max(1, TUTORIAL_MODAL_STEPS.findIndex((value) => value === tutorialStep) + 1)
    : 1;
  const t = COPY[language];
  const legalContacts = useMemo(() => getLegalContactsFromEnv(), []);
  const marketingLinks = useMemo(() => getMarketingLinksFromEnv(legalContacts.telegram), [legalContacts]);
  const coinPacks = useMemo(() => getCoinPacksFromEnv(), []);
  const shopTimingVariant = useMemo(() => getShopTimingVariant(), []);
  const goalAnalyticsValue = levelConfig.goal.type === 'collect_multi'
    ? Object.values(levelConfig.goal.targets).reduce((sum, value) => sum + (value ?? 0), 0)
    : levelConfig.goal.value;
  const isBossLevel = levelConfig.goal.type === 'boss';
  const bossShieldPercent = Math.max(0, Math.min(100, bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 0));
  const bossAttackLabel = language === 'ru' ? 'Мусор после хода' : 'Debris After Move';
  const selectedLevelConfig = useMemo(
    () => (levelToLaunch == null ? null : getLevelConfigPreview(levelToLaunch)),
    [levelToLaunch],
  );
  const selectedLevelGoalPreview = useMemo<ReactNode>(() => {
    if (!selectedLevelConfig) return null;
    return getGoalPreviewText(selectedLevelConfig.goal, language);
  }, [language, selectedLevelConfig]);
  const selectedLevelPacePreview = useMemo(() => {
    if (!selectedLevelConfig) return '';
    return selectedLevelConfig.mode === 'moves'
      ? (language === 'ru' ? `${selectedLevelConfig.limit} ходов на чистый ран` : `${selectedLevelConfig.limit} moves for a clean run`)
      : (language === 'ru' ? `${selectedLevelConfig.limit} секунд на быстрый забег` : `${selectedLevelConfig.limit} seconds for a fast clear`);
  }, [language, selectedLevelConfig]);

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

    if (levelConfig.goal.type === 'special') {
      const specialLabel = (() => {
        if (levelConfig.goal.special === 'bomb') return language === 'ru' ? 'Бомбы' : 'Bombs';
        if (levelConfig.goal.special === 'lightning') return language === 'ru' ? 'Молнии' : 'Lightnings';
        if (levelConfig.goal.special === 'cross') return language === 'ru' ? 'Кресты' : 'Cross';
        if (levelConfig.goal.special === 'pulse') return language === 'ru' ? 'Импульсы' : 'Pulse';
        if (levelConfig.goal.special === 'nova') return language === 'ru' ? 'Новы' : 'Nova';
        return language === 'ru' ? 'Smash-события' : 'Smash Events';
      })();
      const progress = (() => {
        if (levelConfig.goal.special === 'bomb') return levelBombActivations;
        if (levelConfig.goal.special === 'lightning') return levelLightningActivations;
        if (levelConfig.goal.special === 'cross') return levelCrossActivations;
        if (levelConfig.goal.special === 'pulse') return levelPulseActivations;
        if (levelConfig.goal.special === 'nova') return levelNovaActivations;
        return levelSmashEvents;
      })();
      return <span>{specialLabel}: {progress}/{levelConfig.goal.value}</span>;
    }

    if (levelConfig.goal.type === 'combo_x5') {
      return <span>{language === 'ru' ? 'Комбо x4+' : 'Combo x4+'}: {comboX5Count}/{levelConfig.goal.value}</span>;
    }

    if (isBossLevel) {
      return <span>{language === 'ru' ? 'Босс' : 'Boss'}: {Math.max(0, bossHp)}/{Math.max(1, bossMaxHp)}</span>;
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
    if (level === 1 && !hasSeenTutorial) {
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
  const finishTutorial = () => {
    setHasSeenTutorial(true);
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    setShowTutorial(false);
    setTutorialStep(0);
    setPendingSpawn(null);
  };
  const onSkipTutorial = () => {
    finishTutorial();
  };
  const onAdvanceTutorial = () => {
    if (!tutorialActive) return;
    if (tutorialStep === 0) {
      setTutorialStep(1);
      return;
    }
    if (tutorialStep === 1) {
      setTutorialStep(2);
      return;
    }
    if (tutorialStep === 3) {
      setTutorialStep(4);
      return;
    }
    if (tutorialStep === 5) {
      setTutorialStep(6);
      return;
    }
    if (tutorialStep >= 7) {
      finishTutorial();
    }
  };

  const onLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem('match3_language', nextLanguage);
    trackEvent('language_change', { language: nextLanguage });
  };

  const openLegal = (_section: LegalSection) => {
    setIsLegalOpen(true);
  };

  const openGuide = () => {
    setIsGuideOpen(true);
  };

  const walletUnavailableMessage = language === 'ru'
    ? 'Сервис кошелька временно недоступен'
    : 'Wallet service is temporarily unavailable';

  const {
    buyCoinsPack,
    claimDailyReward,
    claimLevelCompletionReward,
    getDailyRewardStatus,
    getLeaderboardTop,
    playerId,
    setShopNotice,
    shopNotice,
    spaceCoins,
    spendCoins,
    submitLeaderboardEntry,
    syncWalletBalance,
    walletReady,
  } = useWallet({
    language,
    coinPacks,
    notEnoughCoinsMessage: t.notEnoughCoins,
    walletUnavailableMessage,
    shopPackUnavailableMessage: t.shopPackUnavailable,
    onPaymentStatus: (status) => {
      trackEvent('shop_payment_status', { status });
    },
    onPackCheckout: (packId) => {
      trackEvent('shop_real_money_click', { pack_id: packId, level, mode: levelConfig.mode });
    },
  });

  const buyExtraMoves = async () => {
    if (levelConfig.mode !== 'moves' || isLevelUp) return;
    if (!await spendCoins(BOOSTER_COST)) return;
    const applied = addExtraMoves(MOVE_BOOST_AMOUNT);
    if (!applied) {
      setShopNotice(walletUnavailableMessage);
      await syncWalletBalance();
      return;
    }
    const notice = t.boughtExtraMoves(MOVE_BOOST_AMOUNT);
    setShopNotice(notice);
    trackEvent('shop_spend_coins', { item: 'extra_moves', cost: BOOSTER_COST, value: MOVE_BOOST_AMOUNT, level, mode: levelConfig.mode });
  };

  const buyExtraTime = async () => {
    if (levelConfig.mode !== 'time' || isLevelUp) return;
    if (!await spendCoins(BOOSTER_COST)) return;
    const applied = addExtraTime(TIME_BOOST_SECONDS);
    if (!applied) {
      setShopNotice(walletUnavailableMessage);
      await syncWalletBalance();
      return;
    }
    const notice = t.boughtExtraTime(TIME_BOOST_SECONDS);
    setShopNotice(notice);
    trackEvent('shop_spend_coins', { item: 'extra_time', cost: BOOSTER_COST, value: TIME_BOOST_SECONDS, level, mode: levelConfig.mode });
  };

  const openShopWithSource = useCallback((source: 'manual_button' | 'level_1_complete_auto') => {
    setIsShopOpen(true);
    trackEvent('shop_prompt_shown', {
      source,
      experiment_id: SHOP_TIMING_EXPERIMENT_ID,
      variant: shopTimingVariant,
      level,
      mode: levelConfig.mode,
    });
    trackEvent('shop_open', { level, coins_balance: spaceCoins, mode: levelConfig.mode, source });
  }, [level, levelConfig.mode, shopTimingVariant, spaceCoins]);

  const openShop = useCallback(() => {
    openShopWithSource('manual_button');
  }, [openShopWithSource]);

  const quickBoostLabel = levelConfig.mode === 'moves'
    ? (language === 'ru' ? `+${MOVE_BOOST_AMOUNT} ходов` : `+${MOVE_BOOST_AMOUNT} moves`)
    : (language === 'ru' ? `+${TIME_BOOST_SECONDS} сек` : `+${TIME_BOOST_SECONDS}s`);

  const quickBoostHint = levelConfig.mode === 'moves'
    ? (language === 'ru' ? 'Экстренный буст ходов' : 'Emergency move boost')
    : (language === 'ru' ? 'Экстренный буст времени' : 'Emergency time boost');

  const triggerQuickBoost = levelConfig.mode === 'moves' ? buyExtraMoves : buyExtraTime;

  const handleClaimDailyReward = async () => {
    const result = await claimDailyReward();
    if (!result) {
      setShopNotice(language === 'ru' ? 'Daily reward недоступен' : 'Daily reward unavailable');
      return;
    }
    if (result.granted) {
      setDailyCanClaim(false);
      setDailyStreak(Math.max(1, result.streak));
      setDailyNextReward(Math.max(1, result.reward));
      setShopNotice(
        language === 'ru'
          ? `Ежедневная награда: +${result.reward} монет (день ${result.streak})`
          : `Daily reward: +${result.reward} coins (day ${result.streak})`,
      );
    } else {
      setDailyCanClaim(false);
      setShopNotice(language === 'ru' ? 'Награда уже получена сегодня' : 'Daily reward already claimed');
    }
  };

  const openLeaderboard = async () => {
    setIsLeaderboardOpen(true);
    setIsLeaderboardLoading(true);
    try {
      const payload = await getLeaderboardTop(20);
      setLeaderboardItems(payload?.items ?? []);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const openDailyRewards = () => {
    setIsDailyRewardsOpen(true);
  };

  const shareGame = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play` : 'https://nebulaclash.com/play';
    const shareTitle = 'Nebula Clash';
    const shareText = language === 'ru'
      ? 'Залетай в Nebula Clash: матч-3 с боссами, бустерами и космическим вайбом.'
      : 'Join me in Nebula Clash: boss battles, boosters, and cosmic match-3 vibes.';

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        setShopNotice(language === 'ru' ? 'Ссылка отправлена' : 'Shared successfully');
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShopNotice(language === 'ru' ? 'Ссылка скопирована' : 'Link copied');
      }
    } catch {
      // Ignore cancelled share dialogs and clipboard failures.
    }
  };

  const openAdmin = () => {
    if (!(isAdminPath() && adminAccessToken)) return;
    setIsAdminOpen(true);
  };

  const clearAdminAccess = useCallback(() => {
    setAdminAccessToken('');
    setIsAdminOpen(false);
    setAdminAuthError(null);
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
    replaceAppPath('/admin');
  }, []);

  const markAdminActive = useCallback(() => {
    localStorage.setItem(ADMIN_LAST_ACTIVE_KEY, String(Date.now()));
  }, []);

  const grantCoinsAsAdmin = async (amount: number) => {
    if (adminAccessToken && playerId) {
      try {
        const response = await fetch('/api/admin/grant-coins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({ amount, playerId }),
        });

        if (!response.ok) {
          setShopNotice(language === 'ru' ? 'Админ: не удалось начислить монеты' : 'Admin: failed to grant coins');
          return;
        }

        await syncWalletBalance();
      } catch {
        setShopNotice(language === 'ru' ? 'Админ: не удалось начислить монеты' : 'Admin: failed to grant coins');
        return;
      }
    }

    setShopNotice(language === 'ru' ? `Админ: начислено ${amount} монет` : `Admin: granted ${amount} coins`);
  };

  const adminAddMoves = () => {
    const applied = addExtraMoves(MOVE_BOOST_AMOUNT);
    setShopNotice(applied
      ? (language === 'ru' ? `Админ: +${MOVE_BOOST_AMOUNT} ходов` : `Admin: +${MOVE_BOOST_AMOUNT} moves`)
      : (language === 'ru' ? 'Админ: режим без ходов' : 'Admin: not in moves mode'));
  };

  const adminAddTime = () => {
    const applied = addExtraTime(TIME_BOOST_SECONDS);
    setShopNotice(applied
      ? (language === 'ru' ? `Админ: +${TIME_BOOST_SECONDS} секунд` : `Admin: +${TIME_BOOST_SECONDS} seconds`)
      : (language === 'ru' ? 'Админ: режим без таймера' : 'Admin: not in timer mode'));
  };

  const adminUnlockAllLevels = () => {
    setUnlockedLevel((prev) => Math.max(prev, MAX_ADMIN_UNLOCK_LEVEL));
    setShopNotice(language === 'ru' ? 'Админ: все уровни открыты' : 'Admin: all levels unlocked');
  };

  const adminResetLocalProgress = () => {
    setUnlockedLevel(1);
    setLevelStars({});
    setHasSeenTutorial(false);
    setShowTutorial(false);
    setLevelToLaunch(null);
    startAtLevel(1);
    localStorage.removeItem(UNLOCKED_LEVEL_STORAGE_KEY);
    localStorage.removeItem(LEVEL_STARS_STORAGE_KEY);
    localStorage.removeItem(GAME_STATE_SNAPSHOT_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_SEEN_KEY);
    setShopNotice(language === 'ru' ? 'Админ: локальный прогресс сброшен' : 'Admin: local progress reset');
  };

  const handleAdminLogin = async (username: string, password: string) => {
    setAdminAuthLoading(true);
    setAdminAuthError(null);

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json().catch(() => ({})) as { token?: string };
      if (!response.ok || !payload.token) {
        setAdminAuthError(language === 'ru' ? 'Неверный логин или пароль' : 'Invalid login or password');
        return;
      }

      setAdminAccessToken(payload.token);
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, payload.token);
      markAdminActive();
      setIsMarketingLandingOpen(false);
      setIsMapOpen(false);
      replaceAppPath('/admin');
    } catch {
      setAdminAuthError(language === 'ru' ? 'Сервис админки недоступен' : 'Admin service is unavailable');
    } finally {
      setAdminAuthLoading(false);
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

  const onEnterFromMarketingLanding = () => {
    setIsMarketingLandingOpen(false);
    replaceAppPath('/play');
    if (hasSeenTutorial) {
      setLevelToLaunch(unlockedLevel);
    }
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
    if (!isAdminPath() || !adminAccessToken) return;

    const lastActiveAt = Number(localStorage.getItem(ADMIN_LAST_ACTIVE_KEY) || 0);
    if (!Number.isFinite(lastActiveAt) || Date.now() - lastActiveAt > ADMIN_IDLE_TIMEOUT_MS) {
      clearAdminAccess();
      return;
    }

    setIsMarketingLandingOpen(false);
    setIsMapOpen(false);
  }, [adminAccessToken, clearAdminAccess]);

  useEffect(() => {
    if (!isAdminPath() || !adminAccessToken) return;

    let timeoutId = window.setTimeout(() => {
      clearAdminAccess();
    }, ADMIN_IDLE_TIMEOUT_MS);

    const refreshTimeout = () => {
      markAdminActive();
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        clearAdminAccess();
      }, ADMIN_IDLE_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, refreshTimeout, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, refreshTimeout));
    };
  }, [adminAccessToken, clearAdminAccess, markAdminActive]);

  useEffect(() => {
    if (localStorage.getItem(PROGRESS_RESET_MARKER_KEY) !== '1') {
      localStorage.removeItem(LEGACY_UNLOCKED_LEVEL_STORAGE_KEY);
      localStorage.removeItem(LEGACY_LEVEL_STARS_STORAGE_KEY);
      localStorage.removeItem(PREVIOUS_UNLOCKED_LEVEL_STORAGE_KEY);
      localStorage.removeItem(PREVIOUS_LEVEL_STARS_STORAGE_KEY);
      localStorage.removeItem(GAME_STATE_SNAPSHOT_STORAGE_KEY);
      localStorage.removeItem(WALLET_TOKEN_KEY);
      localStorage.setItem(PROGRESS_RESET_MARKER_KEY, '1');
    }
    const raw = localStorage.getItem(LEVEL_STARS_STORAGE_KEY);
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
    const savedUnlocked = localStorage.getItem(UNLOCKED_LEVEL_STORAGE_KEY);
    const parsed = Number(savedUnlocked);
    if (Number.isFinite(parsed) && parsed >= 1) {
      setUnlockedLevel(Math.floor(parsed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_LEVEL_STORAGE_KEY, String(unlockedLevel));
  }, [unlockedLevel]);
  useEffect(() => {
    localStorage.setItem(LEVEL_STARS_STORAGE_KEY, JSON.stringify(levelStars));
  }, [levelStars]);

  useEffect(() => {
    if (analyticsInitRef.current) return;
    initAnalytics();
    analyticsInitRef.current = true;
    trackEvent('session_start', { level, mode: levelConfig.mode, language });
  }, [language, level, levelConfig.mode]);

  useEffect(() => {
    if (!analyticsInitRef.current) return;
    if (experimentAssignedTrackedRef.current) return;

    experimentAssignedTrackedRef.current = true;
    trackEvent('experiment_assigned', {
      experiment_id: SHOP_TIMING_EXPERIMENT_ID,
      variant: shopTimingVariant,
    });
  }, [shopTimingVariant]);

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

      if (level === 1 && shopTimingVariant === 'b' && !autoShopPromptShownRef.current) {
        autoShopPromptShownRef.current = true;
        window.localStorage.setItem(SHOP_TIMING_AUTO_SHOWN_KEY, '1');
        openShopWithSource('level_1_complete_auto');
      }
    }

    prevLevelUpRef.current = isLevelUp;
  }, [isLevelUp, level, score, moves, timeLeft, levelConfig.mode, openShopWithSource, shopTimingVariant]);

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
    if (level === 1 && !hasSeenTutorial) {
      setShowTutorial(true);
      setTutorialStep(0);
      setPendingSpawn(null);
      match3Ref.current = match3Moves;
      bombRef.current = bombDoubleActivations;
      lightningRef.current = lightningSwaps;
      return;
    }
    setShowTutorial(false);
    setTutorialStep(0);
    setPendingSpawn(null);
  }, [level, hasSeenTutorial]);

  useEffect(() => {
    if (!shopNotice) return;
    const timeout = window.setTimeout(() => {
      setShopNotice(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [shopNotice]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 2 && match3Moves > match3Ref.current) {
      match3Ref.current = match3Moves;
      setTutorialStep(3);
      setPendingSpawn('bomb');
    }
  }, [match3Moves, tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 4 && bombDoubleActivations > bombRef.current) {
      bombRef.current = bombDoubleActivations;
      setTutorialStep(5);
      setPendingSpawn('lightning');
    }
  }, [bombDoubleActivations, tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 6 && lightningSwaps > lightningRef.current) {
      lightningRef.current = lightningSwaps;
      setTutorialStep(7);
      setPendingSpawn(null);
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
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const compactViewport = window.innerWidth <= 640;
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    setLowPerfMode(prefersReduced || lowMemory || lowCpu || coarsePointer || compactViewport);
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

  useEffect(() => {
    if (!walletReady) return;
    void (async () => {
      const status = await getDailyRewardStatus();
      if (!status) return;
      setDailyCanClaim(Boolean(status.canClaim));
      setDailyStreak(Math.max(1, Number(status.streak || 1)));
      setDailyNextReward(Math.max(1, Number(status.nextReward || 40)));
    })();
  }, [getDailyRewardStatus, walletReady]);

  useEffect(() => {
    if (!isLevelUp || !walletReady || !playerId) return;
    const rewardKey = `${playerId}:${level}:${score}`;
    if (levelRewardClaimRef.current === rewardKey) return;
    levelRewardClaimRef.current = rewardKey;

    const stars = getStarsFromScore(score);
    void (async () => {
      const levelReward = await claimLevelCompletionReward(level, score, stars);
      if (levelReward?.granted) {
        setShopNotice(
          language === 'ru'
            ? `Награда за уровень: +${levelReward.reward} монет`
            : `Level reward: +${levelReward.reward} coins`,
        );
      }

      await submitLeaderboardEntry({
        bestLevel: level,
        bestScore: score,
        totalStars: stars,
      });
    })();
  }, [claimLevelCompletionReward, isLevelUp, language, level, playerId, score, setShopNotice, submitLeaderboardEntry, walletReady]);

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
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.03 * volume, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    master.connect(ctx.destination);

    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(720, now);
    tone.frequency.exponentialRampToValueAtTime(980, now + 0.03);
    tone.frequency.exponentialRampToValueAtTime(760, now + 0.14);

    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1440, now);
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.linearRampToValueAtTime(0.012 * volume, now + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    tone.connect(master);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    tone.start(now);
    shimmer.start(now + 0.004);
    tone.stop(now + 0.15);
    shimmer.stop(now + 0.1);
  };

  const playCombo = () => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const start = now + index * 0.045;
      const end = start + 0.16;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, start + 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq, end);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime((0.04 - index * 0.006) * volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(freq * 2, start);
      sparkleGain.gain.setValueAtTime(0.0001, start);
      sparkleGain.gain.linearRampToValueAtTime(0.012 * volume, start + 0.01);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      osc.start(start);
      sparkle.start(start + 0.003);
      osc.stop(end);
      sparkle.stop(start + 0.09);
    });
  };

  const playBossHit = (damage: number) => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.type = 'sawtooth';
    impact.frequency.setValueAtTime(210, now);
    impact.frequency.exponentialRampToValueAtTime(120, now + 0.1);
    impactGain.gain.setValueAtTime(0.0001, now);
    impactGain.gain.linearRampToValueAtTime(Math.min(0.08, 0.028 + damage * 0.0012) * volume, now + 0.012);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    impact.connect(impactGain);
    impactGain.connect(ctx.destination);

    const zap = ctx.createOscillator();
    const zapGain = ctx.createGain();
    zap.type = 'triangle';
    zap.frequency.setValueAtTime(980, now);
    zap.frequency.exponentialRampToValueAtTime(620, now + 0.12);
    zapGain.gain.setValueAtTime(0.0001, now + 0.01);
    zapGain.gain.linearRampToValueAtTime(0.02 * volume, now + 0.03);
    zapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    zap.connect(zapGain);
    zapGain.connect(ctx.destination);

    impact.start(now);
    zap.start(now + 0.01);
    impact.stop(now + 0.17);
    zap.stop(now + 0.16);
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
    const t1 = window.setTimeout(() => setComboText(null), 1200);
    const t2 = window.setTimeout(() => setComboFlash(false), 650);
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
    const t1 = window.setTimeout(() => setShakeActive(false), 500);
    const t2 = window.setTimeout(() => setPulseActive(false), 820);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bigBlastId, lowPerfMode]);

  useEffect(() => {
    if (smashId <= 0) return;
    setComboText(language === 'ru' ? 'SMASH x7!' : 'SMASH x7!');
    setComboStyle({ color: 'text-cyan-200', size: 'text-xl sm:text-3xl' });
    setComboPos({ x: 50, y: 22 });
    setComboFlash(true);
    const t1 = window.setTimeout(() => setComboText(null), 1350);
    const t2 = window.setTimeout(() => setComboFlash(false), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [smashId, language]);

  useEffect(() => {
    if (bossHitTick <= 0 || bossLastHitDamage <= 0) return;
    setBossHitFlash(true);
    setBossHitText(`-${bossLastHitDamage}`);
    playBossHit(bossLastHitDamage);
    const t1 = window.setTimeout(() => setBossHitFlash(false), 380);
    const t2 = window.setTimeout(() => setBossHitText(null), 950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bossHitTick, bossLastHitDamage]);

  useEffect(() => {
    if (!isBossLevel || isPaused || isLevelUp || isMapOpen || isGameOver) {
      setBossAttackFxActive(false);
      return;
    }

    const triggerAttackFx = () => {
      setBossAttackFxActive(true);
      setBossAttackFxId((prev) => prev + 1);
      window.setTimeout(() => setBossAttackFxActive(false), lowPerfMode ? 520 : 1100);
    };

    const initialDelay = lowPerfMode ? 2600 : 1800;
    const intervalMs = lowPerfMode ? 5200 : 4200;
    const startTimer = window.setTimeout(triggerAttackFx, initialDelay);
    const loopTimer = window.setInterval(triggerAttackFx, intervalMs);

    return () => {
      clearTimeout(startTimer);
      clearInterval(loopTimer);
    };
  }, [isBossLevel, isPaused, isLevelUp, isMapOpen, isGameOver, lowPerfMode]);

  useEffect(() => {
    if (goalClearId <= 0) return;
    const phrases = language === 'ru'
      ? ['Отлично!', 'Великолепно!', 'Невероятно!', 'Идеально!', 'Космос!']
      : ['Great!', 'Super!', 'Unbelievable!', 'Excellent!', 'Spectacular!'];
    const picked = phrases[(goalClearId - 1) % phrases.length];
    setGoalClearText(picked);
    const t1 = window.setTimeout(() => setGoalClearText(null), 420);
    return () => clearTimeout(t1);
  }, [goalClearId]);

  if (isMarketingLandingOpen) {
    return (
      <div className="relative h-full w-full">
        <AnimatePresence>
          {isFeedbackOpen && (
            <FeedbackModal
              language={language}
              feedbackEmail={legalContacts.email}
              onClose={() => setIsFeedbackOpen(false)}
            />
          )}
          {isDailyRewardsOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[2rem] border border-emerald-200/20 bg-[linear-gradient(180deg,rgba(6,24,20,0.96),rgba(4,16,14,0.98))] p-5 shadow-[0_24px_80px_rgba(16,185,129,0.2)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-100">{language === 'ru' ? 'Ежедневная награда' : 'Daily Reward'}</div>
                  <button
                    type="button"
                    onClick={() => setIsDailyRewardsOpen(false)}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
                  >
                    {language === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-white">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">{language === 'ru' ? 'Серия' : 'Streak'}</div>
                  <div className="mt-1 text-2xl font-black">{dailyStreak}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-100/80">{language === 'ru' ? 'Следующая награда' : 'Next reward'}</div>
                  <div className="mt-1 text-xl font-black">+{dailyNextReward}</div>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleClaimDailyReward();
                      setIsDailyRewardsOpen(false);
                    }}
                    className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide transition-all ${
                      dailyCanClaim
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 hover:from-emerald-300 hover:to-teal-400'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {dailyCanClaim ? (language === 'ru' ? 'Получить' : 'Claim reward') : (language === 'ru' ? 'Уже получено сегодня' : 'Already claimed today')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isLeaderboardOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(8,16,38,0.96),rgba(5,10,24,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.22)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">{language === 'ru' ? 'Рейтинг игроков' : 'Player Ranking'}</div>
                  <button
                    type="button"
                    onClick={() => setIsLeaderboardOpen(false)}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
                  >
                    {language === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
                </div>
                <div className="max-h-[58vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2">
                  {isLeaderboardLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>
                  ) : leaderboardItems.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Пока нет данных' : 'No entries yet'}</div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardItems.map((item) => (
                        <div key={`${item.rank}-${item.displayName}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-white">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/20 font-black text-cyan-100">#{item.rank}</span>
                            <span className="max-w-[130px] truncate font-bold">{item.displayName}</span>
                          </div>
                          <div className="text-right text-[11px] text-white/80">
                            <div>{language === 'ru' ? 'Уровень' : 'Level'}: <span className="font-black text-white">{item.bestLevel}</span></div>
                            <div>{language === 'ru' ? 'Счёт' : 'Score'}: <span className="font-black text-white">{item.bestScore}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
        <MarketingLanding
          language={language}
          marketingLinks={marketingLinks}
          contacts={legalContacts}
          onPlayNow={onEnterFromMarketingLanding}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
        <AudioPlayer isMuted={isMuted} volume={volume} mode="lobby" />
      </div>
    );
  }

  if (isMapOpen) {
    return (
      <div className="relative h-full w-full">
        <AnimatePresence>
          {isAdminPath() && adminAccessToken && isAdminOpen && (
            <AdminModal
              language={language}
              playerId={playerId}
              onClose={() => setIsAdminOpen(false)}
              onGrantCoins={grantCoinsAsAdmin}
              onAddMoves={adminAddMoves}
              onAddTime={adminAddTime}
              onSpawnBomb={() => {
                spawnSpecial('bomb');
                setShopNotice(language === 'ru' ? 'Админ: бомба добавлена' : 'Admin: bomb added');
              }}
              onSpawnLightning={() => {
                spawnSpecial('lightning');
                setShopNotice(language === 'ru' ? 'Админ: молния добавлена' : 'Admin: lightning added');
              }}
              onUnlockAllLevels={adminUnlockAllLevels}
              onResetLocalProgress={adminResetLocalProgress}
            />
          )}
          {isLegalOpen && (
            <LegalModal
              language={language}
              contacts={legalContacts}
              onClose={() => setIsLegalOpen(false)}
            />
          )}
          {isGuideOpen && (
            <GameGuideModal
              language={language}
              onClose={() => setIsGuideOpen(false)}
            />
          )}
          {isFeedbackOpen && (
            <FeedbackModal
              language={language}
              feedbackEmail={legalContacts.email}
              onClose={() => setIsFeedbackOpen(false)}
            />
          )}
        </AnimatePresence>
        <SpaceRoadmap
          unlockedLevel={unlockedLevel}
          language={language}
          onLanguageChange={onLanguageChange}
          onStartLevel={onStartFromMap}
          onExitGame={onExitGame}
          onOpenLegal={openLegal}
          onOpenGuide={openGuide}
          levelStars={levelStars}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          volume={volume}
          dailyCanClaim={dailyCanClaim}
          dailyStreak={dailyStreak}
          dailyNextReward={dailyNextReward}
          onOpenDailyRewards={openDailyRewards}
          onOpenLeaderboard={openLeaderboard}
          onShareGame={shareGame}
          onVolumeChange={(v) => {
            setVolume(v);
            if (v > 0 && isMuted) setIsMuted(false);
          }}
        />
        {isDailyRewardsOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] border border-emerald-200/20 bg-[linear-gradient(180deg,rgba(6,24,20,0.96),rgba(4,16,14,0.98))] p-5 shadow-[0_24px_80px_rgba(16,185,129,0.2)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-100">{language === 'ru' ? 'Ежедневная награда' : 'Daily Reward'}</div>
                <button type="button" onClick={() => setIsDailyRewardsOpen(false)} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12">{language === 'ru' ? 'Закрыть' : 'Close'}</button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-white">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">{language === 'ru' ? 'Серия' : 'Streak'}</div>
                <div className="mt-1 text-2xl font-black">{dailyStreak}</div>
                <button type="button" onClick={async () => { await handleClaimDailyReward(); setIsDailyRewardsOpen(false); }} className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide transition-all ${dailyCanClaim ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 hover:from-emerald-300 hover:to-teal-400' : 'bg-white/10 text-white/70'}`}>{dailyCanClaim ? (language === 'ru' ? 'Получить' : 'Claim reward') : (language === 'ru' ? 'Уже получено сегодня' : 'Already claimed today')}</button>
              </div>
            </div>
          </div>
        )}
        {isLeaderboardOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(8,16,38,0.96),rgba(5,10,24,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.22)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">{language === 'ru' ? 'Рейтинг игроков' : 'Player Ranking'}</div>
                <button type="button" onClick={() => setIsLeaderboardOpen(false)} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12">{language === 'ru' ? 'Закрыть' : 'Close'}</button>
              </div>
              <div className="max-h-[58vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2">
                {isLeaderboardLoading ? <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div> : leaderboardItems.length === 0 ? <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Пока нет данных' : 'No entries yet'}</div> : (
                  <div className="space-y-2">{leaderboardItems.map((item) => (
                    <div key={`${item.rank}-${item.displayName}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 text-white"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/20 font-black text-cyan-100">#{item.rank}</span><span className="max-w-[130px] truncate font-bold">{item.displayName}</span></div>
                      <div className="text-right text-[11px] text-white/80"><div>{language === 'ru' ? 'Уровень' : 'Level'}: <span className="font-black text-white">{item.bestLevel}</span></div><div>{language === 'ru' ? 'Счёт' : 'Score'}: <span className="font-black text-white">{item.bestScore}</span></div></div>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          </div>
        )}
        <AudioPlayer isMuted={isMuted} volume={volume} mode="lobby" />
        <AnimatePresence>
          {levelToLaunch !== null && (
            <LevelStartModal
              level={levelToLaunch}
              goalPreview={selectedLevelGoalPreview}
              pacePreview={selectedLevelPacePreview}
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
    <div className={`flex h-full w-full max-w-none flex-col items-center justify-between overflow-hidden p-1 sm:mx-auto sm:max-h-[900px] sm:max-w-lg sm:p-4 safe-area-inset relative bg-[radial-gradient(180%_140%_at_14%_-6%,rgba(56,189,248,0.26)_0%,rgba(14,116,144,0.12)_23%,rgba(2,6,23,0.68)_56%,rgba(2,6,23,0.9)_100%)] backdrop-blur-none ${lowPerfMode ? 'sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-lg' : 'sm:backdrop-blur-md sm:rounded-[3rem] sm:border sm:border-cyan-100/24 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_30px_90px_rgba(2,6,23,0.88),0_0_54px_rgba(34,211,238,0.18)]'} ${shakeActive ? 'shake-soft' : ''}`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-cyan-300/22 blur-3xl" />
        <div className="absolute right-[-70px] top-20 h-64 w-64 rounded-full bg-blue-300/16 blur-3xl" />
        <div className="absolute left-10 bottom-16 h-44 w-44 rounded-full bg-amber-300/14 blur-3xl" />
        {!lowPerfMode && (
          <div className="absolute inset-0 bg-[linear-gradient(118deg,transparent_0%,rgba(186,230,253,0.07)_32%,rgba(125,211,252,0.09)_48%,rgba(251,191,36,0.08)_68%,transparent_100%)] opacity-85" />
        )}
        {!lowPerfMode && (
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:32px_32px,32px_32px]" />
        )}
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isAdminPath() && adminAccessToken && isAdminOpen && (
          <AdminModal
            language={language}
            playerId={playerId}
            onClose={() => setIsAdminOpen(false)}
            onGrantCoins={grantCoinsAsAdmin}
            onAddMoves={adminAddMoves}
            onAddTime={adminAddTime}
            onSpawnBomb={() => {
              spawnSpecial('bomb');
              setShopNotice(language === 'ru' ? 'Админ: бомба добавлена' : 'Admin: bomb added');
            }}
            onSpawnLightning={() => {
              spawnSpecial('lightning');
              setShopNotice(language === 'ru' ? 'Админ: молния добавлена' : 'Admin: lightning added');
            }}
            onUnlockAllLevels={adminUnlockAllLevels}
            onResetLocalProgress={adminResetLocalProgress}
          />
        )}
        {isLegalOpen && (
          <LegalModal
            language={language}
            contacts={legalContacts}
            onClose={() => setIsLegalOpen(false)}
          />
        )}
        {isGuideOpen && (
          <GameGuideModal
            language={language}
            onClose={() => setIsGuideOpen(false)}
          />
        )}
        {isFeedbackOpen && (
          <FeedbackModal
            language={language}
            feedbackEmail={legalContacts.email}
            onClose={() => setIsFeedbackOpen(false)}
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
          />
        )}
        {isDailyRewardsOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] border border-emerald-200/20 bg-[linear-gradient(180deg,rgba(6,24,20,0.96),rgba(4,16,14,0.98))] p-5 shadow-[0_24px_80px_rgba(16,185,129,0.2)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-100">{language === 'ru' ? 'Ежедневная награда' : 'Daily Reward'}</div>
                <button
                  type="button"
                  onClick={() => setIsDailyRewardsOpen(false)}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
                >
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-white">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">{language === 'ru' ? 'Серия' : 'Streak'}</div>
                <div className="mt-1 text-2xl font-black">{dailyStreak}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-100/80">{language === 'ru' ? 'Следующая награда' : 'Next reward'}</div>
                <div className="mt-1 text-xl font-black">+{dailyNextReward}</div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleClaimDailyReward();
                    setIsDailyRewardsOpen(false);
                  }}
                  className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide transition-all ${
                    dailyCanClaim
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 hover:from-emerald-300 hover:to-teal-400'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {dailyCanClaim ? (language === 'ru' ? 'Получить' : 'Claim reward') : (language === 'ru' ? 'Уже получено сегодня' : 'Already claimed today')}
                </button>
              </div>
            </div>
          </div>
        )}
        {isLeaderboardOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/86 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(8,16,38,0.96),rgba(5,10,24,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.22)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">{language === 'ru' ? 'Рейтинг игроков' : 'Player Ranking'}</div>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
                >
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </div>
              <div className="max-h-[58vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2">
                {isLeaderboardLoading ? (
                  <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>
                ) : leaderboardItems.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-white/70">{language === 'ru' ? 'Пока нет данных' : 'No entries yet'}</div>
                ) : (
                  <div className="space-y-2">
                    {leaderboardItems.map((item) => (
                      <div key={`${item.rank}-${item.displayName}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 text-white">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/20 font-black text-cyan-100">#{item.rank}</span>
                          <span className="max-w-[130px] truncate font-bold">{item.displayName}</span>
                        </div>
                        <div className="text-right text-[11px] text-white/80">
                          <div>{language === 'ru' ? 'Уровень' : 'Level'}: <span className="font-black text-white">{item.bestLevel}</span></div>
                          <div>{language === 'ru' ? 'Счёт' : 'Score'}: <span className="font-black text-white">{item.bestScore}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {isPaused && !isGameOver && (
          <PauseMenu
            onResume={() => setIsPaused(false)}
            onRestart={onRestart}
            onClose={() => setIsPaused(false)}
            onOpenLegal={openLegal}
            onOpenGuide={openGuide}
            onShareGame={shareGame}
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
          <GameOverMenu
            score={score}
            mode={levelConfig.mode}
            boostCost={BOOSTER_COST}
            boostAmountLabel={levelConfig.mode === 'moves' ? `+${MOVE_BOOST_AMOUNT} ${language === 'ru' ? 'ходов' : 'moves'}` : `+${TIME_BOOST_SECONDS}${language === 'ru' ? ' сек' : 's'}`}
            canAffordContinue={spaceCoins >= BOOSTER_COST}
            onRestart={onRestart}
            onBuyContinue={triggerQuickBoost}
            onOpenShop={openShop}
            language={language}
          />
        )}
        {isLevelUp && (
          <LevelUpModal level={level} score={score} starsEarned={getStarsFromScore(score)} onNextLevel={onNextLevel} language={language} />
        )}
      </AnimatePresence>

      <AudioPlayer isMuted={isMuted} volume={volume} mode={isBossLevel ? 'boss' : 'level'} />
      {tutorialShowsModal && (
        <TutorialHint
          step={tutorialStep}
          totalSteps={TUTORIAL_TOTAL_STEPS}
          displayStep={tutorialDisplayStep}
          onSkip={onSkipTutorial}
          onAdvance={onAdvanceTutorial}
          language={language}
        />
      )}
      {goalClearText && (
        <div className="pointer-events-none absolute inset-0 z-[95] flex items-center justify-center bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,0.12),rgba(2,6,23,0.82)_45%,rgba(2,6,23,0.92)_100%)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.78, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mx-4 w-[min(92%,560px)] rounded-3xl border border-amber-200/35 bg-slate-950/70 px-6 py-6 text-center shadow-[0_0_40px_rgba(251,191,36,0.2)]"
          >
            <div className="text-xs sm:text-sm uppercase tracking-[0.35em] text-amber-100/80">
              {language === 'ru' ? 'Цель выполнена' : 'Goal Complete'}
            </div>
            <div className="mt-2 text-4xl sm:text-6xl font-black text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]">
              {goalClearText}
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Bar: Progress & Settings */}
      <div className="w-full shrink-0 flex flex-col gap-1 sm:gap-2 z-20 relative">
        <div className="flex justify-between items-start px-1.5 sm:px-2.5">
          <div className="ml-0.5 sm:ml-1 flex items-center mt-1 sm:mt-2">
            <button
              onClick={() => setIsPaused(true)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 sm:border-[3px] border-cyan-100/75 bg-[linear-gradient(145deg,#38bdf8_0%,#2563eb_54%,#1d4ed8_100%)] shadow-[0_8px_22px_rgba(14,116,144,0.55)] text-white font-bold active:scale-95 transition-transform flex items-center justify-center p-0"
            >
              <CompassGlyph className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </button>
          </div>

                    {/* Star Progress Bar */}
          <div className="flex-1 flex flex-col items-center mt-1 sm:mt-2">
            <StarProgress
              score={score}
              level={level}
              language={language}
              lowPerfMode={lowPerfMode}
            />
            <div className="mt-2 w-full max-w-xs sm:max-w-sm rounded-2xl border border-cyan-100/45 bg-[linear-gradient(150deg,rgba(186,230,253,0.96)_0%,rgba(125,211,252,0.9)_48%,rgba(147,197,253,0.88)_100%)] px-4 py-2 text-center text-slate-900 shadow-[0_14px_28px_rgba(14,116,144,0.34)]">
              <div className="text-[10px] sm:text-xs font-black tracking-[0.22em] uppercase text-slate-800/82">{t.goal}</div>
              <div className="text-xl sm:text-2xl font-extrabold leading-tight text-slate-950">{renderGoalContent()}</div>
            </div>
            {isBossLevel && (
              <div className="relative mt-2 w-full max-w-xs sm:max-w-sm px-2">
                <div className="relative overflow-hidden rounded-2xl border border-rose-200/60 bg-slate-950/80 px-2 py-2 shadow-[0_0_22px_rgba(244,63,94,0.28)]">
                  {bossHitFlash && !lowPerfMode && (
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(251,113,133,0.45)_0%,rgba(244,63,94,0.12)_45%,rgba(0,0,0,0)_75%)] animate-[comboFlash_0.24s_ease-out]" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 rounded-2xl border border-rose-200/30 bg-[radial-gradient(circle_at_50%_30%,rgba(248,113,113,0.28)_0%,rgba(76,29,149,0.24)_38%,rgba(15,23,42,0.98)_100%)] shadow-[inset_0_0_12px_rgba(251,113,133,0.14),0_0_14px_rgba(251,113,133,0.14)]">
                      <div className="absolute inset-[5px] rounded-xl border border-white/10 bg-black/30" />
                      <div className="absolute left-1/2 top-[9px] h-2.5 w-5 -translate-x-1/2 rounded-full border border-rose-200/25 bg-rose-300/10" />
                      <div className="absolute left-[11px] top-[16px] h-1.5 w-1.5 rounded-full bg-cyan-100 shadow-[0_0_6px_rgba(224,242,254,0.95)]" />
                      <div className="absolute right-[11px] top-[16px] h-1.5 w-1.5 rounded-full bg-cyan-100 shadow-[0_0_6px_rgba(224,242,254,0.95)]" />
                      <div className="absolute left-1/2 top-[23px] h-1.5 w-4.5 -translate-x-1/2 rounded-full bg-rose-300/70 shadow-[0_0_6px_rgba(251,113,133,0.5)]" />
                      <div className="absolute left-[7px] top-[25px] h-2 w-1.5 rotate-[28deg] rounded-full bg-slate-400/70" />
                      <div className="absolute right-[7px] top-[25px] h-2 w-1.5 -rotate-[28deg] rounded-full bg-slate-400/70" />
                      <div className={`absolute left-1/2 top-[21px] h-3 w-3 -translate-x-1/2 rounded-full border border-rose-200/35 bg-[radial-gradient(circle,#fda4af_0%,#fb7185_42%,#7c3aed_100%)] ${bossHitFlash && !lowPerfMode ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-rose-100/85">
                        <span>{language === 'ru' ? 'Щит босса' : 'Boss Shield'}</span>
                        <span>{Math.max(0, bossHp)}/{Math.max(1, bossMaxHp)}</span>
                      </div>
                      <div className="h-3 rounded-full border border-white/10 bg-white/10 p-[2px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400 shadow-[0_0_12px_rgba(244,63,94,0.55)] transition-[width] duration-300"
                          style={{ width: `${bossShieldPercent}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-rose-100/60">
                        <span>{language === 'ru' ? 'Секторная угроза' : 'Sector Threat'}</span>
                        <span>{bossAttackLabel}</span>
                      </div>
                    </div>
                  </div>
                  {bossHitText && !lowPerfMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: -6, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute right-3 top-1 text-sm font-black text-rose-300 drop-shadow-[0_0_10px_rgba(251,113,133,0.75)]"
                    >
                      {bossHitText}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Donate Button */}
          <button
            type="button"
            onClick={openShop}
            className="mr-0.5 sm:mr-1 mt-1 sm:mt-2 flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 sm:border-[3px] border-cyan-100/70 bg-[linear-gradient(145deg,#38bdf8_0%,#1d4ed8_52%,#312e81_100%)] text-white shadow-[0_10px_22px_rgba(30,64,175,0.55)] transition-all hover:scale-105 active:scale-95"
            title={language === 'ru' ? 'Открыть магазин' : 'Open shop'}
            aria-label={language === 'ru' ? 'Открыть магазин' : 'Open shop'}
          >
            <VaultGlyph className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-end pr-2 sm:pr-3">
          <div className="mr-auto ml-1" />
          {isAdminPath() && adminAccessToken && (
            <button
              type="button"
              onClick={openAdmin}
              className="relative z-30 mr-2 inline-flex items-center rounded-full border border-rose-200/35 bg-gradient-to-r from-rose-400/20 via-orange-300/18 to-amber-300/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-100 shadow-[0_0_18px_rgba(251,113,133,0.18)] transition-all hover:from-rose-400/30 hover:via-orange-300/24 hover:to-amber-300/30"
              title={language === 'ru' ? 'Открыть админку' : 'Open admin panel'}
              aria-label={language === 'ru' ? 'Открыть админку' : 'Open admin panel'}
            >
              ADM
            </button>
          )}
          <button
            type="button"
            onClick={openShop}
            className="relative z-30 pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-[linear-gradient(140deg,rgba(251,191,36,0.24),rgba(251,191,36,0.12),rgba(251,146,60,0.2))] px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all hover:from-amber-300/30 hover:via-yellow-300/22 hover:to-orange-300/30 sm:px-3.5 sm:py-1.5 sm:text-xs"
            title={language === 'ru' ? 'Открыть магазин монет' : 'Open coin shop'}
            aria-label={language === 'ru' ? 'Открыть магазин монет' : 'Open coin shop'}
          >
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/50 bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.38)]">
              <span className="relative block h-2.5 w-2.5">
                <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-emerald-950" />
                <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-emerald-950" />
              </span>
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <CoinGlyph className="h-4.5 w-4.5" />
            </span>
            <span className="hidden text-amber-100/88 sm:inline">{language === 'ru' ? 'Монеты' : 'Coins'}</span>
            <span className="min-w-[2.2rem] text-right text-sm font-black tabular-nums text-amber-50 sm:min-w-[2.8rem] sm:text-base">{spaceCoins}</span>
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 min-h-0 flex flex-col justify-center items-center w-full relative z-0">
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
        <div className={`relative mb-1 rounded-3xl border-4 border-cyan-100/38 bg-[linear-gradient(150deg,rgba(148,163,184,0.18),rgba(30,41,59,0.3),rgba(2,6,23,0.34))] p-2 sm:mb-3 sm:p-3 backdrop-blur-none ${lowPerfMode ? '' : 'sm:backdrop-blur-xl'} ${lowPerfMode ? 'shadow-lg' : 'shadow-[0_18px_44px_rgba(8,47,73,0.46),inset_0_1px_0_rgba(255,255,255,0.18)]'} [transform:translateZ(0)] ${pulseActive ? 'frame-pulse' : ''}`}>
          {!lowPerfMode && comboFlash && (
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,rgba(59,130,246,0.15)_40%,rgba(0,0,0,0)_70%)] animate-[comboFlash_0.4s_ease-out]" />
          )}
          {!lowPerfMode && bossHitFlash && isBossLevel && (
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_12%,rgba(251,113,133,0.28)_0%,rgba(139,92,246,0.14)_35%,rgba(0,0,0,0)_70%)] animate-[comboFlash_0.3s_ease-out]" />
          )}
          {!lowPerfMode && isBossLevel && bossAttackFxActive && (
            <div key={bossAttackFxId} className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute inset-x-8 top-2 rounded-full border border-rose-200/20 bg-rose-300/10 px-3 py-1 text-center text-[9px] font-black uppercase tracking-[0.25em] text-rose-100/80">
                {bossAttackLabel}
              </div>
              {[
                { left: 18, endX: -18, endY: 122, delay: 0, rotateStart: -22, width: 'w-5' },
                { left: 32, endX: 12, endY: 166, delay: 0.05, rotateStart: 14, width: 'w-4' },
                { left: 48, endX: -10, endY: 146, delay: 0.1, rotateStart: -10, width: 'w-6' },
                { left: 63, endX: 14, endY: 190, delay: 0.15, rotateStart: 22, width: 'w-4' },
                { left: 79, endX: -12, endY: 136, delay: 0.2, rotateStart: -28, width: 'w-5' },
              ].map((shard, index) => (
                <motion.div
                  key={`${bossAttackFxId}-${index}`}
                  initial={{ x: 0, y: -24, rotate: shard.rotateStart, opacity: 0 }}
                  animate={{ x: shard.endX, y: shard.endY, rotate: shard.rotateStart + 48, opacity: [0, 0.96, 0.16] }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: shard.delay }}
                  className={`absolute top-3 h-2.5 ${shard.width} rounded-sm border border-white/15 bg-gradient-to-r from-slate-100/70 via-slate-400/75 to-slate-800/90 shadow-[0_0_10px_rgba(226,232,240,0.18)]`}
                  style={{ left: `${shard.left}%` }}
                />
              ))}
              <div className="absolute left-1/2 top-8 h-7 w-16 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,113,133,0.18)_0%,rgba(148,163,184,0.08)_45%,rgba(0,0,0,0)_75%)] blur-sm" />
            </div>
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
            onTileClick={(tile) => !isPaused && tutorialAllowsBoardInput && handleTileClick(tile)}
            onTileSwipe={(from, to) => !isPaused && tutorialAllowsBoardInput && handleTileSwipe(from, to)}
          />
        </div>
      </div>

      {/* Bottom Bar: Moves (Left) & Boosters (Right) */}
      <div className="w-full shrink-0 z-10 pb-1 sm:pb-6 px-2 sm:px-4 -mt-1 sm:mt-0">
        <div className="flex items-end justify-between max-w-md mx-auto relative">
          {/* Moves Counter (Bottom Left) */}
          <div className="relative z-20 flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 border-cyan-100/70 bg-[linear-gradient(155deg,#0ea5e9_0%,#2563eb_52%,#1e3a8a_100%)] shadow-[0_14px_28px_rgba(2,132,199,0.48)] sm:h-20 sm:w-20 sm:border-4">
            <span className="mt-1 text-[8px] font-bold uppercase text-cyan-100/90 sm:text-[10px]">
              {levelConfig.mode === 'time' ? t.time : t.moves}
            </span>
            <span className="text-xl font-black leading-none text-white drop-shadow-md sm:text-3xl">
              {levelConfig.mode === 'time' ? `${Math.max(0, timeLeft)}s` : moves}
            </span>
          </div>

          {/* Boosters (Right side) */}
          <div className="mb-1 ml-2 flex flex-1 items-center justify-end gap-1.5 rounded-2xl border border-cyan-100/20 bg-[linear-gradient(140deg,rgba(2,6,23,0.5),rgba(15,23,42,0.42))] p-1.5 shadow-[0_10px_28px_rgba(2,6,23,0.4)] backdrop-blur-md sm:ml-4">
            <button
              type="button"
              onClick={triggerQuickBoost}
              title={quickBoostHint}
              aria-label={quickBoostHint}
              className="group flex h-7 min-w-[72px] items-center justify-center gap-1 rounded-xl border-2 border-emerald-200/30 bg-emerald-300/12 px-1 text-[9px] font-black text-emerald-100 transition-all active:scale-95 hover:bg-emerald-300/18 sm:h-12 sm:min-w-[118px] sm:gap-1.5 sm:px-2 sm:text-xs"
            >
              {levelConfig.mode === 'moves' ? <BoosterGlyph className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : <TimeGlyph className="h-3.5 w-3.5 sm:h-5 sm:w-5" />}
              <span>{quickBoostLabel}</span>
              <span className="rounded-full bg-black/20 px-1 py-[1px] text-[8px] font-bold sm:px-1.5 sm:text-[10px]">-{BOOSTER_COST}</span>
            </button>
            <button
              type="button"
              onClick={openShop}
              title={language === 'ru' ? 'Магазин' : 'Shop'}
              aria-label={language === 'ru' ? 'Магазин' : 'Shop'}
              className="group flex h-7 w-7 items-center justify-center rounded-xl border-2 border-amber-200/30 bg-amber-300/12 text-amber-100 transition-all active:scale-95 hover:bg-amber-300/18 sm:h-12 sm:w-12"
            >
              <GiftGlyph className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={openGuide}
              title={language === 'ru' ? 'Гайд' : 'Guide'}
              aria-label={language === 'ru' ? 'Гайд' : 'Guide'}
              className="group flex h-7 w-7 items-center justify-center rounded-xl border-2 border-cyan-200/25 bg-cyan-300/10 text-cyan-100 transition-all active:scale-95 hover:bg-cyan-300/18 sm:h-12 sm:w-12"
            >
              <SignalGlyph className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
        {shopNotice && (
          <div className="mt-2 text-center text-xs sm:text-sm font-bold text-cyan-200">
            {shopNotice}
          </div>
        )}
        {isAdminPath() && !adminAccessToken && (
          <AdminAccessModal
            language={language}
            onSubmit={handleAdminLogin}
            isLoading={adminAuthLoading}
            error={adminAuthError}
          />
        )}
      </div>

    </div>
  );
}

export default App;













