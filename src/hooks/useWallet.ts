import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../i18n';
import { trackEvent } from '../analytics';
import { PAYMENT_ORDER_ID_KEY, PAYMENT_RETURN_TO_GAME_KEY, WALLET_TOKEN_KEY } from '../config/appConfig';
import type { ShopPack } from '../types/shop';

type UseWalletOptions = {
  language: Language;
  coinPacks: ShopPack[];
  notEnoughCoinsMessage: string;
  walletUnavailableMessage: string;
  shopPackUnavailableMessage: string;
  onPaymentStatus: (status: 'success' | 'fail') => void;
  onPackCheckout: (packId: string) => void;
};

type DailyRewardStatus = {
  ok: boolean;
  canClaim: boolean;
  streak: number;
  totalClaims: number;
  claimDay: number;
  lastClaimDate: string | null;
  nextReward: number;
  milestoneBonus: number;
  calendarRewards: number[];
  nextClaimAt: string | null;
};

type DailyRewardClaimResult = {
  ok: boolean;
  granted: boolean;
  reward: number;
  streak: number;
  claimDay: number;
  totalClaims: number;
  milestoneBonus: number;
  calendarRewards: number[];
  balance: number;
  nextClaimAt: string | null;
};

type LevelRewardClaimResult = {
  ok: boolean;
  granted: boolean;
  reward: number;
  baseReward: number;
  milestoneBonus: number;
  completedLevelsCount: number;
  level: number;
  balance: number;
};

type LeaderboardEntry = {
  rank: number;
  displayName: string;
  bestLevel: number;
  bestScore: number;
  totalStars: number;
};

type DailyMissionStatus = {
  ok: boolean;
  missionDate: string;
  missions: Array<{
    id: string;
    target: number;
    reward: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
  }>;
};

type LeaderboardOverview = {
  ok: boolean;
  items: LeaderboardEntry[];
  playerRank?: number | null;
  nextRival?: {
    displayName: string;
    bestLevel: number;
    bestScore: number;
    totalStars: number;
    gapScore: number;
  } | null;
  weeklyTier?: {
    id: string;
    maxRank: number;
    reward: number;
  } | null;
  chest?: {
    tierId: string;
    reward: number;
    claimable: boolean;
    claimed: boolean;
    weekKey: string;
  } | null;
};

export function useWallet({
  language,
  coinPacks,
  notEnoughCoinsMessage,
  walletUnavailableMessage,
  shopPackUnavailableMessage,
  onPaymentStatus,
  onPackCheckout,
}: UseWalletOptions) {
  const [spaceCoins, setSpaceCoins] = useState(120);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [walletToken, setWalletToken] = useState('');
  const [walletReady, setWalletReady] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const walletInitInFlightRef = useRef(false);

  const syncWalletBalance = useCallback(async (): Promise<boolean> => {
    if (!walletToken) return false;
    try {
      const response = await fetch('/api/wallet', {
        headers: {
          Authorization: `Bearer ${walletToken}`,
        },
      });
      if (!response.ok) return false;
      const payload = await response.json() as { balance?: number; playerId?: string };
      if (typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
        setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
      }
      if (payload.playerId) {
        setPlayerId(String(payload.playerId));
      }
      return true;
    } catch {
      return false;
    }
  }, [walletToken]);

  const authedJson = useCallback(async <T>(path: string, init?: RequestInit): Promise<T | null> => {
    if (!walletToken) return null;
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${walletToken}`,
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
      if (!response.ok) return null;
      return await response.json() as T;
    } catch {
      return null;
    }
  }, [walletToken]);

  const fetchOrderStatus = useCallback(async (orderId: string) => {
    if (!walletToken) return null;

    try {
      const response = await fetch(`/api/payments/order-status?orderId=${encodeURIComponent(orderId)}`, {
        headers: {
          Authorization: `Bearer ${walletToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as { status?: string; balance?: number; coins?: number };
    } catch {
      return null;
    }
  }, [walletToken]);

  const waitForOrderCredit = useCallback(async (orderId: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const payload = await fetchOrderStatus(orderId);
      if (payload?.status === 'credited') {
        if (typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
          setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
        } else {
          await syncWalletBalance();
        }
        return true;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1250);
      });
    }

    return false;
  }, [fetchOrderStatus, syncWalletBalance]);

  const spendCoins = useCallback(async (cost: number): Promise<boolean> => {
    if (!walletReady || !walletToken) {
      setShopNotice(walletUnavailableMessage);
      return false;
    }

    if (spaceCoins < cost) {
      setShopNotice(notEnoughCoinsMessage);
      return false;
    }

    try {
      const response = await fetch('/api/wallet/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${walletToken}`,
        },
        body: JSON.stringify({ amount: cost }),
      });

      const payload = await response.json().catch(() => ({})) as { balance?: number };

      if (response.status === 409) {
        if (typeof payload.balance === 'number') {
          setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
        }
        setShopNotice(notEnoughCoinsMessage);
        return false;
      }

      if (!response.ok) {
        setShopNotice(walletUnavailableMessage);
        await syncWalletBalance();
        return false;
      }

      if (typeof payload.balance === 'number') {
        setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
      } else {
        await syncWalletBalance();
      }

      return true;
    } catch {
      setShopNotice(walletUnavailableMessage);
      await syncWalletBalance();
      return false;
    }
  }, [notEnoughCoinsMessage, spaceCoins, syncWalletBalance, walletReady, walletToken, walletUnavailableMessage]);

  const buyCoinsPack = useCallback(async (packId: string) => {
    const pack = coinPacks.find((item) => item.id === packId);
    if (!pack) return;

    if (!walletReady || !walletToken) {
      setShopNotice(walletUnavailableMessage);
      return;
    }

    try {
      trackEvent('checkout_start', { pack_id: packId, coins: pack.coins, price_label: pack.priceLabel });
      const response = await fetch('/api/payments/robokassa/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${walletToken}`,
        },
        body: JSON.stringify({ packId, returnUrl: window.location.href }),
      });

      const payload = await response.json().catch(() => ({})) as { paymentUrl?: string; orderId?: string };
      if (response.ok && payload.paymentUrl) {
        onPackCheckout(packId);
        if (payload.orderId) {
          window.localStorage.setItem(PAYMENT_ORDER_ID_KEY, payload.orderId);
        }
        window.localStorage.setItem(PAYMENT_RETURN_TO_GAME_KEY, '1');
        trackEvent('checkout_redirect', {
          pack_id: packId,
          coins: pack.coins,
          has_order_id: Boolean(payload.orderId),
        });
        window.location.assign(payload.paymentUrl);
        return;
      }
      trackEvent('checkout_error', { pack_id: packId, status: response.status });
    } catch {
      trackEvent('checkout_error', { pack_id: packId, status: 'network_error' });
    }

    setShopNotice(shopPackUnavailableMessage);
  }, [coinPacks, onPackCheckout, shopPackUnavailableMessage, walletReady, walletToken, walletUnavailableMessage]);

  const getDailyRewardStatus = useCallback(async (): Promise<DailyRewardStatus | null> => {
    return authedJson<DailyRewardStatus>('/api/rewards/daily-status');
  }, [authedJson]);

  const getDailyMissionsStatus = useCallback(async (): Promise<DailyMissionStatus | null> => {
    return authedJson<DailyMissionStatus>('/api/missions/daily-status');
  }, [authedJson]);

  const reportDailyMissionProgress = useCallback(async (payload: {
    bombActivationsDelta?: number;
    highestScore?: number;
    cleanLevelClearDelta?: number;
  }): Promise<DailyMissionStatus | null> => {
    return authedJson<DailyMissionStatus>('/api/missions/daily-progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }, [authedJson]);

  const claimDailyMission = useCallback(async (missionId: string) => {
    const payload = await authedJson<DailyMissionStatus & { balance?: number; reward?: number }>('/api/missions/daily-claim', {
      method: 'POST',
      body: JSON.stringify({ missionId }),
    });
    if (payload && typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
      setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
    }
    return payload;
  }, [authedJson]);

  const claimDailyReward = useCallback(async (): Promise<DailyRewardClaimResult | null> => {
    const payload = await authedJson<DailyRewardClaimResult>('/api/rewards/daily-claim', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (payload && typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
      setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
    }
    return payload;
  }, [authedJson]);

  const claimLevelCompletionReward = useCallback(async (
    level: number,
    score: number,
    stars: number,
  ): Promise<LevelRewardClaimResult | null> => {
    const payload = await authedJson<LevelRewardClaimResult>('/api/rewards/level-complete', {
      method: 'POST',
      body: JSON.stringify({ level, score, stars }),
    });
    if (payload && typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
      setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
    }
    return payload;
  }, [authedJson]);

  const submitLeaderboardEntry = useCallback(async (params: {
    displayName?: string;
    bestLevel: number;
    bestScore: number;
    totalStars: number;
  }) => {
    return authedJson<{ ok: boolean; entry?: LeaderboardEntry }>('/api/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }, [authedJson]);

  const getLeaderboardTop = useCallback(async (limit = 20) => {
    return authedJson<LeaderboardOverview>(`/api/leaderboard/top?limit=${Math.max(1, Math.min(50, Math.floor(limit)))}`);
  }, [authedJson]);

  const claimLeaderboardChest = useCallback(async () => {
    const payload = await authedJson<{
      ok: boolean;
      reward?: number;
      balance?: number;
      playerRank?: number | null;
      weeklyTier?: LeaderboardOverview['weeklyTier'];
      chest?: LeaderboardOverview['chest'];
    }>('/api/leaderboard/claim-tier-chest', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (payload && typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
      setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
    }
    return payload;
  }, [authedJson]);

  useEffect(() => {
    let isDisposed = false;
    if (walletInitInFlightRef.current) return;

    walletInitInFlightRef.current = true;

    const initWallet = async () => {
      try {
        const savedToken = localStorage.getItem(WALLET_TOKEN_KEY) || '';
        const response = await fetch('/api/session/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedToken ? { token: savedToken } : {}),
        });

        if (!response.ok) {
          throw new Error('wallet_init_failed');
        }

        const payload = await response.json() as { token?: string; balance?: number; playerId?: string };
        if (isDisposed) return;

        if (payload.token) {
          setWalletToken(payload.token);
          localStorage.setItem(WALLET_TOKEN_KEY, payload.token);
        }

        if (typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
          setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
        }

        if (payload.playerId) {
          setPlayerId(String(payload.playerId));
        }

        setWalletReady(Boolean(payload.token));
        trackEvent('wallet_ready', {
          has_token: Boolean(payload.token),
          has_player_id: Boolean(payload.playerId),
          balance: typeof payload.balance === 'number' ? Math.max(0, Math.floor(payload.balance)) : null,
        });
      } catch {
        if (isDisposed) return;
        setWalletReady(false);
        setShopNotice(walletUnavailableMessage);
        trackEvent('wallet_init_error', { reason: 'wallet_init_failed' });
      } finally {
        walletInitInFlightRef.current = false;
      }
    };

    void initWallet();

    return () => {
      isDisposed = true;
    };
  }, [walletUnavailableMessage]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentState = url.searchParams.get('payment');
    if (!paymentState) return;
    if (paymentState === 'success' && !walletToken) return;
    const orderId = url.searchParams.get('orderId') || window.localStorage.getItem(PAYMENT_ORDER_ID_KEY) || '';

    const cleanupPaymentParams = () => {
      url.searchParams.delete('payment');
      url.searchParams.delete('orderId');
      window.localStorage.removeItem(PAYMENT_RETURN_TO_GAME_KEY);
      window.localStorage.removeItem(PAYMENT_ORDER_ID_KEY);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    cleanupPaymentParams();

    trackEvent('payment_return', {
      status: paymentState,
      has_order_id: Boolean(orderId),
    });

    if (paymentState === 'success') {
      setShopNotice(language === 'ru' ? 'Платеж подтвержден, проверяем зачисление...' : 'Payment confirmed, verifying coin credit...');
      void (async () => {
        const credited = orderId ? await waitForOrderCredit(orderId) : await syncWalletBalance();

        if (credited) {
          setShopNotice(language === 'ru' ? 'Монеты зачислены' : 'Coins credited');
          trackEvent('payment_credited', { order_id: orderId || null });
        } else {
          setShopNotice(language === 'ru' ? 'Платеж принят. Зачисление может занять до минуты.' : 'Payment received. Coin credit may take up to a minute.');
          trackEvent('payment_credit_pending', { order_id: orderId || null });
          await syncWalletBalance();
        }

        onPaymentStatus('success');
      })();
    } else if (paymentState === 'fail') {
      setShopNotice(language === 'ru' ? 'Платеж не завершен' : 'Payment was not completed');
      trackEvent('payment_failed', { order_id: orderId || null });
      onPaymentStatus('fail');
    }
  }, [language, onPaymentStatus, syncWalletBalance, waitForOrderCredit, walletToken]);

  return {
    buyCoinsPack,
    claimDailyReward,
    claimDailyMission,
    claimLevelCompletionReward,
    claimLeaderboardChest,
    getDailyRewardStatus,
    getDailyMissionsStatus,
    getLeaderboardTop,
    playerId,
    reportDailyMissionProgress,
    setShopNotice,
    shopNotice,
    spaceCoins,
    spendCoins,
    submitLeaderboardEntry,
    syncWalletBalance,
    walletReady,
  };
}
